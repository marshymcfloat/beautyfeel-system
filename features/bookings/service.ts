import "server-only";
import { DateTime } from "luxon";
import type { DepositStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/errors/domain-error";
import { normalizePhilippinePhone } from "@/lib/security/phone";
import { createGuestToken, createPublicBookingCode, hashGuestToken, verifySecret } from "@/lib/security/tokens";
import { BUSINESS_TIMEZONE, isWithinBookingWindow } from "@/features/availability/time";
import { buildAvailabilityContext, expireStaleHolds, findAllocation } from "@/features/availability/repository";
import { calculateDepositCentavos } from "./money";
import { assertTransition } from "./state-machine";
import { minimumLeadMinutesForSource, verificationDeadline } from "./policy";
import type { z } from "zod";
import type { createBookingHoldSchema, manualBookingSchema, rescheduleBookingSchema } from "./schema";
import { evaluateBookingRisk } from "@/features/risk/service";

type HoldInput = z.infer<typeof createBookingHoldSchema>;
type ManualInput = z.infer<typeof manualBookingSchema>;
type RescheduleInput = z.infer<typeof rescheduleBookingSchema>;

function localDateOf(date: Date): string {
  return DateTime.fromJSDate(date, { zone: "utc" }).setZone(BUSINESS_TIMEZONE).toISODate()!;
}

function ensureAligned(startsAt: Date, intervalMinutes: number) {
  const local = DateTime.fromJSDate(startsAt, { zone: "utc" }).setZone(BUSINESS_TIMEZONE);
  if (local.minute % intervalMinutes || local.second || local.millisecond) {
    throw new DomainError("VALIDATION_ERROR", `Start time must use a ${intervalMinutes}-minute interval.`);
  }
}

async function withSerializableRetry<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(work, { isolationLevel: "Serializable", maxWait: 5_000, timeout: 10_000 });
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      if (code === "P2034" && attempt < 2) continue;
      if (["P2002", "P2004", "P2010"].includes(code)) {
        throw new DomainError("SLOT_UNAVAILABLE", "That time is no longer available.");
      }
      throw error;
    }
  }
  throw new DomainError("SLOT_UNAVAILABLE", "That time is no longer available.");
}

async function createAllocatedBooking(
  tx: Prisma.TransactionClient,
  input: HoldInput | ManualInput,
  options: {
    source: "ONLINE" | "MESSENGER" | "PHONE" | "WALK_IN";
    status: "AWAITING_PAYMENT" | "CONFIRMED";
    depositStatus: DepositStatus;
    actorId?: string;
    guestTokenHash?: string;
    holdExpiresAt?: Date;
  },
) {
  const now = new Date();
  const startsAt = options.source === "WALK_IN" ? now : input.startsAt;
  await expireStaleHolds(tx, now);
  const localDate = localDateOf(startsAt);
  const { context, plan } = await findAllocation(tx, startsAt, localDate, input.serviceIds);
  if (options.source !== "WALK_IN") ensureAligned(startsAt, context.settings.bookingIntervalMinutes);
  const minimumLeadMinutes = minimumLeadMinutesForSource(options.source, context.settings.minimumLeadMinutes);
  if (!isWithinBookingWindow(startsAt, now, minimumLeadMinutes, context.settings.maximumAdvanceDays)) {
    throw new DomainError("VALIDATION_ERROR", "The requested time is outside the booking window.");
  }
  if (!plan) throw new DomainError("SLOT_UNAVAILABLE", "That time is no longer available.");
  const subtotalCentavos = context.services.reduce((sum, service) => sum + service.priceCentavos, 0);
  const depositCentavos = calculateDepositCentavos(subtotalCentavos, context.settings.depositPercent);
  const booking = await tx.booking.create({
    data: {
      publicCode: createPublicBookingCode(now),
      customerName: input.customerName,
      customerPhoneE164: normalizePhilippinePhone(input.customerPhone),
      gcashSenderName: input.gcashSenderName,
      source: options.source,
      status: options.status,
      staffingStatus: plan.staffingMode === "FLEX_CAPACITY" ? "FLEX_RESERVED" : "ASSIGNED",
      subtotalCentavos,
      depositCentavos,
      requestedStartsAt: plan.startsAt,
      requestedEndsAt: plan.endsAt,
      holdExpiresAt: options.holdExpiresAt,
      guestTokenHash: options.guestTokenHash,
      phoneVerificationId: "verificationId" in input ? input.verificationId : undefined,
      policyVersion: "policyVersion" in input ? input.policyVersion : "2026-08-01",
      policyAcceptedAt: now,
      services: {
        create: context.services.map((service) => ({
          serviceId: service.id,
          serviceName: service.name,
          priceCentavos: service.priceCentavos,
          durationMinutes: service.durationMinutes,
          bufferMinutes: service.bufferMinutes,
        })),
      },
      deposit: { create: { status: options.depositStatus, expectedCentavos: depositCentavos, verifiedAt: options.depositStatus === "VERIFIED" ? now : undefined } },
      statusHistory: { create: { toStatus: options.status, actorId: options.actorId } },
    },
    include: { services: true },
  });
  const bookingServices = new Map(booking.services.map((item) => [item.serviceId, item.id]));
  await tx.bookingSegment.createMany({
    data: plan.segments.map((segment) => ({
      bookingId: booking.id,
      bookingServiceId: bookingServices.get(segment.serviceId)!,
      staffId: segment.staffId,
      flexUnitId: segment.flexUnitId,
      startsAt: segment.startsAt,
      endsAt: segment.endsAt,
      blockedUntil: segment.blockedUntil,
      executionOrder: segment.executionOrder,
    })),
  });
  return { booking, plan, subtotalCentavos, depositCentavos };
}

