"use server";

import { createSupabaseServerClient } from "@/lib/auth/supabase-server";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/errors/domain-error";
import { runAction } from "@/lib/errors/action";
import { normalizePhilippinePhone } from "@/lib/security/phone";
import { phoneToAuthEmail } from "@/lib/security/auth-identifier";
import { assertPublicRateLimit } from "@/lib/security/rate-limit";
import { signInSchema } from "./schema";

export async function signInWithPhoneAndPassword(input: unknown) {
  return runAction(async () => {
    const data = signInSchema.parse(input);
    const phone = normalizePhilippinePhone(data.phone);
    const email = phoneToAuthEmail(phone);
    await assertPublicRateLimit("staff-sign-in", phone, 8, 300);
    const supabase = await createSupabaseServerClient();
    const { data: auth, error } = await supabase.auth.signInWithPassword({ email, password: data.password });
    if (error || !auth.user) throw new DomainError("AUTHENTICATION_REQUIRED", "Invalid phone number or password.");
    const profile = await prisma.userProfile.findUnique({ where: { id: auth.user.id }, include: { staffProfile: true } });
    if (!profile?.active || profile.staffProfile?.active === false) {
      await supabase.auth.signOut();
      throw new DomainError("FORBIDDEN", "This account is inactive.");
    }
    return { role: profile.role, mustChangePassword: profile.mustChangePassword };
  });
}

export async function signOut() {
  return runAction(async () => {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return { signedOut: true };
  });
}
