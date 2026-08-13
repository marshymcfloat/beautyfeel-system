"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarBlank, CalendarCheck, Check, CloudSun, Moon, SunHorizon } from "@phosphor-icons/react";

type Period = "MORNING" | "AFTERNOON" | "EVENING";
type Slot = { startsAt: string };

const periodDetails: Array<{ id: Period; label: string; icon: typeof SunHorizon }> = [
  { id: "MORNING", label: "Morning", icon: SunHorizon },
  { id: "AFTERNOON", label: "Afternoon", icon: CloudSun },
  { id: "EVENING", label: "Evening", icon: Moon },
];

const timeFormatter = new Intl.DateTimeFormat("en-PH", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Manila",
});

function getManilaHour(value: string) {
  const hour = new Intl.DateTimeFormat("en-PH", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Manila" }).format(new Date(value));
  return Number(hour);
}

function getPeriod(value: string): Period {
  const hour = getManilaHour(value);
  if (hour < 12) return "MORNING";
  if (hour < 17) return "AFTERNOON";
  return "EVENING";
}

export function SlotGrid({ slots, services, date, intervalMinutes }: { slots: Slot[]; services: string; date: string; intervalMinutes:number }) {
  const selectedDate = new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" });
  const grouped = useMemo(() => ({
    MORNING: slots.filter(slot => getPeriod(slot.startsAt) === "MORNING"),
    AFTERNOON: slots.filter(slot => getPeriod(slot.startsAt) === "AFTERNOON"),
    EVENING: slots.filter(slot => getPeriod(slot.startsAt) === "EVENING"),
  }), [slots]);
  const firstPeriod = periodDetails.find(period => grouped[period.id].length)?.id ?? "MORNING";
  const [period, setPeriod] = useState<Period>(firstPeriod);
  const [visibleCount, setVisibleCount] = useState(6);
  const [selected, setSelected] = useState<string | null>(null);

  if (!slots.length) return <section className="rounded-3xl border border-line bg-surface p-5 sm:p-6"><div className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-900"><CalendarBlank aria-hidden size={22} weight="duotone"/></div><h2 className="mt-5 text-lg font-semibold tracking-[-.01em]">No openings on {selectedDate}</h2><p className="mt-2 max-w-sm text-sm leading-6 text-ink-muted">Try another highlighted date in the calendar. Availability is checked again before your booking is held.</p></section>;

  const periodSlots = grouped[period];
  const visibleSlots = periodSlots.slice(0, visibleCount);
  const hasMore = periodSlots.length > visibleCount;
  const selectedLabel = selected ? timeFormatter.format(new Date(selected)) : null;

  const choosePeriod = (value: Period) => {
    setPeriod(value);
    setVisibleCount(6);
  };

  const timeButton = (slot: Slot, earliest = false) => {
    const active = selected === slot.startsAt;
    return <button key={slot.startsAt} type="button" onClick={() => setSelected(slot.startsAt)} aria-pressed={active} className={`tabular flex min-h-12 items-center rounded-xl border px-3 text-left transition active:scale-[.98] ${active ? "border-brand-900 bg-brand-900 text-white shadow-[0_8px_18px_-14px_rgba(14,78,79,.85)]" : earliest ? "border-brand-800 bg-brand-50 text-brand-950 hover:bg-brand-100" : "border-line bg-surface-muted text-brand-950 hover:border-brand-800 hover:bg-brand-50"}`}><span className="flex-1 font-semibold">{timeFormatter.format(new Date(slot.startsAt))}</span>{active?<span className="grid size-5 place-items-center rounded-md bg-white/15"><Check aria-hidden size={13} weight="bold"/></span>:earliest?<span className="text-[10px] font-semibold text-brand-800">Earliest</span>:null}</button>;
  };

  return <>
    <section className="rounded-2xl border border-line bg-surface p-3 shadow-[0_14px_34px_-30px_rgba(14,52,53,.38)] sm:p-4">
      <div className="flex items-start justify-between gap-4 rounded-xl bg-brand-950 px-4 py-3.5 text-white"><div><p className="text-[11px] font-medium text-white/60">Available appointments</p><h2 className="mt-0.5 text-lg font-semibold tracking-[-.015em]">{selectedDate}</h2><p className="mt-1 text-[11px] text-white/55">Manila time · {slots.length} start times</p></div><CalendarCheck aria-hidden className="mt-1 text-white/70" size={20} weight="duotone"/></div>

      <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-surface-muted p-1" role="group" aria-label="Time of day">{periodDetails.map(item=>{const Icon=item.icon;const active=period===item.id;const count=grouped[item.id].length;return <button key={item.id} type="button" disabled={!count} onClick={()=>choosePeriod(item.id)} aria-pressed={active} className={`flex min-h-13 items-center justify-center gap-1.5 rounded-lg px-1 transition active:scale-[.98] ${active ? "bg-brand-900 text-white shadow-[0_6px_14px_-12px_rgba(14,78,79,.8)]" : "text-ink-muted hover:bg-surface disabled:cursor-not-allowed disabled:opacity-35"}`}><Icon aria-hidden size={14} weight="duotone"/><span><span className="block text-xs font-semibold">{item.label}</span><span className={`block text-[9px] ${active?"text-white/60":"text-ink-subtle"}`}>{count} times</span></span></button>})}</div>

      <div className="mt-4 flex items-end justify-between gap-3"><div><h3 className="text-sm font-semibold">{periodDetails.find(item=>item.id===period)?.label} times</h3><p className="mt-0.5 text-[11px] text-ink-subtle">Starts every {intervalMinutes} minutes</p></div><p className="text-[11px] font-medium text-ink-muted">{periodSlots.length} available</p></div>
      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">{visibleSlots.map((slot,index)=>timeButton(slot,index===0))}</div>

      {hasMore&&<button type="button" onClick={()=>setVisibleCount(count=>count+6)} className="mt-3 min-h-11 w-full rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-brand-950 transition hover:border-brand-900 hover:bg-brand-50 active:scale-[.99]">Show more <span className="font-medium text-ink-subtle">· {periodSlots.length-visibleCount} remaining</span></button>}
    </section>

    {selected&&<div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pt-3 shadow-[0_-12px_30px_-26px_rgba(14,52,53,.5)] backdrop-blur-md"><div className="mx-auto flex max-w-[1120px] items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-900"><CalendarCheck aria-hidden size={19} weight="duotone"/></span><div className="min-w-0 flex-1"><p className="text-xs font-medium text-ink-muted">Selected appointment</p><p className="tabular mt-0.5 truncate text-sm font-semibold text-brand-950">{selectedDate} · {selectedLabel}</p></div><Link href={`/book/details?services=${encodeURIComponent(services)}&date=${date}&startsAt=${encodeURIComponent(selected)}`} className="inline-flex min-h-13 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-900 px-5 font-semibold text-white transition hover:bg-brand-800 active:scale-[.98]">Continue<ArrowRight aria-hidden size={18} weight="bold"/></Link></div></div>}
  </>;
}
