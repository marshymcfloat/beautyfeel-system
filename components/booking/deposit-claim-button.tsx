"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Check, CircleNotch } from "@phosphor-icons/react";
import { claimBookingDeposit } from "@/app/(booking)/booking/[bookingCode]/actions";

gsap.registerPlugin(useGSAP);

export function DepositClaimButton({ bookingCode }: { bookingCode: string }) {
  const router = useRouter();
  const scope = useRef<HTMLDivElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState("");

  useGSAP(() => {
    if (!error) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(".claim-error", { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: "power2.out" });
    });
    return () => media.revert();
  }, { dependencies: [error], scope });

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await claimBookingDeposit(bookingCode, reference || null);
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      router.refresh();
    });
  }

  return <div ref={scope}>
    <details className="mb-3 rounded-xl bg-white/45 p-3">
      <summary className="cursor-pointer text-xs font-semibold text-[#765f27]">Having trouble matching your payment?</summary>
      <label htmlFor="payment-reference" className="mt-3 block text-xs font-semibold">Optional GCash reference number</label>
      <input id="payment-reference" value={reference} onChange={(event) => setReference(event.target.value)} maxLength={100} autoComplete="off" className="mt-2 min-h-11 w-full rounded-lg border border-[#e7d6aa] bg-white px-3 text-sm" />
    </details>
    <button type="button" disabled={pending} aria-busy={pending} onClick={submit} className="flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-5 font-semibold text-white transition hover:bg-brand-800 active:scale-[.98] disabled:cursor-wait disabled:opacity-70">
      {pending ? <CircleNotch aria-hidden size={18} className="animate-spin" /> : <Check aria-hidden size={17} weight="bold" />}
      {pending ? "Notifying Beautyfeel…" : "I have sent the deposit"}
    </button>
    {pending && <p role="status" className="mt-2 text-center text-xs text-[#765f27]">Please keep this page open while we securely update your booking.</p>}
    {error && <p role="alert" className="claim-error mt-3 rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
  </div>;
}
