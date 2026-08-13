import { describe, expect, it } from "vitest";
import { assertTransition } from "@/features/bookings/state-machine";

describe("booking state machine", () => {
  it("allows the payment verification path", () => {
    expect(() => assertTransition("AWAITING_PAYMENT", "PENDING_VERIFICATION")).not.toThrow();
    expect(() => assertTransition("PENDING_VERIFICATION", "CONFIRMED")).not.toThrow();
  });

  it("rejects invalid terminal transitions", () => {
    expect(() => assertTransition("EXPIRED", "CONFIRMED")).toThrow(/Cannot change/);
  });
});
