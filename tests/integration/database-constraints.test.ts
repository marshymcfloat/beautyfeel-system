import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const databaseUrl = process.env.TEST_DATABASE_URL;
const suite = describe.skipIf(!databaseUrl);
let db: PrismaClient;

suite("PostgreSQL booking constraints", () => {
  const ids = {
    user: randomUUID(), staff: randomUUID(), category: randomUUID(), service: randomUUID(),
    booking1: randomUUID(), booking2: randomUUID(), booking3: randomUUID(), bookingService1: randomUUID(), bookingService2: randomUUID(), bookingService3: randomUUID(), flex: randomUUID(),
  };

  beforeAll(async () => {
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl! }) });
    await db.userProfile.create({ data: { id: ids.user, role: "STAFF", displayName: "Constraint Test", phoneE164: "+639999999999" } });
    await db.staffProfile.create({ data: { id: ids.staff, userId: ids.user, publicName: "Constraint Test" } });
    await db.serviceCategory.create({ data: { id: ids.category, name: "Test", slug: `test-${ids.category}` } });
    await db.service.create({ data: { id: ids.service, categoryId: ids.category, name: "Test", priceCentavos: 10000, durationMinutes: 60 } });
    await db.flexCapacityUnit.create({ data: { id: ids.flex, categoryId: ids.category, unitNumber: 1 } });
    for (const [bookingId, bookingServiceId, code] of [[ids.booking1, ids.bookingService1, "BF-20260809-11111111"], [ids.booking2, ids.bookingService2, "BF-20260809-22222222"], [ids.booking3, ids.bookingService3, "BF-20260809-33333333"]]) {
      await db.booking.create({ data: { id: bookingId, publicCode: code, customerName: "Test", customerPhoneE164: "+639111111111", source: "ONLINE", status: "AWAITING_PAYMENT", subtotalCentavos: 10000, depositCentavos: 2000, requestedStartsAt: new Date("2026-08-10T01:00:00Z"), requestedEndsAt: new Date("2026-08-10T02:00:00Z") } });
      await db.bookingService.create({ data: { id: bookingServiceId, bookingId, serviceId: ids.service, serviceName: "Test", priceCentavos: 10000, durationMinutes: 60, bufferMinutes: 0 } });
    }
  });

  afterAll(async () => {
    if (!db) return;
    await db.booking.deleteMany({ where: { id: { in: [ids.booking1, ids.booking2, ids.booking3] } } });
    await db.flexCapacityUnit.delete({ where: { id: ids.flex } });
    await db.service.delete({ where: { id: ids.service } });
    await db.serviceCategory.delete({ where: { id: ids.category } });
    await db.staffProfile.delete({ where: { id: ids.staff } });
    await db.userProfile.delete({ where: { id: ids.user } });
    await db.$disconnect();
  });

  beforeEach(async () => {
    await db.bookingSegment.deleteMany({ where: { bookingId: { in: [ids.booking1, ids.booking2, ids.booking3] } } });
  });

  it("rejects overlapping active allocations for one staff member", async () => {
    await db.bookingSegment.create({ data: { bookingId: ids.booking1, bookingServiceId: ids.bookingService1, staffId: ids.staff, startsAt: new Date("2026-08-10T01:00:00Z"), endsAt: new Date("2026-08-10T02:00:00Z"), blockedUntil: new Date("2026-08-10T02:10:00Z"), executionOrder: 0 } });
    await expect(db.bookingSegment.create({ data: { bookingId: ids.booking2, bookingServiceId: ids.bookingService2, staffId: ids.staff, startsAt: new Date("2026-08-10T02:00:00Z"), endsAt: new Date("2026-08-10T03:00:00Z"), blockedUntil: new Date("2026-08-10T03:00:00Z"), executionOrder: 0 } })).rejects.toThrow();
  });

  it("rejects overlapping active allocations for one flex unit", async () => {
    await db.bookingSegment.create({ data: { bookingId: ids.booking2, bookingServiceId: ids.bookingService2, flexUnitId: ids.flex, startsAt: new Date("2026-08-11T01:00:00Z"), endsAt: new Date("2026-08-11T02:00:00Z"), blockedUntil: new Date("2026-08-11T02:10:00Z"), executionOrder: 0 } });
    await expect(db.bookingSegment.create({ data: { bookingId: ids.booking3, bookingServiceId: ids.bookingService3, flexUnitId: ids.flex, startsAt: new Date("2026-08-11T02:00:00Z"), endsAt: new Date("2026-08-11T03:00:00Z"), blockedUntil: new Date("2026-08-11T03:00:00Z"), executionOrder: 0 } })).rejects.toThrow();
  });

  it("rejects two active resources for one booking service", async () => {
    await db.bookingSegment.create({ data: { bookingId: ids.booking1, bookingServiceId: ids.bookingService1, staffId: ids.staff, startsAt: new Date("2026-08-12T01:00:00Z"), endsAt: new Date("2026-08-12T02:00:00Z"), blockedUntil: new Date("2026-08-12T02:00:00Z"), executionOrder: 0 } });
    await expect(db.bookingSegment.create({ data: { bookingId: ids.booking1, bookingServiceId: ids.bookingService1, flexUnitId: ids.flex, startsAt: new Date("2026-08-12T01:00:00Z"), endsAt: new Date("2026-08-12T02:00:00Z"), blockedUntil: new Date("2026-08-12T02:00:00Z"), executionOrder: 0 } })).rejects.toThrow();
  });

  it("allows only one winner across 50 simultaneous requests for one resource", async () => {
    const bookingIds = Array.from({ length: 50 }, () => randomUUID());
    const bookingServiceIds = Array.from({ length: 50 }, () => randomUUID());
    try {
      await db.booking.createMany({ data: bookingIds.map((id, index) => ({ id, publicCode: `BF-20260813-${index.toString(16).padStart(8, "0").toUpperCase()}`, customerName: "Load Test", customerPhoneE164: "+639111111111", source: "ONLINE", status: "AWAITING_PAYMENT", subtotalCentavos: 10000, depositCentavos: 2000, requestedStartsAt: new Date("2026-08-13T01:00:00Z"), requestedEndsAt: new Date("2026-08-13T02:00:00Z") })) });
      await db.bookingService.createMany({ data: bookingServiceIds.map((id, index) => ({ id, bookingId: bookingIds[index], serviceId: ids.service, serviceName: "Test", priceCentavos: 10000, durationMinutes: 60, bufferMinutes: 0 })) });
      const results = await Promise.allSettled(bookingIds.map((bookingId, index) => db.bookingSegment.create({ data: { bookingId, bookingServiceId: bookingServiceIds[index], staffId: ids.staff, startsAt: new Date("2026-08-13T01:00:00Z"), endsAt: new Date("2026-08-13T02:00:00Z"), blockedUntil: new Date("2026-08-13T02:00:00Z"), executionOrder: 0 } })));
      expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    } finally {
      await db.booking.deleteMany({ where: { id: { in: bookingIds } } });
    }
  });
});
