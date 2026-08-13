import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { DateTime } from "luxon";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { MANUAL_BOOKING_TARGET_SECONDS, summarizeDurations, TODAY_OVERVIEW_TARGET_SECONDS } from "./metrics";

function duration(metadata: Prisma.JsonValue | null) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = metadata.durationSeconds;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function getWorkflowEfficiency() {
  const actor = await requireActor(["OWNER"]);
  const now = DateTime.now().setZone("Asia/Manila");
  const since = now.minus({ days: 30 }).toUTC().toJSDate();
  const logs = await prisma.auditLog.findMany({
    where: { actorId: actor.id, action: { in: ["MANUAL_BOOKING_CREATED", "TODAY_OVERVIEW_UNDERSTOOD"] }, createdAt: { gte: since } },
    select: { action: true, entityId: true, metadata: true },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  const bookingDurations = logs.filter((log) => log.action === "MANUAL_BOOKING_CREATED").map((log) => duration(log.metadata)).filter((value): value is number => value !== null);
  const overviewDurations = logs.filter((log) => log.action === "TODAY_OVERVIEW_UNDERSTOOD").map((log) => duration(log.metadata)).filter((value): value is number => value !== null);
  const todayKey = `${actor.id}:${now.toISODate()}`;
  return {
    manualBookings: summarizeDurations(bookingDurations, MANUAL_BOOKING_TARGET_SECONDS),
    todayOverview: summarizeDurations(overviewDurations, TODAY_OVERVIEW_TARGET_SECONDS),
    todayAcknowledged: logs.some((log) => log.action === "TODAY_OVERVIEW_UNDERSTOOD" && log.entityId === todayKey),
  };
}
