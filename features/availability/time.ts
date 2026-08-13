import { DateTime } from "luxon";
import { DomainError } from "@/lib/errors/domain-error";

export const BUSINESS_TIMEZONE = "Asia/Manila";

export function localDateMinuteToUtc(
  localDate: string,
  minuteOfDay: number,
  timezone = BUSINESS_TIMEZONE,
): Date {
  const base = DateTime.fromISO(localDate, { zone: timezone }).startOf("day");
  if (!base.isValid || minuteOfDay < 0 || minuteOfDay > 1440) {
    throw new DomainError("VALIDATION_ERROR", "Invalid business date or time.");
  }
  return base.plus({ minutes: minuteOfDay }).toUTC().toJSDate();
}

export function getLocalDayBounds(
  localDate: string,
  timezone = BUSINESS_TIMEZONE,
): { start: Date; end: Date; weekday: number } {
  const start = DateTime.fromISO(localDate, { zone: timezone }).startOf("day");
  if (!start.isValid) {
    throw new DomainError("VALIDATION_ERROR", "Invalid business date.");
  }
  return {
    start: start.toUTC().toJSDate(),
    end: start.plus({ days: 1 }).toUTC().toJSDate(),
    weekday: start.weekday,
  };
}

export function isWithinBookingWindow(
  startsAt: Date,
  now: Date,
  minimumLeadMinutes: number,
  maximumAdvanceDays: number,
): boolean {
  const earliest = now.getTime() + minimumLeadMinutes * 60_000;
  const latest = now.getTime() + maximumAdvanceDays * 86_400_000;
  return startsAt.getTime() >= earliest && startsAt.getTime() <= latest;
}

export function isFlexCapacityAllowed(
  startsAt: Date,
  now: Date,
  strictCutoffHours: number,
): boolean {
  return startsAt.getTime() - now.getTime() > strictCutoffHours * 3_600_000;
}
