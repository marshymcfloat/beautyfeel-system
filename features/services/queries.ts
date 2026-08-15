import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireActor } from "@/lib/auth/session";
import { portalCacheLife, portalCacheTags } from "@/lib/cache/portal";

export async function getPublicServices() {
  "use cache";
  cacheLife(portalCacheLife);
  cacheTag("public-services", portalCacheTags.services);
  return prisma.service.findMany({
    where: { active: true, category: { active: true } },
    select: {
      id: true,
      name: true,
      description: true,
      priceCentavos: true,
      durationMinutes: true,
      bufferMinutes: true,
      category: { select: { id: true, name: true, slug: true } },
    },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });
}

export async function getServiceCatalog() {
  await requireActor(["OWNER"]);
  return loadServiceCatalog();
}
async function loadServiceCatalog() {
  "use cache";
  cacheLife(portalCacheLife);
  cacheTag(portalCacheTags.services);
  return prisma.serviceCategory.findMany({
    include: { services: { orderBy: { name: "asc" } } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}
