import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { SignOutButton } from "@/components/portal/sign-out-button";
import { CustomerTrustManager } from "@/components/portal/customer-trust-manager";
import { getCustomerTrustProfiles } from "@/features/customers/queries";
import { PortalRowsSkeleton } from "@/components/ui/skeletons";

export const metadata = { title: "Account" };
export const instant = false;

async function ProfileCard() {
  await connection();
  const profile = await getCurrentProfile();
  return <section className="rounded-2xl border border-line bg-surface p-5"><p className="text-xs font-semibold text-ink-subtle">Signed in as</p><p className="mt-2 text-xl font-semibold">{profile.displayName}</p><p className="mt-1 text-sm text-ink-muted">Owner</p><div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5"><Link href="/change-password" className="inline-flex min-h-11 items-center rounded-xl bg-brand-900 px-4 text-sm font-semibold text-white">Change password</Link><SignOutButton/></div></section>;
}

async function TrustContent() {
  await connection();
  return <CustomerTrustManager profiles={await getCustomerTrustProfiles()}/>;
}

export default function AccountPage() {
  return <div className="max-w-4xl"><p className="text-sm font-semibold text-brand-800">Owner profile</p><h1 className="text-h1 mt-1">Account</h1><div className="mt-7"><Suspense fallback={<div className="skeleton h-48 rounded-2xl"/>}><ProfileCard/></Suspense></div><Suspense fallback={<div className="mt-6"><PortalRowsSkeleton rows={4}/></div>}><TrustContent/></Suspense></div>;
}
