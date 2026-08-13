import { describe, expect, it } from "vitest";
import { renderSms } from "@/features/notifications/templates";

describe("SMS templates", () => {
  it("renders a concise confirmation without exposing internal data", () => {
    const body = renderSms("CONFIRMED", { bookingCode: "BF-20260809-ABCDEF12", customerName: "Maria Santos", startsAt: "2026-08-10T01:00:00.000Z" });
    expect(body).toContain("Hi Maria!");
    expect(body).toContain("Thank you for choosing Beautyfeel");
    expect(body).toContain("confirmed");
    expect(body).not.toContain("BF-20260809-ABCDEF12");
    expect(body).toContain("Aug 10, 2026, 9:00 AM");
    expect(body).toContain("See you then!");
    expect(body.length).toBeLessThanOrEqual(160);
  });

  it("renders a concise 30-minute reminder", () => {
    const body = renderSms("REMINDER_30M", { bookingCode: "BF-20260809-ABCDEF12", customerName: "Maria Santos", startsAt: "2026-08-10T01:00:00.000Z" });
    expect(body).toContain("Hi Maria!");
    expect(body).toContain("30 minutes");
    expect(body).toContain("We're ready for you");
    expect(body).not.toContain("BF-20260809-ABCDEF12");
    expect(body.length).toBeLessThanOrEqual(160);
  });

  it("renders a friendly day-before reminder", () => {
    const body = renderSms("REMINDER", { bookingCode: "BF-20260809-ABCDEF12", customerName: "Maria Santos", startsAt: "2026-08-10T01:00:00.000Z" });
    expect(body).toContain("Hi Maria!");
    expect(body).toContain("friendly reminder");
    expect(body).toContain("Aug 10, 2026, 9:00 AM");
    expect(body).not.toContain("BF-20260809-ABCDEF12");
    expect(body.length).toBeLessThanOrEqual(160);
  });
});
