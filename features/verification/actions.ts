"use server";

import { runAction } from "@/lib/errors/action";
import { assertPublicRateLimit } from "@/lib/security/rate-limit";
import { normalizePhilippinePhone } from "@/lib/security/phone";
import { requestOtpSchema, verifyOtpSchema } from "./schema";
import { requestBookingOtp as requestOtp, verifyBookingOtp as verifyOtp } from "./service";

export async function requestBookingOtp(input: unknown) {
  return runAction(async () => {
    const data = requestOtpSchema.parse(input);
    const phone = normalizePhilippinePhone(data.phone);
    await assertPublicRateLimit("booking-otp-request", phone, 3, 600);
    return requestOtp(phone);
  });
}

export async function verifyBookingOtp(input: unknown) {
  return runAction(async () => {
    const data = verifyOtpSchema.parse(input);
    await assertPublicRateLimit("booking-otp-verify", data.verificationId, 6, 600);
    return verifyOtp(data.verificationId, data.phone, data.code);
  });
}
