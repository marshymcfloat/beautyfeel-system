import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { getPublicServices } from "@/features/services/queries";
import { formatMoney } from "@/lib/format";

export async function FeaturedServices() {
  const services = await getPublicServices();
  const categories = Array.from(services.reduce((map, service) => { if (!map.has(service.category.id)) map.set(service.category.id, { category: service.category, service }); return map; }, new Map<string, { category: (typeof services)[number]["category"]; service: (typeof services)[number] }>()).values()).slice(0, 4);
  if (!categories.length) return <div className="rounded-2xl border border-line bg-surface p-6"><p className="font-semibold">The service menu is being prepared.</p><p className="mt-2 text-sm text-ink-muted">Message Beautyfeel for current treatments and prices.</p></div>;
  return <div className="divide-y divide-line border-y border-line">{categories.map(({category,service},index) => <article key={category.id} className="grid gap-4 py-6 sm:grid-cols-[48px_1fr_auto] sm:items-center"><span className="tabular text-sm font-semibold text-ink-subtle">0{index+1}</span><div><h3 className="text-h3">{category.name}</h3><p className="mt-1 text-sm leading-5 text-ink-muted">{service.name} from <span className="tabular font-semibold text-ink">{formatMoney(service.priceCentavos)}</span></p></div><Link href={`/book`} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl text-sm font-semibold text-brand-800">Choose a service <ArrowRight size={17}/></Link></article>)}</div>;
}
