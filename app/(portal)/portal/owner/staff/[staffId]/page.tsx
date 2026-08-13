import Link from "next/link";
import { getStaffDirectory } from "@/features/staff/queries";
import { getServiceCatalog } from "@/features/services/queries";
import { StaffManager } from "@/components/portal/staff-manager";
import { formatManilaDateTime } from "@/lib/format";

type Props = { params:Promise<{ staffId:string }> };
export const metadata = { title:"Staff details" };
export const instant = false;

export default async function StaffDetailPage({ params }: Props) {
  const { staffId } = await params;
  const [directory, categories] = await Promise.all([getStaffDirectory(), getServiceCatalog()]);
  const staff = directory.find(item => item.id === staffId);
  if (!staff) return <div><h1 className="text-h1">Staff member not found</h1><Link href="/portal/owner/staff" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-brand-800">Return to staff</Link></div>;
  const services = categories.flatMap(category => category.services.map(service => ({ id:service.id, name:service.name, category:{ name:category.name } })));
  return <div>
    <Link href="/portal/owner/staff" className="inline-flex min-h-11 items-center text-sm font-semibold text-ink-muted">← Back to staff</Link>
    <div className="mt-2 flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold text-brand-800">Staff profile</p><h1 className="text-h1 mt-1">{staff.publicName}</h1><p className="tabular mt-2 text-ink-muted">{staff.user.phoneE164}</p></div><span className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${staff.active ? "bg-success-soft text-success" : "bg-surface-muted text-ink-muted"}`}>{staff.active ? "Active" : "Inactive"}</span></div>
    {staff.timeOff.length > 0 && <section className="mt-7 rounded-2xl bg-warning-soft p-5"><h2 className="font-semibold text-warning">Upcoming time off</h2>{staff.timeOff.map(item => <p key={item.id} className="tabular mt-2 text-sm text-ink-muted">{formatManilaDateTime(item.startsAt)} – {formatManilaDateTime(item.endsAt)}{item.reason ? ` · ${item.reason}` : ""}</p>)}</section>}
    <div className="mt-7 max-w-4xl"><StaffManager staffId={staff.id} userId={staff.userId} active={staff.active} services={services} selectedServiceIds={staff.skills.map(skill => skill.serviceId)} rules={staff.scheduleRules} breaks={staff.breaks}/></div>
  </div>;
}
