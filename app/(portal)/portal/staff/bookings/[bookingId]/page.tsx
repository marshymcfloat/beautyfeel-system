import Link from "next/link";
import { StaffBookingActions } from "@/components/portal/staff-booking-actions";
import { getAssignedStaffBooking } from "@/features/bookings/queries";
import { formatManilaDateTime, formatManilaTime } from "@/lib/format";

export const metadata = { title: "Appointment details" };
export const instant = false;
type Props = { params: Promise<{ bookingId: string }> };

export default async function StaffBookingDetailPage({ params }: Props) {
  const { bookingId } = await params;
  const booking = await getAssignedStaffBooking(bookingId);
  const canFinish = booking.requestedStartsAt <= new Date();

  return <div className="max-w-4xl">
    <Link href="/portal/staff/today" className="inline-flex min-h-11 items-center text-sm font-semibold text-ink-muted">← Back to today</Link>
    <div className="mt-2">
      <p className="tabular text-sm font-semibold text-brand-800">{booking.publicCode}</p>
      <h1 className="text-h1 mt-1">{booking.customerName}</h1>
      <a href={`tel:${booking.customerPhoneE164}`} className="tabular mt-2 inline-flex min-h-11 items-center font-semibold text-brand-900">{booking.customerPhoneE164}</a>
    </div>
    <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,.7fr)]">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="bg-brand-950 p-5 text-white"><p className="text-sm text-white/65">Appointment</p><p className="tabular mt-2 text-xl font-semibold">{formatManilaDateTime(booking.requestedStartsAt)}</p></div>
          <div className="divide-y divide-line px-5">{booking.services.map(service=><div key={service.id} className="py-4"><p className="font-semibold">{service.serviceName}</p><p className="mt-1 text-sm text-ink-muted">{service.durationMinutes} minutes</p></div>)}</div>
        </section>
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-h3">Your assigned services</h2><p className="mt-2 text-sm leading-5 text-ink-muted">You are responsible only for the services listed below.</p>
          <div className="mt-4 divide-y divide-line">{booking.segments.map(segment=>{const service=booking.services.find(item=>item.id===segment.bookingServiceId);return <div key={segment.id} className="flex justify-between gap-4 py-4"><p className="font-semibold">{service?.serviceName??"Service"}</p><p className="tabular text-sm font-semibold text-ink-muted">{formatManilaTime(segment.startsAt)}–{formatManilaTime(segment.endsAt)}</p></div>})}</div>
        </section>
      </div>
      <aside>{canFinish?<StaffBookingActions bookingId={booking.id}/>:<section className="rounded-2xl border border-line bg-surface p-5"><h2 className="text-h3">Appointment actions</h2><p className="mt-2 text-sm leading-5 text-ink-muted">Complete and no-show actions become available when the appointment starts.</p></section>}</aside>
    </div>
  </div>;
}
