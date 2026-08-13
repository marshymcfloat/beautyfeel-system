import Link from "next/link";
import { SignOutButton } from "@/components/portal/sign-out-button";
import { getCurrentProfile } from "@/lib/auth/session";

export const metadata = { title: "Account" };
export const instant = false;

export default async function StaffAccountPage() {
  const profile = await getCurrentProfile();
  return <div className="max-w-2xl">
    <p className="text-sm font-semibold text-brand-800">Profile and security</p><h1 className="text-h1 mt-1">Account</h1>
    <section className="mt-7 rounded-2xl border border-line bg-surface p-5 sm:p-6"><dl className="space-y-5"><div><dt className="text-sm text-ink-muted">Name</dt><dd className="mt-1 font-semibold">{profile.displayName}</dd></div><div><dt className="text-sm text-ink-muted">Access</dt><dd className="mt-1 font-semibold">Staff member</dd></div></dl></section>
    <section className="mt-6 rounded-2xl border border-line bg-surface p-5 sm:p-6"><h2 className="text-h3">Security</h2><p className="mt-2 text-sm leading-5 text-ink-muted">Use a unique password with at least 12 characters.</p><Link href="/change-password" className="mt-5 inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-900 px-5 font-semibold text-white">Change password</Link></section>
    <section className="mt-6 rounded-2xl border border-line bg-surface p-5 sm:p-6"><h2 className="text-h3">Session</h2><div className="mt-4"><SignOutButton/></div></section>
  </div>;
}
