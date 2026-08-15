export function BookingPageSkeleton() {
  return <div className="mt-6 w-full"><div className="skeleton h-13 w-full rounded-2xl"/><div className="mt-5 flex gap-3 overflow-hidden lg:hidden">{[1,2,3].map(i=><div key={i} className="skeleton h-24 w-32 shrink-0 rounded-2xl"/>)}</div><div className="mt-7 grid gap-8 lg:grid-cols-[250px_1fr]"><div className="skeleton hidden h-96 rounded-2xl lg:block"/><div><div className="skeleton h-8 w-56 rounded-lg"/><div className="mt-5 grid gap-3 md:grid-cols-2">{[1,2,3,4].map(i=><div key={i} className="skeleton h-36 rounded-2xl"/>)}</div></div></div></div>;
}
export function PortalPageSkeleton() {
  return <div className="space-y-6"><div className="skeleton h-10 w-56 rounded-lg"/><div className="grid gap-3 sm:grid-cols-3">{[1,2,3].map(i=><div key={i} className="skeleton h-28 rounded-2xl"/>)}</div><div className="skeleton h-80 rounded-2xl"/></div>;
}

export function PortalRowsSkeleton({ rows = 4 }: { rows?: number }) {
  return <div aria-label="Loading content" className="overflow-hidden rounded-2xl border border-line bg-surface">{Array.from({ length: rows }, (_, index) => <div key={index} className="flex min-h-20 items-center gap-4 border-b border-line p-4 last:border-0"><div className="min-w-0 flex-1"><div className="skeleton h-4 w-36 rounded"/><div className="skeleton mt-2 h-3 w-56 max-w-full rounded"/></div><div className="skeleton size-11 rounded-xl"/></div>)}</div>;
}

export function PortalFormSkeleton() {
  return <div aria-label="Loading form" className="grid gap-5 lg:grid-cols-2"><div className="rounded-2xl border border-line bg-surface p-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="skeleton mb-4 h-12 rounded-xl"/> )}</div><div className="skeleton min-h-80 rounded-2xl"/></div>;
}

export function PortalDetailSkeleton() {
  return <div aria-label="Loading details" className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,.8fr)]"><div className="space-y-5"><div className="skeleton h-72 rounded-2xl"/><div className="skeleton h-44 rounded-2xl"/></div><div className="space-y-5"><div className="skeleton h-40 rounded-2xl"/><div className="skeleton h-48 rounded-2xl"/></div></div>;
}

export function PortalCardsSkeleton({ count = 4 }: { count?: number }) {
  return <div aria-label="Loading sections" className="grid gap-3 lg:grid-cols-2">{Array.from({ length: count }, (_, index) => <div key={index} className="skeleton h-48 rounded-2xl"/>)}</div>;
}