export async function createPublicHold(input: HoldInput) {
  const guestToken = createGuestToken();
  const phoneE164 = normalizePhilippinePhone(input.customerPhone);
  const risk = await evaluateBookingRisk(phoneE164);
  if (risk.level === "HIGH") throw new DomainError("FORBIDDEN", "Please contact Beautyfeel to complete this booking.");
  return withSerializableRetry(async (tx) => {
    const verification = await tx.phoneVerification.findFirst({ where: { id: input.verificationId, phoneE164, verifiedAt: { not: null }, OR: [{ consumedAt: null, expiresAt: { gt: new Date() } }, { trustedUntil: { gt: new Date() } }] } });
    if (!verification) throw new DomainError("VALIDATION_ERROR", "Verify your mobile number before booking.");
    const policy = await tx.policyVersion.findFirst({ where: { version: input.policyVersion, active: true } });
    if (!policy || !input.policyAccepted) throw new DomainError("VALIDATION_ERROR", "Accept the current booking policies before continuing.");
    const settings = await tx.businessSettings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
    if (!settings.gcashName || !settings.gcashNumber) throw new DomainError("INVALID_STATE", "Online booking is temporarily unavailable. Please contact Beautyfeel.");
    const holdExpiresAt = new Date(Date.now() + settings.holdDurationMinutes * 60_000);
    const created = await createAllocatedBooking(tx, input, {
      source: "ONLINE",
      status: "AWAITING_PAYMENT",
      depositStatus: "UNPAID",
      guestTokenHash: guestToken.hash,
      holdExpiresAt,
    });
    await tx.booking.update({ where: { id: created.booking.id }, data: { riskLevel: risk.level, riskReasons: risk.reasons } });
    if (!verification.consumedAt) await tx.phoneVerification.update({ where: { id: verification.id }, data: { consumedAt: new Date() } });
    return {
      bookingCode: created.booking.publicCode,
      guestToken: guestToken.raw,
      holdExpiresAt,
      subtotalCentavos: created.subtotalCentavos,
      depositCentavos: created.depositCentavos,
      startsAt: created.plan.startsAt,
      endsAt: created.plan.endsAt,
      staffingMode: created.plan.staffingMode,
    };
  });
}

