import { getServiceCatalog } from "@/features/services/queries";
import { ServiceManager } from "@/components/portal/service-manager";
export const metadata={title:"Services"};
export const instant=false;
export default async function ServicesAdminPage(){const categories=await getServiceCatalog();return <div><p className="text-sm font-semibold text-brand-800">Catalog</p><h1 className="text-h1 mt-1">Services</h1><p className="mt-3 max-w-xl text-ink-muted">Manage booking prices, treatment time, cleanup buffers, descriptions, and visibility.</p><ServiceManager categories={categories}/></div>}
