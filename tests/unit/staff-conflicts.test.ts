import { describe, expect, it } from "vitest";
import { conflictsWithBreaks, conflictsWithSchedule } from "@/features/staff/conflicts";

const segment = {
  startsAt: new Date("2026-08-10T01:00:00.000Z"),
  blockedUntil: new Date("2026-08-10T02:10:00.000Z"),
};

describe("staffing change conflicts", () => {
  it("detects when a proposed schedule no longer covers an appointment", () => {
    expect(conflictsWithSchedule(segment, [{ weekday: 1, startMinute: 8 * 60, endMinute: 12 * 60, effectiveFrom: new Date("2026-01-01") }])).toBe(false);
    expect(conflictsWithSchedule(segment, [{ weekday: 1, startMinute: 10 * 60, endMinute: 18 * 60, effectiveFrom: new Date("2026-01-01") }])).toBe(true);
  });

  it("detects recurring and dated break overlaps including cleanup", () => {
    expect(conflictsWithBreaks(segment, [{ weekday: 1, startMinute: 10 * 60, endMinute: 11 * 60 }])).toBe(true);
    expect(conflictsWithBreaks(segment, [{ date: new Date("2026-08-11"), startMinute: 10 * 60, endMinute: 11 * 60 }])).toBe(false);
  });
});
