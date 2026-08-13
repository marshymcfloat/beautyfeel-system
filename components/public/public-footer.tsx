import Link from "next/link";
import { ArrowSquareOut, Clock, MapPin } from "@phosphor-icons/react/dist/ssr";
import { BrandMark } from "@/components/brand-mark";
import { getPublicBusinessInfo } from "@/features/settings/queries";
import { formatBusinessHours } from "@/features/settings/public-info";

export async function PublicFooter() {
  const info = await getPublicBusinessInfo();
  const standardHours = formatBusinessHours(info.hours);

  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.25fr_1fr_1fr_0.8fr]">
        <div>
          <BrandMark />
          <p className="mt-4 max-w-sm text-sm leading-6 text-ink-muted">Skin treatments, massage and spa care, lashes, nails, and waxing—reserved with time set aside for you.</p>
        </div>
        <section aria-labelledby="footer-location">
          <h2 id="footer-location" className="flex items-center gap-2 text-sm font-semibold"><MapPin aria-hidden size={17} />Visit</h2>
          {info.address ? <address className="mt-3 text-sm not-italic leading-6 text-ink-muted">{info.address}</address> : <p className="mt-3 text-sm leading-6 text-ink-muted">Beautyfeel, Philippines</p>}
          {info.mapUrl && <a href={info.mapUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-800 hover:text-brand-950">Open in Google Maps <ArrowSquareOut aria-hidden size={15} /></a>}
        </section>
        <section aria-labelledby="footer-hours">
          <h2 id="footer-hours" className="flex items-center gap-2 text-sm font-semibold"><Clock aria-hidden size={17} />Service hours</h2>
          {info.alwaysAvailableCategories.length > 0 && <p className="mt-3 text-sm font-semibold leading-6 text-brand-900">{info.alwaysAvailableCategories.join(" & ")}: 24/7</p>}
          <dl className="mt-2 space-y-1 text-xs text-ink-muted">
            {standardHours.map((group) => <div key={`${group.days}-${group.hours}`} className="flex justify-between gap-3"><dt>{group.days}</dt><dd className="tabular text-right">{group.hours}</dd></div>)}
          </dl>
          <p className="mt-2 text-[11px] leading-4 text-ink-subtle">Standard hours apply to all other services.</p>
        </section>
        <div>
          <h2 className="text-sm font-semibold">Quick links</h2>
          <nav className="mt-2 flex flex-col" aria-label="Footer navigation">
            <Link href="/services" className="flex min-h-11 items-center text-sm text-ink-muted hover:text-brand-900">Services and prices</Link>
            <Link href="/book" className="flex min-h-11 items-center text-sm text-ink-muted hover:text-brand-900">Book an appointment</Link>
            <Link href="/login" className="flex min-h-11 items-center text-sm text-ink-muted hover:text-brand-900">Staff login</Link>
          </nav>
        </div>
      </div>
      <div className="border-t border-line"><div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-5 text-xs text-ink-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6"><p>© Beautyfeel.</p><p>Appointments require a 20% deposit.</p></div></div>
    </footer>
  );
}
