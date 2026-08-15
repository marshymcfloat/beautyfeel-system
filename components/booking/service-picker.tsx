"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ArrowRight,
  CaretUp,
  Check,
  Clock,
  Drop,
  Eye,
  FlowerLotus,
  Hand,
  Leaf,
  MagnifyingGlass,
  Plus,
  Sparkle,
  Trash,
  X,
  type Icon,
} from "@phosphor-icons/react";
import { formatMoney } from "@/lib/format";
import { calculateDepositCentavos } from "@/features/bookings/money";

gsap.registerPlugin(useGSAP);

type Service = {
  id: string;
  name: string;
  description: string | null;
  priceCentavos: number;
  durationMinutes: number;
  category: { id: string; name: string; slug?: string };
};

type CategoryStyle = {
  Icon: Icon;
  tint: string;
  icon: string;
  shortName: string;
};

function categoryStyle(name: string): CategoryStyle {
  const value = name.toLowerCase();
  if (value.includes("skin")) return { Icon: Drop, tint: "bg-[#e5f0ea]", icon: "text-[#2f6f5f]", shortName: "Skin care" };
  if (value.includes("massage")) return { Icon: FlowerLotus, tint: "bg-[#f5ead8]", icon: "text-[#8a6535]", shortName: "Massage" };
  if (value.includes("eyelash")) return { Icon: Eye, tint: "bg-[#e8eef0]", icon: "text-[#47758a]", shortName: "Lashes" };
  if (value.includes("nail")) return { Icon: Hand, tint: "bg-[#f4e7df]", icon: "text-[#945e4f]", shortName: "Nails" };
  if (value.includes("wax")) return { Icon: Leaf, tint: "bg-[#eef0df]", icon: "text-[#667143]", shortName: "Waxing & body" };
  return { Icon: Sparkle, tint: "bg-brand-50", icon: "text-brand-800", shortName: name };
}

