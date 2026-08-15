"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createService, setServiceActive, updateService } from "@/features/services/actions";
import { formatMoney } from "@/lib/format";

type Service = { id:string; categoryId:string; name:string; description:string|null; priceCentavos:number; durationMinutes:number; bufferMinutes:number; active:boolean };
type Category = { id:string; name:string; services:Service[] };

export function ServiceManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [optimisticCategories, setOptimisticService] = useOptimistic(categories, (state, change: { id: string; active: boolean }) => state.map((category) => ({ ...category, services: category.services.map((service) => service.id === change.id ? { ...service, active: change.active } : service) })));
  const [busyServiceId, setBusyServiceId] = useState<string | null>(null);
  function run(work: () => Promise<{ ok:boolean; error?:{ message:string } }>) {
    setMessage(null);
    start(async () => {
      const result = await work();
      setMessage(result.ok ? "Changes saved." : result.error?.message ?? "Unable to save changes.");
      if (result.ok) router.refresh();
    });
  }
  function toggle(service: Service) {
    if (busyServiceId) return;
    setBusyServiceId(service.id);
    setMessage(null);
    start(async () => {
      setOptimisticService({ id: service.id, active: !service.active });
      const result = await setServiceActive({ id: service.id, active: !service.active });
      if (!result.ok) setMessage(result.error.message);
      setBusyServiceId(null);
    });
  }
  return <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
    <div className="space-y-8">{optimisticCategories.map(category => <section key={category.id}>
      <h2 className="text-h2">{category.name}</h2>
      <div className="mt-3 overflow-hidden rounded-2xl border border-line bg-surface">
        {category.services.length ? category.services.map(service => <details key={service.id} className="border-b border-line p-5 last:border-0">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4"><div><p className="font-semibold">{service.name}</p><p className="tabular mt-1 text-sm text-ink-muted">{formatMoney(service.priceCentavos)} · {service.durationMinutes} min</p></div><span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${service.active ? "bg-success-soft text-success" : "bg-surface-muted text-ink-muted"}`}>{service.active ? "Active" : "Inactive"}</span></summary>
          <ServiceForm service={service} categories={categories} pending={pending} onSubmit={data => run(() => updateService(data))}/>
          <button type="button" disabled={busyServiceId===service.id} onClick={() => toggle(service)} className="mt-4 min-h-11 rounded-xl border border-line px-4 text-sm font-semibold text-ink-muted">{busyServiceId===service.id ? "Saving..." : service.active ? "Hide from booking" : "Make active"}</button>
        </details>) : <p className="p-5 text-sm text-ink-muted">No services in this category.</p>}
      </div>
    </section>)}</div>
    <aside><div className="sticky top-24 rounded-2xl border border-line bg-surface p-5"><h2 className="text-h3">Add a service</h2><ServiceForm categories={categories} pending={pending} onSubmit={data => run(() => createService(data))}/>{message && <p role="status" className={`mt-4 rounded-xl p-3 text-sm ${message === "Changes saved." ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}>{message}</p>}</div></aside>
  </div>;
}

function ServiceForm({ service, categories, pending, onSubmit }: { service?:Service; categories:Category[]; pending:boolean; onSubmit:(data:unknown)=>void }) {
  return <form className="mt-5 space-y-4" action={form => onSubmit({
    id: service?.id,
    categoryId: service?.categoryId ?? form.get("categoryId"),
    name: form.get("name"),
    description: String(form.get("description") || "") || null,
    priceCentavos: Math.round(Number(form.get("price")) * 100),
    durationMinutes: Number(form.get("duration")),
    bufferMinutes: Number(form.get("buffer")),
  })}>
    <Field label="Category"><select name="categoryId" defaultValue={service?.categoryId ?? categories[0]?.id} className="min-h-11 w-full rounded-xl border border-line bg-surface px-3" disabled={Boolean(service)}>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></Field>
    <Field label="Service name"><input name="name" defaultValue={service?.name} required minLength={2} className="min-h-11 w-full rounded-xl border border-line px-3"/></Field>
    <Field label="Description"><textarea name="description" defaultValue={service?.description ?? ""} rows={3} maxLength={500} className="w-full rounded-xl border border-line p-3"/></Field>
    <div className="grid grid-cols-3 gap-3"><Field label="Price (₱)"><input name="price" type="number" min="0" step="0.01" defaultValue={service ? service.priceCentavos / 100 : ""} required className="min-h-11 w-full rounded-xl border border-line px-2"/></Field><Field label="Minutes"><input name="duration" type="number" min="5" max="480" step="5" defaultValue={service?.durationMinutes ?? 60} required className="min-h-11 w-full rounded-xl border border-line px-2"/></Field><Field label="Cleanup"><input name="buffer" type="number" min="0" max="120" step="5" defaultValue={service?.bufferMinutes ?? 10} required className="min-h-11 w-full rounded-xl border border-line px-2"/></Field></div>
    <button disabled={pending} className="min-h-11 rounded-xl bg-brand-900 px-5 text-sm font-semibold text-white">{service ? "Save service" : "Add service"}</button>
  </form>;
}

function Field({ label, children }: { label:string; children:React.ReactNode }) {
  return <label className="block space-y-2"><span className="block text-xs font-semibold text-ink-muted">{label}</span>{children}</label>;
}
