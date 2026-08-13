import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { getServerEnv } from "@/lib/env/server";
import { DomainError } from "@/lib/errors/domain-error";

export async function assertPublicRateLimit(
  scope: string,
  subject: string,
  maximum: number,
  windowSeconds = 60,
) {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const key = createHash("sha256").update(`${getServerEnv().GUEST_TOKEN_PEPPER}:${scope}:${subject}:${forwarded}`).digest("hex");
  const now = new Date();
  const windowMs = windowSeconds * 1_000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const expiresAt = new Date(windowStart.getTime() + windowMs * 2);
  const bucket = await prisma.publicRateLimit.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, expiresAt },
    update: { count: { increment: 1 }, expiresAt },
  });
  if (bucket.count > maximum) throw new DomainError("RATE_LIMITED", "Too many attempts. Please wait and try again.");
}