export async function claimDeposit(bookingCode: string, guestToken: string, paymentReference?: string | null) {
  return prisma.$transaction(async (tx) => {
    await expireStaleHolds(tx, new Date());
    const booking = await tx.booking.findUnique({ where: { publicCode: bookingCode }, include: { deposit: true } });
    const computed = hashGuestToken(guestToken);
    if (!booking?.guestTokenHash || !verifySecret(computed, booking.guestTokenHash)) {
      throw new DomainError("NOT_FOUND", "Booking not found.");
    }
    assertTransition(booking.status, "PENDING_VERIFICATION");
    const now = new Date();
    const settings = await tx.businessSettings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
    const verificationDueAt = verificationDeadline(now, settings.verificationSlaMinutes);
    const transitioned = await tx.booking.updateMany({ where: { id: booking.id, status: "AWAITING_PAYMENT" }, data: { status: "PENDING_VERIFICATION", holdExpiresAt: null } });
    if (!transitioned.count) throw new DomainError("INVALID_STATE", "The booking status changed. Refresh and try again.");
    await tx.deposit.update({ where: { bookingId: booking.id }, data: { status: "CLAIMED", claimedAt: now, senderName: booking.gcashSenderName, paymentReference: paymentReference || null, claimedAmountCentavos: booking.depositCentavos, verificationDueAt } });
    await tx.bookingStatusHistory.create({ data: { bookingId: booking.id, fromStatus: booking.status, toStatus: "PENDING_VERIFICATION" } });
    await tx.adminAlert.create({ data: { eventKey: `${booking.id}:PAYMENT_CLAIM`, bookingId: booking.id, type: "PAYMENT_CLAIM", severity: "URGENT", message: `${booking.publicCode}: ${booking.gcashSenderName} marked the ${booking.depositCentavos / 100} PHP deposit as sent.` } });
    const owners = await tx.userProfile.findMany({ where: { role: "OWNER", active: true }, select: { id: true, phoneE164: true } });
    if (owners.length) await tx.smsOutbox.createMany({ data: owners.map(owner => ({ eventKey: `${booking.id}:PAYMENT_CLAIM:${owner.id}`, eventType: "PAYMENT_CLAIM", recipientE164: owner.phoneE164, payload: { bookingCode: booking.publicCode, message: `${booking.gcashSenderName} claimed a ${booking.depositCentavos / 100} PHP deposit.` } })), skipDuplicates: true });
    return { bookingCode, status: "PENDING_VERIFICATION" as const, verificationDueAt };
  });
}

export async function createOwnerManualBooking(input: ManualInput, actorId: string) {
  return withSerializableRetry(async (tx) => {
    const created = await createAllocatedBooking(tx, input, {
      source: input.source,
      status: "CONFIRMED",
      depositStatus: input.depositStatus,
      actorId,
    });
    await tx.auditLog.create({ data: { actorId, action: "MANUAL_BOOKING_CREATED", entityType: "Booking", entityId: created.booking.id, metadata: input.entryDurationSeconds === undefined ? undefined : { durationSeconds: input.entryDurationSeconds, targetSeconds: 60, targetMet: input.entryDurationSeconds <= 60 } } });
    await tx.smsOutbox.create({ data: { eventKey: `${created.booking.id}:CONFIRMED`, eventType: "CONFIRMED", recipientE164: created.booking.customerPhoneE164, payload: { customerName: created.booking.customerName, startsAt: created.plan.startsAt.toISOString() } } });
    return { bookingId: created.booking.id, bookingCode: created.booking.publicCode };
  });
}

export async function decideDeposit(bookingId: string, approved: boolean, actorId: string, note?: string | null, customerNote?: string | null) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new DomainError("NOT_FOUND", "Booking not found.");
    const next = approved ? "CONFIRMED" : "REJECTED";
    assertTransition(booking.status, next);
    const transitioned = await tx.booking.updateMany({ where: { id: bookingId, status: "PENDING_VERIFICATION" }, data: { status: next } });
    if (!transitioned.count) throw new DomainError("INVALID_STATE", "The booking status changed. Refresh and try again.");
    await tx.deposit.update({ where: { bookingId }, data: { status: approved ? "VERIFIED" : "REJECTED", verifiedAt: approved ? new Date() : null, ownerNote: note, customerNote: customerNote ?? note, verificationDueAt: null } });
    if (!approved) await tx.bookingSegment.updateMany({ where: { bookingId, allocationState: "ACTIVE" }, data: { allocationState: "RELEASED" } });
    await tx.bookingStatusHistory.create({ data: { bookingId, fromStatus: booking.status, toStatus: next, actorId, reason: note } });
    await tx.auditLog.create({ data: { actorId, action: approved ? "DEPOSIT_APPROVED" : "DEPOSIT_REJECTED", entityType: "Booking", entityId: bookingId } });
    await tx.adminAlert.updateMany({ where: { bookingId, type: { in: ["PAYMENT_CLAIM", "PAYMENT_OVERDUE"] }, resolvedAt: null }, data: { resolvedAt: new Date(), readAt: new Date() } });
    if (!approved) await tx.customerTrustProfile.upsert({ where: { phoneE164: booking.customerPhoneE164 }, create: { phoneE164: booking.customerPhoneE164, rejectedClaimCount: 1 }, update: { rejectedClaimCount: { increment: 1 } } });
    await tx.smsOutbox.create({ data: { eventKey: `${bookingId}:${next}`, eventType: next, recipientE164: booking.customerPhoneE164, payload: next === "CONFIRMED" ? { customerName: booking.customerName, startsAt: booking.requestedStartsAt.toISOString() } : { bookingCode: booking.publicCode, startsAt: booking.requestedStartsAt.toISOString() } } });
    return { bookingId, status: next };
  });
}

