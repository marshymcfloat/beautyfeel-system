"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Clock, MagnifyingGlass } from "@phosphor-icons/react";
import { formatMoney } from "@/lib/format";

type Service = {
  id: string;
  name: string;
  description: string | null;
  priceCentavos: number;
  durationMinutes: number;
  bufferMinutes: number;
  category: { id: string; name: string; slug: string };
};

type SortOption = "recommended" | "price-low" | "price-high" | "duration";

export function ServiceExplorer({ services }: { services: Service[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortOption>("recommended");
  const [visibleCount, setVisibleCount] = useState(12);

  const categories = useMemo(() => Array.from(services.reduce((map, service) => {
    const current = map.get(service.category.id);
    if (current) current.count += 1;
    else map.set(service.category.id, { ...service.category, count: 1 });
    return map;
  }, new Map<string, Service["category"] & { count: number }>()).values()), [services]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = services.filter(service =>
      (category === "all" || service.category.id === category) &&
      (!normalizedQuery || `${service.name} ${service.category.name}`.toLowerCase().includes(normalizedQuery))
    );
    if (sort === "price-low") return [...result].sort((a,b) => a.priceCentavos - b.priceCentavos);
    if (sort === "price-high") return [...result].sort((a,b) => b.priceCentavos - a.priceCentavos);
    if (sort === "duration") return [...result].sort((a,b) => a.durationMinutes - b.durationMinutes);
    return result;
  }, [services, category, query, sort]);

  const updateCategory = (value: string) => { setCategory(value); setVisibleCount(12); };

  return <div>
    <div className="grid gap-5 border-y border-line-strong py-5 md:grid-cols-[minmax(16rem,1fr)_auto_auto] md:items-center">
        <label className="relative block border-b border-line-strong md:border-b-0">
          <span className="sr-only">Search treatments</span>
          <MagnifyingGlass aria-hidden size={19} className="absolute left-0 top-1/2 -translate-y-1/2 text-ink-subtle" />
          <input value={query} onChange={event => { setQuery(event.target.value); setVisibleCount(12); }} type="search" placeholder="Search the menu" className="min-h-12 w-full bg-transparent pl-8 pr-4 text-base text-ink outline-none placeholder:text-ink-subtle" />
        </label>
        <label className="flex min-h-12 items-center gap-3 text-sm"><span className="text-ink-subtle">Sort</span>
          <select value={sort} onChange={event => { setSort(event.target.value as SortOption); setVisibleCount(12); }} className="min-w-44 bg-transparent font-semibold text-ink outline-none">
            <option value="recommended">Recommended order</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="duration">Shortest duration</option>
          </select>
        </label>
        <p className="tabular text-sm text-ink-muted md:text-right">{filtered.length} results</p>
    </div>

    <div className="mt-10 grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-14">
      <aside aria-label="Service categories">
        <p className="mb-3 text-xs font-semibold tracking-[.12em] text-ink-subtle">CATEGORIES</p>
        <FilterButton active={category === "all"} onClick={() => updateCategory("all")} count={services.length}>Complete menu</FilterButton>
        {categories.map(item => <FilterButton key={item.id} active={category === item.id} onClick={() => updateCategory(item.id)} count={item.count}>{item.name}</FilterButton>)}
      </aside>

      {filtered.length ? <div>
        <div className="hidden border-b border-line-strong pb-3 text-[11px] font-semibold tracking-[.1em] text-ink-subtle sm:grid sm:grid-cols-[3rem_minmax(0,1fr)_9rem_6rem_6rem_3rem] sm:gap-4"><span>NO.</span><span>TREATMENT</span><span>CATEGORY</span><span>TIME</span><span className="text-right">PRICE</span><span /></div>
        <div className="divide-y divide-line border-b border-line-strong">{filtered.slice(0,visibleCount).map((service,index) => <article key={service.id} className="group grid grid-cols-[2.25rem_minmax(0,1fr)_auto] gap-3 py-5 sm:grid-cols-[3rem_minmax(0,1fr)_9rem_6rem_6rem_3rem] sm:items-center sm:gap-4 sm:py-6">
          <span className="tabular pt-1 text-xs text-ink-subtle sm:pt-0">{String(index+1).padStart(2,"0")}</span>
          <div><h2 className="text-[clamp(1.15rem,1.8vw,1.5rem)] font-semibold leading-tight tracking-[-.02em]">{service.name}</h2>{service.description && <p className="mt-1 max-w-xl text-sm leading-5 text-ink-muted">{service.description}</p>}<p className="mt-2 text-xs text-ink-subtle sm:hidden">{service.category.name} · {service.durationMinutes} min</p></div>
          <Link href="/book" aria-label={`Book ${service.name}`} className="row-span-2 grid size-10 place-items-center self-center border border-line-strong text-brand-800 transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:border-brand-800 hover:bg-brand-800 hover:text-white sm:col-start-6 sm:row-span-1"><ArrowRight size={16}/></Link>
          <span className="hidden text-xs leading-4 text-ink-muted sm:block">{service.category.name}</span>
          <span className="hidden items-center gap-1.5 text-sm text-ink-muted sm:flex"><Clock aria-hidden size={15}/><span className="tabular">{service.durationMinutes}m</span></span>
          <span className="tabular col-start-2 text-sm font-semibold text-brand-800 sm:col-start-5 sm:text-right">{formatMoney(service.priceCentavos)}</span>
        </article>)}</div>
        {visibleCount < filtered.length && <button type="button" onClick={() => setVisibleCount(count => count + 12)} className="mt-7 min-h-11 border-b border-ink font-semibold text-ink">Show the next 12 treatments</button>}
      </div> : <div className="border-y border-line-strong py-12"><h2 className="text-h2">No treatments found</h2><p className="mt-2 text-ink-muted">Try another search or service category.</p><button type="button" onClick={() => { setQuery(""); updateCategory("all"); }} className="mt-5 min-h-11 border-b border-ink font-semibold text-ink">Clear filters</button></div>}
    </div>
  </div>;
}

function FilterButton({active,onClick,count,children}:{active:boolean;onClick:()=>void;count:number;children:React.ReactNode}) {
  return <button type="button" onClick={onClick} className={`flex min-h-12 w-full items-center justify-between gap-4 border-b px-1 text-left text-sm transition-colors ${active ? "border-brand-800 font-semibold text-brand-800" : "border-line text-ink-muted hover:text-ink"}`}><span>{children}</span><span className="tabular text-xs opacity-60">{count}</span></button>;
}
