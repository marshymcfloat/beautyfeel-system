import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { ServiceCatalog } from "@/components/public/service-catalog";

export const metadata = {
  title: "Services and prices",
  description: "Explore Beautyfeel skin treatments, massage and spa services, lashes, brows, nails, waxing and body care with clear prices and treatment times.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return <main>
    <section className="bg-ink pb-14 pt-44 text-white sm:pb-16 sm:pt-48 lg:pb-20">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-12 border-b border-white/20 pb-12 lg:grid-cols-[1.3fr_.7fr] lg:items-end lg:pb-16">
        <div>
          <p className="text-xs font-semibold tracking-[.14em] text-[#d9a998]">THE BEAUTYFEEL MENU · 2026</p>
          <h1 className="mt-6 max-w-[12ch] text-[clamp(3.1rem,6.5vw,6.6rem)] font-semibold leading-[.88] tracking-[-.06em] text-balance">Treatments, clearly considered.</h1>
        </div>
        <div className="lg:pb-2">
          <p className="max-w-[34rem] text-[clamp(1rem,1.3vw,1.15rem)] leading-relaxed text-white/68">Browse by category, compare time and price, then combine the treatments that make sense for your visit.</p>
          <div className="mt-7 flex items-start gap-3 text-sm text-white/52"><ShieldCheck aria-hidden size={19} className="mt-0.5 shrink-0 text-[#d9a998]"/><p>A 20% deposit is calculated from your selected services.</p></div>
        </div>
        </div>
        <div className="scrollbar-none flex gap-8 overflow-x-auto pt-5 text-xs font-semibold tracking-[.08em] text-white/45 sm:gap-12"><span>SKIN CARE</span><span>MASSAGE & SPA</span><span>LASHES & BROWS</span><span>NAIL CARE</span><span>BODY SERVICES</span></div>
      </div>
    </section>

    <section className="bg-canvas py-12 sm:py-16 lg:py-20" aria-labelledby="catalog-title">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <div className="mb-10 grid gap-4 border-b border-line-strong pb-7 sm:mb-12 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="text-xs font-semibold tracking-[.12em] text-brand-800">TREATMENT INDEX</p><h2 id="catalog-title" className="mt-3 text-[clamp(2.2rem,4vw,4rem)] font-semibold leading-[.95] tracking-[-.045em]">The complete menu.</h2></div>
          <p className="max-w-sm text-sm leading-6 text-ink-muted">Search, filter, or reorder the menu without losing sight of the details.</p>
        </div>
        <Suspense fallback={<CatalogSkeleton/>}><ServiceCatalog/></Suspense>
      </div>
    </section>

    <section className="bg-brand-900 text-white">
      <div className="mx-auto grid max-w-[1500px] gap-8 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[1fr_auto] lg:items-end lg:px-12 lg:py-20">
        <div><p className="text-xs font-semibold tracking-[.12em] text-white/55">WHEN YOU’RE READY</p><h2 className="mt-4 max-w-[14ch] text-[clamp(2.6rem,5vw,5.25rem)] font-semibold leading-[.9] tracking-[-.055em]">Take your choices into booking.</h2></div>
        <Link href="/book" className="group inline-flex min-h-13 w-fit items-center gap-4 border-b border-white pb-2 font-semibold">Choose a time <ArrowRight size={18} className="transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-1"/></Link>
      </div>
    </section>
  </main>;
}

function CatalogSkeleton() {
  return <div><div className="skeleton h-24"/><div className="mt-8 divide-y divide-line border-y border-line">{[1,2,3,4,5].map(item => <div key={item} className="grid min-h-28 gap-4 py-6 sm:grid-cols-[1fr_auto]"><div><div className="skeleton h-4 w-24"/><div className="skeleton mt-4 h-7 w-56"/></div><div className="skeleton h-6 w-24"/></div>)}</div></div>;
}
