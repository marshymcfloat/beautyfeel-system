import { z } from "zod";

const serviceIds = z.array(z.string().uuid()).min(1).max(6).refine(
  (values) => new Set(values).size === values.length,
  "Each service may only be selected once.",
);

const bookingBaseSchema = z.object({
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().min(10).max(30),
  serviceIds,
  startsAt: z.coerce.date(),
});

export const createBookingHoldSchema = bookingBaseSchema.extend({
  gcashSenderName: z.string().trim().min(2).max(100),
  verificationId: z.string().uuid(),
  policyVersion: z.string().trim().min(1).max(40),
  policyAccepted: z.literal(true),
});

export const markDepositSentSchema = z.object({
  bookingCode: z.string().regex(/^BF-\d{8}-[A-F0-9]{8}$/),
  guestToken: z.string().min(32).max(100),
  paymentReference: z.string().trim().max(100).nullable().optional(),
});

export const bookingDecisionSchema = z.object({
  bookingId: z.string().uuid(),
  note: z.string().trim().max(500).nullable().optional(),
  customerNote: z.string().trim().max(500).nullable().optional(),
});

export const cancelBookingSchema = bookingDecisionSchema.extend({
  reason: z.string().trim().min(3).max(500),
});

export const rescheduleBookingSchema = z.object({
  bookingId: z.string().uuid(),
  startsAt: z.coerce.date(),
  overrideReason: z.string().trim().min(3).max(500).nullable().optional(),
});

export const manualBookingSchema = bookingBaseSchema.extend({
  gcashSenderName: z.string().trim().min(2).max(100).default("Owner-created booking"),
  source: z.enum(["MESSENGER", "PHONE", "WALK_IN"]),
  depositStatus: z.enum(["UNPAID", "VERIFIED", "WAIVED"]),
  entryDurationSeconds: z.number().int().min(0).max(86400).optional(),
});

export const reassignSegmentSchema = z.object({
  segmentId: z.string().uuid(),
  staffId: z.string().uuid(),
  reason: z.string().trim().min(3).max(500),
});
