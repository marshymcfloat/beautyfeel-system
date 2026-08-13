import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(32),
  GUEST_TOKEN_PEPPER: z.string().min(32),
  SEMAPHORE_API_KEY: z.string().optional(),
  SEMAPHORE_SENDER_NAME: z.string().min(1).default("Beautyfeel"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (!cached) {
    const result = serverEnvSchema.safeParse(process.env);
    if (!result.success) {
      const keys = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))];
      throw new Error(
        `Beautyfeel server configuration is missing or invalid: ${keys.join(", ")}. ` +
        "Copy .env.example to .env.local, add your local credentials, then restart Next.js.",
      );
    }
    cached = result.data;
  }
  return cached;
}
