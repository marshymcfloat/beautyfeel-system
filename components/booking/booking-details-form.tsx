"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle, Phone, ShieldCheck, User, Wallet } from "@phosphor-icons/react";
import { createBookingHold } from "@/features/bookings/actions";
import { requestBookingOtp, verifyBookingOtp } from "@/features/verification/actions";
import { formatMoney } from "@/lib/format";

type Props = {
  serviceIds: string[]; startsAt: string; subtotalCentavos: number; depositCentavos: number;
  gcashName: string | null; gcashNumber: string | null; holdDurationMinutes: number;
  policyVersion: string;
};

function toE164(value: string) { const entered=value.trim(); return entered.startsWith("+63")?entered:`+63${entered.replace(/^0/,"")}`; }

export function BookingDetailsForm(props: Props) {
  const router=useRouter(); const[pending,startTransition]=useTransition();
  const[phone,setPhone]=useState(""); const[verificationId,setVerificationId]=useState<string|null>(null);
  const[verified,setVerified]=useState(false); const[trustedDevice,setTrustedDevice]=useState(false); const[code,setCode]=useState(""); const[error,setError]=useState<string|null>(null);

  function startVerification(){setError(null);startTransition(async()=>{const result=await requestBookingOtp({phone:toE164(phone)});if(!result.ok){setError(result.error.message);return}setVerificationId(result.data.verificationId);setTrustedDevice(result.data.trusted);if(result.data.trusted)setVerified(true)})}
  function verifyCode(){if(!verificationId)return;setError(null);startTransition(async()=>{const result=await verifyBookingOtp({verificationId,phone:toE164(phone),code});if(!result.ok){setError(result.error.message);return}setVerified(true)})}
  function submit(formData:FormData){if(!verificationId||!verified){setError("Verify your mobile number before booking.");return}setError(null);startTransition(async()=>{const result=await createBookingHold({customerName:formData.get("name"),customerPhone:toE164(phone),gcashSenderName:formData.get("gcashSenderName"),serviceIds:props.serviceIds,startsAt:props.startsAt,verificationId,policyVersion:props.policyVersion,policyAccepted:formData.get("policyAccepted")==="on"});if(!result.ok){setError(result.error.code==="SLOT_UNAVAILABLE"?"That time was just taken. Please choose another available time.":result.error.message);return}router.push(`/booking/access?code=${encodeURIComponent(result.data.bookingCode)}&token=${encodeURIComponent(result.data.guestToken)}`)})}

  return <form action={submit} className="space-y-4">
    <section className="overflow-hidden rounded-2xl border border-line bg-surface"><div className="flex items-start gap-3 border-b border-brand-100 bg-brand-50 px-4 py-4 sm:px-5"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-900 text-white"><User aria-hidden size={17}/></span><div><p className="text-[11px] font-semibold text-brand-800">Contact information</p><h2 className="mt-0.5 text-lg font-semibold">Who is this booking for?</h2></div></div>
      <div className="space-y-4 px-4 py-4 sm:px-5"><p className="text-sm leading-5 text-ink-muted">We use these details only for appointment, payment, and safety updates.</p>
        <div className="space-y-2"><label htmlFor="name" className="text-sm font-semibold">Full name</label><input id="name" name="name" autoComplete="name" required minLength={2} maxLength={100} className="min-h-12 w-full rounded-xl border border-line bg-surface-muted px-4 text-base"/></div>
        <div className="space-y-2"><label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold"><Phone aria-hidden size={16}/>Mobile number</label><div className="flex gap-2"><input id="phone" value={phone} onChange={e=>{setPhone(e.target.value);setVerified(false);setTrustedDevice(false);setVerificationId(null)}} type="tel" inputMode="numeric" autoComplete="tel" required className="tabular min-h-12 min-w-0 flex-1 rounded-xl border border-line bg-surface-muted px-4 text-base" placeholder="0917 123 4567"/><button type="button" disabled={pending||phone.length<10||verified} onClick={startVerification} className="min-h-12 rounded-xl border border-brand-900 px-4 text-sm font-semibold text-brand-900 disabled:opacity-50">{verified?"Verified":"Verify number"}</button></div><p className="text-xs leading-5 text-ink-muted">First-time customers receive an SMS code. This device is remembered for 30 days after verification.</p></div>
        {verificationId&&!verified&&<div className="rounded-xl bg-info-soft p-3"><label htmlFor="otp" className="text-sm font-semibold">Six-digit verification code</label><div className="mt-2 flex gap-2"><input id="otp" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" autoComplete="one-time-code" className="tabular min-h-12 min-w-0 flex-1 rounded-xl border border-line px-4 text-base tracking-[.3em]"/><button type="button" disabled={pending||code.length!==6} onClick={verifyCode} className="min-h-12 rounded-xl bg-brand-900 px-4 text-sm font-semibold text-white disabled:opacity-50">Verify</button></div></div>}
        {verified&&<p role="status" className="flex items-center gap-2 rounded-xl bg-success-soft p-3 text-sm font-semibold text-success"><CheckCircle size={18}/>{trustedDevice?"Previously verified — no SMS code needed":"Mobile number verified"}</p>}
        <div className="space-y-2"><label htmlFor="gcashSenderName" className="text-sm font-semibold">GCash sender name</label><input id="gcashSenderName" name="gcashSenderName" required minLength={2} maxLength={100} className="min-h-12 w-full rounded-xl border border-line bg-surface-muted px-4 text-base" placeholder="Name shown in GCash"/><p className="text-xs text-ink-muted">This helps Beautyfeel match your payment without requiring a screenshot.</p></div>
      </div></section>
    <section className="rounded-2xl border border-[#ead9ad] bg-warning-soft p-4 sm:p-5"><div className="flex items-start gap-3"><Wallet aria-hidden size={20}/><div><p className="text-[11px] font-semibold">Payment after continuing</p><h2 className="font-semibold">20% GCash deposit</h2></div></div><dl className="mt-4 divide-y divide-[#e7d6aa] rounded-xl bg-white/55 px-3"><div className="flex justify-between py-2.5 text-sm"><dt>Service total</dt><dd className="tabular font-medium">{formatMoney(props.subtotalCentavos)}</dd></div><div className="flex justify-between py-2.5 text-sm"><dt className="font-semibold">Deposit amount</dt><dd className="tabular font-semibold">{formatMoney(props.depositCentavos)}</dd></div></dl><p className="mt-3 text-xs leading-5">{props.gcashNumber&&props.gcashName?`Send to ${props.gcashNumber} · ${props.gcashName} after your time is held.`:"Online booking is unavailable until Beautyfeel configures its GCash account."}</p></section>
    <label className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 text-sm leading-5"><input name="policyAccepted" type="checkbox" required className="mt-0.5 size-4 accent-[#174e4f]"/><span>I agree to the 20% deposit policy. Cancellations convert verified deposits to store credit valid for 12 months. Schedule changes must be requested from Beautyfeel.</span><ShieldCheck aria-hidden className="shrink-0" size={18}/></label>
    <p className="text-xs leading-5 text-ink-muted">Your selected time will be held for {props.holdDurationMinutes} minutes. Submitting does not charge you automatically.</p>
    {error&&<div role="alert" className="rounded-xl bg-danger-soft p-4 text-sm font-medium text-danger">{error}</div>}
    <button disabled={pending||!verified||!props.gcashName||!props.gcashNumber} className="flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-6 font-semibold text-white disabled:opacity-50">{pending?"Securing your time…":"Secure this appointment"}{!pending&&<ArrowRight aria-hidden size={18}/>}</button>
  </form>;
}
