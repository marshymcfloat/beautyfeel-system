import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getPublicServices } from "@/features/services/queries";
import { formatMoney } from "@/lib/format";

const categoryMedia: Record<string, { src: string; alt: string; tone: string }> = {
  "skin-care-treatments": { src: "/images/service-skin-care.png", alt: "A Filipina client receiving a facial treatment", tone: "bg-[#dfc9bf]" },
  "massage-therapy": { src: "/images/service-massage-spa.png", alt: "A Filipina client receiving a relaxing shoulder massage", tone: "bg-[#d3dccf]" },
  "eyelash-eyebrow-services": { src: "/images/service-lashes-brows.png", alt: "A Filipina client receiving an eyebrow and lash treatment", tone: "bg-[#e5d4bf]" },
  "nail-care": { src: "/images/service-nail-care.png", alt: "A professional manicure treatment in progress", tone: "bg-[#d8c7c1]" },
};

export async function FeaturedServices() {
  const services = await getPublicServices();
  const categories = Array.from(services.reduce((map, service) => {
    const existing = map.get(service.category.id);
    if (existing) existing.services.push(service);
    else map.set(service.category.id, { category: service.category, services: [service] });
    return map;
  }, new Map<string, { category: (typeof services)[number]["category"]; services: typeof services }>()).values()).slice(0, 4);
  if (!categories.length) return <div className="rounded-2xl border border-line bg-surface p-6"><p className="font-semibold">The service menu is being prepared.</p><p className="mt-2 text-sm text-ink-muted">Message Beautyfeel for current treatments and prices.</p></div>;
  return <div className="grid gap-4">{categories.map(({category,services:categoryServices},index) => {
    const media = categoryMedia[category.slug];
    return <article key={category.id} className={`${media?.tone ?? "bg-surface"} group grid overflow-hidden rounded-[1.5rem] md:grid-cols-[minmax(10rem,12rem)_1fr]`}>
      {media && <div className="relative aspect-[16/9] overflow-hidden bg-surface-muted md:aspect-auto md:min-h-[17rem]">
        <Image src={media.src} alt={media.alt} fill sizes="(max-width: 767px) 100vw, 192px" className="object-cover transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.035]" />
        <span className="absolute left-4 top-4 grid size-9 place-items-center rounded-full bg-surface/90 text-[11px] font-semibold tracking-[.1em] text-ink backdrop-blur-sm">0{index+1}</span>
      </div>}
      <div className="flex flex-col p-5 sm:p-6 lg:p-7">
        <div className="flex items-start justify-between gap-5">
          <h3 className="max-w-[16ch] text-[clamp(1.6rem,2.6vw,2.5rem)] font-semibold leading-[.98] tracking-[-.04em]">{category.name}</h3>
          <Link href="/book" aria-label={`Book ${category.name}`} className="grid size-10 shrink-0 place-items-center rounded-full border border-ink/20 text-ink transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:translate-x-1 hover:bg-ink hover:text-white"><ArrowRight size={17}/></Link>
        </div>
        <ul className="mt-5 divide-y divide-ink/12 border-t border-ink/15">
          {categoryServices.slice(0,3).map(service => <li key={service.id} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
            <span className="text-ink-muted">{service.name}</span>
            <span className="tabular shrink-0 font-semibold text-ink">{formatMoney(service.priceCentavos)}</span>
          </li>)}
        </ul>
        <Link href="/services" className="mt-auto pt-4 text-xs font-semibold tracking-[.04em] text-brand-800">See all {category.name.toLowerCase()}</Link>
      </div>
    </article>;
  })}</div>;
}
