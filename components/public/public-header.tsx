"use client";

import Link from "next/link";
import { useState } from "react";
import { List, X } from "@phosphor-icons/react";
import { BrandMark } from "@/components/brand-mark";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  return <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur-sm">
    <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
      <BrandMark />
      <nav className="hidden items-center gap-1 md:flex" aria-label="Public navigation">
        {links.map(link => <Link key={link.href} href={link.href} className="grid min-h-11 place-items-center rounded-xl px-4 text-sm font-semibold text-ink-muted transition hover:bg-brand-50 hover:text-ink">{link.label}</Link>)}
        <Link href="/book" className="ml-3 grid min-h-11 place-items-center rounded-xl bg-brand-900 px-5 text-sm font-semibold text-white transition hover:bg-brand-800 active:scale-[.98]">Book now</Link>
      </nav>
      <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"} className="grid size-11 place-items-center rounded-xl border border-line text-brand-950 md:hidden">{open ? <X size={21}/> : <List size={21}/>}</button>
    </div>
    <nav id="mobile-menu" className={`${open ? "block" : "hidden"} border-t border-line bg-surface px-4 pb-4 md:hidden`} aria-label="Mobile navigation">
      <div className="mx-auto max-w-lg py-2">{links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center border-b border-line px-1 font-semibold text-ink-muted">{link.label}</Link>)}<Link href="/book" onClick={() => setOpen(false)} className="mt-4 grid min-h-13 place-items-center rounded-xl bg-brand-900 px-5 font-semibold text-white">Book an appointment</Link></div>
    </nav>
  </header>;
}

