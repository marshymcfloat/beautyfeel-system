"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarBlank,
  Check,
  Clock,
  MagnifyingGlass,
  NotePencil,
  Phone,
  Receipt,
  Sparkle,
  Storefront,
  User,
} from "@phosphor-icons/react";
import { createManualBooking } from "@/features/bookings/actions";
import { filterRecentCustomers, type RecentCustomer } from "@/features/customers/recent";
import { formatMoney } from "@/lib/format";
import { walkInStartsAt } from "@/features/bookings/manual";

type Service = {
  id: string;
  name: string;
  priceCentavos: number;
  durationMinutes: number;
  category: { name: string };
};

export function ManualBookingForm({ services, recentCustomers }: { services: Service[]; recentCustomers: RecentCustomer[] }) {
  const router = useRouter();
  const openedAt = useRef(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [showCustomers, setShowCustomers] = useState(false);
  const [bookingMode, setBookingMode] = useState<"SCHEDULED" | "WALK_IN">("SCHEDULED");

  useEffect(() => { openedAt.current = performance.now(); }, []);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedServices = useMemo(
    () => services.filter((service) => selectedIds.includes(service.id)),
    [selectedIds, services],
  );
  const filteredServices = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return services;
    return services.filter((service) =>
      `${service.name} ${service.category.name}`.toLowerCase().includes(term),
    );
  }, [query, services]);
  const totalCentavos = selectedServices.reduce((sum, service) => sum + service.priceCentavos, 0);
  const totalMinutes = selectedServices.reduce((sum, service) => sum + service.durationMinutes, 0);
  const matchingCustomers = useMemo(
    () => filterRecentCustomers(recentCustomers, customerQuery),
    [customerQuery, recentCustomers],
  );

  function selectCustomer(customer: RecentCustomer) {
    setCustomerName(customer.name);
    setCustomerPhone(customer.phoneE164);
    setCustomerQuery("");
    setShowCustomers(false);
  }

  function toggleService(serviceId: string) {
    setSelectedIds((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId],
    );
  }

  function submit(formData: FormData) {
    setError(null);
    if (!selectedIds.length) {
      setError("Select at least one service.");
      return;
    }

    const date = String(formData.get("date"));
    const time = String(formData.get("time"));
    const startsAt = bookingMode === "WALK_IN" ? walkInStartsAt() : new Date(`${date}T${time}:00+08:00`);
    startTransition(async () => {
      const result = await createManualBooking({
        customerName: formData.get("name"),
        customerPhone: formData.get("phone"),
        serviceIds: selectedIds,
        startsAt,
        source: bookingMode === "WALK_IN" ? "WALK_IN" : formData.get("source"),
        depositStatus: formData.get("depositStatus"),
        entryDurationSeconds: Math.min(86400, Math.max(0, Math.round((performance.now() - openedAt.current) / 1000))),
      });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      router.push(`/portal/owner/bookings/${result.data.bookingId}`);
    });
  }

  return (
    <form action={submit} className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0 space-y-5">
        <Section number="01" title="Customer" description="Who is this appointment for?" icon={<User aria-hidden size={20} weight="duotone" />}>
          {recentCustomers.length > 0 && (
            <div className="relative mb-4">
              <label htmlFor="customer-search" className="mb-2 block text-sm font-semibold">Find a recent customer</label>
              <div className="relative">
                <MagnifyingGlass aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" size={18} />
                <input
                  id="customer-search"
                  value={customerQuery}
                  onChange={(event) => { setCustomerQuery(event.target.value); setShowCustomers(true); }}
                  onFocus={() => setShowCustomers(true)}
                  type="search"
                  autoComplete="off"
                  className={`${inputClass} pl-10`}
                  placeholder="Search name or mobile number"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-controls="recent-customer-results"
                  aria-expanded={showCustomers}
                />
              </div>
              {showCustomers && (
                <div id="recent-customer-results" className="mt-2 overflow-hidden rounded-xl border border-line bg-surface shadow-[0_10px_30px_rgba(23,48,46,.1)]">
                  {matchingCustomers.length ? (
                    <ul className="max-h-64 divide-y divide-line overflow-y-auto" aria-label="Recent customers">
                      {matchingCustomers.map((customer) => (
                        <li key={customer.phoneE164}>
                          <button
                            type="button"
                            onClick={() => selectCustomer(customer)}
                            className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-brand-50 focus-visible:bg-brand-50 focus-visible:outline-none sm:px-4"
                          >
                            <span className="min-w-0"><span className="block truncate text-sm font-semibold">{customer.name}</span><span className="tabular mt-0.5 block text-xs text-ink-muted">{customer.phoneE164}</span></span>
                            <span className="shrink-0 text-[10px] text-ink-subtle">Last booking {new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric" }).format(new Date(customer.lastBookedAt))}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-5 text-center text-sm text-ink-muted">No recent customer matches your search.</p>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input name="name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} autoComplete="name" required minLength={2} maxLength={100} className={inputClass} placeholder="Customer name" />
            </Field>
            <Field label="Mobile number">
              <div className="relative">
                <Phone aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" size={18} />
                <input name="phone" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} type="tel" inputMode="tel" autoComplete="tel" required className={`${inputClass} pl-10`} placeholder="09XX XXX XXXX" />
              </div>
            </Field>
          </div>
        </Section>

        <Section number="02" title="Services" description="Search and add treatments to the visit." icon={<Sparkle aria-hidden size={20} weight="duotone" />}>
          <label className="relative block">
            <span className="sr-only">Search services</span>
            <MagnifyingGlass aria-hidden className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" className={`${inputClass} pl-10`} placeholder="Search by service or category" />
          </label>

          <div className="mt-4 max-h-[390px] overflow-y-auto rounded-xl border border-line" aria-label="Available services">
            {filteredServices.length ? (
              <div className="divide-y divide-line">
                {filteredServices.map((service) => {
                  const selected = selectedIds.includes(service.id);
                  return (
                    <label key={service.id} className={`flex min-h-16 cursor-pointer items-center gap-3 px-3 py-3 transition-colors sm:px-4 ${selected ? "bg-brand-50" : "bg-surface hover:bg-surface-muted/60"}`}>
                      <input type="checkbox" name="serviceId" value={service.id} checked={selected} onChange={() => toggleService(service.id)} className="sr-only" />
                      <span className={`grid size-6 shrink-0 place-items-center rounded-md border transition-colors ${selected ? "border-brand-900 bg-brand-900 text-white" : "border-line-strong bg-surface text-transparent"}`}>
                        <Check aria-hidden size={14} weight="bold" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{service.name}</span>
                        <span className="mt-0.5 block text-xs text-ink-muted">{service.category.name} · {service.durationMinutes} min</span>
                      </span>
                      <span className="tabular shrink-0 text-sm font-semibold text-brand-950">{formatMoney(service.priceCentavos)}</span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-ink-muted">No services match “{query}”.</p>
            )}
          </div>
        </Section>

        <Section number="03" title="Appointment" description="Record when and how the customer booked." icon={<CalendarBlank aria-hidden size={20} weight="duotone" />}>
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-surface-muted p-1" role="group" aria-label="Appointment type">
            <button type="button" onClick={() => setBookingMode("SCHEDULED")} aria-pressed={bookingMode === "SCHEDULED"} className={`min-h-12 cursor-pointer rounded-lg px-3 text-sm font-semibold transition-colors ${bookingMode === "SCHEDULED" ? "bg-surface text-brand-950 shadow-[0_4px_12px_rgba(23,48,46,.08)]" : "text-ink-muted hover:text-ink"}`}><CalendarBlank aria-hidden className="mr-2 inline" size={17} />Scheduled</button>
            <button type="button" onClick={() => setBookingMode("WALK_IN")} aria-pressed={bookingMode === "WALK_IN"} className={`min-h-12 cursor-pointer rounded-lg px-3 text-sm font-semibold transition-colors ${bookingMode === "WALK_IN" ? "bg-brand-950 text-white shadow-[0_4px_12px_rgba(23,48,46,.12)]" : "text-ink-muted hover:text-ink"}`}><Storefront aria-hidden className="mr-2 inline" size={17} />Walk-in now</button>
          </div>
          {bookingMode === "WALK_IN" && <div className="mb-4 rounded-xl border border-brand-100 bg-brand-50 px-4 py-3"><p className="text-sm font-semibold text-brand-950">Starting now</p><p className="mt-1 text-xs leading-5 text-ink-muted">No date or time needed. Current staff and service availability will still be checked.</p></div>}
          <div className="grid gap-4 sm:grid-cols-2">
            {bookingMode === "SCHEDULED" && <><Field label="Date"><input name="date" type="date" required className={inputClass} /></Field><Field label="Start time"><input name="time" type="time" required className={inputClass} /></Field><Field label="Booking source"><select name="source" defaultValue="MESSENGER" className={inputClass}><option value="MESSENGER">Messenger</option><option value="PHONE">Phone</option></select></Field></>}
            <Field label="Deposit status">
              <select name="depositStatus" defaultValue="UNPAID" className={inputClass}>
                <option value="UNPAID">Unpaid</option><option value="VERIFIED">Verified</option><option value="WAIVED">Waived</option>
              </select>
            </Field>
          </div>
        </Section>
      </div>

      <aside className="min-w-0 space-y-4 xl:sticky xl:top-24">
        <section className="overflow-hidden rounded-2xl border border-line bg-surface surface-shadow" aria-labelledby="booking-summary-title">
          <div className="flex items-center justify-between border-b border-line bg-brand-950 px-5 py-4 text-white">
            <div><p className="text-xs font-medium text-white/65">Owner workspace</p><h2 id="booking-summary-title" className="mt-0.5 font-semibold">Booking summary</h2></div>
            <Receipt aria-hidden size={23} weight="duotone" />
          </div>
          <div className="p-5">
            {selectedServices.length ? (
              <ol className="space-y-3">
                {selectedServices.map((service, index) => (
                  <li key={service.id} className="grid grid-cols-[24px_1fr_auto] items-start gap-2 text-sm">
                    <span className="tabular grid size-6 place-items-center rounded-md bg-brand-50 text-[10px] font-semibold text-brand-800">{String(index + 1).padStart(2, "0")}</span>
                    <span className="min-w-0"><span className="block truncate font-medium">{service.name}</span><span className="text-xs text-ink-muted">{service.durationMinutes} min</span></span>
                    <span className="tabular font-semibold">{formatMoney(service.priceCentavos)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="rounded-xl border border-dashed border-line-strong bg-canvas px-4 py-6 text-center">
                <NotePencil aria-hidden className="mx-auto text-ink-subtle" size={24} weight="duotone" />
                <p className="mt-2 text-sm font-medium">No services added</p><p className="mt-1 text-xs text-ink-muted">Select services from the workspace.</p>
              </div>
            )}
            <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between gap-4 text-ink-muted"><dt>Services</dt><dd className="tabular font-medium text-ink">{selectedServices.length}</dd></div>
              <div className="flex justify-between gap-4 text-ink-muted"><dt className="flex items-center gap-1.5"><Clock aria-hidden size={15} />Duration</dt><dd className="tabular font-medium text-ink">{totalMinutes ? `${totalMinutes} min` : "—"}</dd></div>
              <div className="flex items-end justify-between gap-4 pt-2"><dt className="font-semibold">Service total</dt><dd className="tabular text-lg font-semibold text-brand-950">{formatMoney(totalCentavos)}</dd></div>
            </dl>
          </div>
        </section>

        {error && <p role="alert" className="rounded-xl border border-danger/20 bg-danger-soft p-4 text-sm font-medium text-danger">{error}</p>}
        <button disabled={pending} className="min-h-13 w-full cursor-pointer rounded-xl bg-brand-900 px-5 font-semibold text-white transition-colors hover:bg-brand-950 disabled:cursor-not-allowed disabled:opacity-70">
          {pending ? "Checking availability…" : bookingMode === "WALK_IN" ? "Create walk-in booking" : "Create booking"}
        </button>
        <p className="px-1 text-xs leading-5 text-ink-muted">Availability and staff conflicts are checked again before the booking is saved.</p>
      </aside>
    </form>
  );
}

const inputClass = "min-h-12 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink transition-colors placeholder:text-ink-subtle hover:border-line-strong focus:border-brand-900 focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-2"><span className="block text-sm font-semibold">{label}</span>{children}</label>;
}

function Section({ number, title, description, icon, children }: { number: string; title: string; description: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-4 surface-shadow sm:p-5">
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-900">{icon}</span>
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="tabular text-[10px] font-semibold tracking-[.14em] text-brand-800">{number}</span><h2 className="font-semibold">{title}</h2></div><p className="mt-0.5 text-sm text-ink-muted">{description}</p></div>
      </div>
      {children}
    </section>
  );
}
