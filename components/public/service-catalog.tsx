import Link from "next/link";
import { ArrowRight, Clock } from "@phosphor-icons/react/dist/ssr";
import { getPublicServices } from "@/features/services/queries";
import { formatMoney } from "@/lib/format";

const categoryTone: Record<string,string> = {
  "skin-treatments": "bg-brand-900 text-white",
  "massage-spa": "bg-brand-100 text-brand-950",
  lashes: "bg-[#e8e2d8] text-ink",
  nails: "bg-brand-950 text-white",
};

export async function ServiceCatalog(){
  const services=await getPublicServices();
  const groups=Array.from(services.reduce((map,service)=>{const group=map.get(service.category.id)??{category:service.category,services:[] as typeof services};group.services.push(service);map.set(service.category.id,group);return map},new Map<string,{category:(typeof services)[number]["category"];services:typeof services}>()).values());
  if(!groups.length)return <div className="rounded-2xl border border-line bg-surface p-6"><h2 className="text-h3">The service menu is being prepared</h2><p className="mt-2 leading-6 text-ink-muted">Please message Beautyfeel for available treatments and current prices.</p></div>;
  return <div className="space-y-16">{groups.map(({category,services:items},index)=><section key={category.id} id={category.slug} className="scroll-mt-24"><div className="grid gap-5 border-b border-line pb-6 sm:grid-cols-[180px_1fr] sm:items-end"><div className={`flex aspect-[3/2] flex-col justify-between rounded-2xl p-4 ${categoryTone[category.slug]??"bg-surface-muted text-ink"}`}><span className="tabular text-xs font-semibold opacity-65">0{index+1}</span><span className="text-lg font-semibold">{category.name}</span></div><div><h2 className="text-h1">{category.name}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">Choose a treatment below, then combine it with services from another category if you want more done in one visit.</p></div></div><div className="divide-y divide-line">{items.map(service=><article key={service.id} className="grid gap-4 py-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><h3 className="text-h3">{service.name}</h3>{service.description&&<p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">{service.description}</p>}<p className="mt-3 inline-flex items-center gap-2 text-sm text-ink-muted"><Clock size={17}/><span className="tabular">{service.durationMinutes} minutes</span></p></div><div className="flex items-center justify-between gap-5 sm:flex-col sm:items-end"><p className="tabular text-lg font-semibold text-brand-900">{formatMoney(service.priceCentavos)}</p><Link href="/book" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-800">Book this service <ArrowRight size={16}/></Link></div></article>)}</div></section>)}</div>;
}

