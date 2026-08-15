"use server";

import { updateTag } from "next/cache";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { runAction } from "@/lib/errors/action";
import { portalCacheTags } from "@/lib/cache/portal";
import { serviceActiveSchema, serviceInputSchema } from "./schema";

export async function createService(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = serviceInputSchema.omit({ id: true }).parse(input);
    const service = await prisma.$transaction(async (tx) => {
      const created = await tx.service.create({ data });
      await tx.auditLog.create({
        data: { actorId: actor.id, action: "SERVICE_CREATED", entityType: "Service", entityId: created.id },
      });
      return created;
    });
    updateTag("public-services");
    updateTag(portalCacheTags.services);
    return service;
  });
}

export async function updateService(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const { id, ...data } = serviceInputSchema.required({ id: true }).parse(input);
    const service = await prisma.$transaction(async (tx) => {
      const updated = await tx.service.update({ where: { id }, data });
      await tx.auditLog.create({
        data: { actorId: actor.id, action: "SERVICE_UPDATED", entityType: "Service", entityId: id },
      });
      return updated;
    });
    updateTag("public-services");
    updateTag(portalCacheTags.services);
    return service;
  });
}

export async function setServiceActive(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = serviceActiveSchema.parse(input);
    await prisma.$transaction([
      prisma.service.update({ where: { id: data.id }, data: { active: data.active } }),
      prisma.auditLog.create({ data: { actorId: actor.id, action: data.active ? "SERVICE_ACTIVATED" : "SERVICE_DEACTIVATED", entityType: "Service", entityId: data.id } }),
    ]);
    updateTag("public-services");
    updateTag(portalCacheTags.services);
    return { id: data.id, active: data.active };
  });
}
