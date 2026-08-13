import { DateTime } from "luxon";

export type ScheduledSegment = { startsAt: Date; blockedUntil: Date };

export function conflictsWithSchedule(
  segment: ScheduledSegment,
  rules: readonly { weekday: number; startMinute: number; endMinute: number; effectiveFrom: Date; effectiveUntil?: Date | null }[],
  timezone = "Asia/Manila",
): boolean {
  const start = DateTime.fromJSDate(segment.startsAt).setZone(timezone);
  const end = DateTime.fromJSDate(segment.blockedUntil).setZone(timezone);
  const date = start.toISODate()!;
  return !rules.some((rule) => {
    const from = DateTime.fromJSDate(rule.effectiveFrom, { zone: "utc" }).toISODate()!;
    const until = rule.effectiveUntil ? DateTime.fromJSDate(rule.effectiveUntil, { zone: "utc" }).toISODate()! : null;
    return rule.weekday === start.weekday && from <= date && (!until || until >= date) && rule.startMinute <= start.hour * 60 + start.minute && rule.endMinute >= end.hour * 60 + end.minute;
  });
}

export function conflictsWithBreaks(
  segment: ScheduledSegment,
  breaks: readonly { weekday?: number | null; date?: Date | null; startMinute: number; endMinute: number }[],
  timezone = "Asia/Manila",
): boolean {
  const start = DateTime.fromJSDate(segment.startsAt).setZone(timezone);
  const end = DateTime.fromJSDate(segment.blockedUntil).setZone(timezone);
  const localDate = start.toISODate();
  const startMinute = start.hour * 60 + start.minute;
  const endMinute = end.hour * 60 + end.minute;
  return breaks.some((item) => {
    const itemDate = item.date ? DateTime.fromJSDate(item.date, { zone: "utc" }).toISODate() : null;
    const applies = itemDate ? itemDate === localDate : item.weekday === start.weekday;
    return applies && item.startMinute < endMinute && startMinute < item.endMinute;
  });
}
