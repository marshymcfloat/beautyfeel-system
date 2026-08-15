export const portalCacheTags = {
  assistants: "portal:assistants",
  alerts: "portal:alerts",
  bookingCounts: "portal:booking-counts",
  bookingQueue: "portal:booking-queue",
  bookings: "portal:bookings",
  customers: "portal:customers",
  efficiency: "portal:efficiency",
  payments: "portal:payments",
  schedule: "portal:schedule",
  services: "portal:services",
  settings: "portal:settings",
  staff: "portal:staff",
  trustProfiles: "portal:trust-profiles",
} as const;

export const bookingCacheTag = (bookingId: string) => `portal:booking:${bookingId}`;
export const efficiencyCacheTag = (actorId: string) => `portal:efficiency:${actorId}`;

export const portalSectionTags = {
  alerts: [portalCacheTags.alerts],
  assistants: [portalCacheTags.assistants],
  booking: [portalCacheTags.bookings],
  "booking-counts": [portalCacheTags.bookingCounts],
  "booking-form": [portalCacheTags.services, portalCacheTags.customers],
  bookings: [portalCacheTags.bookings, portalCacheTags.bookingCounts, portalCacheTags.bookingQueue],
  customers: [portalCacheTags.customers],
  efficiency: [portalCacheTags.efficiency],
  payments: [portalCacheTags.payments, portalCacheTags.bookingQueue],
  schedule: [portalCacheTags.schedule],
  services: [portalCacheTags.services],
  settings: [portalCacheTags.settings],
  staff: [portalCacheTags.staff, portalCacheTags.schedule],
  trust: [portalCacheTags.trustProfiles],
} as const;

export type PortalSection = keyof typeof portalSectionTags;

export const portalCacheLife = { stale: 30, revalidate: 30, expire: 60 } as const;

export function tagsForPortalSections(sections: readonly PortalSection[]) {
  return [...new Set(sections.flatMap((section) => portalSectionTags[section]))];
}

export function bookingMutationTags(bookingId?: string) {
  const tags = [
    portalCacheTags.bookings,
    portalCacheTags.bookingCounts,
    portalCacheTags.bookingQueue,
    portalCacheTags.customers,
    portalCacheTags.payments,
    portalCacheTags.schedule,
  ];
  return bookingId ? [...tags, bookingCacheTag(bookingId)] : tags;
}