export async function cancelExistingBooking(bookingId: string, reason: string, actorId: string) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId }, include: { deposit: true } });
    if (!booking) throw new DomainError("NOT_FOUND", "Booking not found.");
    assertTransition(booking.status, "CANCELLED");
    const settings = await tx.businessSettings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
    const late = booking.requestedStartsAt.getTime() - Date.now() < settings.rescheduleNoticeHours * 3_600_000;
    const transitioned = await tx.booking.updateMany({ where: { id: bookingId, status: booking.status }, data: { status: "CANCELLED" } });
    if (!transitioned.count) throw new DomainError("INVALID_STATE", "The booking status changed. Refresh and try again.");
    await tx.bookingSegment.updateMany({ where: { bookingId, allocationState: "ACTIVE" }, data: { allocationState: "RELEASED" } });
    if (late && booking.deposit?.status === "VERIFIED") await tx.deposit.update({ where: { bookingId }, data: { status: "FORFEITED" } });
    if (booking.deposit?.status === "VERIFIED") await tx.storeCredit.create({ data: { customerPhoneE164: booking.customerPhoneE164, sourceBookingId: booking.id, originalCentavos: booking.deposit.expectedCentavos, remainingCentavos: booking.deposit.expectedCentavos, expiresAt: new Date(Date.now() + 365 * 86_400_000) } });
    await tx.bookingStatusHistory.create({ data: { bookingId, fromStatus: booking.status, toStatus: "CANCELLED", actorId, reason } });
    await tx.auditLog.create({ data: { actorId, action: "BOOKING_CANCELLED", entityType: "Booking", entityId: bookingId, metadata: { reason, late } } });
    return { bookingId, status: "CANCELLED" as const };
  });
}

export async function requestCustomerCancellation(bookingCode: string, guestToken: string, reason: string) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { publicCode: bookingCode }, include: { deposit: true } });
    if (!booking?.guestTokenHash || !verifySecret(hashGuestToken(guestToken), booking.guestTokenHash)) throw new DomainError("NOT_FOUND", "Booking not found.");
    assertTransition(booking.status, "CANCELLED");
    const updated = await tx.booking.updateMany({ where: { id: booking.id, status: booking.status }, data: { status: "CANCELLED" } });
    if (!updated.count) throw new DomainError("INVALID_STATE", "The booking status changed. Refresh and try again.");
    await tx.bookingSegment.updateMany({ where: { bookingId: booking.id, allocationState: "ACTIVE" }, data: { allocationState: "RELEASED" } });
    if (booking.deposit?.status === "VERIFIED") {
      await tx.deposit.update({ where: { bookingId: booking.id }, data: { status: "FORFEITED" } });
      await tx.storeCredit.create({ data: { customerPhoneE164: booking.customerPhoneE164, sourceBookingId: booking.id, originalCentavos: booking.deposit.expectedCentavos, remainingCentavos: booking.deposit.expectedCentavos, expiresAt: new Date(Date.now() + 365 * 86_400_000) } });
    }
    await tx.bookingStatusHistory.create({ data: { bookingId: booking.id, fromStatus: booking.status, toStatus: "CANCELLED", reason: `Customer request: ${reason}` } });
    await tx.adminAlert.create({ data: { eventKey: `${booking.id}:CUSTOMER_CANCELLED`, bookingId: booking.id, type: "CUSTOMER_CANCELLATION", severity: "WARNING", message: `${booking.publicCode} was cancelled by the customer${booking.deposit?.status === "VERIFIED" ? " and converted to store credit" : ""}.` } });
    return { bookingCode, status: "CANCELLED" as const, storeCreditIssued: booking.deposit?.status === "VERIFIED" };
  });
}

