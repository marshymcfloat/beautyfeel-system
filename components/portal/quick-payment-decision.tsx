"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ShieldCheck, X } from "@phosphor-icons/react";
import { approveDeposit } from "@/features/bookings/actions";

export function QuickPaymentDecision({ bookingId, customerName, compact = false }: { bookingId: string; customerName: string; compact?: boolean }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function openDialog() {
    setError(null);
    dialogRef.current?.showModal();
  }

  function approve() {
    setError(null);
    startTransition(async () => {
      const result = await approveDeposit({ bookingId, note: "Approved from Today dashboard" });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      dialogRef.current?.close();
      router.refresh();
    });
  }

  return <div className={compact ? "shrink-0" : ""}>
    <button type="button" onClick={openDialog} aria-label={compact ? `Approve ${customerName}'s deposit` : undefined} title={compact ? "Approve deposit" : undefined} className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-brand-900 text-xs font-semibold text-white transition hover:bg-brand-800 active:scale-[.98] ${compact ? "size-11 p-0" : "w-full px-3"}`}>
      <Check aria-hidden size={compact ? 17 : 14} weight="bold" /> {compact ? <span className="sr-only">Approve deposit</span> : "Approve deposit"}
    </button>

    <dialog ref={dialogRef} aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={(event) => { if (pending) event.preventDefault(); }} className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-[22px] border-0 bg-surface p-0 text-ink shadow-[0_24px_70px_rgba(11,44,44,.28)] backdrop:bg-brand-950/55 backdrop:backdrop-blur-[2px]">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-brand-50 text-brand-900"><ShieldCheck aria-hidden size={23} weight="duotone" /></span>
          <button type="button" disabled={pending} onClick={() => dialogRef.current?.close()} aria-label="Close confirmation" className="grid size-11 shrink-0 place-items-center rounded-xl text-ink-subtle transition hover:bg-canvas hover:text-ink disabled:opacity-40"><X aria-hidden size={18} /></button>
        </div>
        <h2 id={titleId} className="mt-4 text-xl font-semibold tracking-[-.025em]">Approve this deposit?</h2>
        <p id={descriptionId} className="mt-2 text-sm leading-6 text-ink-muted">Confirm that <strong className="font-semibold text-ink">{customerName}</strong>’s payment appears in Beautyfeel’s GCash account.</p>
        <div className="mt-4 rounded-xl bg-warning-soft px-3.5 py-3 text-xs leading-5 text-[#6d5519]">Approval confirms the booking and notifies the customer.</div>
        {error && <p role="alert" className="mt-3 rounded-xl bg-danger-soft px-3.5 py-3 text-xs leading-5 text-danger">{error}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-line bg-canvas/60 p-3">
        <button type="button" disabled={pending} onClick={() => dialogRef.current?.close()} className="min-h-11 rounded-xl text-sm font-semibold text-ink-muted transition hover:bg-surface disabled:opacity-40">Cancel</button>
        <button type="button" disabled={pending} onClick={approve} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-950 px-3 text-sm font-semibold text-white transition hover:bg-brand-800 active:scale-[.98] disabled:cursor-wait disabled:opacity-60"><Check aria-hidden size={16} weight="bold" />{pending ? "Approving…" : "Confirm"}</button>
      </div>
    </dialog>
  </div>;
}
