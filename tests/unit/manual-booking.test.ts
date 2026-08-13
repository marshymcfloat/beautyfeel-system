import { describe, expect, it } from "vitest";
import { walkInStartsAt } from "@/features/bookings/manual";

describe("walk-in booking time", () => {
  it("uses the current time without forcing a booking interval", () => {
    expect(walkInStartsAt(new Date("2026-08-13T06:12:47.321Z"))).toEqual(new Date("2026-08-13T06:12:47.321Z"));
  });
});