export function ServicePicker({ services, depositPercent }: { services: Service[]; depositPercent: number }) {
  const router = useRouter();
  const grouped = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const item of services) {
      const group = map.get(item.category.name) ?? [];
      group.push(item);
      map.set(item.category.name, group);
    }
    return Array.from(map, ([name, items]) => ({ name, items }));
  }, [services]);

  const [activeCategory, setActiveCategory] = useState(grouped[0]?.name ?? "");
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [limitMessage, setLimitMessage] = useState("");
  const [selectionAnnouncement, setSelectionAnnouncement] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toolbarStuck, setToolbarStuck] = useState(false);
  const toolbarSentinel = useRef<HTMLDivElement>(null);
  const fixedToolbar = useRef<HTMLDivElement>(null);
  const serviceResults = useRef<HTMLElement>(null);
  const selectionDialog = useRef<HTMLDialogElement>(null);
  const selectionSheet = useRef<HTMLElement>(null);
  const selectionTitle = useRef<HTMLHeadingElement>(null);
  const summaryTrigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const sentinel = toolbarSentinel.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(([entry]) => {
      setToolbarStuck(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useGSAP(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.to(fixedToolbar.current, {
      y: toolbarStuck ? 0 : -140,
      autoAlpha: toolbarStuck ? 1 : 0,
      pointerEvents: toolbarStuck ? "auto" : "none",
      duration: reduceMotion ? 0 : 0.32,
      ease: "power3.out",
      overwrite: "auto",
    });
  }, { dependencies: [toolbarStuck], scope: fixedToolbar, revertOnUpdate: true });

  useGSAP(() => {
    const dialog = selectionDialog.current;
    if (!dialog) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduceMotion ? 0 : 0.3;
    if (sheetOpen) {
      gsap.timeline()
        .fromTo("[data-sheet-backdrop]", { autoAlpha: 0 }, { autoAlpha: 1, duration: duration * 0.8, ease: "power2.out" })
        .fromTo(selectionSheet.current, { yPercent: 100 }, { yPercent: 0, duration, ease: "power3.out" }, "<");
    } else if (dialog.open) {
      gsap.timeline({ onComplete: () => { dialog.close(); summaryTrigger.current?.focus(); } })
        .to(selectionSheet.current, { yPercent: 100, duration: duration * 0.85, ease: "power2.in" })
        .to("[data-sheet-backdrop]", { autoAlpha: 0, duration: duration * 0.65, ease: "power1.out" }, "<");
    }
  }, { dependencies: [sheetOpen], scope: selectionDialog, revertOnUpdate: true });

  useEffect(() => {
    if (!sheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [sheetOpen]);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleServices = useMemo(() => {
    if (normalizedQuery) {
      return services.filter((item) => `${item.name} ${item.description ?? ""} ${item.category.name}`.toLowerCase().includes(normalizedQuery));
    }
    return grouped.find((group) => group.name === activeCategory)?.items ?? [];
  }, [activeCategory, grouped, normalizedQuery, services]);

  useGSAP(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    gsap.fromTo(
      "[data-service-card]",
      { y: 10, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.28, stagger: 0.035, ease: "power2.out", clearProps: "transform,opacity,visibility" },
    );
  }, { dependencies: [activeCategory, normalizedQuery], scope: serviceResults, revertOnUpdate: true });

  const selectedServices = services.filter((item) => selected.includes(item.id));
  const total = selectedServices.reduce((sum, item) => sum + item.priceCentavos, 0);
  const duration = selectedServices.reduce((sum, item) => sum + item.durationMinutes, 0);
  const deposit = calculateDepositCentavos(total, depositPercent);

  function openSelectionSheet() {
    const dialog = selectionDialog.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    setSheetOpen(true);
    requestAnimationFrame(() => selectionTitle.current?.focus());
  }

  function closeSelectionSheet() {
    setSheetOpen(false);
  }

  function removeSelectedService(id: string) {
    const next = selected.filter((serviceId) => serviceId !== id);
    setSelected(next);
    if (!next.length) closeSelectionSheet();
  }

  function chooseTime() {
    router.push(`/book/schedule?services=${selected.join(",")}`);
  }

  function toggle(id: string) {
    setSelected((current) => {
      if (current.includes(id)) {
        setLimitMessage("");
        setSelectionAnnouncement("Service removed from your appointment.");
        return current.filter((item) => item !== id);
      }
      if (current.length >= 6) {
        setLimitMessage("You can select up to six services for one appointment.");
        return current;
      }
      setLimitMessage("");
      setSelectionAnnouncement("Service added to your appointment.");
      return [...current, id];
    });
  }

  function chooseCategory(name: string) {
    setActiveCategory(name);
    setQuery("");
  }

  return (
    <div className="mt-6 lg:mt-8">
      <p className="sr-only" aria-live="polite">{selectionAnnouncement}</p>
      <div className="lg:hidden">
        <div className="relative">
          <MagnifyingGlass aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle" size={20} />
          <label htmlFor="service-search-mobile-full" className="sr-only">Search services</label>
          <input
            id="service-search-mobile-full"
            type="search"
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search facial, massage, lashes…"
            className="min-h-13 w-full rounded-2xl border border-line bg-surface pl-12 pr-4 text-base shadow-[0_8px_30px_-24px_rgba(14,52,53,.4)] placeholder:text-ink-subtle"
          />
        </div>

        <div className="scrollbar-none mt-5 w-full snap-x snap-mandatory scroll-smooth overflow-x-auto overscroll-x-contain pb-3">
          <div className="flex w-max gap-3 pr-10" role="group" aria-label="Service categories">
            {grouped.map((category) => {
              const active = category.name === activeCategory && !normalizedQuery;
              const style = categoryStyle(category.name);
              return (
                <button
                  key={category.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => chooseCategory(category.name)}
                  className={`min-h-24 w-32 snap-start snap-always rounded-2xl border p-3 text-left transition duration-200 active:scale-[.98] ${active ? "border-brand-950 bg-brand-950 text-white shadow-[0_12px_28px_-18px_rgba(14,52,53,.7)]" : `border-transparent ${style.tint} text-ink`}`}
                >
                  <span className={`grid size-9 place-items-center rounded-xl ${active ? "bg-white/12 text-white" : `bg-white/70 ${style.icon}`}`}><style.Icon aria-hidden size={20} weight="duotone" /></span>
                  <span className="mt-3 block text-sm font-semibold leading-4">{style.shortName}</span>
                  <span className={`mt-1 block text-xs ${active ? "text-white/65" : "text-ink-muted"}`}>{category.items.length} services</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <div ref={toolbarSentinel} aria-hidden className="h-px lg:hidden" />

      <div ref={fixedToolbar} className="invisible fixed inset-x-0 top-0 z-40 -translate-y-full border-b border-line bg-surface/95 px-4 py-3 opacity-0 shadow-[0_12px_30px_-24px_rgba(14,52,53,.4)] backdrop-blur-xl will-change-transform sm:px-6 lg:hidden">
        <div className="relative mx-auto max-w-2xl">
          <MagnifyingGlass aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle" size={19} />
          <label htmlFor="service-search-mobile-sticky" className="sr-only">Search services</label>
          <input id="service-search-mobile-sticky" type="search" autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search services…" className={`min-h-12 w-full rounded-xl border border-line bg-surface pl-11 text-base placeholder:text-ink-subtle ${selected.length ? "pr-28" : "pr-4"}`} />
          {selected.length > 0 && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-brand-100 px-2 py-1 text-xs font-semibold text-brand-950">{selected.length} selected</span>}
        </div>
        <div className="scrollbar-none mx-auto mt-2 w-full max-w-2xl snap-x snap-mandatory overflow-x-auto overscroll-x-contain">
          <div className="flex w-max gap-2 pr-8" role="group" aria-label="Service categories">
            {grouped.map((category) => {
              const active = category.name === activeCategory && !normalizedQuery;
              const style = categoryStyle(category.name);
              return <button key={category.name} type="button" aria-pressed={active} onClick={() => chooseCategory(category.name)} className={`flex min-h-11 w-auto snap-start snap-always items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold active:scale-[.98] ${active ? "border-brand-950 bg-brand-950 text-white" : `border-transparent ${style.tint} text-ink`}`}><style.Icon aria-hidden size={16} weight="duotone" />{style.shortName}</button>;
            })}
          </div>
        </div>
      </div>

      <div className="relative hidden lg:block">
        <MagnifyingGlass aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle" size={20} />
        <label htmlFor="service-search-desktop" className="sr-only">Search services</label>
        <input
          id="service-search-desktop"
          type="search"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search facial, massage, lashes…"
          className="min-h-13 w-full rounded-2xl border border-line bg-surface pl-12 pr-4 text-base shadow-[0_8px_30px_-24px_rgba(14,52,53,.4)] placeholder:text-ink-subtle"
        />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start">
        <aside className="sticky top-24 hidden rounded-2xl bg-surface p-2 shadow-[0_16px_44px_-34px_rgba(14,52,53,.45)] lg:block">
          <p className="px-3 pb-2 pt-3 text-xs font-semibold text-ink-subtle">Browse categories</p>
          <nav aria-label="Service categories" className="space-y-1">
            {grouped.map((category) => {
              const active = category.name === activeCategory && !normalizedQuery;
              const style = categoryStyle(category.name);
              return <button key={category.name} type="button" onClick={() => chooseCategory(category.name)} aria-current={active ? "true" : undefined} className={`flex min-h-14 w-full items-center gap-3 rounded-xl px-3 text-left transition ${active ? "bg-brand-950 text-white" : "text-ink-muted hover:bg-brand-50 hover:text-ink"}`}><span className={`grid size-9 shrink-0 place-items-center rounded-xl ${active ? "bg-white/12" : style.tint}`}><style.Icon aria-hidden size={19} className={active ? "text-white" : style.icon} weight="duotone" /></span><span className="min-w-0 flex-1 text-sm font-semibold">{style.shortName}</span><span className={`tabular text-xs ${active ? "text-white/60" : "text-ink-subtle"}`}>{category.items.length}</span></button>;
            })}
          </nav>
          <div className="mx-3 my-3 border-t border-line pt-4"><p className="text-xs leading-5 text-ink-muted">Choose up to six services. We will find one continuous appointment time.</p></div>
        </aside>

        <section ref={serviceResults}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-brand-800">{normalizedQuery ? "Search results" : "Now browsing"}</p>
              <h2 className="text-h2 mt-1">{normalizedQuery ? `Results for “${query.trim()}”` : activeCategory}</h2>
            </div>
            <p className="tabular shrink-0 text-sm text-ink-subtle">{visibleServices.length} {visibleServices.length === 1 ? "service" : "services"}</p>
          </div>

          {visibleServices.length ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {visibleServices.map((item) => {
                const active = selected.includes(item.id);
                const style = categoryStyle(item.category.name);
                return (
                  <button
                    data-service-card
                    type="button"
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    aria-pressed={active}
                    className={`group grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border px-4 py-3.5 text-left transition duration-200 active:scale-[.99] ${active ? "border-brand-900 bg-brand-50 shadow-[0_14px_34px_-26px_rgba(14,52,53,.5)]" : "border-line bg-surface hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_14px_34px_-28px_rgba(14,52,53,.45)]"}`}
                  >
                    <span className="min-w-0">
                      {normalizedQuery && <span className="mb-1 block text-xs font-medium text-ink-subtle">{style.shortName}</span>}
                      <span className="block text-[16px] font-semibold leading-5 text-ink">{item.name}</span>
                      {item.description && <span className="mt-1.5 line-clamp-2 block text-sm leading-5 text-ink-muted">{item.description}</span>}
                      <span className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-subtle"><Clock aria-hidden size={14} />About {item.durationMinutes} min</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="tabular text-sm font-semibold text-brand-900">{formatMoney(item.priceCentavos)}</span>
                      <span className={`grid size-9 place-items-center rounded-xl transition-colors ${active ? "bg-brand-900 text-white" : `${style.tint} ${style.icon} group-hover:bg-brand-100 group-hover:text-brand-900`}`}>{active ? <Check aria-hidden size={18} weight="bold" /> : <Plus aria-hidden size={18} weight="bold" />}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-surface p-8 text-center"><MagnifyingGlass aria-hidden className="mx-auto text-ink-subtle" size={28} /><h3 className="mt-4 font-semibold">No matching services</h3><p className="mt-2 text-sm text-ink-muted">Try a shorter search or choose a category.</p></div>
          )}
        </section>
      </div>

      {limitMessage && <div role="alert" className="fixed inset-x-4 bottom-28 z-40 mx-auto max-w-md rounded-xl bg-warning-soft px-4 py-3 text-center text-sm font-semibold text-warning shadow-lg">{limitMessage}</div>}

      {selected.length > 0 && <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 pt-3 shadow-[0_-12px_30px_-26px_rgba(14,52,53,.45)] backdrop-blur-md">
        <div className="mx-auto max-w-[1120px]">
          <div className="flex items-center gap-3 sm:gap-5">
            <button ref={summaryTrigger} type="button" onClick={openSelectionSheet} aria-haspopup="dialog" aria-expanded={sheetOpen} className="group flex min-w-0 flex-1 items-center gap-2.5 rounded-xl py-1 text-left transition-colors hover:bg-brand-50 sm:px-1" aria-label={`Review ${selected.length} selected services`}><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-100 font-semibold text-brand-950">{selected.length}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{`${selectedServices[0].name}${selectedServices.length > 1 ? ` +${selectedServices.length - 1} more` : ""}`}</span><span className="tabular mt-0.5 block truncate text-xs text-ink-muted">{formatMoney(total)} <span aria-hidden>·</span> about {duration} min</span></span><span className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface text-brand-900 transition-transform duration-200 group-hover:-translate-y-0.5"><CaretUp aria-hidden size={17} weight="bold"/></span></button>
            <button onClick={chooseTime} className="inline-flex min-h-13 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 font-semibold text-white transition hover:bg-brand-800 active:scale-[.98] sm:px-6"><span className="hidden sm:inline">Choose a time</span><span className="sm:hidden">Choose time</span><ArrowRight aria-hidden size={18} weight="bold" /></button>
          </div>
        </div>
      </div>}

      <dialog ref={selectionDialog} onCancel={(event) => { event.preventDefault(); closeSelectionSheet(); }} className="fixed inset-0 z-50 m-0 h-[100dvh] max-h-none w-screen max-w-none overflow-hidden bg-transparent p-0 backdrop:bg-transparent">
        <button data-sheet-backdrop type="button" onClick={closeSelectionSheet} aria-label="Close selected services" className="absolute inset-0 bg-brand-950/40"/>
        <section ref={selectionSheet} aria-labelledby="selection-sheet-title" className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[78dvh] max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-surface shadow-[0_-24px_64px_-28px_rgba(14,52,53,.45)]">
          <div className="border-b border-line px-4 pb-4 pt-3 sm:px-6">
            <div aria-hidden className="mx-auto h-1 w-10 rounded-full bg-line-strong"/>
            <div className="mt-4 flex items-start justify-between gap-4"><div><h2 ref={selectionTitle} tabIndex={-1} id="selection-sheet-title" className="text-h2 outline-none">Your selected services</h2><p className="mt-1 text-sm text-ink-muted">Review your visit before choosing a time.</p></div><button type="button" onClick={closeSelectionSheet} aria-label="Close" className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-muted text-ink-muted"><X aria-hidden size={20}/></button></div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6">
            <ul className="divide-y divide-line">{selectedServices.map((item) => <li key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-4"><div><p className="font-semibold">{item.name}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-ink-muted"><Clock aria-hidden size={14}/>About {item.durationMinutes} min</p></div><div className="flex items-center gap-3"><p className="tabular text-sm font-semibold text-brand-900">{formatMoney(item.priceCentavos)}</p><button type="button" onClick={() => removeSelectedService(item.id)} aria-label={`Remove ${item.name}`} className="grid size-11 place-items-center rounded-xl text-danger hover:bg-danger-soft"><Trash aria-hidden size={18}/></button></div></li>)}</ul>
          </div>

          <div className="safe-bottom border-t border-line bg-surface px-4 pt-4 sm:px-6">
            <dl className="space-y-2 text-sm"><div className="flex justify-between gap-4"><dt className="text-ink-muted">{selected.length} {selected.length === 1 ? "service" : "services"} · about {duration} min</dt><dd className="tabular font-semibold">{formatMoney(total)}</dd></div><div className="flex justify-between gap-4"><dt className="text-ink-muted">{depositPercent}% deposit</dt><dd className="tabular font-semibold text-brand-900">{formatMoney(deposit)}</dd></div></dl>
            <div className="mt-4 grid grid-cols-[auto_1fr] gap-3"><button type="button" onClick={() => { setSelected([]); closeSelectionSheet(); }} className="min-h-13 rounded-xl border border-line px-4 font-semibold text-danger">Clear all</button><button type="button" onClick={chooseTime} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-brand-900 px-5 font-semibold text-white">Choose a time<ArrowRight aria-hidden size={18} weight="bold"/></button></div>
            <button type="button" onClick={closeSelectionSheet} className="mt-2 min-h-11 w-full text-sm font-semibold text-ink-muted">Continue choosing services</button>
          </div>
        </section>
      </dialog>
    </div>
  );
}
