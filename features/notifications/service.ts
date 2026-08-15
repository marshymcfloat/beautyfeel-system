import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { expireStaleHolds } from "@/features/availability/repository";
import type { SmsProvider } from "./provider";
import { SemaphoreSmsProvider } from "./semaphore";
import { renderSms } from "./templates";

const retryMinutes = [1, 5, 25, 125];

export async function enqueueDueReminders(now = new Date()): Promise<number> {
  const from = new Date(now.getTime() + 23 * 3_600_000 + 55 * 60_000);
  const to = new Date(now.getTime() + 24 * 3_600_000 + 5 * 60_000);
  const bookings = await prisma.booking.findMany({
    where: { status: "CONFIRMED", requestedStartsAt: { gte: from, lt: to } },
    select: { id: true, customerName: true, customerPhoneE164: true, requestedStartsAt: true },
    take: 200,
  });
  const result = await prisma.smsOutbox.createMany({
    data: bookings.map((booking) => ({
      eventKey: `${booking.id}:REMINDER`,
      eventType: "REMINDER",
      recipientE164: booking.customerPhoneE164,
      payload: { customerName: booking.customerName, startsAt: booking.requestedStartsAt.toISOString() },
    })),
    skipDuplicates: true,
  });
  return result.count;
}

export async function enqueueThirtyMinuteReminders(now = new Date()): Promise<number> {
  // The maintenance job may run a few minutes early or late. The unique event key
  // keeps this wider window from sending the same reminder more than once.
  const from = new Date(now.getTime() + 25 * 60_000);
  const to = new Date(now.getTime() + 35 * 60_000);
  const bookings = await prisma.booking.findMany({
    where: { status: "CONFIRMED", requestedStartsAt: { gte: from, lt: to } },
    select: { id: true, customerName: true, customerPhoneE164: true, requestedStartsAt: true },
    take: 200,
  });
  const result = await prisma.smsOutbox.createMany({
    data: bookings.map((booking) => ({
      eventKey: `${booking.id}:REMINDER:30M`,
      eventType: "REMINDER_30M",
      recipientE164: booking.customerPhoneE164,
      payload: { customerName: booking.customerName, startsAt: booking.requestedStartsAt.toISOString() },
    })),
    skipDuplicates: true,
  });
  return result.count;
}

function safeErrorCode(error: unknown): string {
  if (!(error instanceof Error)) return "UNKNOWN";
  return /^[A-Z0-9_]+$/.test(error.message) ? error.message.slice(0, 80) : error.name;
}

export async function processSmsOutbox(
  provider: SmsProvider = new SemaphoreSmsProvider(),
  now = new Date(),
  batchSize = 25,
  eventKey?: string,
) {
  const candidates = await prisma.smsOutbox.findMany({
    where: { status: { in: ["PENDING", "RETRY"] }, nextAttemptAt: { lte: now }, ...(eventKey ? { eventKey } : {}) },
    orderBy: { createdAt: "asc" },
    take: batchSize,
  });
  let sent = 0;
  let failed = 0;
  for (const candidate of candidates) {
    const claimed = await prisma.smsOutbox.updateMany({
      where: { id: candidate.id, status: { in: ["PENDING", "RETRY"] }, nextAttemptAt: { lte: now } },
      data: { status: "PROCESSING", attemptCount: { increment: 1 } },
    });
    if (!claimed.count) continue;
    try {
      const payload = candidate.payload as Prisma.JsonObject;
      const result = await provider.send({
        recipientE164: candidate.recipientE164,
        body: renderSms(candidate.eventType, {
          bookingCode: typeof payload.bookingCode === "string" ? payload.bookingCode : undefined,
          customerName: typeof payload.customerName === "string" ? payload.customerName : undefined,
          startsAt: typeof payload.startsAt === "string" ? payload.startsAt : undefined,
          message: typeof payload.message === "string" ? payload.message : undefined,
          phone: typeof payload.phone === "string" ? payload.phone : undefined,
          temporaryPassword: typeof payload.temporaryPassword === "string" ? payload.temporaryPassword : undefined,
        }),
      });
      await prisma.smsOutbox.update({ where: { id: candidate.id }, data: { status: "SENT", sentAt: new Date(), providerMessageId: result.providerMessageId, lastErrorCode: null } });
      sent += 1;
    } catch (error) {
      const attempt = candidate.attemptCount + 1;
      const retryDelay = retryMinutes[attempt - 1];
      await prisma.smsOutbox.update({
        where: { id: candidate.id },
        data: retryDelay
          ? { status: "RETRY", nextAttemptAt: new Date(now.getTime() + retryDelay * 60_000), lastErrorCode: safeErrorCode(error) }
          : { status: "FAILED", lastErrorCode: safeErrorCode(error) },
      });
      if (!retryDelay) await prisma.adminAlert.createMany({ data: [{ eventKey: `SMS_FAILED:${candidate.id}`, type: "SMS_FAILURE", severity: "URGENT", message: `SMS delivery permanently failed for ${candidate.eventType}.` }], skipDuplicates: true });
      failed += 1;
    }
  }
  return { claimed: candidates.length, sent, failed };
}