export async function rescheduleExistingBooking(input: RescheduleInput, actorId: string) {
  return withSerializableRetry(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: input.bookingId }, include: { services: true } });
    if (!booking) throw new DomainError("NOT_FOUND", "Booking not found.");
    if (booking.status !== "CONFIRMED") throw new DomainError("INVALID_STATE", "Only confirmed bookings can be rescheduled.");
    const settings = await tx.businessSettings.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
    const timely = booking.requestedStartsAt.getTime() - Date.now() >= settings.rescheduleNoticeHours * 3_600_000;
    if ((booking.rescheduleCount >= 1 || !timely) && !input.overrideReason) {
      throw new DomainError("VALIDATION_ERROR", "An override reason is required.");
    }
    await tx.bookingSegment.updateMany({ where: { bookingId: booking.id, allocationState: "ACTIVE" }, data: { allocationState: "RELEASED" } });
    const serviceIds = booking.services.map((service) => service.serviceId);
    const { plan } = await findAllocation(tx, input.startsAt, localDateOf(input.startsAt), serviceIds);
    if (!plan) throw new DomainError("SLOT_UNAVAILABLE", "That time is no longer available.");
    ensureAligned(input.startsAt, settings.bookingIntervalMinutes);
    if (!isWithinBookingWindow(input.startsAt, new Date(), settings.minimumLeadMinutes, settings.maximumAdvanceDays)) throw new DomainError("VALIDATION_ERROR", "The requested time is outside the booking window.");
    const bookingServices = new Map(booking.services.map((item) => [item.serviceId, item.id]));
    await tx.bookingSegment.createMany({ data: plan.segments.map((segment) => ({ bookingId: booking.id, bookingServiceId: bookingServices.get(segment.serviceId)!, staffId: segment.staffId, flexUnitId: segment.flexUnitId, startsAt: segment.startsAt, endsAt: segment.endsAt, blockedUntil: segment.blockedUntil, executionOrder: segment.executionOrder })) });
    await tx.booking.update({ where: { id: booking.id }, data: { requestedStartsAt: plan.startsAt, requestedEndsAt: plan.endsAt, staffingStatus: plan.staffingMode === "FLEX_CAPACITY" ? "FLEX_RESERVED" : "ASSIGNED", rescheduleCount: { increment: 1 } } });
    await tx.bookingStatusHistory.create({ data: { bookingId: booking.id, fromStatus: "CONFIRMED", toStatus: "CONFIRMED", actorId, reason: input.overrideReason ?? "Booking rescheduled." } });
    await tx.smsOutbox.create({ data: { eventKey: `${booking.id}:RESCHEDULED:${booking.rescheduleCount + 1}`, eventType: "CONFIRMED", recipientE164: booking.customerPhoneE164, payload: { customerName: booking.customerName, startsAt: plan.startsAt.toISOString() } } });
    await tx.auditLog.create({ data: { actorId, action: "BOOKING_RESCHEDULED", entityType: "Booking", entityId: booking.id, metadata: { overrideReason: input.overrideReason ?? null } } });
    return { bookingId: booking.id, startsAt: plan.startsAt, endsAt: plan.endsAt };
  });
}

