import "server-only";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/errors/domain-error";

export type BookingRisk = { level: "LOW" | "MEDIUM" | "HIGH"; reasons: string[] };

export async function evaluateBookingRisk(phoneE164: string): Promise<BookingRisk> {
  const [profile, active, recentExpired, recentRejected, completed] = await Promise.all([
    prisma.customerTrustProfile.findUnique({ where: { phoneE164 } }),
    prisma.booking.count({ where: { customerPhoneE164: phoneE164, status: { in: ["AWAITING_PAYMENT", "PENDING_VERIFICATION"] } } }),
    prisma.booking.count({ where: { customerPhoneE164: phoneE164, status: "EXPIRED", createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } } }),
    prisma.booking.count({ where: { customerPhoneE164: phoneE164, status: "REJECTED", createdAt: { gte: new Date(Date.now() - 30 * 86_400_000) } } }),
    prisma.booking.count({ where: { customerPhoneE164: phoneE164, status: "COMPLETED" } }),
  ]);
  if (profile?.status === "BLOCKED" && (!profile.blockedUntil || profile.blockedUntil > new Date())) {
    throw new DomainError("FORBIDDEN", "Online booking is unavailable for this number. Please contact Beautyfeel.");
  }
  const reasons: string[] = [];
  if (active > 0) reasons.push("ACTIVE_UNRESOLVED_BOOKING");
  if (recentExpired >= 2) reasons.push("REPEATED_EXPIRED_HOLDS");
  if (recentRejected >= 2) reasons.push("REPEATED_REJECTED_CLAIMS");
  if (completed > 0 || profile?.status === "TRUSTED") reasons.push("RETURNING_CUSTOMER");
  if (active > 0) return { level: "HIGH", reasons };
  if (recentExpired >= 2 || recentRejected >= 2) return { level: "MEDIUM", reasons };
  return { level: "LOW", reasons };
}
