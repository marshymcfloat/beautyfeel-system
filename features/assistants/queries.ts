import "server-only";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function getBookingAssistants() {
  await requireActor(["OWNER"]);
  return prisma.userProfile.findMany({ where: { role: "BOOKING_ASSISTANT" }, select: { id: true, displayName: true, phoneE164: true, active: true, createdAt: true }, orderBy: { displayName: "asc" } });
}
