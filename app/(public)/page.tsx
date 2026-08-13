import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CheckCircle, Clock, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { TreatmentComposition } from "@/components/public/treatment-composition";
import { FeaturedServices } from "@/components/public/featured-services";

export const metadata = {
  title: "Beautyfeel | Skin, spa, lashes and nails",
  description: "Choose Beautyfeel treatments, see available times, and reserve your appointment online with a 20% GCash deposit.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <main>
    <section className="bg-surface">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[5fr_7fr] lg:items-center lg:gap-16 lg:py-20">
        <div className="lg:pb-8">
          <p className="text-sm font-semibold text-brand-800">Skin · Spa · Lashes · Nails</p>
          <h1 className="text-display mt-4 max-w-xl">Carefully chosen treatments, with time reserved for you.</h1>
          <p className="mt-6 max-w-[55ch] text-[17px] leading-relaxed text-ink-muted">Choose what you need, find a time that works, and secure your visit through a clear online booking process.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/book" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-brand-900 px-6 font-semibold text-white transition hover:bg-brand-800 active:scale-[.98]">Book an appointment <ArrowRight size={18}/></Link>
            <Link href="/services" className="inline-flex min-h-13 items-center justify-center rounded-xl border border-line bg-surface px-6 font-semibold text-ink transition hover:border-line-strong">See services and prices</Link>
          </div>
          <p className="mt-5 flex items-center gap-2 text-sm text-ink-muted"><ShieldCheck size={18} className="text-brand-800"/> A 20% deposit holds your selected time.</p>
        </div>
        <TreatmentComposition/>
      </div>
    </section>

    <section className="border-y border-line bg-brand-950 text-white" aria-label="Booking benefits">
      <div className="mx-auto grid max-w-[1200px] divide-y divide-white/15 px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0">
        <TrustItem icon={<CheckCircle size={21}/>} title="Clear before you confirm" text="See treatment prices, duration, and deposit before booking."/>
        <TrustItem icon={<Clock size={21}/>} title="Times checked for you" text="Only appointment times that can fit your services are offered."/>
        <TrustItem icon={<ShieldCheck size={21}/>} title="Manually verified" text="Beautyfeel confirms your GCash deposit before final confirmation."/>
      </div>
    </section>

    <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-[4fr_8fr] lg:gap-16">
        <div><p className="text-sm font-semibold text-brand-800">What we offer</p><h2 className="text-h1 mt-3">Treatments for the way you want to feel.</h2><p className="mt-4 max-w-sm leading-6 text-ink-muted">A focused menu across skin, body, lashes, and nails. Choose one treatment or combine services in a single visit.</p><Link href="/services" className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-800">View the full menu <ArrowRight size={17}/></Link></div>
        <Suspense fallback={<FeaturedSkeleton/>}><FeaturedServices/></Suspense>
      </div>
    </section>

    <section className="bg-surface">
      <div className="mx-auto grid max-w-[1200px] gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[7fr_5fr] lg:items-start lg:py-24">
        <div><p className="text-sm font-semibold text-brand-800">How booking works</p><h2 className="text-h1 mt-3 max-w-lg">A clear path from choosing to confirmed.</h2><div className="mt-8 divide-y divide-line border-y border-line">{steps.map((step,index)=><div key={step.title} className="grid grid-cols-[40px_1fr] gap-4 py-6"><span className="tabular text-sm font-semibold text-brand-800">0{index+1}</span><div><h3 className="text-h3">{step.title}</h3><p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">{step.text}</p></div></div>)}</div></div>
        <aside className="rounded-3xl bg-brand-50 p-6 sm:p-8 lg:sticky lg:top-24"><p className="text-sm font-semibold text-brand-800">Before you book</p><h2 className="text-h2 mt-3">Your time is held for 30 minutes.</h2><p className="mt-4 leading-6 text-ink-muted">After choosing a schedule, send the 20% deposit to the GCash account shown on your private booking page. Mark it as sent so Beautyfeel can verify it.</p><div className="mt-6 border-t border-brand-100 pt-5"><p className="text-sm font-semibold">No payment screenshot required</p><p className="mt-1 text-sm leading-5 text-ink-muted">Beautyfeel checks the GCash account directly.</p></div></aside>
      </div>
    </section>

    <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20">
      <div className="overflow-hidden rounded-3xl bg-brand-900 px-6 py-10 text-white sm:px-10 sm:py-12 lg:grid lg:grid-cols-[1fr_auto] lg:items-end lg:gap-12">
        <div><p className="text-sm font-semibold text-white/70">Ready when you are</p><h2 className="text-h1 mt-3 max-w-2xl">Choose your services and find your time.</h2><p className="mt-4 max-w-xl leading-6 text-white/75">The booking system checks the latest schedule again before holding your appointment.</p></div>
        <Link href="/book" className="mt-8 inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-white px-6 font-semibold text-brand-950 transition active:scale-[.98] lg:mt-0">Start booking <ArrowRight size={18}/></Link>
      </div>
    </section>
  </main>;
}

const steps = [
  { title: "Choose your treatments", text: "Select up to six services. Prices and treatment times stay visible as you choose." },
  { title: "Pick an available time", text: "Choose a date and see times that can accommodate your complete visit." },
  { title: "Send the deposit", text: "Secure your time with a 20% GCash deposit, then wait for Beautyfeel to verify it." },
];

function TrustItem({icon,title,text}:{icon:React.ReactNode;title:string;text:string}) { return <div className="flex gap-3 py-6 md:px-6"><span className="mt-0.5 text-white/75">{icon}</span><div><h2 className="text-sm font-semibold">{title}</h2><p className="mt-1 text-sm leading-5 text-white/65">{text}</p></div></div>; }
function FeaturedSkeleton(){return <div className="divide-y divide-line border-y border-line">{[1,2,3,4].map(item=><div key={item} className="grid gap-3 py-6 sm:grid-cols-[48px_1fr_auto]"><div className="skeleton h-5 w-6 rounded"/><div><div className="skeleton h-6 w-36 rounded"/><div className="skeleton mt-2 h-4 w-48 rounded"/></div><div className="skeleton h-11 w-32 rounded-xl"/></div>)}</div>}

