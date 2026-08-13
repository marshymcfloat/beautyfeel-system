"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarBlank, DotsThree, House, ListChecks, Plus } from "@phosphor-icons/react";

const items = [
  { href: "/portal/owner/home", label: "Home", Icon: House },
  { href: "/portal/owner/bookings", label: "Bookings", Icon: ListChecks },
  { href: "/portal/owner/calendar", label: "Calendar", Icon: CalendarBlank },
  { href: "/portal/owner/settings", label: "More", Icon: DotsThree },
];

function isCurrent(path: string, href: string, label: string) {
  return path.startsWith(href) || (label === "More" && ["/services", "/staff", "/account", "/alerts", "/payments"].some((part) => path.includes(`/owner${part}`)));
}

export function PortalNav() {
  const path = usePathname();

  return <>
    <nav aria-label="Owner workspace" className="hidden w-60 shrink-0 px-4 py-6 lg:block">
      <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[.12em] text-ink-subtle">Workspace</p>
      <ul className="space-y-1">{items.map(({ href, label, Icon }) => {
        const active = isCurrent(path, href, label);
        return <li key={href}><Link href={href} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${active ? "bg-brand-950 text-white shadow-[0_8px_20px_rgba(23,78,79,.16)]" : "text-ink-muted hover:bg-surface hover:text-ink"}`}><Icon aria-hidden size={18} weight={active ? "fill" : "regular"} />{label}</Link></li>;
      })}</ul>
      <Link href="/portal/owner/bookings/new" className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-brand-900 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"><Plus aria-hidden size={16} weight="bold" /> New booking</Link>
    </nav>

    <nav className="safe-bottom fixed inset-x-3 bottom-3 z-20 mx-auto max-w-[430px] rounded-[22px] border border-white/80 bg-[#fffefa]/95 px-1.5 py-1 shadow-[0_16px_40px_rgba(23,48,46,.18),0_2px_8px_rgba(23,48,46,.08)] backdrop-blur-xl lg:hidden" aria-label="Owner navigation">
      <ul className="grid h-14 grid-cols-5 items-stretch">
        {items.slice(0, 2).map(({ href, label, Icon }) => <MobileItem key={href} href={href} label={label} Icon={Icon} active={isCurrent(path, href, label)} />)}
        <li className="relative h-14"><Link href="/portal/owner/bookings/new" aria-label="Create a new booking" className="absolute inset-0 flex flex-col items-center justify-end pb-1 text-[9px] font-semibold leading-none text-brand-950 transition active:scale-95"><span className="absolute -top-2 grid size-12 place-items-center rounded-[16px] border-[3px] border-[#fffefa] bg-brand-950 text-white shadow-[0_7px_18px_rgba(23,78,79,.26)]"><Plus aria-hidden size={21} weight="bold" /></span><span>New</span></Link></li>
        {items.slice(2).map(({ href, label, Icon }) => <MobileItem key={href} href={href} label={label} Icon={Icon} active={isCurrent(path, href, label)} />)}
      </ul>
    </nav>
  </>;
}

function MobileItem({ href, label, Icon, active }: { href: string; label: string; Icon: typeof House; active: boolean }) {
  return <li className="h-14"><Link href={href} aria-current={active ? "page" : undefined} className={`grid h-14 grid-rows-[24px_12px] place-items-center content-center gap-1 rounded-[16px] text-[9px] font-semibold leading-none transition active:scale-95 ${active ? "bg-brand-50 text-brand-950" : "text-ink-subtle"}`}><span className="grid size-6 place-items-center"><Icon aria-hidden size={19} weight={active ? "fill" : "regular"} /></span><span>{label}</span></Link></li>;
}
