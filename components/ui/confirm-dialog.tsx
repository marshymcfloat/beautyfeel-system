"use client";

import { useEffect, useId, useRef } from "react";
import { Trash, Warning, X } from "@phosphor-icons/react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  pendingLabel?: string;
  pending?: boolean;
  error?: string | null;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  pendingLabel = "Saving...",
  pending = false,
  error,
  destructive = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onCancel();
      }}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-[22px] border-0 bg-surface p-0 text-ink shadow-[0_24px_70px_rgba(11,44,44,.28)] backdrop:bg-brand-950/55 backdrop:backdrop-blur-[2px]"
    >
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <span className={`grid size-11 shrink-0 place-items-center rounded-[14px] ${destructive ? "bg-danger-soft text-danger" : "bg-warning-soft text-[#6d5519]"}`}>
            {destructive ? <Trash aria-hidden size={22} weight="duotone" /> : <Warning aria-hidden size={22} weight="duotone" />}
          </span>
          <button type="button" disabled={pending} onClick={onCancel} aria-label="Close confirmation" className="grid size-11 shrink-0 place-items-center rounded-xl text-ink-subtle transition hover:bg-canvas hover:text-ink disabled:opacity-40">
            <X aria-hidden size={18} />
          </button>
        </div>
        <h2 id={titleId} className="mt-4 text-xl font-semibold tracking-[-.025em]">{title}</h2>
        <p id={descriptionId} className="mt-2 text-sm leading-6 text-ink-muted">{description}</p>
        {error && <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-3.5 py-3 text-sm leading-5 text-danger">{error}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-line bg-canvas/60 p-3">
        <button type="button" disabled={pending} onClick={onCancel} className="min-h-11 rounded-xl text-sm font-semibold text-ink-muted transition hover:bg-surface disabled:opacity-40">Keep account</button>
        <button type="button" disabled={pending} onClick={onConfirm} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-white transition active:scale-[.98] disabled:cursor-wait disabled:opacity-60 ${destructive ? "bg-danger hover:brightness-90" : "bg-brand-950 hover:bg-brand-800"}`}>
          {destructive && <Trash aria-hidden size={16} weight="bold" />}
          {pending ? pendingLabel : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
