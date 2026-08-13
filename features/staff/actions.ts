"use server";

import { z } from "zod";
import { requireActor } from "@/lib/auth/session";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/errors/domain-error";
import { runAction } from "@/lib/errors/action";
import { normalizePhilippinePhone } from "@/lib/security/phone";
import { phoneToAuthEmail } from "@/lib/security/auth-identifier";
import { createTemporaryPassword } from "@/lib/security/tokens";
import { createStaffSchema, staffBreaksSchema, staffIdSchema, staffScheduleSchema, staffSkillsSchema, staffTimeOffSchema, userIdSchema } from "./schema";
import { conflictsWithBreaks, conflictsWithSchedule } from "./conflicts";
import { getFutureStaffSegments, resolveStaffingConflicts } from "./safety";

export async function createStaffAccount(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = createStaffSchema.parse(input);
    const phone = normalizePhilippinePhone(data.phone);
    const email = phoneToAuthEmail(phone);
    const temporaryPassword = createTemporaryPassword();
    const admin = createSupabaseAdminClient();
    const { data: authData, error } = await admin.auth.admin.createUser({ email, password: temporaryPassword, email_confirm: true });
    if (error || !authData.user) throw new DomainError("INTERNAL_ERROR", "Unable to create staff account.");
    try {
      const staff = await prisma.$transaction(async (tx) => {
        await tx.userProfile.create({ data: { id: authData.user.id, role: "STAFF", displayName: data.displayName, phoneE164: phone } });
        const created = await tx.staffProfile.create({ data: { userId: authData.user.id, publicName: data.publicName, internalName: data.internalName } });
        await tx.auditLog.create({ data: { actorId: actor.id, action: "STAFF_CREATED", entityType: "StaffProfile", entityId: created.id } });
        return created;
      });
      return { staff, temporaryPassword };
    } catch (cause) {
      await admin.auth.admin.deleteUser(authData.user.id);
      throw cause;
    }
  });
}

export async function resetStaffPassword(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const { userId } = userIdSchema.parse(input);
    const temporaryPassword = createTemporaryPassword();
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, { password: temporaryPassword });
    if (error) throw new DomainError("INTERNAL_ERROR", "Unable to reset password.");
    await prisma.$transaction([
      prisma.userProfile.update({ where: { id: userId }, data: { mustChangePassword: true } }),
      prisma.auditLog.create({ data: { actorId: actor.id, action: "STAFF_PASSWORD_RESET", entityType: "UserProfile", entityId: userId } }),
    ]);
    return { temporaryPassword };
  });
}

export async function setStaffActive(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const { staffId, active, overrideReason } = staffIdSchema.extend({ active: z.boolean(), overrideReason: z.string().trim().min(3).max(500).nullable().optional() }).parse(input);
    const staff = await prisma.staffProfile.findUnique({ where: { id: staffId }, select: { userId: true } });
    if (!staff) throw new DomainError("NOT_FOUND", "Staff member not found.");
    const admin = createSupabaseAdminClient();
    const { error } = await admin.auth.admin.updateUserById(staff.userId, { ban_duration: active ? "none" : "876000h" });
    if (error) throw new DomainError("INTERNAL_ERROR", "Unable to update staff access.");
    try {
      await prisma.$transaction(async (tx) => {
        if (!active) await resolveStaffingConflicts(tx, await getFutureStaffSegments(tx, staffId), actor.id, overrideReason, "STAFF_DEACTIVATED");
        await tx.staffProfile.update({ where: { id: staffId }, data: { active } });
        await tx.userProfile.update({ where: { id: staff.userId }, data: { active } });
        await tx.auditLog.create({ data: { actorId: actor.id, action: active ? "STAFF_ACTIVATED" : "STAFF_DEACTIVATED", entityType: "StaffProfile", entityId: staffId } });
      });
    } catch (cause) {
      await admin.auth.admin.updateUserById(staff.userId, { ban_duration: active ? "876000h" : "none" });
      throw cause;
    }
    return { staffId, active };
  });
}

