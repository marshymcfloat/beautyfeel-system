"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createBookingAssistant,
  deleteBookingAssistant,
  resetBookingAssistantPassword,
  setBookingAssistantActive,
} from "@/features/assistants/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

type Assistant = { id: string; displayName: string; phoneE164: string; active: boolean };
type ActionResult = { ok: boolean; data?: { userId?: string; temporaryPassword?: string }; error?: { message: string } };

export function AssistantManager({ assistants }: { assistants: Assistant[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [assistantToDelete, setAssistantToDelete] = useState<Assistant | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [optimisticAssistants, setOptimisticAssistant] = useOptimistic(assistants, (state, change: { id: string; active: boolean }) => state.map((assistant) => assistant.id === change.id ? { ...assistant, active: change.active } : assistant));
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());

  function run(work: () => Promise<ActionResult>, successMessage = "Changes saved.") {
    start(async () => {
      const result = await work();
      setMessage(
        result.ok
          ? result.data?.temporaryPassword
            ? `Credentials SMS queued. Temporary password: ${result.data.temporaryPassword}`
            : successMessage
          : (result.error?.message ?? "Unable to save."),
      );
      if (result.ok) router.refresh();
    });
  }

  function requestDelete(assistant: Assistant) {
    setDeleteError(null);
    setAssistantToDelete(assistant);
  }

  function toggle(assistant: Assistant) {
    if (busyIds.has(assistant.id)) return;
    setBusyIds((previous) => new Set(previous).add(assistant.id));
    start(async () => {
      setOptimisticAssistant({ id: assistant.id, active: !assistant.active });
      const result = await setBookingAssistantActive({ userId: assistant.id, active: !assistant.active });
      setBusyIds((previous) => { const next = new Set(previous); next.delete(assistant.id); return next; });
      if (!result.ok) setMessage(result.error.message);
    });
  }

  function remove() {
    if (!assistantToDelete) return;
    start(async () => {
      const result = await deleteBookingAssistant({ userId: assistantToDelete.id });
      if (!result.ok) {
        setDeleteError(result.error.message);
        return;
      }
      setAssistantToDelete(null);
      setMessage("Assistant account deleted.");
      router.refresh();
    });
  }

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
      <section className="overflow-hidden rounded-2xl border border-line bg-surface">
        {optimisticAssistants.length ? optimisticAssistants.map((assistant) => (
          <div key={assistant.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4 last:border-0">
            <div>
              <p className="font-semibold">{assistant.displayName}</p>
              <p className="tabular mt-1 text-sm text-ink-muted">{assistant.phoneE164} · {assistant.active ? "Active" : "Inactive"}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button disabled={pending} onClick={() => run(() => resetBookingAssistantPassword({ userId: assistant.id }))} className="min-h-11 rounded-xl border border-line px-3 text-xs font-semibold">Reset password</button>
              <button disabled={busyIds.has(assistant.id)} onClick={() => toggle(assistant)} className="min-h-11 rounded-xl bg-brand-950 px-3 text-xs font-semibold text-white">{busyIds.has(assistant.id) ? "Saving..." : assistant.active ? "Disable" : "Enable"}</button>
              <button disabled={pending} onClick={() => requestDelete(assistant)} className="min-h-11 rounded-xl border border-danger px-3 text-xs font-semibold text-danger">Delete</button>
            </div>
          </div>
        )) : <p className="p-5 text-sm text-ink-muted">No booking assistants yet.</p>}
      </section>

      <aside className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-h3">Add booking assistant</h2>
        <form className="mt-4 space-y-4" action={(form) => run(() => createBookingAssistant({ displayName: form.get("displayName"), phone: form.get("phone") }))}>
          <label className="block text-sm font-semibold">Name<input name="displayName" required minLength={2} className="mt-2 min-h-11 w-full rounded-xl border border-line px-3" /></label>
          <label className="block text-sm font-semibold">Mobile number<input name="phone" type="tel" required className="mt-2 min-h-11 w-full rounded-xl border border-line px-3" /></label>
          <button disabled={pending} className="min-h-11 rounded-xl bg-brand-950 px-4 text-sm font-semibold text-white">Create account</button>
        </form>
        {message && <p role="status" className="mt-4 break-all rounded-xl bg-brand-50 p-3 text-sm text-brand-950">{message}</p>}
      </aside>
      <ConfirmDialog
        open={Boolean(assistantToDelete)}
        title="Delete assistant account?"
        description={`${assistantToDelete?.displayName ?? "This assistant"} will immediately lose access. Their booking and audit history will be kept.`}
        confirmLabel="Delete account"
        pendingLabel="Deleting..."
        pending={pending}
        error={deleteError}
        destructive
        onCancel={() => { setAssistantToDelete(null); setDeleteError(null); }}
        onConfirm={remove}
      />
    </div>
  );
}
