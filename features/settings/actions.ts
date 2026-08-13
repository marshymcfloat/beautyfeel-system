"use server";

import { updateTag } from "next/cache";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { runAction } from "@/lib/errors/action";
import { DomainError } from "@/lib/errors/domain-error";
import { DateTime } from "luxon";
import { businessHoursSchema, businessSettingsSchema, closureSchema, flexCapacitySchema } from "./schema";

export async function updateBusinessSettings(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = businessSettingsSchema.parse(input);
    const settings = await prisma.$transaction(async (tx) => {
      const updated = await tx.businessSettings.upsert({ where: { id: 1 }, create: { id: 1, ...data }, update: data });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "SETTINGS_UPDATED", entityType: "BusinessSettings", entityId: "1" } });
      return updated;
    });
    updateTag("business-settings");
    return settings;
  });
}

export async function createBusinessClosure(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = closureSchema.omit({ id: true }).parse(input);
    return prisma.$transaction(async (tx) => {
      const closure = await tx.businessClosure.create({ data });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "CLOSURE_CREATED", entityType: "BusinessClosure", entityId: closure.id } });
      return closure;
    });
  });
}

export async function removeBusinessClosure(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const { id } = closureSchema.pick({ id: true }).required().parse(input);
    await prisma.$transaction([
      prisma.businessClosure.delete({ where: { id } }),
      prisma.auditLog.create({ data: { actorId: actor.id, action: "CLOSURE_REMOVED", entityType: "BusinessClosure", entityId: id } }),
    ]);
    return { id };
  });
}

export async function updateBusinessHours(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = businessHoursSchema.parse(input);
    await prisma.$transaction(async (tx) => {
      const flexSegments = await tx.bookingSegment.findMany({
        where: { flexUnitId: { not: null }, allocationState: "ACTIVE", blockedUntil: { gt: new Date() }, booking: { status: { in: ["AWAITING_PAYMENT", "PENDING_VERIFICATION", "CONFIRMED"] } } },
        include: { booking: { select: { publicCode: true } }, flexUnit: { include: { category: { select: { available24Hours: true } } } } },
        take: 500,
      });
      const uncovered = flexSegments.filter((segment) => {
        if (segment.flexUnit?.category.available24Hours) return false;
        const start = DateTime.fromJSDate(segment.startsAt).setZone("Asia/Manila");
        const end = DateTime.fromJSDate(segment.blockedUntil).setZone("Asia/Manila");
        return !data.rules.some((rule) => rule.weekday === start.weekday && rule.startMinute <= start.hour * 60 + start.minute && rule.endMinute >= end.hour * 60 + end.minute);
      });
      if (uncovered.length) throw new DomainError("INVALID_STATE", "Business-hour changes would invalidate flex reservations. Assign staff first.", { bookings: [...new Set(uncovered.map((segment) => segment.booking.publicCode))] });
      await tx.businessHoursRule.deleteMany();
      if (data.rules.length) await tx.businessHoursRule.createMany({ data: data.rules });
      await tx.auditLog.create({ data: { actorId: actor.id, action: "BUSINESS_HOURS_UPDATED", entityType: "BusinessHours", entityId: "default" } });
    });
    updateTag("business-settings");
    return { rules: data.rules.length };
  });
}

export async function setFlexCapacity(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = flexCapacitySchema.parse(input);
    const result = await prisma.$transaction(async (tx) => {
      const category = await tx.serviceCategory.findUnique({ where: { id: data.categoryId } });
      if (!category) throw new DomainError("NOT_FOUND", "Service category not found.");
      await tx.serviceCategory.update({ where: { id: data.categoryId }, data: { available24Hours: data.available24Hours } });
      const units = await tx.flexCapacityUnit.findMany({ where: { categoryId: data.categoryId }, orderBy: { unitNumber: "asc" } });
      for (let unitNumber = 1; unitNumber <= data.capacity; unitNumber += 1) {
        const existing = units.find((unit) => unit.unitNumber === unitNumber);
        if (existing) await tx.flexCapacityUnit.update({ where: { id: existing.id }, data: { active: true } });
        else await tx.flexCapacityUnit.create({ data: { categoryId: data.categoryId, unitNumber } });
      }
      const toDisable = units.filter((unit) => unit.unitNumber > data.capacity && unit.active);
      if (toDisable.length) {
        const occupied = await tx.bookingSegment.findMany({
          where: { flexUnitId: { in: toDisable.map((unit) => unit.id) }, allocationState: "ACTIVE", blockedUntil: { gt: new Date() } },
          select: { bookingId: true },
          distinct: ["bookingId"],
          take: 20,
        });
        if (occupied.length) throw new DomainError("INVALID_STATE", "Flex capacity is reserved by future bookings.", { bookingIds: occupied.map((item) => item.bookingId) });
        await tx.flexCapacityUnit.updateMany({ where: { id: { in: toDisable.map((unit) => unit.id) } }, data: { active: false } });
      }
      await tx.auditLog.create({ data: { actorId: actor.id, action: "CATEGORY_BOOKING_CONFIG_UPDATED", entityType: "ServiceCategory", entityId: data.categoryId, metadata: { capacity: data.capacity, available24Hours: data.available24Hours } } });
      return { categoryId: data.categoryId, capacity: data.capacity, available24Hours: data.available24Hours };
    });
    updateTag("business-settings");
    return result;
  });
}
