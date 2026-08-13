import { z } from "zod";

export const businessSettingsSchema = z.object({
  gcashNumber: z.string().trim().max(30).nullable(),
  gcashName: z.string().trim().max(100).nullable(),
  businessAddress: z.string().trim().max(300).nullable(),
  businessMapUrl: z.url().max(500).nullable(),
  depositPercent: z.number().int().min(1).max(100),
  bookingIntervalMinutes: z.number().int().refine((value) => 60 % value === 0),
  minimumLeadMinutes: z.number().int().min(0).max(1440),
  maximumAdvanceDays: z.number().int().min(1).max(365),
  holdDurationMinutes: z.number().int().min(5).max(240),
  verificationSlaMinutes: z.number().int().min(15).max(240),
  otpTrustDays: z.number().int().min(1).max(90),
  cancellationCutoffHours: z.number().int().min(0).max(168),
  rescheduleNoticeHours: z.number().int().min(0).max(168),
  flexStrictCutoffHours: z.number().int().min(1).max(336),
});

const businessHoursRuleSchema = z.object({
  weekday: z.number().int().min(1).max(7),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
}).refine((value) => value.endMinute > value.startMinute, { message: "Business hours must end after they start." });

export const businessHoursSchema = z.object({ rules: z.array(businessHoursRuleSchema).max(30) });

export const flexCapacitySchema = z.object({
  categoryId: z.string().uuid(),
  capacity: z.number().int().min(0).max(20),
  available24Hours: z.boolean(),
});

export const closureSchema = z.object({
  id: z.string().uuid().optional(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  reason: z.string().trim().max(250).nullable().optional(),
}).refine((value) => value.endsAt > value.startsAt, {
  message: "Closure must end after it starts.",
});
