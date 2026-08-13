import { describe, expect, it } from "vitest";
import {
  createBookingHoldSchema,
  manualBookingSchema,
  markDepositSentSchema,
} from "@/features/bookings/schema";

const serviceId = "20000000-0000-4000-8000-000000000001";
const startsAt = new Date("2026-08-20T02:00:00.000Z");

describe("booking input boundaries", () => {
  it("rejects duplicate services and more than six services", () => {
    const base = {
      customerName: "QA Customer",
      customerPhone: "09171234567",
      startsAt,
      source: "PHONE",
      depositStatus: "UNPAID",
    };

    expect(manualBookingSchema.safeParse({ ...base, serviceIds: [serviceId, serviceId] }).success).toBe(false);
    expect(manualBookingSchema.safeParse({
      ...base,
      serviceIds: Array.from({ length: 7 }, (_, index) =>
        `20000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      ),
    }).success).toBe(false);
  });

  it("requires explicit policy acceptance and a verified identifier", () => {
    const result = createBookingHoldSchema.safeParse({
      customerName: "QA Customer",
      customerPhone: "09171234567",
      serviceIds: [serviceId],
      startsAt,
      gcashSenderName: "QA Sender",
      verificationId: "30000000-0000-4000-8000-000000000001",
      policyVersion: "2026-08-01",
      policyAccepted: false,
    });

    expect(result.success).toBe(false);
  });

  it("rejects malformed private booking claims", () => {
    expect(markDepositSentSchema.safeParse({
      bookingCode: "BF-invalid",
      guestToken: "short",
      paymentReference: null,
    }).success).toBe(false);
  });
});
