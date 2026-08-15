import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { ArrowRight, CheckCircle, Clock, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { FeaturedServices } from "@/components/public/featured-services";

export const metadata = {
  title: "Beautyfeel | Skin, spa, lashes and nails",
  description: "Choose Beautyfeel treatments, see available times, and reserve your appointment online with a 20% GCash deposit.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <main>
    <section className="relative isolate h-[100dvh] overflow-hidden bg-brand-950 text-white">
      <Image src="/images/beautyfeel-building-mobile-v4.png" alt="The Beautyfeel Beauty Lounge at RMDC Building" fill priority sizes="(max-width: 639px) 100vw, 1px" className="-z-20 object-cover object-center sm:hidden" />
      <Image src="/images/beautyfeel-building-restored-v3.png" alt="" fill priority sizes="(min-width: 640px) 100vw, 1px" className="-z-20 hidden object-cover object-center sm:block" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(7,16,16,.18)_0%,rgba(7,16,16,.02)_42%,rgba(7,16,16,.88)_100%)]" />
      <div className="mx-auto flex h-full w-full max-w-[1500px] flex-col justify-end px-5 pb-7 pt-24 sm:px-8 sm:pb-9 lg:px-12 lg:pb-11">
        <div className="grid items-end gap-7 border-b border-white/25 pb-7 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,32rem)] lg:gap-16 lg:pb-9">
          <div>
            <p className="text-sm font-semibold tracking-[.08em] text-white/72">Skin · Spa · Lashes · Nails</p>
            <h1 className="mt-3 max-w-[13ch] text-[clamp(2.75rem,5vw,5.5rem)] font-semibold leading-[.92] tracking-[-.05em] text-balance">Beauty, care, and time for you.</h1>
          </div>
          <div className="lg:pb-1">
            <p className="max-w-[31rem] text-[clamp(1rem,1.25vw,1.125rem)] leading-relaxed text-white/78">Thoughtful treatments and unhurried appointments, all in one welcoming local beauty lounge.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/book" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-white px-6 font-semibold text-brand-950 transition hover:bg-brand-50 active:scale-[.98]">Book an appointment <ArrowRight size={18}/></Link>
              <Link href="/services" className="inline-flex min-h-13 items-center justify-center rounded-xl border border-white/35 bg-black/10 px-6 font-semibold text-white backdrop-blur-sm transition hover:bg-white/10">Explore treatments</Link>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-5 text-sm text-white/68">
          <p className="flex items-center gap-2"><ShieldCheck size={18}/> 20% deposit secures your time</p>
          <p className="hidden sm:block">RMDC Building · Beautyfeel, The Beauty Lounge</p>
        </div>
      </div>
    </section>

    <section className="overflow-hidden bg-ink text-surface" aria-labelledby="booking-assurance-title">
      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-8 sm:py-8 lg:grid lg:grid-cols-[.8fr_2.2fr] lg:items-stretch lg:gap-5 lg:px-12">
        <div className="flex min-h-36 flex-col justify-between py-2 lg:pr-8">
          <p className="text-xs font-semibold tracking-[.12em] text-[#d9a998]">A considered visit</p>
          <h2 id="booking-assurance-title" className="mt-5 max-w-[11ch] text-[clamp(1.75rem,2.5vw,2.7rem)] font-semibold leading-[.98] tracking-[-.04em]">Every detail, thoughtfully handled.</h2>
        </div>
        <div className="scrollbar-none -mx-5 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:mt-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
          <TrustItem icon={<CheckCircle size={18}/>} number="01" tone="bg-[#ead8cf]" title="Clear from the start" text="See prices, treatment time, and deposit before choosing."/>
          <TrustItem icon={<Clock size={18}/>} number="02" tone="bg-[#dce2d8]" title="Times that truly fit" text="Only schedules that accommodate your full visit are offered."/>
          <TrustItem icon={<ShieldCheck size={18}/>} number="03" tone="bg-[#e6d5c1]" title="Personally verified" text="Your GCash deposit is checked before confirmation."/>
        </div>
      </div>
    </section>

    <section className="bg-[#f1e9df] py-[clamp(4rem,7vw,7rem)]" aria-labelledby="treatments-title">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(18rem,.62fr)_minmax(0,1.38fr)] lg:gap-14 xl:gap-20">
          <div className="h-fit lg:sticky lg:top-24">
            <p className="text-sm font-semibold text-brand-800">What we offer</p>
            <h2 id="treatments-title" className="mt-3 max-w-[9ch] text-[clamp(2.75rem,4.5vw,4.75rem)] font-semibold leading-[.9] tracking-[-.05em] text-balance">Choose your kind of care.</h2>
            <p className="mt-6 max-w-[31rem] text-[clamp(1rem,1.2vw,1.1rem)] leading-relaxed text-ink-muted">From focused maintenance to a slower reset, explore treatments by category and see where your visit could begin.</p>
            <Link href="/services" className="group mt-6 inline-flex min-h-11 items-center gap-3 font-semibold text-ink">Explore the complete menu <span className="grid size-9 place-items-center rounded-full bg-brand-50 text-brand-800 transition-transform duration-500 ease-[cubic-bezier(.22,1,.36,1)] group-hover:translate-x-1"><ArrowRight size={17}/></span></Link>
          </div>
          <Suspense fallback={<FeaturedSkeleton/>}><FeaturedServices/></Suspense>
        </div>
      </div>
    </section>

    <section className="bg-surface py-[clamp(4.5rem,8vw,8rem)]" aria-labelledby="booking-steps-title">
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold text-brand-800">How booking works</p>
          <h2 id="booking-steps-title" className="mt-3 text-[clamp(2.5rem,5vw,4.75rem)] font-semibold leading-[.92] tracking-[-.05em] text-balance">From choosing to confirmed.</h2>
          <p className="mx-auto mt-5 max-w-[42rem] leading-relaxed text-ink-muted">A simple booking flow designed to keep every detail clear before you commit.</p>
        </div>

        <div className="relative mt-12 grid gap-9 md:mt-16 md:grid-cols-3 md:gap-6 lg:gap-12">
          <div aria-hidden="true" className="absolute left-[16.66%] right-[16.66%] top-9 hidden border-t border-line-strong md:block" />
          {steps.map((step,index)=><article key={step.title} className="relative text-center">
            <div className="relative z-10 mx-auto grid size-[4.5rem] place-items-center rounded-full border border-brand-800 bg-surface text-brand-800 shadow-[0_0_0_10px_var(--surface)]">{step.icon}</div>
            <p className="tabular mt-7 text-xs font-semibold tracking-[.14em] text-brand-800">STEP 0{index+1}</p>
            <h3 className="mt-3 text-[clamp(1.3rem,2vw,1.65rem)] font-semibold tracking-[-.025em]">{step.title}</h3>
            <p className="mx-auto mt-3 max-w-[30ch] text-sm leading-6 text-ink-muted">{step.text}</p>
          </article>)}
        </div>

        <aside className="mt-14 grid gap-6 rounded-[1.75rem] bg-[#ead8cf] p-6 sm:p-8 lg:mt-20 lg:grid-cols-[.8fr_1.35fr_.85fr] lg:items-center lg:gap-10 lg:px-10">
          <div><p className="text-sm font-semibold text-brand-800">Before you book</p><h3 className="mt-2 text-[clamp(1.5rem,2.4vw,2.25rem)] font-semibold leading-[1.05] tracking-[-.035em]">Your time is held for 30 minutes.</h3></div>
          <p className="max-w-[42rem] leading-7 text-ink-muted">After choosing a schedule, send the 20% deposit to the GCash account shown on your private booking page. Mark it as sent so Beautyfeel can verify it.</p>
          <div className="border-t border-ink/15 pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0"><p className="text-sm font-semibold">No screenshot required</p><p className="mt-1 text-sm leading-5 text-ink-muted">Beautyfeel checks the GCash account directly.</p></div>
        </aside>
      </div>
    </section>

    <section className="relative isolate flex min-h-[34rem] overflow-hidden text-white sm:min-h-[38rem]" aria-labelledby="closing-cta-title">
      <Image src="/images/beautyfeel-cta-afterglow.png" alt="A Beautyfeel client enjoying her post-treatment glow" fill sizes="100vw" className="-z-20 object-cover object-[72%_center] sm:object-center" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(22,15,12,.08)_10%,rgba(22,15,12,.88)_100%)] sm:bg-[linear-gradient(90deg,rgba(28,19,15,.88)_0%,rgba(28,19,15,.64)_42%,rgba(28,19,15,.08)_72%)]" />
      <div className="mx-auto flex w-full max-w-[1500px] items-end px-5 py-10 sm:items-center sm:px-8 sm:py-14 lg:px-12 lg:py-16">
          <div className="max-w-[42rem]">
            <p className="text-sm font-semibold tracking-[.06em] text-white/70">Ready when you are</p>
            <h2 id="closing-cta-title" className="mt-4 max-w-[12ch] text-[clamp(2.6rem,5vw,5rem)] font-semibold leading-[.92] tracking-[-.05em] text-balance">Make time for the way you want to feel.</h2>
            <p className="mt-5 max-w-[34rem] text-[clamp(1rem,1.25vw,1.125rem)] leading-relaxed text-white/76">Choose your treatments, find a schedule that fits, and reserve your Beautyfeel visit online.</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href="/book" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-white px-6 font-semibold text-ink transition hover:bg-[#f7f0e8] active:scale-[.98]">Book an appointment <ArrowRight size={18}/></Link>
              <Link href="/services" className="inline-flex min-h-13 items-center justify-center rounded-xl border border-white/35 bg-black/10 px-6 font-semibold text-white backdrop-blur-sm transition hover:bg-white/10">Explore services</Link>
            </div>
          </div>
      </div>
    </section>
  </main>;
}

