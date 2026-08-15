"use server";

import { DateTime } from "luxon";
import { z } from "zod";
import { updateTag } from "next/cache";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { runAction } from "@/lib/errors/action";
import { TODAY_OVERVIEW_TARGET_SECONDS } from "./metrics";
import { efficiencyCacheTag, portalCacheTags } from "@/lib/cache/portal";

const claritySchema = z.object({ durationSeconds: z.number().int().min(0).max(3600) });

export async function recordTodayOverviewUnderstood(input: unknown) {
  return runAction(async () => {
    const actor = await requireActor(["OWNER"]);
    const data = claritySchema.parse(input);
    const date = DateTime.now().setZone("Asia/Manila").toISODate()!;
    const entityId = `${actor.id}:${date}`;
    const existing = await prisma.auditLog.findFirst({ where: { actorId: actor.id, action: "TODAY_OVERVIEW_UNDERSTOOD", entityId } });
    if (!existing) {
      await prisma.auditLog.create({
        data: { actorId: actor.id, action: "TODAY_OVERVIEW_UNDERSTOOD", entityType: "OwnerWorkflow", entityId, metadata: { durationSeconds: data.durationSeconds, targetSeconds: TODAY_OVERVIEW_TARGET_SECONDS, targetMet: data.durationSeconds <= TODAY_OVERVIEW_TARGET_SECONDS } },
      });
    }
    updateTag(portalCacheTags.efficiency);
    updateTag(efficiencyCacheTag(actor.id));
    return { recorded: !existing };
  });
}
