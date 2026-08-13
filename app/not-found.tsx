import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function NotFound() {
  return <main className="grid min-h-[100dvh] place-items-center bg-canvas px-4 py-16"><div className="w-full max-w-lg"><BrandMark/><p className="mt-12 text-sm font-semibold text-brand-800">Page not found</p><h1 className="text-h1 mt-2">This page is no longer available.</h1><p className="mt-4 max-w-md leading-6 text-ink-muted">The link may be incorrect or the page may have moved.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-900 px-5 font-semibold text-white">Return home</Link><Link href="/book" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-line bg-surface px-5 font-semibold">Book an appointment</Link></div></div></main>;
}
