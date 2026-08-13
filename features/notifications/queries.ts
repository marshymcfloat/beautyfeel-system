import "server-only";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function getAdminAlerts(take = 50) {
  await requireActor(["OWNER"]);
  return prisma.adminAlert.findMany({
    where: { resolvedAt: null },
    include: { booking: { select: { id: true, publicCode: true, requestedStartsAt: true, staffingStatus: true } } },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(take, 1), 100),
  });
}
