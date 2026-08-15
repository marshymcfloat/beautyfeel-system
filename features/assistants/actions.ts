"use server";

import { updateTag } from "next/cache";

import { requireActor } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/auth/supabase-server";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/errors/domain-error";
import { runAction } from "@/lib/errors/action";
import { normalizePhilippinePhone } from "@/lib/security/phone";
import { phoneToAuthEmail } from "@/lib/security/auth-identifier";
import { createTemporaryPassword } from "@/lib/security/tokens";
import { processSmsEvent } from "@/features/notifications/service";
import { assistantActiveSchema, assistantUserSchema, createAssistantSchema } from "./schema";
import { portalCacheTags } from "@/lib/cache/portal";

export async function createBookingAssistant(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = createAssistantSchema.parse(input);
    const phone = normalizePhilippinePhone(data.phone);
    const temporaryPassword = createTemporaryPassword();
    const admin = createSupabaseAdminClient();
    const { data: auth, error } = await admin.auth.admin.createUser({ email: phoneToAuthEmail(phone), password: temporaryPassword, email_confirm: true });
    if (error || !auth.user) throw new DomainError("INTERNAL_ERROR", "Unable to create booking assistant.");
    try {
      const eventKey = `${auth.user.id}:ASSISTANT_WELCOME`;
      await prisma.$transaction([
        prisma.userProfile.create({ data: { id: auth.user.id, role: "BOOKING_ASSISTANT", displayName: data.displayName, phoneE164: phone } }),
        prisma.auditLog.create({ data: { actorId: actor.id, action: "BOOKING_ASSISTANT_CREATED", entityType: "UserProfile", entityId: auth.user.id } }),
        prisma.smsOutbox.create({ data: { eventKey, eventType: "ASSISTANT_WELCOME", recipientE164: phone, payload: { customerName: data.displayName, phone, temporaryPassword } } }),
      ]);
      await processSmsEvent(eventKey);
      updateTag(portalCacheTags.assistants);
      return { userId: auth.user.id, temporaryPassword };
    } catch (cause) { await admin.auth.admin.deleteUser(auth.user.id); throw cause; }
  });
}

export async function setBookingAssistantActive(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]); const data = assistantActiveSchema.parse(input);
    const profile = await prisma.userProfile.findFirst({ where: { id: data.userId, role: "BOOKING_ASSISTANT" } });
    if (!profile) throw new DomainError("NOT_FOUND", "Booking assistant not found.");
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.updateUserById(data.userId, { ban_duration: data.active ? "none" : "876000h" });
    if (error) throw new DomainError("INTERNAL_ERROR", "Unable to update assistant access.");
    await prisma.$transaction([
      prisma.userProfile.update({ where: { id: data.userId }, data: { active: data.active } }),
      prisma.auditLog.create({ data: { actorId: actor.id, action: data.active ? "BOOKING_ASSISTANT_ACTIVATED" : "BOOKING_ASSISTANT_DEACTIVATED", entityType: "UserProfile", entityId: data.userId } }),
    ]);
    updateTag(portalCacheTags.assistants);
    return { ...data, temporaryPassword: undefined as string | undefined };
  });
}

export async function resetBookingAssistantPassword(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]); const { userId } = assistantUserSchema.parse(input);
    const profile = await prisma.userProfile.findFirst({ where: { id: userId, role: "BOOKING_ASSISTANT" } });
    if (!profile) throw new DomainError("NOT_FOUND", "Booking assistant not found.");
    const temporaryPassword = createTemporaryPassword(); const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, { password: temporaryPassword });
    if (error) throw new DomainError("INTERNAL_ERROR", "Unable to reset password.");
    const eventKey = `${userId}:ASSISTANT_PASSWORD_RESET:${crypto.randomUUID()}`;
    await prisma.$transaction([
      prisma.userProfile.update({ where: { id: userId }, data: { mustChangePassword: true } }),
      prisma.auditLog.create({ data: { actorId: actor.id, action: "BOOKING_ASSISTANT_PASSWORD_RESET", entityType: "UserProfile", entityId: userId } }),
      prisma.smsOutbox.create({ data: { eventKey, eventType: "ASSISTANT_PASSWORD_RESET", recipientE164: profile.phoneE164, payload: { customerName: profile.displayName, temporaryPassword } } }),
    ]);
    await processSmsEvent(eventKey);
    updateTag(portalCacheTags.assistants);
    return { temporaryPassword };
  });
}

export async function deleteBookingAssistant(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const { userId } = assistantUserSchema.parse(input);
    const profile = await prisma.userProfile.findFirst({
      where: { id: userId, role: "BOOKING_ASSISTANT" },
      select: { id: true },
    });
    if (!profile) throw new DomainError("NOT_FOUND", "Booking assistant not found.");

    const admin = createSupabaseAdminClient();
    const { error: disableError } = await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
    if (disableError && !disableError.message.toLowerCase().includes("user not found")) {
      throw new DomainError("INTERNAL_ERROR", "Unable to disable the assistant account before deletion.");
    }

    await prisma.userProfile.update({ where: { id: userId }, data: { active: false } });
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError && !deleteError.message.toLowerCase().includes("user not found")) {
      throw new DomainError("INTERNAL_ERROR", "The account was disabled, but could not be deleted. Please try again.");
    }

    await prisma.$transaction([
      prisma.userProfile.delete({ where: { id: userId } }),
      prisma.auditLog.create({ data: { actorId: actor.id, action: "BOOKING_ASSISTANT_DELETED", entityType: "UserProfile", entityId: userId } }),
    ]);
    updateTag(portalCacheTags.assistants);
    return { userId };
  });
}
