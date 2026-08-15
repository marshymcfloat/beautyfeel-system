import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { requireActor } from "@/lib/auth/session";
import { portalCacheLife, portalCacheTags } from "@/lib/cache/portal";
import { prisma } from "@/lib/db/prisma";

export async function getAdminAlerts(take = 50) {
  await requireActor(["OWNER"]);
  return loadAdminAlerts(Math.min(Math.max(take, 1), 100));
}

async function loadAdminAlerts(take: number) {
  "use cache";
  cacheLife(portalCacheLife);
  cacheTag(portalCacheTags.alerts);
  return prisma.adminAlert.findMany({
    where: { resolvedAt: null },
    include: { booking: { select: { id: true, publicCode: true, requestedStartsAt: true, staffingStatus: true } } },
    orderBy: { createdAt: "desc" },
    take,
  });
}
