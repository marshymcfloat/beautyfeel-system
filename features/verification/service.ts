import "server-only";
import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/errors/domain-error";
import { getServerEnv } from "@/lib/env/server";
import { normalizePhilippinePhone } from "@/lib/security/phone";
import { SemaphoreSmsProvider } from "@/features/notifications/semaphore";
import { evaluateBookingRisk } from "@/features/risk/service";
import { trustedVerificationLifetimeDays } from "./policy";

const trustedCookie = "bf_booking_trust";

function digest(value: string) {
  return createHash("sha256").update(`${getServerEnv().GUEST_TOKEN_PEPPER}:${value}`).digest("hex");
}

function equal(left: string, right: string) {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function requestBookingOtp(phoneInput: string) {
  const phoneE164 = normalizePhilippinePhone(phoneInput);
  const risk = await evaluateBookingRisk(phoneE164);
  const now = new Date();
  const cookieToken = (await cookies()).get(trustedCookie)?.value;
  if (cookieToken && risk.level === "LOW") {
    const trusted = await prisma.phoneVerification.findFirst({
      where: { phoneE164, trustedTokenHash: digest(cookieToken), trustedUntil: { gt: now }, verifiedAt: { not: null } },
      orderBy: { createdAt: "desc" },
    });
    if (trusted) return { verificationId: trusted.id, trusted: true, expiresAt: trusted.trustedUntil! };
  }
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(now.getTime() + 10 * 60_000);
  const verification = await prisma.phoneVerification.create({
    data: { phoneE164, otpHash: digest(code), expiresAt },
  });
  try {
    await new SemaphoreSmsProvider().send({ recipientE164: phoneE164, body: `Beautyfeel verification code: ${code}. It expires in 10 minutes. Do not share this code.` });
  } catch {
    await prisma.adminAlert.create({ data: { eventKey: `OTP_DELIVERY:${verification.id}`, type: "OTP_FAILURE", severity: "URGENT", message: `OTP delivery failed for verification ${verification.id}.` } });
    throw new DomainError("INTERNAL_ERROR", "We could not send the verification code. Please try again or contact Beautyfeel.");
  }
  return { verificationId: verification.id, trusted: false, expiresAt };
}

export async function verifyBookingOtp(verificationId: string, phoneInput: string, code: string) {
  const phoneE164 = normalizePhilippinePhone(phoneInput);
  const verification = await prisma.phoneVerification.findUnique({ where: { id: verificationId } });
  if (!verification || verification.phoneE164 !== phoneE164 || verification.consumedAt || verification.expiresAt <= new Date()) {
    throw new DomainError("VALIDATION_ERROR", "The verification code has expired. Request a new one.");
  }
  if (verification.attemptCount >= 5) throw new DomainError("RATE_LIMITED", "Too many incorrect codes. Request a new one.");
  if (!verification.otpHash || !equal(digest(code), verification.otpHash)) {
    await prisma.$transaction([
      prisma.phoneVerification.update({ where: { id: verification.id }, data: { attemptCount: { increment: 1 } } }),
      prisma.customerTrustProfile.upsert({ where: { phoneE164 }, create: { phoneE164, otpFailureCount: 1 }, update: { otpFailureCount: { increment: 1 } } }),
    ]);
    throw new DomainError("VALIDATION_ERROR", "The verification code is incorrect.");
  }
  const settings = await prisma.businessSettings.findUnique({ where: { id: 1 } });
  const rawTrustToken = randomBytes(32).toString("base64url");
  const trustDays = trustedVerificationLifetimeDays(settings?.otpTrustDays);
  const trustedUntil = new Date(Date.now() + trustDays * 86_400_000);
  await prisma.phoneVerification.update({ where: { id: verification.id }, data: { verifiedAt: new Date(), otpHash: null, trustedTokenHash: digest(rawTrustToken), trustedUntil } });
  (await cookies()).set(trustedCookie, rawTrustToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/book", maxAge: trustDays * 86_400 });
  return { verificationId: verification.id, verified: true, trustedUntil };
}

export async function consumePhoneVerification(id: string, phoneE164: string) {
  const result = await prisma.phoneVerification.updateMany({
    where: { id, phoneE164, verifiedAt: { not: null }, consumedAt: null, OR: [{ trustedUntil: { gt: new Date() } }, { expiresAt: { gt: new Date() } }] },
    data: { consumedAt: new Date() },
  });
  if (!result.count) throw new DomainError("VALIDATION_ERROR", "Verify your mobile number before booking.");
}
