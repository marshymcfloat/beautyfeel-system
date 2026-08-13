import "server-only";
import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { allocateServices, generateStartTimes } from "./allocator";
import { getLocalDayBounds, isFlexCapacityAllowed, localDateMinuteToUtc } from "./time";
import type { AllocatableService, AvailableResource, TimeInterval } from "./types";
import { DomainError } from "@/lib/errors/domain-error";

type Db = PrismaClient | Prisma.TransactionClient;

export async function expireStaleHolds(db: Db, now: Date): Promise<string[]> {
  const expired = await db.booking.findMany({
    where: { status: "AWAITING_PAYMENT", holdExpiresAt: { lte: now } },
    select: { id: true },
    take: 200,
  });
  const transitioned: string[] = [];
  for (const { id } of expired) {
    const updated = await db.booking.updateMany({ where: { id, status: "AWAITING_PAYMENT", holdExpiresAt: { lte: now } }, data: { status: "EXPIRED" } });
    if (!updated.count) continue;
    await db.bookingSegment.updateMany({ where: { bookingId: id, allocationState: "ACTIVE" }, data: { allocationState: "RELEASED" } });
    await db.bookingStatusHistory.create({ data: { bookingId: id, fromStatus: "AWAITING_PAYMENT", toStatus: "EXPIRED", reason: "Payment hold expired." } });
    const booking = await db.booking.findUnique({ where: { id }, select: { customerPhoneE164: true } });
    if (booking) await db.customerTrustProfile.upsert({ where: { phoneE164: booking.customerPhoneE164 }, create: { phoneE164: booking.customerPhoneE164, expiredHoldCount: 1 }, update: { expiredHoldCount: { increment: 1 } } });
    transitioned.push(id);
  }
  return transitioned;
}

export async function buildAvailabilityContext(
  db: Db,
  localDate: string,
  serviceIds: readonly string[],
) {
  const bounds = getLocalDayBounds(localDate);
  const dateValue = new Date(`${localDate}T00:00:00.000Z`);
  const [settings, services, staffRows, flexRows, businessHours, closures] = await Promise.all([
    db.businessSettings.findUnique({ where: { id: 1 } }),
    db.service.findMany({
      where: { id: { in: [...serviceIds] }, active: true, category: { active: true } },
      include: {
        staffSkills: { where: { staff: { active: true, user: { active: true } } }, select: { staffId: true } },
        category: { select: { id: true, available24Hours: true } },
      },
    }),
    db.staffProfile.findMany({
      where: { active: true, user: { active: true }, skills: { some: { serviceId: { in: [...serviceIds] } } } },
      include: {
        scheduleRules: { where: { weekday: bounds.weekday, effectiveFrom: { lte: dateValue }, OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: dateValue } }] } },
        breaks: { where: { OR: [{ date: dateValue }, { date: null, weekday: bounds.weekday }] } },
        timeOff: { where: { startsAt: { lt: bounds.end }, endsAt: { gt: bounds.start } } },
        segments: { where: { allocationState: "ACTIVE", startsAt: { lt: bounds.end }, blockedUntil: { gt: bounds.start } }, select: { startsAt: true, blockedUntil: true } },
      },
    }),
    db.flexCapacityUnit.findMany({
      where: { active: true, category: { services: { some: { id: { in: [...serviceIds] } } } } },
      include: {
        category: { select: { available24Hours: true } },
        segments: { where: { allocationState: "ACTIVE", startsAt: { lt: bounds.end }, blockedUntil: { gt: bounds.start } }, select: { startsAt: true, blockedUntil: true } },
      },
      orderBy: [{ categoryId: "asc" }, { unitNumber: "asc" }],
    }),
    db.businessHoursRule.findMany({ where: { weekday: bounds.weekday, active: true }, orderBy: { startMinute: "asc" } }),
    db.businessClosure.findMany({ where: { startsAt: { lt: new Date(bounds.end.getTime() + 86_400_000) }, endsAt: { gt: bounds.start } } }),
  ]);

  if (!settings) throw new DomainError("INTERNAL_ERROR", "Business settings have not been initialized.");
  if (services.length !== serviceIds.length) {
    throw new DomainError("VALIDATION_ERROR", "One or more services are unavailable.");
  }

  const allocatableServices: AllocatableService[] = serviceIds.map((id) => {
    const service = services.find((item) => item.id === id)!;
    return {
      id,
      durationMinutes: service.durationMinutes,
      bufferMinutes: service.bufferMinutes,
      qualifiedResourceIds: [
        ...service.staffSkills.map((skill) => `staff:${skill.staffId}`),
        ...flexRows.filter((unit) => unit.categoryId === service.categoryId).map((unit) => `flex:${unit.id}`),
      ],
    };
  });

  const staffResources: AvailableResource[] = staffRows.map((member) => {
    const working = member.scheduleRules.map((rule) => ({
      start: localDateMinuteToUtc(localDate, rule.startMinute, settings.timezone),
      end: localDateMinuteToUtc(localDate, rule.endMinute, settings.timezone),
    }));
    const breakIntervals = member.breaks.map((item) => ({
      start: localDateMinuteToUtc(localDate, item.startMinute, settings.timezone),
      end: localDateMinuteToUtc(localDate, item.endMinute, settings.timezone),
    }));
    const busy: TimeInterval[] = [
      ...breakIntervals,
      ...member.timeOff.map((item) => ({ start: item.startsAt, end: item.endsAt })),
      ...member.segments.map((item) => ({ start: item.startsAt, end: item.blockedUntil })),
      ...closures.map((item) => ({ start: item.startsAt, end: item.endsAt })),
    ];
    const workloadMinutes = member.segments.reduce((total, item) => total + Math.round((item.blockedUntil.getTime() - item.startsAt.getTime()) / 60_000), 0);
    return { id: `staff:${member.id}`, kind: "NAMED_STAFF", staffId: member.id, flexUnitId: null, working, busy, workloadMinutes };
  });

  const flexWorking = businessHours.map((rule) => ({
    start: localDateMinuteToUtc(localDate, rule.startMinute, settings.timezone),
    end: localDateMinuteToUtc(localDate, rule.endMinute, settings.timezone),
  }));
  const flexResources: AvailableResource[] = flexRows.map((unit) => ({
    id: `flex:${unit.id}`,
    kind: "FLEX_CAPACITY",
    staffId: null,
    flexUnitId: unit.id,
    working: unit.category.available24Hours
      ? [{ start: bounds.start, end: new Date(bounds.end.getTime() + 86_400_000) }]
      : flexWorking,
    busy: [
      ...unit.segments.map((item) => ({ start: item.startsAt, end: item.blockedUntil })),
      ...closures.map((item) => ({ start: item.startsAt, end: item.endsAt })),
    ],
    workloadMinutes: unit.segments.reduce((total, item) => total + Math.round((item.blockedUntil.getTime() - item.startsAt.getTime()) / 60_000), 0),
  }));

  return { bounds, settings, services, allocatableServices, resources: [...staffResources, ...flexResources] };
}