export async function processSmsEvent(eventKey: string, now = new Date()) {
  return processSmsOutbox(new SemaphoreSmsProvider(), now, 1, eventKey);
}

export async function enqueueStaffingAlerts(now = new Date()) {
  const bookings = await prisma.booking.findMany({
    where: { status: "CONFIRMED", staffingStatus: "FLEX_RESERVED", requestedStartsAt: { gt: now, lte: new Date(now.getTime() + 48 * 3_600_000) } },
    select: { id: true, publicCode: true, requestedStartsAt: true },
    take: 200,
  });
  const owners = await prisma.userProfile.findMany({ where: { role: "OWNER", active: true }, select: { id: true, phoneE164: true } });
  let created = 0;
  for (const booking of bookings) {
    const hoursRemaining = (booking.requestedStartsAt.getTime() - now.getTime()) / 3_600_000;
    for (const threshold of [48, 24, 2]) {
      if (hoursRemaining > threshold) continue;
      const eventKey = `${booking.id}:STAFFING:${threshold}H`;
      const message = `${booking.publicCode} still needs assigned staff and starts within ${threshold} hours.`;
      const inserted = await prisma.$transaction(async (tx) => {
        const alert = await tx.adminAlert.createMany({ data: [{ eventKey, bookingId: booking.id, severity: threshold <= 2 ? "CRITICAL" : threshold <= 24 ? "URGENT" : "WARNING", message }], skipDuplicates: true });
        if (!alert.count) return false;
        if (owners.length) await tx.smsOutbox.createMany({ data: owners.map((owner) => ({ eventKey: `${eventKey}:${owner.id}:SMS`, eventType: "STAFFING_ALERT", recipientE164: owner.phoneE164, payload: { bookingCode: booking.publicCode, startsAt: booking.requestedStartsAt.toISOString(), message } })), skipDuplicates: true });
        return true;
      });
      if (inserted) created += 1;
    }
  }
  return created;
}

export async function escalateOverduePayments(now = new Date()) {
  const overdue = await prisma.deposit.findMany({ where: { status: "CLAIMED", verificationDueAt: { lte: now }, escalatedAt: null }, include: { booking: true }, take: 200 });
  const owners = await prisma.userProfile.findMany({ where: { role: "OWNER", active: true }, select: { id: true, phoneE164: true } });
  let escalated = 0;
  for (const deposit of overdue) {
    const changed = await prisma.$transaction(async tx => {
      const updated = await tx.deposit.updateMany({ where: { id: deposit.id, status: "CLAIMED", escalatedAt: null }, data: { overdueAt: now, escalatedAt: now } });
      if (!updated.count) return false;
      await tx.adminAlert.createMany({ data: [{ eventKey: `${deposit.bookingId}:PAYMENT_OVERDUE`, bookingId: deposit.bookingId, type: "PAYMENT_OVERDUE", severity: "CRITICAL", message: `${deposit.booking.publicCode} has exceeded the payment-verification deadline.` }], skipDuplicates: true });
      if (owners.length) await tx.smsOutbox.createMany({ data: owners.map(owner => ({ eventKey: `${deposit.bookingId}:PAYMENT_OVERDUE:${owner.id}`, eventType: "PAYMENT_OVERDUE", recipientE164: owner.phoneE164, payload: { bookingCode: deposit.booking.publicCode } })), skipDuplicates: true });
      return true;
    });
    if (changed) escalated += 1;
  }
  return escalated;
}

export async function runBookingMaintenance(now = new Date()) {
  const expired = await prisma.$transaction((tx) => expireStaleHolds(tx, now));
  await prisma.publicRateLimit.deleteMany({ where: { expiresAt: { lte: now } } });
  const reminders = await enqueueDueReminders(now);
  const thirtyMinuteReminders = await enqueueThirtyMinuteReminders(now);
  const overduePayments = await escalateOverduePayments(now);
  const expiredCredits = await prisma.storeCredit.updateMany({ where: { status: "ACTIVE", expiresAt: { lte: now } }, data: { status: "EXPIRED", remainingCentavos: 0 } });
  const sms = await processSmsOutbox(new SemaphoreSmsProvider(), now);
  await prisma.auditLog.create({ data: { action: "BOOKING_MAINTENANCE_COMPLETED", entityType: "System", entityId: "booking-maintenance", metadata: { ranAt: now.toISOString() } } });
  return { expired: expired.length, reminders, thirtyMinuteReminders, overduePayments, expiredCredits: expiredCredits.count, sms };
}
