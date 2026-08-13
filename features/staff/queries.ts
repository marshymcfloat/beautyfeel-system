import "server-only";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function getStaffDirectory() {
  await requireActor(["OWNER"]);
  return prisma.staffProfile.findMany({
    include: {
      user: { select: { id: true, displayName: true, phoneE164: true, active: true } },
      skills: { include: { service: { select: { id: true, name: true } } } },
      scheduleRules: { orderBy: [{ weekday: "asc" }, { startMinute: "asc" }] },
      breaks: { orderBy: [{ weekday: "asc" }, { date: "asc" }, { startMinute: "asc" }] },
      timeOff: { where: { endsAt: { gt: new Date() } }, orderBy: { startsAt: "asc" } },
    },
    orderBy: { publicName: "asc" },
  });
}
