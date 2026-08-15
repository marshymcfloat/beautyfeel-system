import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowRight, Scissors, SlidersHorizontal, UserCircle, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { getBusinessSettings, getCapacitySettings } from "@/features/settings/queries";
import { SettingsManager } from "@/components/portal/settings-manager";

export const metadata = { title: "Settings" };
export const instant = false;

async function SettingsContent() {
  await connection();
  const [settings, capacity] = await Promise.all([getBusinessSettings(), getCapacitySettings()]);

  return <SettingsManager settings={settings} hours={capacity.hours} categories={capacity.categories} closures={capacity.closures} />;
}

export default function SettingsPage() {
  return <div className="mx-auto max-w-5xl">
    <header className="max-w-2xl">
      <p className="text-xs font-semibold text-brand-800">Business controls</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-[-.035em] sm:text-3xl">Settings</h1>
      <p className="mt-2 text-sm leading-5 text-ink-muted">Manage your catalog, team, payment rules, availability, and closures.</p>
    </header>

    <nav className="mt-5 grid gap-2.5 sm:grid-cols-3" aria-label="Management areas">
      <ManageLink href="/portal/owner/services" title="Services" text="Prices and durations" icon={<Scissors size={21} weight="duotone" />} tone="teal" />
      <ManageLink href="/portal/owner/assistants" title="Booking assistants" text="Accounts and access" icon={<UsersThree size={21} weight="duotone" />} tone="blue" />
      <ManageLink href="/portal/owner/account" title="Account" text="Profile and security" icon={<UserCircle size={21} weight="duotone" />} tone="sand" />
    </nav>

    <div className="mt-8 flex items-center gap-3 border-b border-line pb-4">
      <span className="grid size-10 place-items-center rounded-xl bg-brand-950 text-white"><SlidersHorizontal size={20} weight="duotone" /></span>
      <div><p className="text-xs font-medium text-ink-muted">Booking configuration</p><h2 className="text-lg font-semibold tracking-[-.02em]">Rules and capacity</h2></div>
    </div>

    <Suspense fallback={<SettingsSkeleton />}><SettingsContent /></Suspense>
  </div>;
}

function ManageLink({ href, title, text, icon, tone }: { href: string; title: string; text: string; icon: React.ReactNode; tone: "teal" | "blue" | "sand" }) {
  const colors = { teal: "bg-brand-100 text-brand-900", blue: "bg-info-soft text-info", sand: "bg-warning-soft text-warning" };
  return <Link href={href} className="group grid min-h-[76px] grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-line bg-surface px-3.5 py-3 transition hover:-translate-y-px hover:border-border-strong active:scale-[.98]">
    <span className={`grid size-11 place-items-center rounded-xl ${colors[tone]}`}>{icon}</span>
    <span className="min-w-0"><span className="block text-sm font-semibold">{title}</span><span className="mt-0.5 block truncate text-xs text-ink-muted">{text}</span></span>
    <ArrowRight size={15} weight="bold" className="text-ink-subtle transition group-hover:translate-x-0.5 group-hover:text-brand-900" />
  </Link>;
}

function SettingsSkeleton() {
  return <div className="mt-5 grid gap-3 lg:grid-cols-2" aria-label="Loading settings">{[120, 96, 96, 96].map((height, index) => <div key={index} className="overflow-hidden rounded-2xl border border-line bg-surface"><div className="flex items-center gap-3 p-4"><div className="skeleton size-10 rounded-xl" /><div className="flex-1"><div className="skeleton h-4 w-36 rounded" /><div className="skeleton mt-2 h-3 w-48 rounded" /></div></div><div className="skeleton rounded-none" style={{ height }} /></div>)}</div>;
}
