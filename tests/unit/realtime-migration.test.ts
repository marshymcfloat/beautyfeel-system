import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("Realtime migration privacy", () => {
  it("broadcasts only date and revision metadata", () => {
    const sql = readFileSync("prisma/migrations/20260809000000_initial/migration.sql", "utf8");
    const start = sql.indexOf("CREATE OR REPLACE FUNCTION public.beautyfeel_send_invalidation");
    const end = sql.indexOf("CREATE OR REPLACE FUNCTION public.beautyfeel_broadcast_booking_change");
    const broadcastFunction = sql.slice(start, end);
    expect(broadcastFunction).toContain("jsonb_build_object('date', local_date, 'revision'");
    expect(broadcastFunction).not.toMatch(/customer|phone|deposit|staff_id|NEW\.|OLD\./i);
  });
});
