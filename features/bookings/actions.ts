"use server";

import { updateTag } from "next/cache";
import { requireActor } from "@/lib/auth/session";
import { runAction } from "@/lib/errors/action";
import { DomainError } from "@/lib/errors/domain-error";
import { assertPublicRateLimit } from "@/lib/security/rate-limit";
import { bookingDecisionSchema, cancelBookingSchema, createBookingHoldSchema, manualBookingSchema, markDepositSentSchema, reassignSegmentSchema, rescheduleBookingSchema } from "./schema";
import { cancelExistingBooking, claimDeposit, createOwnerManualBooking, createPublicHold, decideDeposit, finishAssignedBooking, reassignExistingSegment, rescheduleExistingBooking } from "./service";
import { processSmsEvent } from "@/features/notifications/service";
import { bookingMutationTags } from "@/lib/cache/portal";

function invalidateBookingData(bookingId?: string) {
  for (const tag of bookingMutationTags(bookingId)) updateTag(tag);
}

export async function createBookingHold(input: unknown) {
  return runAction(async () => {
    const data = createBookingHoldSchema.parse(input);
    await assertPublicRateLimit("create-booking", data.customerPhone, 5);
    const result = await createPublicHold(data);
    invalidateBookingData();
    return result;
  });
}

export async function markDepositSent(input: unknown) {
  return runAction(async () => {
    const data = markDepositSentSchema.parse(input);
    await assertPublicRateLimit("claim-deposit", data.bookingCode, 10);
    const result = await claimDeposit(data.bookingCode, data.guestToken, data.paymentReference);
    invalidateBookingData();
    return result;
  });
}

export async function approveDeposit(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = bookingDecisionSchema.parse(input);
    const result = await decideDeposit(data.bookingId, true, actor.id, data.note, data.customerNote);
    await processSmsEvent(`${data.bookingId}:CONFIRMED`);
    invalidateBookingData(data.bookingId);
    return result;
  });
}

export async function rejectDeposit(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = bookingDecisionSchema.parse(input);
    if (!data.customerNote || data.customerNote.length < 3) throw new DomainError("VALIDATION_ERROR", "A customer-facing rejection reason is required.");
    const result = await decideDeposit(data.bookingId, false, actor.id, data.note, data.customerNote);
    invalidateBookingData(data.bookingId);
    return result;
  });
}

export async function cancelBooking(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = cancelBookingSchema.parse(input);
    const result = await cancelExistingBooking(data.bookingId, data.reason, actor.id);
    invalidateBookingData(data.bookingId);
    return result;
  });
}

export async function rescheduleBooking(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER", "BOOKING_ASSISTANT"]);
    const data = rescheduleBookingSchema.parse(input);
    if (actor.role === "BOOKING_ASSISTANT" && data.overrideReason) throw new DomainError("FORBIDDEN", "Only the owner can override rescheduling rules.");
    const result = await rescheduleExistingBooking(data, actor.id);
    invalidateBookingData(data.bookingId);
    return result;
  });
}

export async function createManualBooking(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER", "BOOKING_ASSISTANT"]);
    const data = manualBookingSchema.parse(input);
    const result = await createOwnerManualBooking(data, actor.id);
    await processSmsEvent(`${result.bookingId}:CONFIRMED`);
    invalidateBookingData(result.bookingId);
    return result;
  });
}

export async function completeAssignedBooking(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER", "STAFF"]);
    const { bookingId } = bookingDecisionSchema.pick({ bookingId: true }).parse(input);
    const result = await finishAssignedBooking(bookingId, "COMPLETED", actor.id, actor.role === "OWNER" ? null : actor.staffId);
    invalidateBookingData(bookingId);
    return result;
  });
}

export async function markAssignedBookingNoShow(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER", "STAFF"]);
    const { bookingId } = bookingDecisionSchema.pick({ bookingId: true }).parse(input);
    const result = await finishAssignedBooking(bookingId, "NO_SHOW", actor.id, actor.role === "OWNER" ? null : actor.staffId);
    invalidateBookingData(bookingId);
    return result;
  });
}

export async function reassignBookingSegment(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = reassignSegmentSchema.parse(input);
    const result = await reassignExistingSegment(data.segmentId, data.staffId, data.reason, actor.id);
    invalidateBookingData();
    return result;
  });
}
