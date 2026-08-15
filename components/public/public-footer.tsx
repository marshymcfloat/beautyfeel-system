import Link from "next/link";
import { ArrowSquareOut, Clock, MapPin } from "@phosphor-icons/react/dist/ssr";
import { BrandMark } from "@/components/brand-mark";
import { getPublicBusinessInfo } from "@/features/settings/queries";
import { formatBusinessHours } from "@/features/settings/public-info";

export async function PublicFooter() {
  const info = await getPublicBusinessInfo();
  const standardHours = formatBusinessHours(info.hours);

  return <footer className="relative isolate overflow-hidden bg-ink text-white">
    <p aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-10 -z-10 whitespace-nowrap text-center text-[clamp(4.5rem,10.8vw,11rem)] font-semibold leading-none tracking-[-.065em] text-white/[.045]">CARE THAT FEELS PERSONAL</p>
    <div className="mx-auto max-w-[1500px] px-5 pb-16 pt-16 sm:px-8 sm:pb-20 lg:px-12 lg:pb-24 lg:pt-20">
      <div className="grid gap-14 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
        <div>
          <div className="[&_a]:gap-4 [&_a]:text-white [&_img]:!size-28 [&_img]:border-white/20 [&_span]:!text-[1.65rem] sm:[&_img]:!size-32 sm:[&_span]:!text-[1.85rem]"><BrandMark /></div>
          <p className="mt-7 max-w-md text-sm leading-6 text-white/60">Face · Skin · Lashes · Nails · Massage</p>
          <p className="mt-2 max-w-sm text-xs leading-5 text-white/40">Thoughtful treatments with time intentionally reserved for you.</p>
        </div>

        <div className="grid gap-10 border-t border-white/15 pt-8 sm:grid-cols-2 lg:grid-cols-[1fr_1.15fr_.75fr] lg:gap-8">
          <section aria-labelledby="footer-location">
            <FooterHeading id="footer-location" icon={<MapPin aria-hidden size={17} />}>Visit</FooterHeading>
            {info.address ? <address className="mt-5 text-sm not-italic leading-6 text-white/60">{info.address}</address> : <p className="mt-5 text-sm leading-6 text-white/60">Beautyfeel, Philippines</p>}
            {info.mapUrl && <a href={info.mapUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#d9a998] hover:text-white">Open in Google Maps <ArrowSquareOut aria-hidden size={15} /></a>}
          </section>

          <section aria-labelledby="footer-hours">
            <FooterHeading id="footer-hours" icon={<Clock aria-hidden size={17} />}>Service hours</FooterHeading>
            {info.alwaysAvailableCategories.length > 0 && <p className="mt-5 text-sm font-semibold leading-6 text-[#d9a998]">{info.alwaysAvailableCategories.join(" & ")}: 24/7</p>}
            <dl className="mt-3 space-y-1.5 text-xs text-white/60">{standardHours.map(group => <div key={`${group.days}-${group.hours}`} className="flex justify-between gap-3"><dt>{group.days}</dt><dd className="tabular text-right">{group.hours}</dd></div>)}</dl>
            <p className="mt-3 text-[11px] leading-4 text-white/40">Standard hours apply to all other services.</p>
          </section>

          <div>
            <h2 className="text-sm font-semibold">Explore</h2>
            <nav className="mt-3 flex flex-col" aria-label="Footer navigation">
              <Link href="/services" className="flex min-h-11 items-center text-sm text-white/60 transition-colors hover:text-[#d9a998]">Services and prices</Link>
              <Link href="/book" className="flex min-h-11 items-center text-sm text-white/60 transition-colors hover:text-[#d9a998]">Book an appointment</Link>
              <Link href="/login" className="flex min-h-11 items-center text-sm text-white/60 transition-colors hover:text-[#d9a998]">Staff login</Link>
            </nav>
          </div>
        </div>
      </div>
    </div>
    <div className="border-t border-white/15"><div className="mx-auto flex max-w-[1500px] flex-col gap-2 px-5 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><p>© Beautyfeel.</p><p>Appointments require a 20% deposit.</p></div></div>
  </footer>;
}

function FooterHeading({id,icon,children}:{id:string;icon:React.ReactNode;children:React.ReactNode}) {
  return <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full border border-white/20 text-[#d9a998]">{icon}</span><h2 id={id} className="text-sm font-semibold">{children}</h2></div>;
}
