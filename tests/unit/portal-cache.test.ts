import { describe, expect, it } from "vitest";
import { bookingCacheTag, bookingMutationTags, portalCacheTags, tagsForPortalSections } from "@/lib/cache/portal";

describe("portal cache tags", () => {
  it("maps a section to only its required tags", () => {
    expect(tagsForPortalSections(["schedule"])).toEqual([portalCacheTags.schedule]);
  });

  it("deduplicates tags shared by multiple sections", () => {
    expect(tagsForPortalSections(["bookings", "payments"])).toEqual([
      portalCacheTags.bookings,
      portalCacheTags.bookingCounts,
      portalCacheTags.bookingQueue,
      portalCacheTags.payments,
    ]);
  });

  it("includes global and detail tags after a booking mutation", () => {
    const tags = bookingMutationTags("booking-id");
    expect(tags).toContain(portalCacheTags.schedule);
    expect(tags).toContain(portalCacheTags.payments);
    expect(tags).toContain(bookingCacheTag("booking-id"));
  });
});