const steps = [
  { icon: <CheckCircle size={30} weight="light"/>, title: "Choose your treatments", text: "Select up to six services with prices and treatment times visible as you choose." },
  { icon: <Clock size={30} weight="light"/>, title: "Pick an available time", text: "Choose a date and see schedules that can accommodate your complete visit." },
  { icon: <ShieldCheck size={30} weight="light"/>, title: "Secure your booking", text: "Send the 20% GCash deposit, then Beautyfeel personally verifies your appointment." },
];

function TrustItem({icon,number,tone,title,text}:{icon:React.ReactNode;number:string;tone:string;title:string;text:string}) { return <article className={`${tone} min-w-[76vw] snap-start rounded-2xl p-5 text-ink sm:min-w-[43vw] lg:min-w-0`}><div className="flex items-center justify-between text-brand-800"><span className="grid size-9 place-items-center rounded-full bg-surface/70">{icon}</span><span className="tabular text-xs font-semibold tracking-[.12em] text-ink-subtle">{number}</span></div><h3 className="mt-5 text-[1.05rem] font-semibold tracking-[-.015em]">{title}</h3><p className="mt-1.5 max-w-[28ch] text-sm leading-5 text-ink-muted">{text}</p></article>; }
function FeaturedSkeleton(){return <div className="grid lg:grid-cols-2">{[1,2,3,4].map(item=><div key={item} className="min-h-64 border-b border-line p-6 lg:p-10"><div className="skeleton h-4 w-6 rounded"/><div className="skeleton mt-12 h-9 w-44 rounded"/><div className="skeleton mt-5 h-4 w-52 rounded"/></div>)}</div>}
