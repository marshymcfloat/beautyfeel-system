import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { requireActor } from "@/lib/auth/session";
import { portalCacheLife, portalCacheTags } from "@/lib/cache/portal";
import { prisma } from "@/lib/db/prisma";

export async function getBookingAssistants() {
  await requireActor(["OWNER"]);
  return loadBookingAssistants();
}

async function loadBookingAssistants() {
  "use cache";
  cacheLife(portalCacheLife);
  cacheTag(portalCacheTags.assistants);
  return prisma.userProfile.findMany({ where: { role: "BOOKING_ASSISTANT" }, select: { id: true, displayName: true, phoneE164: true, active: true, createdAt: true }, orderBy: { displayName: "asc" } });
}