export async function findAllocation(
  db: Db,
  startsAt: Date,
  localDate: string,
  serviceIds: readonly string[],
  now = new Date(),
) {
  const context = await buildAvailabilityContext(db, localDate, serviceIds);
  const allowFlex = context.services.every((service) => service.category.available24Hours)
    || isFlexCapacityAllowed(startsAt, now, context.settings.flexStrictCutoffHours);
  return { context, plan: allocateServices(startsAt, context.allocatableServices, context.resources, { allowFlex }) };
}

export type AvailableSlot = {
  startsAt: string;
  availability: "AVAILABLE";
  staffingMode: "NAMED_STAFF" | "FLEX_CAPACITY";
};

export async function listAvailableSlots(
  db: Db,
  localDate: string,
  serviceIds: readonly string[],
  now = new Date(),
): Promise<AvailableSlot[]> {
  await expireStaleHolds(db, now);
  const context = await buildAvailabilityContext(db, localDate, serviceIds);
  const earliest = new Date(Math.max(context.bounds.start.getTime(), now.getTime() + context.settings.minimumLeadMinutes * 60_000));
  const latestWindow = new Date(now.getTime() + context.settings.maximumAdvanceDays * 86_400_000);
  if (context.bounds.start > latestWindow) return [];
  const latest = new Date(Math.min(context.bounds.end.getTime() - 1, latestWindow.getTime()));
  return generateStartTimes(earliest, latest, context.settings.bookingIntervalMinutes).flatMap((startsAt) => {
    const allowFlex = context.services.every((service) => service.category.available24Hours)
      || isFlexCapacityAllowed(startsAt, now, context.settings.flexStrictCutoffHours);
    const plan = allocateServices(startsAt, context.allocatableServices, context.resources, { allowFlex });
    return plan ? [{ startsAt: startsAt.toISOString(), availability: "AVAILABLE" as const, staffingMode: plan.staffingMode }] : [];
  });
}
