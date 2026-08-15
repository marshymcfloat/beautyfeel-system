import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("capacity-only migration", () => {
  const sql = readFileSync("prisma/migrations/20260813020000_booking_assistant_and_capacity_only/migration.sql", "utf8");
  it("converts staff segments before deleting staff", () => {
    expect(sql.indexOf('UPDATE "booking_segments"')).toBeLessThan(sql.indexOf('DELETE FROM "staff_profiles"'));
    expect(sql).toContain("Treatment-staff segment conversion was incomplete");
  });
});
