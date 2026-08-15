import { Suspense } from "react";
import { connection } from "next/server";
import { getServiceCatalog } from "@/features/services/queries";
import { ServiceManager } from "@/components/portal/service-manager";
import { PortalCardsSkeleton } from "@/components/ui/skeletons";
import { SectionRefreshButton } from "@/components/portal/section-refresh-button";
export const metadata={title:"Services"};
export const instant=false;
async function ServicesContent(){await connection();return <ServiceManager categories={await getServiceCatalog()}/>}
export default function ServicesAdminPage(){return <div><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-brand-800">Catalog</p><h1 className="text-h1 mt-1">Services</h1></div><SectionRefreshButton sections={["services"]} label="Refresh services"/></div><p className="mt-3 max-w-xl text-ink-muted">Manage booking prices, treatment time, cleanup buffers, descriptions, and visibility.</p><div className="mt-6"><Suspense fallback={<PortalCardsSkeleton/>}><ServicesContent/></Suspense></div></div>}
