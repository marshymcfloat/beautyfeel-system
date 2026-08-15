"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { CircleNotch } from "@phosphor-icons/react";
import { requestCustomerCancellation } from "@/app/(booking)/booking/[bookingCode]/actions";

gsap.registerPlugin(useGSAP);

export function CustomerCancellation({ bookingCode }: { bookingCode: string }) {
  const router = useRouter();
  const scope = useRef<HTMLDetailsElement>(null);
  const [pending, start] = useTransition();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  useGSAP(() => {
    if (!error) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(".cancel-error", { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" });
    });
    return () => media.revert();
  }, { dependencies: [error], scope });

  function cancel() {
    setError(null);
    start(async () => {
      const result = await requestCustomerCancellation(bookingCode, reason);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  return <details ref={scope} className="rounded-2xl border border-line bg-surface p-4">
    <summary className="cursor-pointer text-sm font-semibold text-danger">Cancel this appointment</summary>
    <p className="mt-3 text-xs leading-5 text-ink-muted">A verified deposit becomes store credit tied to your mobile number and valid for 12 months.</p>
    <label htmlFor="cancel-reason" className="mt-3 block text-sm font-semibold">Reason</label>
    <textarea id="cancel-reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={3} maxLength={500} className="mt-2 w-full rounded-xl border border-line p-3" />
    {error && <p role="alert" className="cancel-error mt-2 rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
    <button type="button" disabled={pending || reason.trim().length < 3} aria-busy={pending} onClick={cancel} className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-xl border border-danger px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger-soft disabled:opacity-50">
      {pending && <CircleNotch aria-hidden size={17} className="animate-spin" />}
      {pending ? "Cancelling appointment…" : "Confirm cancellation"}
    </button>
    {pending && <p role="status" className="mt-2 text-xs text-ink-muted">Please wait while we confirm the cancellation.</p>}
  </details>;
}
