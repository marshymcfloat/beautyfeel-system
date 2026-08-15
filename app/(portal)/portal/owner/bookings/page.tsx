import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { ArrowRight, CheckCircle, ClockCountdown, Eye, Plus, Receipt, UserFocus, Wallet } from "@phosphor-icons/react/dist/ssr";
import { getOwnerBookingCounts, getOwnerBookingsByView } from "@/features/bookings/queries";
import { QuickPaymentDecision } from "@/components/portal/quick-payment-decision";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatManilaDateTime, formatMoney } from "@/lib/format";
import { SectionRefreshButton } from "@/components/portal/section-refresh-button";

type View = "requests" | "confirmed" | "history";
type Props = { searchParams: Promise<{ view?: string }> };
type BookingItem = Awaited<ReturnType<typeof getOwnerBookingsByView>>[number];

export const metadata = { title: "Bookings" };
export const instant = false;

async function BookingRoute({ searchParams }: Props) {
  await connection();
  const query = await searchParams;
  const view: View = ["requests", "confirmed", "history"].includes(query.view ?? "") ? query.view as View : "requests";

  return <div className="mt-5">
    <Suspense fallback={<BookingTabsSkeleton />}><BookingTabs activeView={view} /></Suspense>
    <div className="mt-4">
      <Suspense key={view} fallback={<BookingContentSkeleton />}><BookingView view={view} /></Suspense>
    </div>
  </div>;
}

async function BookingTabs({ activeView }: { activeView: View }) {
  const counts = await getOwnerBookingCounts();
  return <nav aria-label="Booking views" className="grid grid-cols-3 rounded-[18px] bg-surface p-1.5 shadow-[0_8px_24px_rgba(23,48,46,.06)]"><BookingTab href="/portal/owner/bookings?view=requests" label="Requests" count={counts.requests} active={activeView === "requests"} /><BookingTab href="/portal/owner/bookings?view=confirmed" label="Confirmed" count={counts.confirmed} active={activeView === "confirmed"} /><BookingTab href="/portal/owner/bookings?view=history" label="History" count={counts.history} active={activeView === "history"} /></nav>;
}

async function BookingView({ view }: { view: View }) {
  const items = await getOwnerBookingsByView({ view, take: 100 });
  if (view === "requests") return <RequestsView items={items} />;
  return <BookingList view={view} items={items} />;
}

