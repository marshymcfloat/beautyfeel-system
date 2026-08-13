"use server";

import { revalidatePath } from "next/cache";
import { requireActor } from "@/lib/auth/session";
import { runAction } from "@/lib/errors/action";
import { DomainError } from "@/lib/errors/domain-error";
import { assertPublicRateLimit } from "@/lib/security/rate-limit";
import { bookingDecisionSchema, cancelBookingSchema, createBookingHoldSchema, manualBookingSchema, markDepositSentSchema, reassignSegmentSchema, rescheduleBookingSchema } from "./schema";
import { cancelExistingBooking, claimDeposit, createOwnerManualBooking, createPublicHold, decideDeposit, finishAssignedBooking, reassignExistingSegment, rescheduleExistingBooking } from "./service";
import { processSmsEvent } from "@/features/notifications/service";

export async function createBookingHold(input: unknown) {
  return runAction(async () => {
    const data = createBookingHoldSchema.parse(input);
    await assertPublicRateLimit("create-booking", data.customerPhone, 5);
    return createPublicHold(data);
  });
}

export async function markDepositSent(input: unknown) {
  return runAction(async () => {
    const data = markDepositSentSchema.parse(input);
    await assertPublicRateLimit("claim-deposit", data.bookingCode, 10);
    return claimDeposit(data.bookingCode, data.guestToken, data.paymentReference);
  });
}

export async function approveDeposit(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = bookingDecisionSchema.parse(input);
    const result = await decideDeposit(data.bookingId, true, actor.id, data.note, data.customerNote);
    await processSmsEvent(`${data.bookingId}:CONFIRMED`);
    revalidatePath("/portal/owner", "layout");
    return result;
  });
}

export async function rejectDeposit(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = bookingDecisionSchema.parse(input);
    if (!data.customerNote || data.customerNote.length < 3) throw new DomainError("VALIDATION_ERROR", "A customer-facing rejection reason is required.");
    const result = await decideDeposit(data.bookingId, false, actor.id, data.note, data.customerNote);
    revalidatePath("/portal/owner", "layout");
    return result;
  });
}

export async function cancelBooking(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = cancelBookingSchema.parse(input);
    const result = await cancelExistingBooking(data.bookingId, data.reason, actor.id);
    revalidatePath("/portal/owner", "layout");
    return result;
  });
}

export async function rescheduleBooking(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = rescheduleBookingSchema.parse(input);
    const result = await rescheduleExistingBooking(data, actor.id);
    revalidatePath("/portal/owner", "layout");
    return result;
  });
}

export async function createManualBooking(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = manualBookingSchema.parse(input);
    const result = await createOwnerManualBooking(data, actor.id);
    await processSmsEvent(`${result.bookingId}:CONFIRMED`);
    revalidatePath("/portal/owner", "layout");
    return result;
  });
}

export async function completeAssignedBooking(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER", "STAFF"]);
    const { bookingId } = bookingDecisionSchema.pick({ bookingId: true }).parse(input);
    const result = await finishAssignedBooking(bookingId, "COMPLETED", actor.id, actor.role === "OWNER" ? null : actor.staffId);
    revalidatePath("/portal", "layout");
    return result;
  });
}

export async function markAssignedBookingNoShow(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER", "STAFF"]);
    const { bookingId } = bookingDecisionSchema.pick({ bookingId: true }).parse(input);
    const result = await finishAssignedBooking(bookingId, "NO_SHOW", actor.id, actor.role === "OWNER" ? null : actor.staffId);
    revalidatePath("/portal", "layout");
    return result;
  });
}

export async function reassignBookingSegment(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = reassignSegmentSchema.parse(input);
    const result = await reassignExistingSegment(data.segmentId, data.staffId, data.reason, actor.id);
    revalidatePath("/portal/owner", "layout");
    return result;
  });
}
