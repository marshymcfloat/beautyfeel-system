"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bank, CalendarBlank, CaretDown, Check, Clock, FloppyDisk, Info, MapPin, MinusCircle, UsersThree } from "@phosphor-icons/react";
import { createBusinessClosure, removeBusinessClosure, setFlexCapacity, updateBusinessHours, updateBusinessSettings } from "@/features/settings/actions";
import { formatManilaDateTime } from "@/lib/format";

type Settings = { gcashNumber: string | null; gcashName: string | null; businessAddress: string | null; businessMapUrl: string | null; depositPercent: number; bookingIntervalMinutes: number; minimumLeadMinutes: number; maximumAdvanceDays: number; holdDurationMinutes: number; verificationSlaMinutes:number; otpTrustDays:number; cancellationCutoffHours:number; rescheduleNoticeHours: number; flexStrictCutoffHours: number };
type Hour = { weekday: number; startMinute: number; endMinute: number };
type Category = { id: string; name: string; available24Hours: boolean; flexCapacity: number };
type Closure = { id: string; startsAt: Date | string; endsAt: Date | string; reason: string | null };
type ActionResult = { ok: boolean; error?: { message: string; details?: Record<string, unknown> } };

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const inputClass = "min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm outline-none transition focus:border-brand-800 focus:ring-2 focus:ring-brand-100";

