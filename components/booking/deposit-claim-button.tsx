"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "@phosphor-icons/react";
import { claimBookingDeposit } from "@/app/(booking)/booking/[bookingCode]/actions";

export function DepositClaimButton({ bookingCode }: { bookingCode: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState("");

  return <div><details className="mb-3 rounded-xl bg-white/45 p-3"><summary className="cursor-pointer text-xs font-semibold text-[#765f27]">Having trouble matching your payment?</summary><label htmlFor="payment-reference" className="mt-3 block text-xs font-semibold">Optional GCash reference number</label><input id="payment-reference" value={reference} onChange={event=>setReference(event.target.value)} maxLength={100} className="mt-2 min-h-11 w-full rounded-lg border border-[#e7d6aa] bg-white px-3 text-sm"/></details><button disabled={pending} onClick={() => startTransition(async () => {
    const result = await claimBookingDeposit(bookingCode,reference||null);
    if (!result.ok) { setError(result.error.message); return; }
    router.refresh();
  })} className="flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-5 font-semibold text-white transition hover:bg-brand-800 active:scale-[.98] disabled:opacity-70">{!pending&&<Check aria-hidden size={17} weight="bold"/>}{pending ? "Updating…" : "I have sent the deposit"}</button>{error&&<p role="alert" className="mt-3 rounded-xl bg-danger-soft p-3 text-sm text-danger">{error}</p>}</div>;
}
