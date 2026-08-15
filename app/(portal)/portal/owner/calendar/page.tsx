import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { DateTime } from "luxon";
import { ArrowRight, CalendarBlank, CaretLeft, CaretRight, Clock, Plus, UserFocus } from "@phosphor-icons/react/dist/ssr";
import { getDashboardSchedule } from "@/features/bookings/queries";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatManilaTime } from "@/lib/format";
import { SectionRefreshButton } from "@/components/portal/section-refresh-button";

type Props = { searchParams: Promise<{ date?: string }> };

export const metadata = { title: "Calendar" };
export const instant = false;

async function CalendarContent({ searchParams }: Props) {
  await connection();
  const query = await searchParams;
  const today = DateTime.now().setZone("Asia/Manila").startOf("day");
  const requested = DateTime.fromISO(query.date ?? "", { zone: "Asia/Manila" });
  const selectedDay = requested.isValid ? requested.startOf("day") : today;
  const month = selectedDay.startOf("month");
  const monthEnd = month.endOf("month");
  const monthBookings = await getDashboardSchedule({ startsAt: month.toUTC().toJSDate(), endsAt: monthEnd.toUTC().toJSDate() });
  const selectedIso = selectedDay.toISODate()!;
  const bookings = monthBookings.filter((booking) => DateTime.fromJSDate(booking.requestedStartsAt, { zone: "utc" }).setZone("Asia/Manila").toISODate() === selectedIso);

  const bookingsByDate = new Map<string, { count: number; needsStaff: boolean }>();
  for (const booking of monthBookings) {
    const iso = DateTime.fromJSDate(booking.requestedStartsAt, { zone: "utc" }).setZone("Asia/Manila").toISODate()!;
    const current = bookingsByDate.get(iso) ?? { count: 0, needsStaff: false };
    bookingsByDate.set(iso, { count: current.count + 1, needsStaff: current.needsStaff || booking.staffingStatus === "FLEX_RESERVED" });
  }

  const gridStart = month.minus({ days: month.weekday % 7 });
  const calendarDays = Array.from({ length: 42 }, (_, index) => gridStart.plus({ days: index }));
  const previousMonth = month.minus({ months: 1 }).toISODate()!;
  const nextMonth = month.plus({ months: 1 }).toISODate()!;

  return <div className="mt-5 grid items-start gap-4 xl:grid-cols-[minmax(320px,.85fr)_minmax(0,1.15fr)]">
    <section className="overflow-hidden rounded-[22px] bg-surface shadow-[0_10px_28px_rgba(23,48,46,.07)]">
      <div className="flex items-center justify-between bg-brand-950 px-4 py-3.5 text-white">
        <div><p className="text-[10px] font-medium text-white/55">Select a date</p><h2 className="mt-0.5 text-lg font-semibold tracking-[-.02em]">{month.toFormat("LLLL yyyy")}</h2></div>
        <div className="flex gap-1.5"><MonthControl href={`/portal/owner/calendar?date=${previousMonth}`} label="Previous month"><CaretLeft size={17} weight="bold" /></MonthControl><MonthControl href={`/portal/owner/calendar?date=${nextMonth}`} label="Next month"><CaretRight size={17} weight="bold" /></MonthControl></div>
      </div>
      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-7 pb-1" aria-hidden>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekday) => <span key={weekday} className="py-1 text-center text-[9px] font-semibold text-ink-subtle">{weekday}</span>)}</div>
        <div className="grid grid-cols-7 gap-1" role="grid" aria-label={month.toFormat("LLLL yyyy")}>
          {calendarDays.map((date) => {
            const iso = date.toISODate()!;
            const active = iso === selectedIso;
            const isToday = iso === today.toISODate();
            const inMonth = date.month === month.month && date.year === month.year;
            const activity = bookingsByDate.get(iso);
            return <Link key={iso} href={`/portal/owner/calendar?date=${iso}`} role="gridcell" aria-current={isToday ? "date" : undefined} aria-label={`${date.toFormat("cccc, d LLLL yyyy")}${activity ? `, ${activity.count} appointment${activity.count === 1 ? "" : "s"}` : ""}`} className={`relative flex aspect-square min-h-11 flex-col items-center justify-center rounded-xl text-xs font-semibold transition active:scale-95 ${active ? "bg-brand-900 text-white shadow-[0_6px_14px_rgba(23,78,79,.2)]" : isToday ? "bg-brand-50 text-brand-900 ring-1 ring-inset ring-brand-100" : inMonth ? "text-ink hover:bg-canvas" : "text-ink-subtle/45 hover:bg-canvas"}`}>
              <span className="tabular">{date.day}</span>
              {activity && <span className={`absolute bottom-1.5 flex items-center gap-0.5 ${active ? "text-white" : activity.needsStaff ? "text-warning" : "text-brand-700"}`}><span className="size-1 rounded-full bg-current" />{activity.count > 1 && <span className="tabular text-[7px] leading-none">{activity.count}</span>}</span>}
            </Link>;
          })}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-[9px] text-ink-muted"><Legend color="bg-brand-700" label="Confirmed" /><Legend color="bg-warning" label="Staffing required" /><span className="ml-auto tabular">{monthBookings.length} this month</span></div>
      </div>
    </section>

    <section className="overflow-hidden rounded-[22px] bg-surface shadow-[0_10px_28px_rgba(23,48,46,.07)]">
      <header className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
        <div><p className="text-[10px] font-semibold text-brand-700">Selected date</p><h2 className="mt-1 text-xl font-semibold tracking-[-.025em]">{selectedDay.toFormat("cccc, d LLLL")}</h2><p className="mt-1 text-xs text-ink-muted">{bookings.length ? `${bookings.length} confirmed appointment${bookings.length === 1 ? "" : "s"}` : "No confirmed appointments"}</p></div>
        <span className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-brand-50 text-brand-800"><CalendarBlank size={20} weight="duotone" /></span>
      </header>
      {bookings.length ? <div className="divide-y divide-line border-t border-line">{bookings.map((booking) => <Link key={booking.id} href={`/portal/owner/bookings/${booking.id}`} className="group grid grid-cols-[58px_1fr_auto] items-start gap-3 px-4 py-3.5 transition hover:bg-brand-50/60 sm:grid-cols-[74px_1fr_auto] sm:px-5">
        <div className="pt-0.5"><p className="tabular text-xs font-semibold text-brand-900">{formatManilaTime(booking.requestedStartsAt)}</p><p className="tabular mt-1 text-[9px] text-ink-subtle">{DateTime.fromJSDate(booking.requestedEndsAt, { zone: "utc" }).setZone("Asia/Manila").toFormat("h:mm a")}</p></div>
        <div className="min-w-0 border-l-2 border-brand-100 pl-3"><p className="truncate text-sm font-semibold">{booking.customerName}</p><p className="mt-1 line-clamp-2 text-[11px] leading-4 text-ink-muted">{booking.services.map((service) => service.serviceName).join(", ")}</p><p className="mt-2 flex items-center gap-1.5 truncate text-[10px] text-ink-subtle"><UserFocus size={13} /><span className="truncate">{booking.segments.map((segment) => segment.staff?.publicName ?? "Staffing required").join(" · ")}</span></p></div>
        <div className="flex flex-col items-end gap-2"><StatusBadge status={booking.staffingStatus} /><ArrowRight className="text-ink-subtle transition group-hover:translate-x-0.5 group-hover:text-brand-900" size={14} weight="bold" /></div>
      </Link>)}</div> : <div className="border-t border-line px-4 py-7 sm:px-5"><span className="grid size-11 place-items-center rounded-[14px] bg-info-soft text-info"><Clock size={21} weight="duotone" /></span><h3 className="mt-3 text-sm font-semibold">This date is open</h3><p className="mt-1 text-xs leading-5 text-ink-muted">There are no confirmed appointments scheduled for this day.</p><Link href="/portal/owner/bookings/new" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-950 px-4 text-xs font-semibold text-white"><Plus size={15} weight="bold" /> Add a booking</Link></div>}
    </section>
  </div>;
}

function MonthControl({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return <Link href={href} aria-label={label} title={label} className="grid size-11 place-items-center rounded-xl bg-white/10 text-white transition hover:bg-white/15 active:scale-95">{children}</Link>;
}

function Legend({ color, label }: { color: string; label: string }) {
  return <span className="flex items-center gap-1.5"><span className={`size-1.5 rounded-full ${color}`} />{label}</span>;
}

function CalendarSkeleton() {
  return <div className="mt-5 grid items-start gap-4 xl:grid-cols-[minmax(320px,.85fr)_minmax(0,1.15fr)]"><div className="overflow-hidden rounded-[22px] bg-surface"><div className="skeleton h-20 rounded-none" /><div className="grid grid-cols-7 gap-1 p-4">{Array.from({ length: 42 }, (_, index) => <div key={index} className="skeleton aspect-square min-h-11 rounded-xl" />)}</div></div><div className="overflow-hidden rounded-[22px] bg-surface"><div className="skeleton h-24 rounded-none" />{Array.from({ length: 3 }, (_, index) => <div key={index} className="flex gap-3 border-t border-line p-4"><div className="skeleton h-4 w-14 rounded" /><div className="flex-1"><div className="skeleton h-4 w-32 rounded" /><div className="skeleton mt-2 h-3 w-48 rounded" /></div></div>)}</div></div>;
}

export default function CalendarPage(props: Props) {
  return <div className="mx-auto max-w-6xl">
    <header className="flex items-end justify-between gap-4"><div><p className="text-[11px] font-semibold text-brand-700">Schedule</p><h1 className="mt-1 text-2xl font-semibold tracking-[-.035em] sm:text-3xl">Calendar</h1><p className="mt-2 text-sm text-ink-muted">Choose a date to review confirmed appointments.</p></div><div className="flex items-center gap-2"><SectionRefreshButton sections={["schedule"]} label="Refresh calendar"/><Link href="/portal/owner/bookings/new" className="hidden min-h-11 items-center gap-2 rounded-xl bg-brand-950 px-4 text-sm font-semibold text-white transition hover:bg-brand-800 sm:inline-flex"><Plus size={16} weight="bold" /> New booking</Link></div></header>
    <Suspense fallback={<CalendarSkeleton />}><CalendarContent searchParams={props.searchParams} /></Suspense>
  </div>;
}
