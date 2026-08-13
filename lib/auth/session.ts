import "server-only";
import type { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/errors/domain-error";
import { createSupabaseServerClient } from "./supabase-server";

export type AuthenticatedActor = {
  id: string;
  role: UserRole;
  staffId: string | null;
  mustChangePassword: boolean;
};

export async function requireActor(
  allowedRoles?: readonly UserRole[],
): Promise<AuthenticatedActor> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new DomainError("AUTHENTICATION_REQUIRED", "Sign in is required.");
  }

  const profile = await prisma.userProfile.findUnique({
    where: { id: data.user.id },
    include: { staffProfile: { select: { id: true, active: true } } },
  });
  if (!profile?.active || (profile.staffProfile && !profile.staffProfile.active)) {
    throw new DomainError("FORBIDDEN", "This account is inactive.");
  }
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    throw new DomainError("FORBIDDEN", "You do not have permission.");
  }
  return {
    id: profile.id,
    role: profile.role,
    staffId: profile.staffProfile?.id ?? null,
    mustChangePassword: profile.mustChangePassword,
  };
}

export async function getCurrentProfile() {
  const actor = await requireActor();
  return prisma.userProfile.findUniqueOrThrow({
    where: { id: actor.id },
    select: { id: true, role: true, displayName: true, mustChangePassword: true },
  });
}
