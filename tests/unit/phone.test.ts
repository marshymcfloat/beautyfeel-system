import { describe, expect, it } from "vitest";
import { normalizePhilippinePhone } from "@/lib/security/phone";

describe("Philippine phone normalization", () => {
  it.each([
    ["0917 123 4567", "+639171234567"],
    ["639171234567", "+639171234567"],
    ["9171234567", "+639171234567"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizePhilippinePhone(input)).toBe(expected);
  });

  it("rejects invalid numbers", () => {
    expect(() => normalizePhilippinePhone("123")).toThrow(/valid Philippine/);
  });
});