export async function finishAssignedBooking(bookingId: string, target: "COMPLETED" | "NO_SHOW", actorId: string, staffId: string | null) {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findFirst({ where: { id: bookingId, status: "CONFIRMED", ...(staffId ? { segments: { some: { staffId, allocationState: "ACTIVE" } } } : {}) } });
    if (!booking) throw new DomainError("FORBIDDEN", "This booking is not assigned to you.");
    if (booking.requestedStartsAt > new Date()) throw new DomainError("INVALID_STATE", "The appointment has not started yet.");
    const segmentStatus = target === "COMPLETED" ? "COMPLETED" : "NO_SHOW";
    const updatedSegments = await tx.bookingSegment.updateMany({ where: { bookingId, allocationState: "ACTIVE", completionStatus: "PENDING", ...(staffId ? { staffId } : {}) }, data: { completionStatus: segmentStatus, completedAt: new Date(), completedById: actorId } });
    if (!updatedSegments.count) throw new DomainError("INVALID_STATE", "No pending assigned service remains.");
    const remaining = await tx.bookingSegment.count({ where: { bookingId, allocationState: "ACTIVE", completionStatus: "PENDING" } });
    if (remaining) {
      await tx.auditLog.create({ data: { actorId, action: `BOOKING_SEGMENT_${segmentStatus}`, entityType: "Booking", entityId: bookingId, metadata: { updatedSegments: updatedSegments.count, remaining } } });
      return { bookingId, status: "SEGMENT_UPDATED" as const, remaining };
    }
    const anyNoShow = await tx.bookingSegment.count({ where: { bookingId, allocationState: "ACTIVE", completionStatus: "NO_SHOW" } });
    const finalStatus = anyNoShow ? "NO_SHOW" : "COMPLETED";
    assertTransition(booking.status, finalStatus);
    const transitioned = await tx.booking.updateMany({ where: { id: bookingId, status: "CONFIRMED" }, data: { status: finalStatus } });
    if (!transitioned.count) throw new DomainError("INVALID_STATE", "The booking status changed. Refresh and try again.");
    await tx.bookingSegment.updateMany({ where: { bookingId, allocationState: "ACTIVE" }, data: { allocationState: "RELEASED" } });
    if (finalStatus === "NO_SHOW") await tx.deposit.updateMany({ where: { bookingId, status: "VERIFIED" }, data: { status: "FORFEITED" } });
    await tx.customerTrustProfile.upsert({ where: { phoneE164: booking.customerPhoneE164 }, create: { phoneE164: booking.customerPhoneE164, completedCount: finalStatus === "COMPLETED" ? 1 : 0 }, update: finalStatus === "COMPLETED" ? { completedCount: { increment: 1 } } : {} });
    await tx.bookingStatusHistory.create({ data: { bookingId, fromStatus: booking.status, toStatus: finalStatus, actorId } });
    await tx.auditLog.create({ data: { actorId, action: `BOOKING_${finalStatus}`, entityType: "Booking", entityId: bookingId } });
    await tx.adminAlert.create({ data: { eventKey: `${bookingId}:${finalStatus}`, bookingId, type: "BOOKING_COMPLETION", severity: finalStatus === "NO_SHOW" ? "WARNING" : "INFO", message: `${booking.publicCode} was marked ${finalStatus.toLowerCase().replace("_", " ")}.` } });
    return { bookingId, status: finalStatus, remaining: 0 };
  });
}

export async function reassignExistingSegment(segmentId: string, staffId: string, reason: string, actorId: string) {
  return withSerializableRetry(async (tx) => {
    const segment = await tx.bookingSegment.findUnique({ where: { id: segmentId }, include: { bookingService: true, booking: true } });
    if (!segment || segment.allocationState !== "ACTIVE") throw new DomainError("NOT_FOUND", "Active segment not found.");
    await tx.bookingSegment.update({ where: { id: segmentId }, data: { allocationState: "RELEASED" } });
    const localDate = localDateOf(segment.startsAt);
    const context = await buildAvailabilityContext(tx, localDate, [segment.bookingService.serviceId]);
    const member = context.resources.find((item) => item.staffId === staffId);
    const interval = { start: segment.startsAt, end: segment.blockedUntil };
    const contains = member?.working.some((window) => window.start <= interval.start && window.end >= interval.end);
    const conflicts = member?.busy.some((busy) => busy.start < interval.end && interval.start < busy.end);
    if (!member || !contains || conflicts || !context.allocatableServices[0].qualifiedResourceIds.includes(member.id)) {
      throw new DomainError("SLOT_UNAVAILABLE", "The selected staff member is unavailable or unqualified.");
    }
    const replacement = await tx.bookingSegment.create({ data: { bookingId: segment.bookingId, bookingServiceId: segment.bookingServiceId, staffId, startsAt: segment.startsAt, endsAt: segment.endsAt, blockedUntil: segment.blockedUntil, executionOrder: segment.executionOrder } });
    const remainingFlex = await tx.bookingSegment.count({ where: { bookingId: segment.bookingId, allocationState: "ACTIVE", flexUnitId: { not: null } } });
    await tx.booking.update({ where: { id: segment.bookingId }, data: { staffingStatus: remainingFlex ? "FLEX_RESERVED" : "ASSIGNED" } });
    await tx.auditLog.create({ data: { actorId, action: "BOOKING_SEGMENT_REASSIGNED", entityType: "BookingSegment", entityId: replacement.id, metadata: { previousSegmentId: segment.id, reason } } });
    return { segmentId: replacement.id, staffId };
  });
}