export function SettingsManager({ settings, hours, categories, closures }: { settings: Settings; hours: Hour[]; categories: Category[]; closures: Closure[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [optimisticCategories, updateOptimisticCategory] = useOptimistic(categories, (state, change: { id: string; capacity: number; available24Hours: boolean }) => state.map((category) => category.id === change.id ? { ...category, flexCapacity: change.capacity, available24Hours: change.available24Hours } : category));
  const [busyCategory, setBusyCategory] = useState<string | null>(null);

  function run(work: () => Promise<ActionResult>) {
    setMessage(null);
    start(async () => {
      const result = await work();
      if (!result.ok) return setMessage({ text: result.error?.message ?? "Unable to save changes.", success: false });
      setMessage({ text: "Changes saved.", success: true });
      router.refresh();
    });
  }

  function saveCapacity(category: Category, form: FormData) {
    if (busyCategory) return;
    const capacity = Number(form.get("capacity"));
    const available24Hours = form.get("available24Hours") === "on";
    setBusyCategory(category.id);
    setMessage(null);
    start(async () => {
      updateOptimisticCategory({ id: category.id, capacity, available24Hours });
      const result = await setFlexCapacity({ categoryId: category.id, capacity, available24Hours });
      setBusyCategory(null);
      setMessage(result.ok ? { text: "Capacity saved.", success: true } : { text: result.error?.message ?? "Unable to save capacity.", success: false });
    });
  }

  return <div className="mt-5 grid items-start gap-3 lg:grid-cols-2">
    <SettingsSection icon={<MapPin size={20} weight="duotone" />} title="Public business information" description="Address and map shown to customers" tone="teal" open>
      <form className="grid gap-4" action={(form) => run(() => updateBusinessSettings({ gcashNumber: settings.gcashNumber, gcashName: settings.gcashName, businessAddress: String(form.get("businessAddress") || "") || null, businessMapUrl: String(form.get("businessMapUrl") || "") || null, depositPercent: settings.depositPercent, bookingIntervalMinutes: settings.bookingIntervalMinutes, minimumLeadMinutes: settings.minimumLeadMinutes, maximumAdvanceDays: settings.maximumAdvanceDays, holdDurationMinutes: settings.holdDurationMinutes, verificationSlaMinutes: settings.verificationSlaMinutes, otpTrustDays: settings.otpTrustDays, cancellationCutoffHours: settings.cancellationCutoffHours, rescheduleNoticeHours: settings.rescheduleNoticeHours, flexStrictCutoffHours: settings.flexStrictCutoffHours }))}>
        <Field label="Complete address"><textarea name="businessAddress" defaultValue={settings.businessAddress ?? ""} required maxLength={300} rows={3} className={`${inputClass} py-3`} placeholder="Building, street, barangay, city, province" /></Field>
        <Field label="Google Maps link (optional)"><input name="businessMapUrl" type="url" defaultValue={settings.businessMapUrl ?? ""} maxLength={500} className={inputClass} placeholder="https://maps.google.com/…" /></Field>
        <Save pending={pending} label="Save public information" />
      </form>
    </SettingsSection>

    <SettingsSection icon={<Bank size={20} weight="duotone" />} title="Payments and booking" description="GCash details and customer booking rules" tone="sand" open>
      <form className="grid gap-4 sm:grid-cols-2" action={(form) => run(() => updateBusinessSettings({ gcashNumber: String(form.get("gcashNumber") || "") || null, gcashName: String(form.get("gcashName") || "") || null, businessAddress: settings.businessAddress, businessMapUrl: settings.businessMapUrl, depositPercent: Number(form.get("depositPercent")), bookingIntervalMinutes: Number(form.get("interval")), minimumLeadMinutes: Number(form.get("lead")), maximumAdvanceDays: Number(form.get("advance")), holdDurationMinutes: Number(form.get("hold")), verificationSlaMinutes:Number(form.get("verificationSla")), otpTrustDays:Number(form.get("otpTrust")), cancellationCutoffHours:Number(form.get("cancelCutoff")), rescheduleNoticeHours: Number(form.get("reschedule")), flexStrictCutoffHours: Number(form.get("cutoff")) }))}>
        <Field label="GCash number"><input name="gcashNumber" defaultValue={settings.gcashNumber ?? ""} className={inputClass} /></Field>
        <Field label="GCash account name"><input name="gcashName" defaultValue={settings.gcashName ?? ""} className={inputClass} /></Field>
        <NumberField name="depositPercent" label="Deposit" suffix="%" value={settings.depositPercent} min={1} max={100} />
        <NumberField name="interval" label="Time interval" suffix="min" value={settings.bookingIntervalMinutes} min={5} max={60} />
        <NumberField name="lead" label="Minimum notice" suffix="min" value={settings.minimumLeadMinutes} min={0} max={1440} />
        <NumberField name="advance" label="Book ahead" suffix="days" value={settings.maximumAdvanceDays} min={1} max={365} />
        <NumberField name="hold" label="Payment hold" suffix="min" value={settings.holdDurationMinutes} min={5} max={240} />
        <NumberField name="verificationSla" label="Payment review target" suffix="min" value={settings.verificationSlaMinutes} min={15} max={240} />
        <NumberField name="otpTrust" label="OTP trusted device" suffix="days" value={settings.otpTrustDays} min={1} max={90} />
        <NumberField name="cancelCutoff" label="Cancellation cutoff" suffix="hrs" value={settings.cancellationCutoffHours} min={0} max={168} />
        <NumberField name="reschedule" label="Reschedule notice" suffix="hrs" value={settings.rescheduleNoticeHours} min={0} max={168} />
        <div className="sm:col-span-2"><NumberField name="cutoff" label="Named-staff cutoff" suffix="hrs" value={settings.flexStrictCutoffHours} min={1} max={336} /></div>
        <div className="sm:col-span-2"><Save pending={pending} /></div>
      </form>
    </SettingsSection>

    <SettingsSection icon={<Clock size={20} weight="duotone" />} title="Business hours" description="Days and times clients can book" tone="blue">
      <form action={(form) => { const rules = days.flatMap((_, index) => form.get(`enabled-${index + 1}`) ? [{ weekday: index + 1, startMinute: toMinute(String(form.get(`start-${index + 1}`))), endMinute: toMinute(String(form.get(`end-${index + 1}`))) }] : []); run(() => updateBusinessHours({ rules })); }}>
        <div className="divide-y divide-line">{days.map((day, index) => { const weekday = index + 1; const rule = hours.find((item) => item.weekday === weekday); return <div key={day} className="grid grid-cols-[1fr_76px_76px] items-center gap-2 py-2.5 sm:grid-cols-[1fr_100px_100px]">
          <label className="flex min-w-0 items-center gap-2 text-xs font-semibold sm:text-sm"><input type="checkbox" name={`enabled-${weekday}`} defaultChecked={Boolean(rule)} className="size-4 shrink-0 accent-[#174e4f]" /><span className="truncate">{day}</span></label>
          <input aria-label={`${day} opens`} name={`start-${weekday}`} type="time" defaultValue={minuteToTime(rule?.startMinute ?? 540)} className="min-h-10 min-w-0 rounded-lg border border-line bg-surface px-1.5 text-xs outline-none focus:border-brand-800 sm:px-2" />
          <input aria-label={`${day} closes`} name={`end-${weekday}`} type="time" defaultValue={minuteToTime(rule?.endMinute ?? 1080)} className="min-h-10 min-w-0 rounded-lg border border-line bg-surface px-1.5 text-xs outline-none focus:border-brand-800 sm:px-2" />
        </div>; })}</div>
        <Save pending={pending} />
      </form>
    </SettingsSection>

    <SettingsSection icon={<UsersThree size={20} weight="duotone" />} title="Category capacity" description="Simultaneous appointments per service category" tone="teal">
      <div className="mb-2 flex gap-2 rounded-xl bg-brand-50 p-3 text-xs leading-5 text-brand-900"><Info className="mt-0.5 shrink-0" size={16} weight="fill" /><p>Set how many customers Beautyfeel can serve at the same time in each category.</p></div>
      <div className="divide-y divide-line">{optimisticCategories.map((category) => <form key={category.id} className="grid grid-cols-[1fr_68px_auto] items-center gap-2 py-3" action={(form) => saveCapacity(category, form)}>
        <div className="min-w-0"><label className="block truncate text-sm font-semibold" htmlFor={`capacity-${category.id}`}>{category.name}</label><label className="mt-1 flex min-h-8 cursor-pointer items-center gap-2 text-xs text-ink-muted"><input name="available24Hours" type="checkbox" defaultChecked={category.available24Hours} className="size-4 accent-[#174e4f]" />Available 24/7</label></div>
        <input id={`capacity-${category.id}`} aria-label={`${category.name} flex capacity`} name="capacity" type="number" min="0" max="20" defaultValue={category.flexCapacity} className={`${inputClass} text-center tabular`} />
        <button disabled={busyCategory===category.id} className="grid size-11 place-items-center rounded-xl border border-line bg-surface text-brand-900 transition hover:bg-brand-50 active:scale-[.98] disabled:opacity-50" aria-label={`Save ${category.name} capacity`}><FloppyDisk size={17} weight="duotone" /></button>
      </form>)}</div>
    </SettingsSection>

    <SettingsSection icon={<CalendarBlank size={20} weight="duotone" />} title="Closures" description="Block holidays and unavailable periods" tone="rose">
      <form className="grid gap-4 sm:grid-cols-2" action={(form) => run(() => createBusinessClosure({ startsAt: new Date(`${form.get("startsAt")}:00+08:00`), endsAt: new Date(`${form.get("endsAt")}:00+08:00`), reason: String(form.get("reason") || "") || null }))}>
        <Field label="Starts"><input name="startsAt" type="datetime-local" required className={inputClass} /></Field>
        <Field label="Ends"><input name="endsAt" type="datetime-local" required className={inputClass} /></Field>
        <div className="sm:col-span-2"><Field label="Reason"><input name="reason" maxLength={250} placeholder="Holiday, maintenance, private event…" className={inputClass} /></Field><Save pending={pending} label="Add closure" /></div>
      </form>
      <div className="mt-5 divide-y divide-line border-t border-line">{closures.map((closure) => <div key={closure.id} className="flex items-start justify-between gap-3 py-3.5"><div className="min-w-0"><p className="tabular text-xs font-semibold leading-5">{formatManilaDateTime(closure.startsAt)} – {formatManilaDateTime(closure.endsAt)}</p>{closure.reason && <p className="mt-0.5 truncate text-xs text-ink-muted">{closure.reason}</p>}</div><button disabled={pending} onClick={() => run(() => removeBusinessClosure({ id: closure.id }))} className="grid size-10 shrink-0 place-items-center rounded-xl bg-danger-soft text-danger transition active:scale-[.98] disabled:opacity-50" aria-label="Remove closure"><MinusCircle size={18} weight="duotone" /></button></div>)}{!closures.length && <div className="flex items-center gap-2 py-4 text-xs text-ink-muted"><Check size={16} className="text-success" weight="bold" /> No upcoming closures</div>}</div>
    </SettingsSection>

    {message && <p role="status" className={`fixed bottom-24 left-1/2 z-20 w-[calc(100%-40px)] max-w-sm -translate-x-1/2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-[0_14px_36px_-20px_rgba(14,52,53,.4)] lg:bottom-6 ${message.success ? "border-success/20 bg-success-soft text-success" : "border-danger/20 bg-danger-soft text-danger"}`}>{message.text}</p>}
  </div>;
}

function SettingsSection({ icon, title, description, tone, open, children }: { icon: React.ReactNode; title: string; description: string; tone: "teal" | "blue" | "sand" | "rose"; open?: boolean; children: React.ReactNode }) {
  const colors = { teal: "bg-brand-100 text-brand-900", blue: "bg-info-soft text-info", sand: "bg-warning-soft text-warning", rose: "bg-danger-soft text-danger" };
  return <details open={open} className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_10px_30px_-22px_rgba(14,52,53,.28)]">
    <summary className="flex min-h-[72px] cursor-pointer list-none items-center gap-3 px-4 py-3.5 marker:hidden [&::-webkit-details-marker]:hidden">
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${colors[tone]}`}>{icon}</span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold tracking-[-.01em]">{title}</span><span className="mt-0.5 block truncate text-xs text-ink-muted">{description}</span></span>
      <CaretDown size={16} weight="bold" className="shrink-0 text-ink-subtle transition-transform duration-200 group-open:rotate-180" />
    </summary>
    <div className="border-t border-line px-4 py-4">{children}</div>
  </details>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1.5"><span className="block text-xs font-semibold text-ink-muted">{label}</span>{children}</label>; }
function NumberField({ name, label, suffix, value, min, max }: { name: string; label: string; suffix: string; value: number; min: number; max: number }) { return <Field label={label}><span className="relative block"><input name={name} type="number" min={min} max={max} defaultValue={value} required className={`${inputClass} tabular pr-12`} /><span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[10px] font-medium text-ink-subtle">{suffix}</span></span></Field>; }
function Save({ pending, label = "Save changes" }: { pending: boolean; label?: string }) { return <button disabled={pending} className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-950 px-4 text-sm font-semibold text-white transition hover:bg-brand-800 active:scale-[.98] disabled:opacity-50"><FloppyDisk size={17} weight="duotone" />{pending ? "Saving…" : label}</button>; }
function minuteToTime(value: number) { return `${Math.floor(value / 60).toString().padStart(2, "0")}:${(value % 60).toString().padStart(2, "0")}`; }
function toMinute(value: string) { const [hours, minutes] = value.split(":").map(Number); return hours * 60 + minutes; }
