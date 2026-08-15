"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { List, X } from "@phosphor-icons/react";
import { BrandMark } from "@/components/brand-mark";

const links = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
];

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 8);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  return <header className={`fixed inset-x-0 top-0 z-20 text-white transition-[background-color,border-color,backdrop-filter] duration-300 ${scrolled || open ? "border-b border-white/15 bg-brand-950/75 backdrop-blur-md" : "border-b border-transparent bg-transparent"}`}>
    <div className={`mx-auto flex max-w-[1500px] items-center justify-between px-5 transition-[height] duration-500 ease-[cubic-bezier(.22,1,.36,1)] sm:px-8 lg:px-12 ${scrolled || open ? "h-16" : "h-36 sm:h-40"}`}>
      <div className={`origin-left [&_a]:text-white [&_img]:transition-all [&_img]:duration-500 [&_img]:ease-[cubic-bezier(.22,1,.36,1)] [&_span]:hidden ${scrolled || open ? "[&_img]:!size-10" : "[&_img]:!size-28 sm:[&_img]:!size-32"}`}><BrandMark /></div>
      <nav className="hidden items-center gap-1 md:flex" aria-label="Public navigation">
        {links.map(link => <Link key={link.href} href={link.href} className="grid min-h-11 place-items-center rounded-xl px-4 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white">{link.label}</Link>)}
        <Link href="/book" className="ml-3 grid min-h-11 place-items-center rounded-xl bg-white px-5 text-sm font-semibold text-brand-950 transition hover:bg-brand-50 active:scale-[.98]">Book now</Link>
      </nav>
      <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"} className="grid size-11 place-items-center rounded-xl border border-white/25 text-white md:hidden">{open ? <X size={21}/> : <List size={21}/>}</button>
    </div>
    <nav id="mobile-menu" className={`${open ? "block" : "hidden"} border-t border-line bg-surface px-4 pb-4 md:hidden`} aria-label="Mobile navigation">
      <div className="mx-auto max-w-lg py-2">{links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center border-b border-line px-1 font-semibold text-ink-muted">{link.label}</Link>)}<Link href="/book" onClick={() => setOpen(false)} className="mt-4 grid min-h-13 place-items-center rounded-xl bg-brand-900 px-5 font-semibold text-white">Book an appointment</Link></div>
    </nav>
  </header>;
}
