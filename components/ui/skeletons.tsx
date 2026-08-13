export function BookingPageSkeleton() {
  return <div className="mt-6 w-full"><div className="skeleton h-13 w-full rounded-2xl"/><div className="mt-5 flex gap-3 overflow-hidden lg:hidden">{[1,2,3].map(i=><div key={i} className="skeleton h-24 w-32 shrink-0 rounded-2xl"/>)}</div><div className="mt-7 grid gap-8 lg:grid-cols-[250px_1fr]"><div className="skeleton hidden h-96 rounded-2xl lg:block"/><div><div className="skeleton h-8 w-56 rounded-lg"/><div className="mt-5 grid gap-3 md:grid-cols-2">{[1,2,3,4].map(i=><div key={i} className="skeleton h-36 rounded-2xl"/>)}</div></div></div></div>;
}
export function PortalPageSkeleton() {
  return <div className="space-y-6"><div className="skeleton h-10 w-56 rounded-lg"/><div className="grid gap-3 sm:grid-cols-3">{[1,2,3].map(i=><div key={i} className="skeleton h-28 rounded-2xl"/>)}</div><div className="skeleton h-80 rounded-2xl"/></div>;
}
