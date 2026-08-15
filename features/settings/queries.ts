import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/errors/domain-error";
import { portalCacheLife, portalCacheTags } from "@/lib/cache/portal";

export async function getBusinessSettings() {
  "use cache";
  cacheLife(portalCacheLife);
  cacheTag("business-settings", portalCacheTags.settings);
  const settings = await prisma.businessSettings.findUnique({ where: { id: 1 } });
  if (!settings) throw new DomainError("INTERNAL_ERROR", "Business settings have not been initialized.");
  return settings;
}

export async function getCapacitySettings() {
  const { requireActor } = await import("@/lib/auth/session");
  await requireActor(["OWNER"]);
  return loadCapacitySettings();
}
async function loadCapacitySettings() {
  "use cache";
  cacheLife(portalCacheLife);
  cacheTag(portalCacheTags.settings);
  const [hours, categories, closures] = await Promise.all([
    prisma.businessHoursRule.findMany({ where: { active: true }, orderBy: [{ weekday: "asc" }, { startMinute: "asc" }] }),
    prisma.serviceCategory.findMany({
      select: { id: true, name: true, available24Hours: true, flexUnits: { where: { active: true }, select: { id: true } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.businessClosure.findMany({ where: { endsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" }, take: 100 }),
  ]);
  return { hours, closures, categories: categories.map((category) => ({ id: category.id, name: category.name, available24Hours: category.available24Hours, flexCapacity: category.flexUnits.length })) };
}


export async function getPublicBusinessInfo() {
  "use cache";
  cacheLife("minutes");
  cacheTag("business-settings");
  const [settings, hours, categories] = await Promise.all([
    prisma.businessSettings.findUnique({ where: { id: 1 }, select: { businessAddress: true, businessMapUrl: true } }),
    prisma.businessHoursRule.findMany({ where: { active: true }, orderBy: [{ weekday: "asc" }, { startMinute: "asc" }] }),
    prisma.serviceCategory.findMany({ where: { active: true, available24Hours: true }, select: { name: true }, orderBy: { sortOrder: "asc" } }),
  ]);
  return { address: settings?.businessAddress ?? null, mapUrl: settings?.businessMapUrl ?? null, hours, alwaysAvailableCategories: categories.map((category) => category.name) };
}
