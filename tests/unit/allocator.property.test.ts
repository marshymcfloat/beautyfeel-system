import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { allocateServices } from "@/features/availability/allocator";

describe("allocator properties", () => {
  it("never overlaps segments assigned to the same resource", () => {
    fc.assert(fc.property(
      fc.array(fc.record({ durationMinutes: fc.integer({ min: 1, max: 12 }).map((n) => n * 5), bufferMinutes: fc.integer({ min: 0, max: 4 }).map((n) => n * 5) }), { minLength: 1, maxLength: 6 }),
      (values) => {
        const start = new Date("2026-08-10T00:00:00.000Z");
        const end = new Date("2026-08-10T12:00:00.000Z");
        const resources = ["a", "b"].map((id) => ({ id: `staff:${id}`, kind: "NAMED_STAFF" as const, staffId: id, flexUnitId: null, working: [{ start, end }], busy: [], workloadMinutes: 0 }));
        const services = values.map((value, index) => ({ id: `service-${index}`, ...value, qualifiedResourceIds: resources.map((resource) => resource.id) }));
        const plan = allocateServices(start, services, resources);
        if (!plan) return;
        for (const resource of resources) {
          const segments = plan.segments.filter((segment) => segment.resourceId === resource.id).sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
          for (let index = 1; index < segments.length; index += 1) expect(segments[index - 1].blockedUntil <= segments[index].startsAt).toBe(true);
        }
        expect(plan.segments.every((segment, index) => index === 0 || plan.segments[index - 1].endsAt.getTime() === segment.startsAt.getTime())).toBe(true);
      },
    ), { numRuns: 100 });
  });
});
