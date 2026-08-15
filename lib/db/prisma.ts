import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getServerEnv } from "@/lib/env/server";

function createPrismaClient() {
  const env = getServerEnv();
  const isDevelopment = process.env.NODE_ENV === "development";
  // The persistent local dev server can keep a direct connection warm. Deployed
  // instances continue using DATABASE_URL's serverless transaction pooler.
  const connectionString = isDevelopment && env.DIRECT_URL ? env.DIRECT_URL : env.DATABASE_URL;

  const adapter = new PrismaPg({
    connectionString,
    max: 3,
    connectionTimeoutMillis: 30_000,
    idleTimeoutMillis: isDevelopment ? 300_000 : 30_000,
    maxLifetimeSeconds: isDevelopment ? 1_800 : 300,
    keepAlive: true,
    keepAliveInitialDelayMillis: 10_000,
  });
  return new PrismaClient({ adapter });
}

type AppPrismaClient = ReturnType<typeof createPrismaClient>;
const globalForPrisma = globalThis as unknown as { prisma?: AppPrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
