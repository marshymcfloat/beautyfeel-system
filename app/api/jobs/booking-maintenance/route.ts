import { getServerEnv } from "@/lib/env/server";
import { verifySecret } from "@/lib/security/tokens";
import { runBookingMaintenance } from "@/features/notifications/service";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const provided = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!verifySecret(provided, getServerEnv().CRON_SECRET)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  try {
    const result = await runBookingMaintenance();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("Booking maintenance failed", { name: error instanceof Error ? error.name : "UnknownError" });
    try { const { prisma } = await import("@/lib/db/prisma"); await prisma.adminAlert.createMany({ data: [{ eventKey: `CRON_FAILURE:${new Date().toISOString().slice(0,16)}`, type: "CRON_FAILURE", severity: "CRITICAL", message: "Booking maintenance failed. Check server logs and retry the job." }], skipDuplicates: true }); } catch {}
    return Response.json({ ok: false }, { status: 500 });
  }
}
