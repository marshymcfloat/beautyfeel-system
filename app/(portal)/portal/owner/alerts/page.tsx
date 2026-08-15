import { Suspense } from "react";
import { connection } from "next/server";
import { getAdminAlerts } from "@/features/notifications/queries";
import { AlertList } from "@/components/portal/alert-list";
import { PortalRowsSkeleton } from "@/components/ui/skeletons";
export const metadata={title:"Alerts"};
export const instant=false;
async function AlertsContent(){await connection();const alerts=await getAdminAlerts(100);return <AlertList alerts={alerts}/>}
export default function AlertsPage(){return <div><p className="text-sm font-semibold text-brand-800">Operations</p><h1 className="text-h1 mt-1">Alerts</h1><p className="mt-3 max-w-xl text-ink-muted">Notification failures and operational issues appear here.</p><div className="mt-7"><Suspense fallback={<PortalRowsSkeleton rows={5}/>}><AlertsContent/></Suspense></div></div>}
