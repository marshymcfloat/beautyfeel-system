import Link from "next/link";
import { Suspense } from "react";
import { DateTime } from "luxon";
import { ArrowRight, CalendarCheck, CheckCircle, Clock, Hourglass, IdentificationCard, Receipt, ShieldCheck, Timer, Wallet, WarningCircle, XCircle } from "@phosphor-icons/react/dist/ssr";
import { getGuestBooking } from "@/features/bookings/queries";
import { getBusinessSettings } from "@/features/settings/queries";
import { getGuestAccessToken } from "@/lib/security/guest-access";
import { StatusBadge } from "@/components/ui/status-badge";
import { DepositClaimButton } from "@/components/booking/deposit-claim-button";
import { CopyValueButton } from "@/components/booking/copy-value-button";
import { CustomerCancellation } from "@/components/booking/customer-cancellation";
import { HoldCountdown } from "@/components/booking/hold-countdown";
import { formatManilaDateTime, formatMoney } from "@/lib/format";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { getServerEnv } from "@/lib/env/server";
import { BookingStatusMotion } from "@/components/booking/booking-status-motion";

export const metadata = { title: "Booking status", robots: { index: false, follow: false }, referrer: "no-referrer" };
type Props = { params: Promise<{ bookingCode: string }> };

function BookingStatusSkeleton() {
  return <main className="mx-auto w-full max-w-[960px] px-4 py-8 pb-20 sm:px-6 sm:py-12"><div className="skeleton h-36 rounded-3xl"/><div className="mt-5 grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(320px,.8fr)]"><div className="skeleton h-96 rounded-2xl"/><div className="skeleton h-80 rounded-2xl"/></div></main>;
}

