import { describe, expect, it } from "vitest";
import { isFlexCapacityAllowed, isWithinBookingWindow, localDateMinuteToUtc } from "@/features/availability/time";

describe("Manila scheduling time", () => {
  it("converts Manila wall time to UTC", () => {
    expect(localDateMinuteToUtc("2026-08-10", 9 * 60).toISOString()).toBe(
      "2026-08-10T01:00:00.000Z",
    );
  });

  it("enforces lead and advance windows", () => {
    const now = new Date("2026-08-10T00:00:00.000Z");
    expect(isWithinBookingWindow(new Date("2026-08-10T02:00:00.000Z"), now, 120, 30)).toBe(true);
    expect(isWithinBookingWindow(new Date("2026-08-10T01:59:59.000Z"), now, 120, 30)).toBe(false);
  });

  it("allows flex capacity only beyond the strict cutoff", () => {
    const now = new Date("2026-08-10T00:00:00.000Z");
    expect(isFlexCapacityAllowed(new Date("2026-08-12T00:00:00.000Z"), now, 48)).toBe(false);
    expect(isFlexCapacityAllowed(new Date("2026-08-12T00:00:01.000Z"), now, 48)).toBe(true);
  });
});
