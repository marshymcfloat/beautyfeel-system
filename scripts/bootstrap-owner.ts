import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../generated/prisma/client";
import { normalizePhilippinePhone } from "../lib/security/phone";
import { phoneToAuthEmail } from "../lib/security/auth-identifier";

config({ path: ".env.local" });
config();

const required = ["DATABASE_URL", "SUPABASE_URL", "SUPABASE_SECRET_KEY", "OWNER_PHONE", "OWNER_PASSWORD", "OWNER_NAME"] as const;
for (const key of required) if (!process.env[key]) throw new Error(`${key} is required.`);

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

async function main() {
  const phone = normalizePhilippinePhone(process.env.OWNER_PHONE!);
  const email = phoneToAuthEmail(phone);
  const existing = await prisma.userProfile.findFirst({ where: { role: "OWNER" } });
  if (existing) {
    const conflictingPhone = await prisma.userProfile.findFirst({ where: { phoneE164: phone, id: { not: existing.id } }, select: { id: true } });
    if (conflictingPhone) throw new Error("OWNER_PHONE is already assigned to another profile.");

    const { data: authUser, error: lookupError } = await supabase.auth.admin.getUserById(existing.id);
    if (lookupError || !authUser.user) {
      throw new Error("The database owner has no matching Supabase Auth account. Manual repair is required.");
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
      email,
      password: process.env.OWNER_PASSWORD!,
      email_confirm: true,
      user_metadata: { display_name: process.env.OWNER_NAME! },
    });
    if (updateError) throw new Error("Unable to update the existing Supabase owner account.");

    await prisma.userProfile.update({
      where: { id: existing.id },
      data: {
        displayName: process.env.OWNER_NAME!,
        phoneE164: phone,
        active: true,
        mustChangePassword: false,
      },
    });
    console.log("Existing owner credentials updated.");
    return;
  }
  const { data, error } = await supabase.auth.admin.createUser({ email, password: process.env.OWNER_PASSWORD!, email_confirm: true });
  if (error || !data.user) throw new Error("Unable to create the Supabase owner account.");
  try {
    await prisma.userProfile.create({ data: { id: data.user.id, role: "OWNER", displayName: process.env.OWNER_NAME!, phoneE164: phone, mustChangePassword: false } });
  } catch (cause) {
    await supabase.auth.admin.deleteUser(data.user.id);
    throw cause;
  }
  console.log("Owner account created.");
}

main().finally(() => prisma.$disconnect());
