import { Suspense } from "react";
import { getPublicServices } from "@/features/services/queries";
import { getBusinessSettings } from "@/features/settings/queries";
import { ServicePicker } from "@/components/booking/service-picker";
import { StepHeader } from "@/components/booking/step-header";
import { BookingPageSkeleton } from "@/components/ui/skeletons";

export const metadata = { title: "Choose services" };
async function Services() { const [services,settings] = await Promise.all([getPublicServices(),getBusinessSettings()]); return services.length ? <ServicePicker services={services} depositPercent={settings.depositPercent}/> : <div className="mt-8 rounded-2xl border border-line bg-surface p-6"><h2 className="font-semibold">Services are being prepared</h2><p className="mt-2 text-sm text-ink-muted">Please message Beautyfeel for assistance with your appointment.</p></div>; }
export default function BookPage() { return <main className="mx-auto w-full max-w-[1200px] px-4 py-6 pb-32 sm:px-6 sm:py-9 lg:px-8"><section className="relative overflow-hidden rounded-3xl bg-brand-950 px-5 py-7 text-white sm:px-8 sm:py-9"><div aria-hidden className="absolute -right-10 -top-14 size-48 rounded-full border border-white/10"/><div aria-hidden className="absolute -right-2 top-8 size-24 rounded-full border border-white/10"/><div className="relative max-w-2xl [&_.bg-brand-900]:bg-white [&_.bg-line]:bg-white/20 [&_.text-brand-800]:text-white/65 [&_.text-ink-muted]:text-white/70"><StepHeader step={1} title="What would you like to book?" description="Choose a category, then select one or more services for your visit."/></div></section><Suspense fallback={<BookingPageSkeleton/>}><Services/></Suspense></main>; }
