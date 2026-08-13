import Link from "next/link";
import { connection } from "next/server";
import { ArrowLeft, Lightning } from "@phosphor-icons/react/dist/ssr";
import { getPublicServices } from "@/features/services/queries";
import { ManualBookingForm } from "@/components/portal/manual-booking-form";
import { getRecentCustomers } from "@/features/customers/queries";

export const metadata = { title: "New manual booking" };
export const instant = false;

export default async function NewBookingPage() {
  await connection();
  const [services, recentCustomers] = await Promise.all([getPublicServices(), getRecentCustomers()]);
  return (
    <div className="mx-auto w-full max-w-[1180px]">
      <Link href="/portal/owner/bookings" className="inline-flex min-h-11 items-center gap-2 rounded-xl px-1 text-sm font-semibold text-ink-muted transition-colors hover:text-brand-950">
        <ArrowLeft aria-hidden size={17} weight="bold" />Back to bookings
      </Link>
      <header className="mt-2 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold text-brand-800"><Lightning aria-hidden size={15} weight="fill" />Owner quick entry</p>
          <h1 className="text-h1 mt-1 text-balance">Create a booking</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">For phone, Messenger, and walk-in appointments. Complete the workspace and confirm once.</p>
        </div>
        <span className="inline-flex w-fit items-center rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-muted">Live conflict checks enabled</span>
      </header>
      <ManualBookingForm
        services={services}
        recentCustomers={recentCustomers.map((customer) => ({ ...customer, lastBookedAt: customer.lastBookedAt.toISOString() }))}
      />
    </div>
  );
}
