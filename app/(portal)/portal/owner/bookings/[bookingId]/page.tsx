import Link from "next/link";
import { Suspense } from "react";
import { DateTime } from "luxon";
import { getOwnerBookingById } from "@/features/bookings/queries";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookingManagement, PaymentDecision } from "@/components/portal/booking-actions";
import { formatManilaDateTime, formatManilaTime, formatMoney } from "@/lib/format";
import { PortalDetailSkeleton } from "@/components/ui/skeletons";

export const metadata = { title: "Booking details" };
export const instant = false;

type Props = { params: Promise<{ bookingId: string }> };

async function BookingDetailContent({ params }: Props) {
  const { bookingId } = await params;
  const booking = await getOwnerBookingById(bookingId);
  const currentStart = DateTime.fromJSDate(booking.requestedStartsAt, { zone: "utc" })
    .setZone("Asia/Manila")
    .toFormat("yyyy-LL-dd'T'HH:mm");

  return (
    <div>
      <Link href="/portal/owner/bookings" className="inline-flex min-h-11 items-center text-sm font-semibold text-ink-muted">
        ← Back to bookings
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="tabular text-sm font-semibold text-brand-800">{booking.publicCode}</p>
          <h1 className="text-h1 mt-1">{booking.customerName}</h1>
          <p className="tabular mt-2 text-ink-muted">{booking.customerPhoneE164}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={booking.status} />
          <StatusBadge status={booking.staffingStatus} />
        </div>
      </div>

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,.8fr)]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-line bg-surface">
            <div className="bg-brand-950 p-5 text-white">
              <p className="text-sm text-white/70">Appointment</p>
              <p className="tabular mt-2 text-xl font-semibold">{formatManilaDateTime(booking.requestedStartsAt)}</p>
            </div>
            <div className="divide-y divide-line px-5">
              {booking.services.map((service) => (
                <div key={service.id} className="flex justify-between gap-4 py-4">
                  <div>
                    <p className="font-semibold">{service.serviceName}</p>
                    <p className="mt-1 text-sm text-ink-muted">{service.durationMinutes} min + {service.bufferMinutes} min cleanup</p>
                  </div>
                  <p className="tabular font-semibold">{formatMoney(service.priceCentavos)}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-line p-5">
              <div className="flex justify-between text-sm"><span className="text-ink-muted">Total</span><span className="tabular font-semibold">{formatMoney(booking.subtotalCentavos)}</span></div>
              <div className="mt-2 flex justify-between text-sm"><span className="text-ink-muted">Deposit</span><span className="tabular font-semibold text-brand-900">{formatMoney(booking.depositCentavos)}</span></div>
            </div>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-h3">Service assignments</h2>
            <div className="mt-4 divide-y divide-line">
              {booking.segments.map((segment) => (
                <div key={segment.id} className="grid gap-1 py-3 sm:grid-cols-[1fr_auto]">
                  <div>
                    <p className="font-semibold">{booking.services.find((item) => item.id === segment.bookingServiceId)?.serviceName ?? "Service"}</p>
                    <p className="tabular text-sm text-ink-muted">{formatManilaTime(segment.startsAt)}–{formatManilaTime(segment.endsAt)}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink-muted">{segment.staff?.publicName ?? `${segment.flexUnit?.category.name} flex unit`}</p>
                </div>
              ))}
            </div>
          </section>

          {booking.status === "CONFIRMED" && (
            <BookingManagement bookingId={booking.id} currentStart={currentStart} />
          )}
        </div>

        <aside className="space-y-6">
          {booking.status === "PENDING_VERIFICATION" && <PaymentDecision bookingId={booking.id} />}

          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-h3">Customer details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-ink-muted">Name</dt><dd className="text-right font-semibold">{booking.customerName}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-muted">Mobile</dt><dd className="tabular text-right font-semibold"><a className="underline decoration-line underline-offset-4" href={`tel:${booking.customerPhoneE164}`}>{booking.customerPhoneE164}</a></dd></div>
              <div className="flex justify-between gap-4"><dt className="text-ink-muted">Booked through</dt><dd className="text-right font-semibold">{booking.source.replaceAll("_", " ").toLowerCase()}</dd></div>
              {booking.gcashSenderName !== "Unknown" && <div className="flex justify-between gap-4"><dt className="text-ink-muted">GCash sender</dt><dd className="text-right font-semibold">{booking.gcashSenderName}</dd></div>}
            </dl>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-h3">Deposit record</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">Status</dt><dd className="font-semibold">{booking.deposit?.status ?? "None"}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Expected</dt><dd className="tabular font-semibold">{formatMoney(booking.deposit?.expectedCentavos ?? booking.depositCentavos)}</dd></div>
              {booking.deposit?.claimedAt && <div className="flex justify-between gap-3"><dt className="text-ink-muted">Claimed</dt><dd className="text-right font-semibold">{formatManilaDateTime(booking.deposit.claimedAt)}</dd></div>}
            </dl>
          </section>

          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-h3">History</h2>
            <ol className="mt-4 space-y-4">
              {booking.statusHistory.map((entry) => (
                <li key={entry.id} className="border-l-2 border-brand-100 pl-3">
                  <p className="text-sm font-semibold">{entry.toStatus.replaceAll("_", " ").toLowerCase()}</p>
                  <p className="tabular mt-1 text-xs text-ink-subtle">{formatManilaDateTime(entry.createdAt)}</p>
                  {entry.reason && <p className="mt-1 text-sm text-ink-muted">{entry.reason}</p>}
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}

export default function BookingDetailPage(props: Props) {
  return <div><p className="text-sm font-semibold text-brand-800">Booking record</p><h1 className="text-h1 mt-1">Booking details</h1><div className="mt-5"><Suspense fallback={<PortalDetailSkeleton/>}><BookingDetailContent params={props.params}/></Suspense></div></div>;
}
