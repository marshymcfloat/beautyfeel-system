import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { DomainError } from "@/lib/errors/domain-error";

export type StaffingConflict = Prisma.BookingSegmentGetPayload<{
  include: { booking: { select: { id: true; publicCode: true } }; bookingService: { select: { serviceId: true; service: { select: { categoryId: true } } } } };
}>;

export async function getFutureStaffSegments(
  tx: Prisma.TransactionClient,
  staffId: string,
): Promise<StaffingConflict[]> {
  return tx.bookingSegment.findMany({
    where: { staffId, allocationState: "ACTIVE", blockedUntil: { gt: new Date() }, booking: { status: { in: ["AWAITING_PAYMENT", "PENDING_VERIFICATION", "CONFIRMED"] } } },
    include: { booking: { select: { id: true, publicCode: true } }, bookingService: { select: { serviceId: true, service: { select: { categoryId: true } } } } },
    orderBy: { startsAt: "asc" },
  });
}

export async function resolveStaffingConflicts(
  tx: Prisma.TransactionClient,
  conflicts: readonly StaffingConflict[],
  actorId: string,
  overrideReason: string | null | undefined,
  action: string,
) {
  if (!conflicts.length) return [];
  if (!overrideReason) {
    throw new DomainError("INVALID_STATE", "This change affects future bookings. Reassign them or provide an emergency override reason.", {
      bookings: [...new Set(conflicts.map((item) => item.booking.publicCode))],
    });
  }

  const moved: string[] = [];
  for (const segment of conflicts) {
    const units = await tx.flexCapacityUnit.findMany({
      where: { categoryId: segment.bookingService.service.categoryId, active: true },
      include: { segments: { where: { allocationState: "ACTIVE", startsAt: { lt: segment.blockedUntil }, blockedUntil: { gt: segment.startsAt } }, select: { id: true } } },
      orderBy: { unitNumber: "asc" },
    });
    const unit = units.find((candidate) => candidate.segments.length === 0);
    if (!unit) {
      throw new DomainError("SLOT_UNAVAILABLE", "No flex capacity is available for all affected bookings.", { bookingCode: segment.booking.publicCode });
    }
    await tx.bookingSegment.update({ where: { id: segment.id }, data: { allocationState: "RELEASED" } });
    await tx.bookingSegment.create({
      data: { bookingId: segment.bookingId, bookingServiceId: segment.bookingServiceId, flexUnitId: unit.id, startsAt: segment.startsAt, endsAt: segment.endsAt, blockedUntil: segment.blockedUntil, executionOrder: segment.executionOrder },
    });
    await tx.booking.update({ where: { id: segment.bookingId }, data: { staffingStatus: "FLEX_RESERVED" } });
    await tx.adminAlert.upsert({
      where: { eventKey: `${segment.id}:${action}:OVERRIDE` },
      create: { eventKey: `${segment.id}:${action}:OVERRIDE`, bookingId: segment.bookingId, severity: "URGENT", message: `${segment.booking.publicCode} needs replacement staff: ${overrideReason}` },
      update: { readAt: null, message: `${segment.booking.publicCode} needs replacement staff: ${overrideReason}` },
    });
    moved.push(segment.booking.publicCode);
  }
  await tx.auditLog.create({ data: { actorId, action: `${action}_EMERGENCY_OVERRIDE`, entityType: "StaffProfile", entityId: conflicts[0].staffId!, metadata: { reason: overrideReason, bookings: moved } } });
  return moved;
}
