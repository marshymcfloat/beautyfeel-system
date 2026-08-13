import { describe, expect, it } from "vitest";
import { filterRecentCustomers, type RecentCustomer } from "@/features/customers/recent";

const customers: RecentCustomer[] = [
  { name: "Maria Santos", phoneE164: "+639171234567", lastBookedAt: "2026-08-01T02:00:00.000Z" },
  { name: "Ana Cruz", phoneE164: "+639289876543", lastBookedAt: "2026-07-20T03:00:00.000Z" },
];

describe("recent customer filtering", () => {
  it("matches customer names without case sensitivity", () => {
    expect(filterRecentCustomers(customers, "MARIA")).toEqual([customers[0]]);
  });

  it("matches formatted phone fragments", () => {
    expect(filterRecentCustomers(customers, "0917 123")).toEqual([customers[0]]);
  });

  it("returns recent customers when the search is empty", () => {
    expect(filterRecentCustomers(customers, "", 1)).toEqual([customers[0]]);
  });
});
