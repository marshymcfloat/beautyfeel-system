import { describe, expect, it } from "vitest";
import { trustedVerificationLifetimeDays } from "@/features/verification/policy";

describe("booking verification policy", () => {
  it("remembers a verified device for 30 days by default", () => {
    expect(trustedVerificationLifetimeDays(undefined)).toBe(30);
    expect(trustedVerificationLifetimeDays(null)).toBe(30);
  });

  it("uses the owner's configured trust period", () => {
    expect(trustedVerificationLifetimeDays(14)).toBe(14);
  });
});
