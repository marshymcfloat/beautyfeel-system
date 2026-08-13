import { describe, expect, it } from "vitest";
import { calculateDepositCentavos } from "@/features/bookings/money";

describe("deposit calculation", () => {
  it("calculates 20 percent in integer centavos and rounds upward", () => {
    expect(calculateDepositCentavos(100_00, 20)).toBe(20_00);
    expect(calculateDepositCentavos(10_01, 20)).toBe(201);
  });
});
