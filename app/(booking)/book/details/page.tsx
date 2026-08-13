import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, CalendarBlank, Clock } from "@phosphor-icons/react/dist/ssr";
import { getPublicServices } from "@/features/services/queries";
import { getBusinessSettings } from "@/features/settings/queries";
import { calculateDepositCentavos } from "@/features/bookings/money";
import { StepHeader } from "@/components/booking/step-header";
import { BookingDetailsForm } from "@/components/booking/booking-details-form";
import { formatManilaDateTime, formatMoney } from "@/lib/format";

export const metadata = { title: "Your details" };

type Props = { searchParams: Promise<{ services?: string; startsAt?: string; date?: string }> };

function DetailsSkeleton() {
  return <main className="mx-auto w-full max-w-[1120px] px-4 py-6 pb-24 sm:px-6 sm:py-9 lg:px-8"><div className="skeleton h-11 w-32 rounded-xl"/><div className="skeleton mt-4 h-48 rounded-3xl"/><div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(320px,5fr)]"><div className="skeleton h-[460px] rounded-2xl"/><div className="skeleton h-80 rounded-2xl"/></div></main>;
}

function InvalidDetails({ unavailable = false }: { unavailable?: boolean }) {
  return <main className="mx-auto max-w-3xl px-4 py-12"><h1 className="text-h1">{unavailable ? "A selected service is no longer available" : "Your booking details are incomplete"}</h1><Link href="/book" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-brand-900 px-5 font-semibold text-white">{unavailable ? "Update services" : "Start again"}</Link></main>;
}

async function DetailsContent({ searchParams }: Props) {
  const query = await searchParams;
  const ids = [...new Set((query.services ?? "").split(",").map(id => id.trim()).filter(Boolean))].slice(0, 6);
  const startsAt = new Date(query.startsAt ?? "");
  if (!ids.length || Number.isNaN(startsAt.getTime())) return <InvalidDetails/>;

  const [catalog, settings] = await Promise.all([getPublicServices(), getBusinessSettings()]);
  const selected = ids.map(id => catalog.find(service => service.id === id)).filter((service): service is NonNullable<typeof service> => Boolean(service));
  if (selected.length !== ids.length) return <InvalidDetails unavailable/>;

  const subtotal = selected.reduce((sum, service) => sum + service.priceCentavos, 0);
  const duration = selected.reduce((sum, service) => sum + service.durationMinutes, 0);
  const deposit = calculateDepositCentavos(subtotal, settings.depositPercent);

  return <main className="mx-auto w-full max-w-[1120px] px-4 py-6 pb-24 sm:px-6 sm:py-9 lg:px-8">
    <Link href={`/book/schedule?services=${encodeURIComponent(ids.join(","))}&date=${query.date ?? ""}`} className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-semibold text-ink-muted transition hover:text-brand-950"><ArrowLeft aria-hidden size={17} weight="bold"/>Back to times</Link>

    <section className="relative overflow-hidden rounded-3xl bg-brand-950 px-5 py-7 text-white sm:px-8 sm:py-9"><div aria-hidden className="absolute -right-12 -top-14 size-52 rounded-full border border-white/10"/><div aria-hidden className="absolute right-7 top-10 size-24 rounded-full border border-white/10"/><div className="relative max-w-2xl [&_.bg-brand-900]:bg-white [&_.bg-line]:bg-white/20 [&_.text-brand-800]:text-white/65 [&_.text-ink-muted]:text-white/70"><StepHeader step={3} title="Your booking details" description={`Add your contact information, then secure this appointment for ${settings.holdDurationMinutes} minutes.`}/></div></section>

    <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(320px,5fr)]">
      <BookingDetailsForm serviceIds={ids} startsAt={startsAt.toISOString()} subtotalCentavos={subtotal} depositCentavos={deposit} gcashName={settings.gcashName} gcashNumber={settings.gcashNumber} holdDurationMinutes={settings.holdDurationMinutes} policyVersion="2026-08-01"/>

      <aside className="overflow-hidden rounded-2xl border border-line bg-surface lg:sticky lg:top-6">
        <div className="bg-info-soft px-4 py-4"><div className="flex items-center justify-between gap-3"><p className="text-[11px] font-semibold text-info">Appointment summary</p><CalendarBlank aria-hidden className="text-info" size={18} weight="duotone"/></div><p className="tabular mt-2 font-semibold text-brand-950">{formatManilaDateTime(startsAt)}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted"><Clock aria-hidden size={14}/>About {duration} minutes</p></div>
        <div className="divide-y divide-line px-4">{selected.map((service,index)=><div key={service.id} className="grid grid-cols-[28px_1fr_auto] items-start gap-2.5 py-3 text-sm"><span className="tabular grid size-7 place-items-center rounded-lg bg-brand-50 text-[10px] font-semibold text-brand-800">{String(index+1).padStart(2,"0")}</span><div><p className="font-medium">{service.name}</p><p className="mt-0.5 text-xs text-ink-subtle">{service.durationMinutes} min</p></div><span className="tabular shrink-0 font-semibold text-brand-900">{formatMoney(service.priceCentavos)}</span></div>)}</div>
        <div className="bg-brand-950 px-4 py-4 text-white"><div className="flex justify-between gap-4 text-xs text-white/60"><span>Service total</span><span className="tabular">{formatMoney(subtotal)}</span></div><div className="mt-2 flex items-end justify-between gap-4"><span className="font-semibold">Deposit due later</span><span className="tabular text-lg font-semibold">{formatMoney(deposit)}</span></div></div>
      </aside>
    </div>
  </main>;
}

export default function DetailsPage({ searchParams }: Props) {
  return <Suspense fallback={<DetailsSkeleton/>}><DetailsContent searchParams={searchParams}/></Suspense>;
}
