import { getAdminAlerts } from "@/features/notifications/queries";
import { AlertList } from "@/components/portal/alert-list";
export const metadata={title:"Alerts"};
export const instant=false;
export default async function AlertsPage(){const alerts=await getAdminAlerts(100);return <div><p className="text-sm font-semibold text-brand-800">Operations</p><h1 className="text-h1 mt-1">Alerts</h1><p className="mt-3 max-w-xl text-ink-muted">Bookings that still need staffing and notification failures appear here.</p><div className="mt-7"><AlertList alerts={alerts}/></div></div>}
