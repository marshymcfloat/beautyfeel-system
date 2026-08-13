"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CheckCircle, Gauge } from "@phosphor-icons/react";
import { recordTodayOverviewUnderstood } from "@/features/efficiency/actions";

type Summary = { samples: number; medianSeconds: number | null; targetRate: number | null };

export function WorkflowEfficiency({ manualBookings, todayOverview, todayAcknowledged }: { manualBookings: Summary; todayOverview: Summary; todayAcknowledged: boolean }) {
  const openedAt = useRef(0);
  const [acknowledged, setAcknowledged] = useState(todayAcknowledged);
  const [pending, startTransition] = useTransition();

  useEffect(() => { openedAt.current = performance.now(); }, []);

  function confirmClarity() {
    const durationSeconds = Math.min(3600, Math.max(0, Math.round((performance.now() - openedAt.current) / 1000)));
    startTransition(async () => {
      const result = await recordTodayOverviewUnderstood({ durationSeconds });
      if (result.ok) setAcknowledged(true);
    });
  }

  return <section className="rounded-[20px] border border-line bg-surface px-4 py-3.5" aria-labelledby="efficiency-title">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5"><span className="grid size-9 place-items-center rounded-xl bg-brand-50 text-brand-900"><Gauge aria-hidden size={19} weight="duotone" /></span><div><h2 id="efficiency-title" className="text-sm font-semibold">Time-saving check</h2><p className="mt-0.5 text-[10px] text-ink-muted">Last 30 days · owner-only measurements</p></div></div>
      {!acknowledged && <button type="button" disabled={pending} onClick={confirmClarity} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-brand-950 px-3 text-xs font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60"><CheckCircle aria-hidden size={16} weight="bold" />{pending ? "Recording…" : "Today is clear"}</button>}
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
      <Metric label="Manual booking" summary={manualBookings} target="under 60 sec" />
      <Metric label="Today overview" summary={todayOverview} target="under 15 sec" />
    </div>
    {!acknowledged && <p className="mt-2 text-[10px] leading-4 text-ink-subtle">Tap “Today is clear” once you understand today’s appointments and tasks.</p>}
  </section>;
}

function Metric({ label, summary, target }: { label: string; summary: Summary; target: string }) {
  return <div className="rounded-xl bg-canvas px-3 py-2.5"><p className="text-[10px] font-medium text-ink-muted">{label}</p><p className="tabular mt-1 text-sm font-semibold">{summary.medianSeconds === null ? "Collecting data" : `${summary.medianSeconds} sec median`}</p><p className="mt-0.5 text-[9px] text-ink-subtle">Target {target}{summary.targetRate === null ? "" : ` · ${summary.targetRate}% met`}</p></div>;
}
