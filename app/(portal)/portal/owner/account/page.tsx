import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth/session";
import { SignOutButton } from "@/components/portal/sign-out-button";
import { CustomerTrustManager } from "@/components/portal/customer-trust-manager";
import { getCustomerTrustProfiles } from "@/features/customers/queries";
export const metadata={title:"Account"};export const instant=false;
export default async function AccountPage(){const[profile,customers]=await Promise.all([getCurrentProfile(),getCustomerTrustProfiles()]);return <div className="max-w-4xl"><p className="text-sm font-semibold text-brand-800">Owner profile</p><h1 className="text-h1 mt-1">Account</h1><section className="mt-7 rounded-2xl border border-line bg-surface p-5"><p className="text-xs font-semibold text-ink-subtle">Signed in as</p><p className="mt-2 text-xl font-semibold">{profile.displayName}</p><p className="mt-1 text-sm text-ink-muted">Owner</p><div className="mt-6 flex flex-wrap gap-3 border-t border-line pt-5"><Link href="/change-password" className="inline-flex min-h-11 items-center rounded-xl bg-brand-900 px-4 text-sm font-semibold text-white">Change password</Link><SignOutButton/></div></section><CustomerTrustManager profiles={customers}/></div>}