async function BookingStatusContent({ params }: Props) {
  const { bookingCode } = await params;
  const token = await getGuestAccessToken(bookingCode);
  if (!token) return <AccessMissing/>;
  let booking;
  try { booking = await getGuestBooking(bookingCode, token); } catch { return <AccessMissing/>; }
  const settings = await getBusinessSettings();
  const canClaim = booking.status === "AWAITING_PAYMENT" && booking.deposit?.status === "UNPAID";
  const env = getServerEnv();
  const date = DateTime.fromJSDate(booking.requestedStartsAt, { zone: "utc" }).setZone("Asia/Manila").toISODate();

  return <BookingStatusMotion><main className="mx-auto w-full max-w-[960px] px-4 py-8 pb-20 sm:px-6 sm:py-12">
    <RealtimeRefresh url={env.SUPABASE_URL} publishableKey={env.SUPABASE_PUBLISHABLE_KEY} topics={[`availability:${date}`]}/>
    <header className="overflow-hidden rounded-3xl bg-brand-950 text-white"><div className="flex flex-wrap items-start justify-between gap-4 px-5 py-5 sm:px-6"><div><p className="flex items-center gap-2 text-xs font-medium text-white/60"><Receipt aria-hidden size={15}/>Booking reference</p><p className="tabular mt-1 text-sm font-semibold tracking-[.04em]">{booking.publicCode}</p><h1 className="mt-4 text-2xl font-semibold tracking-[-.025em] sm:text-3xl">Your appointment</h1></div><div className="rounded-xl bg-white p-1"><StatusBadge status={booking.status}/></div></div><div className="flex items-center gap-2 border-t border-white/10 bg-white/[.04] px-5 py-3 text-xs text-white/65 sm:px-6"><ShieldCheck aria-hidden size={16} weight="duotone"/>This private page contains the latest booking status.</div></header>

    <div className="mt-5 grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_minmax(320px,.8fr)]">
      <section className="overflow-hidden rounded-2xl border border-line bg-surface"><div className="bg-info-soft px-4 py-4 sm:px-5"><div className="flex items-start gap-3"><CalendarCheck aria-hidden className="mt-0.5 shrink-0 text-info" size={21} weight="duotone"/><div><p className="text-[11px] font-semibold text-info">Scheduled appointment</p><p className="tabular mt-1 text-lg font-semibold text-brand-950">{formatManilaDateTime(booking.requestedStartsAt)}</p></div></div></div><div className="divide-y divide-line px-4 sm:px-5">{booking.services.map((service,index)=><div key={service.id} className="grid grid-cols-[28px_1fr_auto] items-start gap-2.5 py-3.5"><span className="tabular grid size-7 place-items-center rounded-lg bg-brand-50 text-[10px] font-semibold text-brand-800">{String(index+1).padStart(2,"0")}</span><div><p className="text-sm font-semibold">{service.serviceName}</p><p className="mt-0.5 flex items-center gap-1 text-xs text-ink-subtle"><Clock aria-hidden size={13}/>{service.durationMinutes} min</p></div><p className="tabular text-sm font-semibold text-brand-900">{formatMoney(service.priceCentavos)}</p></div>)}</div><div className="bg-brand-950 px-4 py-4 text-white sm:px-5"><div className="flex justify-between gap-4 text-xs text-white/60"><span>Service total</span><span className="tabular">{formatMoney(booking.subtotalCentavos)}</span></div><div className="mt-2 flex items-end justify-between gap-4"><span className="font-semibold">Required deposit</span><span className="tabular text-lg font-semibold">{formatMoney(booking.depositCentavos)}</span></div></div></section>

      <div className="space-y-5">{canClaim&&<section className="rounded-2xl border border-[#ead9ad] bg-warning-soft p-4 sm:p-5"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/70 text-[#735713]"><Wallet aria-hidden size={18}/></span><div><p className="text-[11px] font-semibold text-[#876b27]">Complete your hold</p><h2 className="mt-0.5 font-semibold text-[#4f3c0d]">Send the GCash deposit</h2></div></div>{booking.holdExpiresAt&&<div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white/70 px-2.5 py-2 text-xs text-[#735713]"><Timer aria-hidden size={15}/><HoldCountdown expiresAt={booking.holdExpiresAt.toISOString()}/></div>}</div><dl className="mt-4 divide-y divide-[#e7d6aa] rounded-xl bg-white/55 px-3 text-sm"><div className="flex justify-between gap-4 py-2.5"><dt>Amount</dt><dd className="tabular font-semibold">{formatMoney(booking.depositCentavos)}</dd></div><div className="flex justify-between gap-4 py-2.5"><dt>GCash number</dt><dd className="tabular font-semibold">{settings.gcashNumber??"Contact Beautyfeel"}</dd></div><div className="flex justify-between gap-4 py-2.5"><dt>Account name</dt><dd className="font-semibold">{settings.gcashName??"Beautyfeel"}</dd></div><div className="flex justify-between gap-4 py-2.5"><dt>Sender name</dt><dd className="font-semibold">{booking.gcashSenderName}</dd></div></dl>{settings.gcashNumber&&<div className="mt-3 flex flex-wrap gap-2"><CopyValueButton value={settings.gcashNumber} label="number"/><CopyValueButton value={formatMoney(booking.depositCentavos)} label="amount"/></div>}<p className="my-4 text-xs leading-5">Mark it sent below. Beautyfeel normally verifies it within {settings.verificationSlaMinutes} minutes.</p><DepositClaimButton bookingCode={booking.publicCode}/></section>}<StatusMessage status={booking.status}/>{["AWAITING_PAYMENT","PENDING_VERIFICATION","CONFIRMED"].includes(booking.status)&&<CustomerCancellation bookingCode={booking.publicCode}/>}</div>
    </div>
    <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-ink-muted"><ShieldCheck aria-hidden size={15}/>Keep this private page for booking updates.</p>
  </main></BookingStatusMotion>;
}

export default function BookingStatusPage({ params }: Props) { return <Suspense fallback={<BookingStatusSkeleton/>}><BookingStatusContent params={params}/></Suspense>; }

function StatusMessage({ status }: { status: string }) {
  const messages: Record<string, { title: string; text: string; tone: string; icon: React.ReactNode }> = {
    PENDING_VERIFICATION: { title: "Payment is being checked", text: "Beautyfeel received your payment notice. Your appointment remains reserved while it is verified.", tone: "border-[#cfe1e8] bg-info-soft text-info", icon: <Hourglass aria-hidden size={20} weight="duotone"/> },
    CONFIRMED: { title: "Your appointment is confirmed", text: "We look forward to seeing you. Beautyfeel will send an SMS reminder before your visit.", tone: "border-brand-100 bg-success-soft text-success", icon: <CheckCircle aria-hidden size={20} weight="duotone"/> },
    REJECTED: { title: "Deposit was not verified", text: "Please contact Beautyfeel if you believe this needs another review.", tone: "border-danger/20 bg-danger-soft text-danger", icon: <WarningCircle aria-hidden size={20} weight="duotone"/> },
    EXPIRED: { title: "Your booking hold expired", text: "The time was released because payment was not marked as sent before the hold ended.", tone: "border-[#ead9ad] bg-warning-soft text-warning", icon: <Timer aria-hidden size={20} weight="duotone"/> },
    CANCELLED: { title: "This appointment was cancelled", text: "Contact Beautyfeel if you need help arranging another visit.", tone: "border-danger/20 bg-danger-soft text-danger", icon: <XCircle aria-hidden size={20} weight="duotone"/> },
    COMPLETED: { title: "Appointment completed", text: "Thank you for visiting Beautyfeel.", tone: "border-brand-100 bg-success-soft text-success", icon: <CheckCircle aria-hidden size={20} weight="duotone"/> },
    NO_SHOW: { title: "Appointment marked as no-show", text: "Contact Beautyfeel if you need assistance.", tone: "border-[#ead9ad] bg-warning-soft text-warning", icon: <WarningCircle aria-hidden size={20} weight="duotone"/> },
  };
  const message = messages[status];
  if (!message) return null;
  return <section className={`rounded-2xl border p-4 ${message.tone}`}><div className="flex items-start gap-3">{message.icon}<div><h2 className="font-semibold">{message.title}</h2><p className="mt-1 text-sm leading-5 text-ink-muted">{message.text}</p></div></div></section>;
}

function AccessMissing() { return <main className="mx-auto max-w-xl px-4 py-16"><div className="overflow-hidden rounded-2xl border border-line bg-surface"><div className="bg-info-soft p-5"><IdentificationCard aria-hidden className="text-info" size={28} weight="duotone"/><h1 className="text-h2 mt-4">Private booking access required</h1></div><div className="p-5"><p className="leading-6 text-ink-muted">Open the private link shown when this booking was created, or contact Beautyfeel for help.</p><Link href="/book" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-900 px-5 font-semibold text-white">Start a new booking<ArrowRight aria-hidden size={17} weight="bold"/></Link></div></div></main>; }
