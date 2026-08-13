import Link from "next/link";
import { Suspense } from "react";
import { DateTime } from "luxon";
import { ArrowLeft, CalendarBlank, Clock, Sparkle } from "@phosphor-icons/react/dist/ssr";
import { getAvailableSlots } from "@/features/availability/queries";
import { getPublicServices } from "@/features/services/queries";
import { getBusinessSettings } from "@/features/settings/queries";
import { StepHeader } from "@/components/booking/step-header";
import { DateRail } from "@/components/booking/date-rail";
import { SlotGrid } from "@/components/booking/slot-grid";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { getServerEnv } from "@/lib/env/server";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Choose a time" };
type Props = { searchParams: Promise<{ services?: string; date?: string }> };
async function Availability({ date, serviceIds, serialized, intervalMinutes }: { date: string; serviceIds: string[]; serialized: string; intervalMinutes:number }) { const slots=await getAvailableSlots({date,serviceIds}); return <SlotGrid slots={slots} services={serialized} date={date} intervalMinutes={intervalMinutes}/>; }

function SchedulePageSkeleton() {
  return <main className="mx-auto w-full max-w-[1120px] px-4 py-6 pb-24 sm:px-6 sm:py-9 lg:px-8"><div className="skeleton h-11 w-36 rounded-xl"/><div className="skeleton mt-4 h-52 rounded-3xl"/><div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]"><div className="skeleton h-[430px] rounded-3xl"/><div className="skeleton h-64 rounded-3xl"/></div></main>;
}

async function ScheduleContent({ searchParams }: Props) {
  const query=await searchParams;
  const serviceIds=[...new Set((query.services??"").split(",").map(id=>id.trim()).filter(Boolean))].slice(0,6);
  if(!serviceIds.length) return <main className="mx-auto max-w-3xl px-4 py-12"><h1 className="text-h1">Choose services first</h1><Link href="/book" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-brand-900 px-5 font-semibold text-white">Choose services</Link></main>;
  const [catalog,settings]=await Promise.all([getPublicServices(),getBusinessSettings()]); const valid=new Set(catalog.map(x=>x.id)); if(serviceIds.some(id=>!valid.has(id))) return <main className="mx-auto max-w-3xl px-4 py-12"><h1 className="text-h1">Some services are unavailable</h1><Link href="/book" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-brand-900 px-5 font-semibold text-white">Update selection</Link></main>;
  const selectedServices=serviceIds.map(id=>catalog.find(service=>service.id===id)!);
  const total=selectedServices.reduce((sum,service)=>sum+service.priceCentavos,0);
  const duration=selectedServices.reduce((sum,service)=>sum+service.durationMinutes,0);
  const today=DateTime.now().setZone(settings.timezone).startOf("day"); const dates=Array.from({length:Math.min(settings.maximumAdvanceDays+1,31)},(_,i)=>today.plus({days:i}).toISODate()!); const selected=dates.includes(query.date??"")?query.date!:dates[0]; const serialized=serviceIds.join(",");
  const env=getServerEnv();
  return <main className="mx-auto w-full max-w-[1120px] px-4 py-6 pb-24 sm:px-6 sm:py-9 lg:px-8">
    <RealtimeRefresh url={env.SUPABASE_URL} publishableKey={env.SUPABASE_PUBLISHABLE_KEY} topics={[`availability:${selected}`,"availability:all"]}/>
    <Link href="/book" className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-semibold text-ink-muted transition hover:text-brand-950"><ArrowLeft aria-hidden size={17} weight="bold"/>Back to services</Link>

    <section className="relative overflow-hidden rounded-3xl bg-brand-950 px-5 py-7 text-white sm:px-8 sm:py-9">
      <div aria-hidden className="absolute -right-12 -top-14 size-52 rounded-full border border-white/10"/><div aria-hidden className="absolute right-7 top-10 size-24 rounded-full border border-white/10"/>
      <div className="relative max-w-2xl [&_.bg-brand-900]:bg-white [&_.bg-line]:bg-white/20 [&_.text-brand-800]:text-white/65 [&_.text-ink-muted]:text-white/70"><StepHeader step={2} title="Choose a date and time" description="Pick a date, then choose an available appointment for your complete visit."/></div>
    </section>

    <section aria-label="Selected services summary" className="mt-4 grid gap-3 rounded-2xl border border-line bg-surface px-4 py-4 shadow-[0_14px_32px_-25px_rgba(14,52,53,.55)] sm:grid-cols-[1fr_auto_auto] sm:items-center sm:px-5">
      <div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-900"><Sparkle aria-hidden size={20} weight="duotone"/></span><div className="min-w-0"><p className="truncate text-sm font-semibold">{selectedServices.map(service=>service.name).join(", ")}</p><p className="mt-0.5 text-xs text-ink-muted">{selectedServices.length} {selectedServices.length===1?"service":"services"} selected</p></div></div>
      <div className="flex items-center gap-2 text-xs text-ink-muted sm:border-l sm:border-line sm:pl-5"><Clock aria-hidden size={16}/><span className="tabular">About {duration} min</span></div>
      <p className="tabular text-sm font-semibold text-brand-900 sm:pl-2">{formatMoney(total)}</p>
    </section>

    <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <DateRail key={selected} dates={dates} selected={selected} services={serialized}/>
      <Suspense key={`${selected}:${serialized}`} fallback={<section className="rounded-3xl border border-line bg-surface p-5 sm:p-6"><div className="flex items-center gap-3"><div className="skeleton size-11 rounded-xl"/><div className="flex-1"><div className="skeleton h-4 w-32 rounded"/><div className="skeleton mt-2 h-6 w-52 max-w-full rounded-lg"/></div></div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">{[1,2,3,4,5,6].map(i=><div key={i} className="skeleton h-13 rounded-xl"/>)}</div></section>}><Availability date={selected} serviceIds={serviceIds} serialized={serialized} intervalMinutes={settings.bookingIntervalMinutes}/></Suspense>
    </div>

    <div className="mt-5 flex items-start gap-3 rounded-2xl bg-brand-50 px-4 py-4 text-sm text-brand-950"><CalendarBlank aria-hidden className="mt-0.5 shrink-0" size={18} weight="duotone"/><p className="leading-6"><span className="font-semibold">Your time is not reserved yet.</span> We confirm availability once you continue and create a {settings.holdDurationMinutes}-minute booking hold.</p></div>
  </main>;
}

export default function SchedulePage({ searchParams }: Props) {
  return <Suspense fallback={<SchedulePageSkeleton/>}><ScheduleContent searchParams={searchParams}/></Suspense>;
}
