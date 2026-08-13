import { z } from "zod";

export const createStaffSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  publicName: z.string().trim().min(2).max(100),
  internalName: z.string().trim().max(100).nullable().optional(),
  phone: z.string().min(10).max(30),
});

export const staffIdSchema = z.object({ staffId: z.string().uuid() });
export const userIdSchema = z.object({ userId: z.string().uuid() });

export const staffSkillsSchema = staffIdSchema.extend({
  serviceIds: z.array(z.string().uuid()).max(100),
  overrideReason: z.string().trim().min(3).max(500).nullable().optional(),
});

const scheduleRule = z.object({
  weekday: z.number().int().min(1).max(7),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
  effectiveFrom: z.coerce.date(),
  effectiveUntil: z.coerce.date().nullable().optional(),
}).refine((value) => value.endMinute > value.startMinute, { message: "Shift must end after it starts." });

export const staffScheduleSchema = staffIdSchema.extend({ rules: z.array(scheduleRule).max(50), overrideReason: z.string().trim().min(3).max(500).nullable().optional() });

const staffBreak = z.object({
  weekday: z.number().int().min(1).max(7).nullable().optional(),
  date: z.coerce.date().nullable().optional(),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(1).max(1440),
}).refine((value) => Boolean(value.weekday) !== Boolean(value.date), { message: "Provide either a weekday or a date." })
  .refine((value) => value.endMinute > value.startMinute, { message: "Break must end after it starts." });

export const staffBreaksSchema = staffIdSchema.extend({ breaks: z.array(staffBreak).max(100), overrideReason: z.string().trim().min(3).max(500).nullable().optional() });

export const staffTimeOffSchema = staffIdSchema.extend({
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  reason: z.string().trim().max(250).nullable().optional(),
  overrideReason: z.string().trim().min(3).max(500).nullable().optional(),
}).refine((value) => value.endsAt > value.startsAt, { message: "Time off must end after it starts." });
