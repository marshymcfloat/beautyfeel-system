import { describe, expect, it } from "vitest";
import { createAssistantSchema } from "@/features/assistants/schema";
import { rescheduleBookingSchema } from "@/features/bookings/schema";

describe("booking assistant inputs", () => {
  it("validates an individual assistant account", () => {
    expect(createAssistantSchema.parse({ displayName: "Ana Cruz", phone: "09171234567" }).displayName).toBe("Ana Cruz");
  });

  it("keeps reschedule overrides explicit for server authorization", () => {
    const result = rescheduleBookingSchema.parse({ bookingId: "00000000-0000-4000-8000-000000000001", startsAt: "2026-08-20T10:00:00+08:00" });
    expect(result.overrideReason).toBeUndefined();
  });
});