function RequestsView({ items }: { items: BookingItem[] }) {
  const paymentClaims = items.filter((item) => item.status === "PENDING_VERIFICATION");
  const unpaidHolds = items.filter((item) => item.status === "AWAITING_PAYMENT");
  return <div className="space-y-4">
    <section className="overflow-hidden rounded-[20px] bg-surface shadow-[0_8px_24px_rgba(23,48,46,.06)]">
      <header className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5"><div className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-xl bg-warning-soft text-[#765710]"><Wallet size={18} weight="duotone" /></span><h2 className="text-base font-semibold tracking-[-.02em]">Needs verification</h2></div><Count value={paymentClaims.length} tone="warning" /></header>
      {paymentClaims.length ? <div className="divide-y divide-line border-t border-line">{paymentClaims.map((item) => <article key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[minmax(0,1.25fr)_minmax(150px,.75fr)_auto] sm:px-5"><BookingIdentity item={item} mobileAmount /><div className="hidden sm:block"><p className="text-[10px] text-ink-subtle">Deposit to verify</p><p className="tabular mt-1 text-sm font-semibold text-brand-900">{formatMoney(item.depositCentavos)}</p></div><div className="flex items-center gap-1.5"><ReviewLink item={item} /><QuickPaymentDecision bookingId={item.id} customerName={item.customerName} compact /></div></article>)}</div> : <EmptyQueue icon={<CheckCircle size={21} weight="duotone" />} title="No deposits to verify" text="New GCash payment claims will appear here." />}
    </section>

    <section className="overflow-hidden rounded-[20px] bg-surface shadow-[0_8px_24px_rgba(23,48,46,.06)]">
      <header className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5"><div className="flex min-w-0 items-center gap-2.5"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-info-soft text-info"><Receipt size={18} weight="duotone" /></span><div className="min-w-0"><h2 className="text-base font-semibold tracking-[-.02em]">Waiting for payment</h2>{!unpaidHolds.length && <p className="mt-0.5 truncate text-[10px] text-ink-muted">No unpaid booking holds</p>}</div></div><Count value={unpaidHolds.length} tone="info" /></header>
      {unpaidHolds.length ? <div className="divide-y divide-line border-t border-line">{unpaidHolds.map((item) => <Link key={item.id} href={`/portal/owner/bookings/${item.id}`} className="group grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 transition hover:bg-brand-50/60 sm:grid-cols-[minmax(0,1.25fr)_minmax(170px,.75fr)_auto] sm:px-5"><BookingIdentity item={item} mobileAmount /><div className="hidden sm:block"><p className="text-[10px] text-ink-subtle">Hold expires</p><p className="tabular mt-1 text-xs font-semibold text-ink-muted">{item.holdExpiresAt ? formatManilaDateTime(item.holdExpiresAt) : "Not scheduled"}</p></div><ArrowRight className="text-ink-subtle group-hover:text-brand-900" size={16} weight="bold" /></Link>)}</div> : null}
    </section>
  </div>;
}

function BookingList({ items, view }: { items: BookingItem[]; view: "confirmed" | "history" }) {
  const confirmed = view === "confirmed";
  return <section className="overflow-hidden rounded-[20px] bg-surface shadow-[0_8px_24px_rgba(23,48,46,.06)]">
    <header className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-5"><div><h2 className="text-base font-semibold tracking-[-.02em]">{confirmed ? "Confirmed appointments" : "Booking history"}</h2><p className="mt-0.5 text-[10px] text-ink-muted">{confirmed ? "Upcoming bookings, nearest first" : "Completed and closed bookings"}</p></div><Count value={items.length} tone={confirmed ? "success" : "neutral"} /></header>
    {items.length ? <div className="divide-y divide-line border-t border-line">{items.map((item) => <Link key={item.id} href={`/portal/owner/bookings/${item.id}`} className="group grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3.5 transition hover:bg-brand-50/60 sm:grid-cols-[minmax(0,1.2fr)_minmax(170px,.65fr)_auto] sm:px-5">
      <div className="min-w-0"><div className="flex items-baseline gap-2"><p className="truncate text-sm font-semibold">{item.customerName}</p><span className="sm:hidden"><StatusBadge status={item.status} /></span></div><p className="tabular mt-1 text-[10px] font-medium text-brand-800">{formatManilaDateTime(item.requestedStartsAt)}</p><p className="mt-1 truncate text-[11px] text-ink-muted">{item.services.map((service) => service.serviceName).join(", ")}</p>{confirmed && <p className="mt-1.5 flex items-center gap-1 text-[10px] text-ink-subtle"><UserFocus size={13} /><span className="truncate">{item.segments.map((segment) => segment.staff?.publicName ?? `${segment.flexUnit?.category.name ?? "Service"} staffing required`).join(" · ")}</span></p>}</div>
      <div className="hidden sm:block"><StatusBadge status={confirmed ? item.staffingStatus : item.status} /><p className="tabular mt-2 text-xs font-semibold text-brand-900">{formatMoney(item.subtotalCentavos)}</p><p className="mt-0.5 text-[9px] text-ink-subtle">Deposit: {item.deposit?.status?.toLowerCase().replaceAll("_", " ") ?? "none"}</p></div>
      <span className="grid size-11 place-items-center rounded-xl text-ink-subtle group-hover:text-brand-900"><ArrowRight size={16} weight="bold" /></span>
    </Link>)}</div> : <EmptyQueue icon={confirmed ? <ClockCountdown size={21} weight="duotone" /> : <Receipt size={21} weight="duotone" />} title={confirmed ? "No confirmed appointments" : "No booking history"} text={confirmed ? "Verified bookings will appear here." : "Completed and closed bookings will appear here."} />}
  </section>;
}

function BookingIdentity({ item, mobileAmount = false }: { item: BookingItem; mobileAmount?: boolean }) {
  return <div className="min-w-0"><div className="flex items-baseline gap-2"><p className="truncate text-sm font-semibold">{item.customerName}</p>{mobileAmount && <p className="tabular shrink-0 text-sm font-semibold text-brand-900 sm:hidden">{formatMoney(item.depositCentavos)}</p>}</div><p className="mt-1 truncate text-[11px] text-ink-muted">{item.services.map((service) => service.serviceName).join(", ")}</p><p className="tabular mt-1 text-[10px] text-ink-subtle">{formatManilaDateTime(item.requestedStartsAt)} · {item.publicCode}</p></div>;
}

function ReviewLink({ item }: { item: BookingItem }) {
  return <Link href={`/portal/owner/bookings/${item.id}`} aria-label={`Review ${item.customerName}'s booking`} title="Review booking" className="grid size-11 place-items-center rounded-xl text-ink-muted transition hover:bg-brand-50 hover:text-brand-900"><Eye size={18} weight="duotone" /></Link>;
}

function BookingTab({ href, label, count, active }: { href: string; label: string; count: number; active: boolean }) {
  return <Link href={href} aria-current={active ? "page" : undefined} className={`flex min-h-11 min-w-0 items-center justify-center gap-1.5 rounded-[14px] px-2 text-[11px] font-semibold transition sm:text-sm ${active ? "bg-brand-950 text-white shadow-[0_5px_14px_rgba(23,78,79,.16)]" : "text-ink-muted hover:bg-brand-50 hover:text-ink"}`}><span className="truncate">{label}</span><span className={`tabular text-[9px] ${active ? "text-white/65" : "text-ink-subtle"}`}>{count}</span></Link>;
}

function Count({ value, tone }: { value: number; tone: "warning" | "info" | "success" | "neutral" }) {
  const styles = { warning: "bg-warning-soft text-warning", info: "bg-info-soft text-info", success: "bg-success-soft text-success", neutral: "bg-surface-muted text-ink-muted" };
  return <span className={`tabular grid size-8 place-items-center rounded-xl text-xs font-semibold ${styles[tone]}`}>{value}</span>;
}

function EmptyQueue({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="flex items-center gap-3 border-t border-line px-4 py-5 sm:px-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-800">{icon}</span><div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs leading-5 text-ink-muted">{text}</p></div></div>;
}

function BookingTabsSkeleton() {
  return <div aria-label="Loading booking views" className="skeleton h-14 rounded-[18px]" />;
}

function BookingContentSkeleton() {
  return <div aria-label="Loading bookings" className="overflow-hidden rounded-[20px] bg-surface"><div className="skeleton h-16 rounded-none" />{Array.from({ length: 4 }, (_, row) => <div key={row} className="flex items-center justify-between border-t border-line px-4 py-3"><div className="min-w-0 flex-1"><div className="skeleton h-4 w-32 rounded" /><div className="skeleton mt-2 h-3 w-48 rounded" /><div className="skeleton mt-2 h-3 w-36 rounded" /></div><div className="skeleton size-11 rounded-xl" /></div>)}</div>;
}

function BookingRouteSkeleton() {
  return <div className="mt-5"><BookingTabsSkeleton /><div className="mt-4"><BookingContentSkeleton /></div></div>;
}

export default function BookingsPage(props: Props) {
  return <div className="mx-auto max-w-5xl"><header className="flex items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-[-.035em] sm:text-3xl">Bookings</h1><p className="mt-2 max-w-xl text-sm leading-5 text-ink-muted">Review requests, manage confirmed appointments, and find past records.</p></div><div className="flex items-center gap-2"><SectionRefreshButton sections={["bookings"]} label="Refresh bookings"/><Link href="/portal/owner/bookings/new" className="hidden min-h-11 items-center gap-2 rounded-xl bg-brand-950 px-4 text-sm font-semibold text-white transition hover:bg-brand-800 sm:inline-flex"><Plus size={16} weight="bold" /> New booking</Link></div></header><Suspense fallback={<BookingRouteSkeleton />}><BookingRoute searchParams={props.searchParams} /></Suspense></div>;
}
