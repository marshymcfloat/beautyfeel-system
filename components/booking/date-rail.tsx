"use client";

import Link from "next/link";
import { useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function DateRail({ dates, selected, services }: { dates: string[]; selected: string; services: string }) {
  const allowed = new Set(dates);
  const availableMonths = [...new Set(dates.map(date => date.slice(0, 7)))];
  const [visibleMonth, setVisibleMonth] = useState(selected.slice(0, 7));
  const monthIndex = Math.max(0, availableMonths.indexOf(visibleMonth));
  const [year, month] = visibleMonth.split("-").map(Number);
  const first = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();
  const cells: Array<Date | null> = [
    ...Array.from({ length: first.getDay() }, () => null),
    ...Array.from({ length: lastDay }, (_, index) => new Date(year, month - 1, index + 1)),
  ];
  while (cells.length % 7) cells.push(null);

  const goToMonth = (offset: number) => {
    const next = availableMonths[monthIndex + offset];
    if (next) setVisibleMonth(next);
  };

  return <section aria-labelledby="calendar-title" className="rounded-3xl border border-line bg-surface p-4 shadow-[0_16px_40px_-30px_rgba(14,52,53,.45)] sm:p-6">
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-semibold text-brand-800">Select a date</p>
        <h2 id="calendar-title" className="mt-1 text-xl font-semibold tracking-[-.02em]">{first.toLocaleDateString("en-PH", { month: "long", year: "numeric" })}</h2>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => goToMonth(-1)} disabled={monthIndex === 0} aria-label="Previous month" className="grid size-11 place-items-center rounded-xl border border-line bg-surface text-brand-950 transition hover:border-brand-900 hover:bg-brand-50 active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-30"><CaretLeft aria-hidden size={18} weight="bold"/></button>
        <button type="button" onClick={() => goToMonth(1)} disabled={monthIndex === availableMonths.length - 1} aria-label="Next month" className="grid size-11 place-items-center rounded-xl border border-line bg-surface text-brand-950 transition hover:border-brand-900 hover:bg-brand-50 active:scale-[.97] disabled:cursor-not-allowed disabled:opacity-30"><CaretRight aria-hidden size={18} weight="bold"/></button>
      </div>
    </div>

    <div className="mt-5 grid grid-cols-7 text-center" aria-hidden="true">{weekdays.map(day=><span key={day} className="py-2 text-[11px] font-semibold text-ink-subtle">{day}</span>)}</div>
    <div className="grid grid-cols-7 gap-y-1">{cells.map((date,index)=>{
      if(!date) return <span key={`blank-${index}`} aria-hidden className="aspect-square"/>;
      const value=isoDate(date);
      const enabled=allowed.has(value);
      const active=value===selected;
      const isToday=value===dates[0];
      if(!enabled) return <span key={value} aria-disabled="true" className="grid aspect-square place-items-center text-sm text-ink-subtle/35">{date.getDate()}</span>;
      return <Link key={value} href={`/book/schedule?services=${encodeURIComponent(services)}&date=${value}`} scroll={false} aria-current={active?"date":undefined} aria-label={`${date.toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" })}${isToday ? ", today" : ""}`} className={`relative grid aspect-square min-h-11 place-items-center rounded-xl text-sm font-semibold transition active:scale-[.94] ${active ? "bg-brand-900 text-white shadow-[0_8px_18px_-10px_rgba(14,78,79,.8)]" : "text-ink hover:bg-brand-50 hover:text-brand-950"}`}><span>{date.getDate()}</span>{isToday&&!active&&<span aria-hidden className="absolute bottom-1.5 size-1 rounded-full bg-brand-800"/>}</Link>;
    })}</div>
    <div className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-xs text-ink-muted"><span className="size-2 rounded-full bg-brand-800"/><span>Today</span><span className="ml-2 size-4 rounded-md bg-brand-900"/><span>Selected date</span></div>
  </section>;
}
