import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { DateTime } from "luxon";
import { ArrowRight, Bell, CalendarBlank, CalendarCheck, Clock, Eye, Plus, UsersThree, Wallet, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { getDashboardSchedule, getOwnerBookingQueue } from "@/features/bookings/queries";
import { getAdminAlerts } from "@/features/notifications/queries";
import { QuickPaymentDecision } from "@/components/portal/quick-payment-decision";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { formatManilaDateTime, formatManilaTime, formatMoney } from "@/lib/format";
import { getServerEnv } from "@/lib/env/server";
import { getWorkflowEfficiency } from "@/features/efficiency/queries";
import { WorkflowEfficiency } from "@/components/portal/workflow-efficiency";

export const metadata = { title: "Home" };
export const instant = false;

async function HomeContent() {
  await connection();
  const now = DateTime.now().setZone("Asia/Manila");
  const todayStart = now.startOf("day");
  const tomorrow = todayStart.plus({ days: 1 });
  const [confirmed, queue, alerts, efficiency] = await Promise.all([
    getDashboardSchedule({ startsAt: todayStart.toUTC().toJSDate(), endsAt: todayStart.plus({ days: 31 }).toUTC().toJSDate() }),
    getOwnerBookingQueue({ take: 20 }),
    getAdminAlerts(20),
    getWorkflowEfficiency(),
  ]);
  const today = confirmed.filter((item) => DateTime.fromJSDate(item.requestedStartsAt, { zone: "utc" }).setZone("Asia/Manila").toISODate() === todayStart.toISODate());
  const upcoming = confirmed.filter((item) => item.requestedStartsAt >= tomorrow.toUTC().toJSDate()).slice(0, 3);
  const paymentClaims = queue.filter((item) => item.status === "PENDING_VERIFICATION");
  const staffing = confirmed.filter((item) => item.staffingStatus === "FLEX_RESERVED");
  const unreadAlerts = alerts.filter((item) => !item.readAt);
  const needsAttention = paymentClaims.length > 0 || staffing.length > 0 || unreadAlerts.length > 0;
  const env = getServerEnv();

  return <div className="space-y-4">
    <RealtimeRefresh url={env.SUPABASE_URL} publishableKey={env.SUPABASE_PUBLISHABLE_KEY} topics={[`schedule:${todayStart.toISODate()}`, "schedule:all"]} />

    <header className="flex items-end justify-between gap-4 pb-1"><div><p className="text-[11px] font-semibold text-brand-700">{now.toFormat("cccc, d LLLL")}</p><h1 className="mt-1 text-2xl font-semibold tracking-[-.035em] sm:text-3xl">Home</h1><p className="mt-2 text-sm text-ink-muted">What needs attention and what is coming next.</p></div><Link href="/portal/owner/bookings/new" className="hidden min-h-11 items-center gap-2 rounded-xl bg-brand-950 px-4 text-sm font-semibold text-white sm:inline-flex"><Plus size={16} weight="bold" /> New booking</Link></header>

    <section className="grid grid-cols-3 gap-2" aria-label="Workspace overview">
      <Summary icon={<CalendarCheck size={22} weight="duotone" />} value={today.length} label="Today" tone="green" />
      <Summary icon={<Wallet size={22} weight="duotone" />} value={paymentClaims.length} label="To approve" tone="amber" />
      <Summary icon={<UsersThree size={22} weight="duotone" />} value={staffing.length} label="Need staff" tone="blue" />
    </section>

    <WorkflowEfficiency {...efficiency} />

    {needsAttention && <section className="overflow-hidden rounded-[20px] bg-[#fff7df] shadow-[0_8px_24px_rgba(91,69,15,.07)]">
      <div className="flex items-center justify-between px-4 py-3"><div className="flex items-center gap-2"><WarningCircle className="text-[#856516]" size={18} weight="fill" /><h2 className="text-sm font-semibold text-[#4f3c0d]">Needs attention</h2></div><Link href="/portal/owner/bookings" className="text-[10px] font-semibold text-[#765710]">Open bookings</Link></div>
      {paymentClaims.length > 0 && <div className="border-t border-[#ead9ad] bg-[#fffaf0]">{paymentClaims.slice(0, 3).map((item) => <article key={item.id} className="flex items-center gap-2.5 border-b border-[#ead9ad] px-3.5 py-2.5 last:border-b-0"><div className="min-w-0 flex-1"><div className="flex items-baseline gap-2"><p className="truncate text-xs font-semibold text-[#3f330f]">{item.customerName}</p><p className="tabular shrink-0 text-xs font-semibold text-[#4f3c0d]">{formatMoney(item.depositCentavos)}</p></div><p className="tabular mt-1 truncate text-[9px] text-[#876b27]">{formatManilaDateTime(item.requestedStartsAt)} · {item.publicCode}</p></div><div className="flex shrink-0 items-center gap-1.5"><Link href={`/portal/owner/bookings/${item.id}`} aria-label={`Review ${item.customerName}'s booking`} title="Review booking" className="grid size-11 place-items-center rounded-xl text-[#60490f] hover:bg-[#f5e8c3]"><Eye size={18} weight="duotone" /></Link><QuickPaymentDecision bookingId={item.id} customerName={item.customerName} compact /></div></article>)}{paymentClaims.length > 3 && <Link href="/portal/owner/bookings" className="flex min-h-11 items-center justify-between px-4 text-xs font-semibold text-[#60490f]">View {paymentClaims.length - 3} more <ArrowRight size={14} weight="bold" /></Link>}</div>}
      {(staffing.length > 0 || unreadAlerts.length > 0) && <div className="grid grid-cols-2 border-t border-[#ead9ad]"><AttentionLink href="/portal/owner/calendar" icon={<UsersThree size={16} />} value={staffing.length} label="Bookings need staff" /><AttentionLink href="/portal/owner/alerts" icon={<Bell size={16} />} value={unreadAlerts.length} label="Unread alerts" bordered /></div>}
    </section>}

    <div className="grid items-start gap-4 xl:grid-cols-2">
      <SchedulePreview title="Today" caption={`${today.length} confirmed`} icon={<Clock size={19} weight="duotone" />} items={today.slice(0, 3)} href={`/portal/owner/calendar?date=${todayStart.toISODate()}`} empty="No confirmed appointments today" />
      <SchedulePreview title="Upcoming" caption="Next confirmed bookings" icon={<CalendarBlank size={19} weight="duotone" />} items={upcoming} href="/portal/owner/calendar" empty="No upcoming confirmed bookings" showDate />
    </div>
  </div>;
}

type ScheduleItem = Awaited<ReturnType<typeof getDashboardSchedule>>[number];

function SchedulePreview({ title, caption, icon, items, href, empty, showDate = false }: { title: string; caption: string; icon: React.ReactNode; items: ScheduleItem[]; href: string; empty: string; showDate?: boolean }) {
  return <section className="overflow-hidden rounded-[20px] bg-surface shadow-[0_8px_24px_rgba(23,48,46,.06)]"><header className="flex items-center justify-between gap-3 px-4 py-3.5"><div className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-800">{icon}</span><div><h2 className="text-base font-semibold tracking-[-.02em]">{title}</h2><p className="mt-0.5 text-[10px] text-ink-subtle">{caption}</p></div></div><Link href={href} aria-label={`Open ${title.toLowerCase()} schedule`} className="grid size-10 place-items-center rounded-xl text-brand-800 hover:bg-brand-50"><ArrowRight size={15} weight="bold" /></Link></header>{items.length ? <div className="divide-y divide-line border-t border-line">{items.map((item) => <Link key={item.id} href={`/portal/owner/bookings/${item.id}`} className="group grid grid-cols-[64px_1fr_auto] items-center gap-3 px-4 py-3 hover:bg-brand-50/60"><div><p className="tabular text-xs font-semibold text-brand-900">{showDate ? DateTime.fromJSDate(item.requestedStartsAt, { zone: "utc" }).setZone("Asia/Manila").toFormat("d LLL") : formatManilaTime(item.requestedStartsAt)}</p><p className="tabular mt-0.5 text-[9px] text-ink-subtle">{showDate ? formatManilaTime(item.requestedStartsAt) : DateTime.fromJSDate(item.requestedEndsAt, { zone: "utc" }).setZone("Asia/Manila").toFormat("h:mm a")}</p></div><div className="min-w-0 border-l border-line pl-3"><p className="truncate text-xs font-semibold">{item.customerName}</p><p className="mt-0.5 truncate text-[10px] text-ink-muted">{item.services.map((service) => service.serviceName).join(", ")}</p></div><span className={`size-2 rounded-full ${item.staffingStatus === "FLEX_RESERVED" ? "bg-warning" : "bg-success"}`} aria-label={item.staffingStatus === "FLEX_RESERVED" ? "Staffing required" : "Assigned"} /></Link>)}</div> : <div className="border-t border-line px-4 py-5"><p className="text-xs font-semibold">{empty}</p><p className="mt-1 text-[10px] text-ink-muted">Confirmed bookings will appear here.</p></div>}</section>;
}

function Summary({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone: "green" | "amber" | "blue" }) {
  const styles = { green: "bg-[#e4f2ec] text-brand-900", amber: "bg-[#fff0cf] text-[#765710]", blue: "bg-[#e5f0f3] text-[#286477]" };
  return <div className={`min-w-0 rounded-[18px] px-3 py-3 ${styles[tone]}`}><span className="grid size-9 place-items-center rounded-xl bg-white/65">{icon}</span><p className="tabular mt-2 text-xl font-semibold leading-none text-ink">{value}</p><p className="mt-1 truncate text-[9px] font-semibold sm:text-[10px]">{label}</p></div>;
}

function AttentionLink({ href, icon, value, label, bordered = false }: { href: string; icon: React.ReactNode; value: number; label: string; bordered?: boolean }) {
  return <Link href={href} className={`flex min-h-14 items-center gap-2 px-4 text-[#60490f] ${bordered ? "border-l border-[#ead9ad]" : ""}`}><span>{icon}</span><span><strong className="tabular block text-sm">{value}</strong><span className="block text-[9px] text-[#876b27]">{label}</span></span></Link>;
}

function HomeSkeleton() {
  return <div className="space-y-4"><div className="skeleton h-16 rounded-2xl" /><div className="grid grid-cols-3 gap-2"><div className="skeleton h-24 rounded-[18px]" /><div className="skeleton h-24 rounded-[18px]" /><div className="skeleton h-24 rounded-[18px]" /></div><div className="grid gap-4 xl:grid-cols-2"><div className="skeleton h-64 rounded-[20px]" /><div className="skeleton h-64 rounded-[20px]" /></div></div>;
}

export default function HomePage() {
  return <Suspense fallback={<HomeSkeleton />}><HomeContent /></Suspense>;
}
