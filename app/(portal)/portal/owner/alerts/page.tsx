import { Suspense } from "react";
import { connection } from "next/server";
import { getAdminAlerts } from "@/features/notifications/queries";
import { AlertList } from "@/components/portal/alert-list";
import { PortalRowsSkeleton } from "@/components/ui/skeletons";
import { SectionRefreshButton } from "@/components/portal/section-refresh-button";
export const metadata={title:"Alerts"};
export const instant=false;
async function AlertsContent(){await connection();const alerts=await getAdminAlerts(100);return <AlertList alerts={alerts}/>}
export default function AlertsPage(){return <div><div className="flex items-end justify-between gap-3"><div><p className="text-sm font-semibold text-brand-800">Operations</p><h1 className="text-h1 mt-1">Alerts</h1></div><SectionRefreshButton sections={["alerts"]} label="Refresh alerts" /></div><p className="mt-3 max-w-xl text-ink-muted">Notification failures and operational issues appear here.</p><div className="mt-7"><Suspense fallback={<PortalRowsSkeleton rows={5}/>}><AlertsContent/></Suspense></div></div>}