export async function updateStaffBreaks(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = staffBreaksSchema.parse(input);
    await prisma.$transaction(async (tx) => {
      const conflicts = (await getFutureStaffSegments(tx, data.staffId)).filter((segment) => conflictsWithBreaks(segment, data.breaks));
      await resolveStaffingConflicts(tx, conflicts, actor.id, data.overrideReason, "STAFF_BREAKS_UPDATED");
      await tx.staffBreak.deleteMany({ where: { staffId: data.staffId } });
      if (data.breaks.length) await tx.staffBreak.createMany({ data: data.breaks.map((item) => ({ staffId: data.staffId, weekday: item.weekday, date: item.date, startMinute: item.startMinute, endMinute: item.endMinute })) });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "STAFF_BREAKS_UPDATED", entityType: "StaffProfile", entityId: data.staffId } });
    });
    return { staffId: data.staffId };
  });
}

export async function updateStaffSkills(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = staffSkillsSchema.parse(input);
    await prisma.$transaction(async (tx) => {
      const current = await tx.staffService.findMany({ where: { staffId: data.staffId }, select: { serviceId: true } });
      const removed = current.map((item) => item.serviceId).filter((id) => !data.serviceIds.includes(id));
      const conflicts = (await getFutureStaffSegments(tx, data.staffId)).filter((segment) => removed.includes(segment.bookingService.serviceId));
      await resolveStaffingConflicts(tx, conflicts, actor.id, data.overrideReason, "STAFF_SKILLS_UPDATED");
      await tx.staffService.deleteMany({ where: { staffId: data.staffId } });
      if (data.serviceIds.length) await tx.staffService.createMany({ data: data.serviceIds.map((serviceId) => ({ staffId: data.staffId, serviceId })) });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "STAFF_SKILLS_UPDATED", entityType: "StaffProfile", entityId: data.staffId } });
    });
    return { staffId: data.staffId };
  });
}

export async function updateStaffSchedule(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = staffScheduleSchema.parse(input);
    await prisma.$transaction(async (tx) => {
      const conflicts = (await getFutureStaffSegments(tx, data.staffId)).filter((segment) => conflictsWithSchedule(segment, data.rules));
      await resolveStaffingConflicts(tx, conflicts, actor.id, data.overrideReason, "STAFF_SCHEDULE_UPDATED");
      await tx.staffScheduleRule.deleteMany({ where: { staffId: data.staffId } });
      if (data.rules.length) await tx.staffScheduleRule.createMany({ data: data.rules.map(({ weekday, startMinute, endMinute, effectiveFrom, effectiveUntil }) => ({ weekday, startMinute, endMinute, effectiveFrom, effectiveUntil, staffId: data.staffId })) });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "STAFF_SCHEDULE_UPDATED", entityType: "StaffProfile", entityId: data.staffId } });
    });
    return { staffId: data.staffId };
  });
}

export async function recordStaffTimeOff(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = staffTimeOffSchema.parse(input);
    return prisma.$transaction(async (tx) => {
      const conflicts = (await getFutureStaffSegments(tx, data.staffId)).filter((segment) => segment.startsAt < data.endsAt && data.startsAt < segment.blockedUntil);
      await resolveStaffingConflicts(tx, conflicts, actor.id, data.overrideReason, "STAFF_TIME_OFF_CREATED");
      const timeOff = await tx.staffTimeOff.create({ data: { staffId: data.staffId, startsAt: data.startsAt, endsAt: data.endsAt, reason: data.reason } });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "STAFF_TIME_OFF_CREATED", entityType: "StaffTimeOff", entityId: timeOff.id } });
      return timeOff;
    });
  });
}

export async function changeOwnTemporaryPassword(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor();
    const password = z.string().min(12).max(128).parse(input);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new DomainError("VALIDATION_ERROR", "Unable to update password.");
    await supabase.auth.signOut({ scope: "others" });
    await prisma.userProfile.update({ where: { id: actor.id }, data: { mustChangePassword: false } });
    return { changed: true };
  });
}
