import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../generated/prisma/client";
import { normalizePhilippinePhone } from "../lib/security/phone";
import { phoneToAuthEmail } from "../lib/security/auth-identifier";

config({ path: ".env.local" });
config();

const required = ["DATABASE_URL", "SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY", "OWNER_PHONE", "OWNER_PASSWORD"] as const;
for (const key of required) if (!process.env[key]) throw new Error(`${key} is required.`);

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
const publicClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const phone = normalizePhilippinePhone(process.env.OWNER_PHONE!);
  const email = phoneToAuthEmail(phone);
  const profile = await prisma.userProfile.findFirst({ where: { role: "OWNER" } });
  if (!profile) throw new Error("No database owner profile exists.");

  const { data: authData, error: authLookupError } = await admin.auth.admin.getUserById(profile.id);
  if (authLookupError || !authData.user) throw new Error(`Supabase owner lookup failed: ${authLookupError?.message ?? "user missing"}`);

  console.log(`Database phone matches configuration: ${profile.phoneE164 === phone}`);
  console.log(`Internal Auth identifier matches: ${authData.user.email === email}`);
  console.log(`Internal Auth identifier confirmed: ${Boolean(authData.user.email_confirmed_at)}`);

  const { error: signInError } = await publicClient.auth.signInWithPassword({ email, password: process.env.OWNER_PASSWORD! });
  if (signInError) throw new Error(`Supabase sign-in failed (${signInError.code ?? "unknown"}): ${signInError.message}`);
  console.log("Owner credentials verified through the publishable Auth client.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Owner login verification failed.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
