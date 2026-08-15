import "server-only";
import { z } from "zod";
import { cacheLife, cacheTag } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { DomainError } from "@/lib/errors/domain-error";
import { hashGuestToken, verifySecret } from "@/lib/security/tokens";
import { bookingCacheTag, portalCacheLife, portalCacheTags } from "@/lib/cache/portal";

const rangeSchema = z.object({ startsAt: z.coerce.date(), endsAt: z.coerce.date() }).refine((value) => value.endsAt > value.startsAt);

export async function getOwnerBookingQueue(input: unknown = {}) {
  await requireActor(["OWNER"]);
  const filters = z.object({ status: z.enum(["AWAITING_PAYMENT", "PENDING_VERIFICATION"]).optional(), take: z.number().int().min(1).max(100).default(50) }).parse(input);
  return loadOwnerBookingQueue(filters.status ?? null, filters.take);
}
async function loadOwnerBookingQueue(status: "AWAITING_PAYMENT" | "PENDING_VERIFICATION" | null, take: number) {
  "use cache";
  cacheLife(portalCacheLife);
  cacheTag(portalCacheTags.bookingQueue, portalCacheTags.bookings);
  return prisma.booking.findMany({
    where: { status: status ?? { in: ["AWAITING_PAYMENT", "PENDING_VERIFICATION"] } },
    include: { deposit: true, services: true },
    orderBy: { createdAt: "asc" },
    take,
  });
}

export async function getOwnerPayments(input: unknown = {}) {
  await requireActor(["OWNER"]);
  const filters=z.object({group:z.enum(["new","overdue","approved","rejected"]).default("new"),search:z.string().trim().max(100).default("")}).parse(input);
  return loadOwnerPayments(filters.group, filters.search);
}
async function loadOwnerPayments(group:"new"|"overdue"|"approved"|"rejected",searchText:string){
  "use cache";cacheLife(portalCacheLife);cacheTag(portalCacheTags.payments);
  const status=group==="approved"?"VERIFIED":group==="rejected"?"REJECTED":"CLAIMED";
  const timing=group==="overdue"?{verificationDueAt:{lte:new Date()}}:group==="new"?{OR:[{verificationDueAt:null},{verificationDueAt:{gt:new Date()}}]}:{};
  const search=searchText?{OR:[{paymentReference:{contains:searchText,mode:"insensitive" as const}},{senderName:{contains:searchText,mode:"insensitive" as const}},{booking:{OR:[{publicCode:{contains:searchText,mode:"insensitive" as const}},{customerName:{contains:searchText,mode:"insensitive" as const}},{customerPhoneE164:{contains:searchText}},{gcashSenderName:{contains:searchText,mode:"insensitive" as const}}]}}]}:{};
  return prisma.deposit.findMany({where:{status,...timing,...search},include:{booking:{include:{services:true}}},orderBy:{claimedAt:"desc"},take:100});
}

const ownerBookingViewSchema = z.enum(["requests", "confirmed", "history"]);
type OwnerBookingView = z.infer<typeof ownerBookingViewSchema>;

async function loadOwnerBookingCounts() {
  "use cache";
  cacheLife(portalCacheLife);
  cacheTag(portalCacheTags.bookingCounts);
  const grouped = await prisma.booking.groupBy({ by: ["status"], _count: { _all: true } });
  const statusCounts = new Map(grouped.map((entry) => [entry.status, entry._count._all]));
  return {
    requests: (statusCounts.get("AWAITING_PAYMENT") ?? 0) + (statusCounts.get("PENDING_VERIFICATION") ?? 0),
    confirmed: statusCounts.get("CONFIRMED") ?? 0,
    history: (statusCounts.get("COMPLETED") ?? 0) + (statusCounts.get("NO_SHOW") ?? 0) + (statusCounts.get("CANCELLED") ?? 0) + (statusCounts.get("REJECTED") ?? 0) + (statusCounts.get("EXPIRED") ?? 0),
  };
}

async function loadOwnerBookings(view: OwnerBookingView, take: number) {
  "use cache";
  cacheLife(portalCacheLife);
  cacheTag(portalCacheTags.bookings);
  const where: Prisma.BookingWhereInput = view === "requests"
    ? { status: { in: ["AWAITING_PAYMENT", "PENDING_VERIFICATION"] } }
    : view === "confirmed"
      ? { status: "CONFIRMED" }
      : { status: { in: ["COMPLETED", "NO_SHOW", "CANCELLED", "REJECTED", "EXPIRED"] } };

  return prisma.booking.findMany({
    where,
    include: {
      deposit: true,
      services: true,
      segments: {
        where: { allocationState: "ACTIVE" },
        include: { staff: { select: { publicName: true } }, flexUnit: { select: { category: { select: { name: true } } } } },
        orderBy: { executionOrder: "asc" },
      },
    },
    orderBy: { requestedStartsAt: view === "history" ? "desc" : "asc" },
    take,
  });
}

export async function getOwnerBookingCounts() {
  await requireActor(["OWNER"]);
  return loadOwnerBookingCounts();
}

export async function getOwnerBookingsByView(input: unknown) {
  await requireActor(["OWNER"]);
  const filters = z.object({ view: ownerBookingViewSchema, take: z.number().int().min(1).max(200).default(100) }).parse(input);
  return loadOwnerBookings(filters.view, filters.take);
}

export async function getOwnerBookingsIndex(input: unknown = {}) {
  await requireActor(["OWNER"]);
  const filters = z.object({ view: ownerBookingViewSchema.optional(), take: z.number().int().min(1).max(200).default(100) }).parse(input);
  const counts = await loadOwnerBookingCounts();
  const view = filters.view ?? (counts.requests > 0 ? "requests" : "confirmed");
  const items = await loadOwnerBookings(view, filters.take);

  return { view, counts, items };
}

export async function getDashboardSchedule(input: unknown) {
  await requireActor(["OWNER", "BOOKING_ASSISTANT"]);
  const range = rangeSchema.parse(input);
  return loadDashboardSchedule(range.startsAt.toISOString(), range.endsAt.toISOString());
}
async function loadDashboardSchedule(startsAt: string, endsAt: string) {
  "use cache";
  cacheLife(portalCacheLife);
  cacheTag(portalCacheTags.schedule);
  return prisma.booking.findMany({
    where: { status: "CONFIRMED", requestedStartsAt: { lt: new Date(endsAt) }, requestedEndsAt: { gt: new Date(startsAt) } },
    include: { services: true, segments: { where: { allocationState: "ACTIVE" }, include: { staff: { select: { id: true, publicName: true } }, flexUnit: { select: { id: true, unitNumber: true, category: { select: { id: true, name: true } } } } }, orderBy: { executionOrder: "asc" } } },
    orderBy: { requestedStartsAt: "asc" },
    take: 500,
  });
}

export async function getStaffSchedule(userId: string, input: unknown) {
  const actor = await requireActor(["OWNER", "STAFF"]);
  if (actor.role === "STAFF" && actor.id !== userId) throw new DomainError("FORBIDDEN", "You do not have permission.");
  const range = rangeSchema.parse(input);
  return prisma.booking.findMany({
    where: { status: "CONFIRMED", segments: { some: { staff: { userId }, allocationState: "ACTIVE", startsAt: { lt: range.endsAt }, endsAt: { gt: range.startsAt } } } },
    include: { services: true, segments: { where: { staff: { userId }, allocationState: "ACTIVE" }, orderBy: { executionOrder: "asc" } } },
    orderBy: { requestedStartsAt: "asc" },
    take: 200,
  });
}

export async function getGuestBooking(bookingCode: string, guestToken: string) {
  const booking = await prisma.booking.findUnique({
    where: { publicCode: bookingCode },
    select: {
      publicCode: true,
      status: true,
      subtotalCentavos: true,
      depositCentavos: true,
      requestedStartsAt: true,
      requestedEndsAt: true,
      holdExpiresAt: true,
      gcashSenderName: true,
      guestTokenHash: true,
      services: { select: { id: true, serviceName: true, priceCentavos: true, durationMinutes: true }, orderBy: { id: "asc" } },
      deposit: { select: { status: true, expectedCentavos: true, claimedAt: true, verifiedAt: true, verificationDueAt: true, overdueAt: true, paymentReference: true, customerNote: true } },
    },
  });
  if (!booking?.guestTokenHash || !verifySecret(hashGuestToken(guestToken), booking.guestTokenHash)) {
    throw new DomainError("NOT_FOUND", "Booking not found.");
  }
  const { guestTokenHash: _secret, ...safeBooking } = booking;
  void _secret;
  return safeBooking;
}

export async function getOwnerBookingById(bookingId: string) {
  await requireActor(["OWNER"]);
  const id = z.string().uuid().parse(bookingId);
  return loadOwnerBookingById(id);
}
async function loadOwnerBookingById(id: string) {
  "use cache";
  cacheLife(portalCacheLife);
  cacheTag(portalCacheTags.bookings, bookingCacheTag(id));
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      deposit: true,
      services: true,
      segments: { where: { allocationState: "ACTIVE" }, include: { staff: { select: { id: true, publicName: true } }, flexUnit: { select: { unitNumber: true, category: { select: { name: true } } } } }, orderBy: { executionOrder: "asc" } },
      statusHistory: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!booking) throw new DomainError("NOT_FOUND", "Booking not found.");
  return booking;
}

export async function getAssistantBookingById(bookingId: string) {
  await requireActor(["BOOKING_ASSISTANT"]);
  const id = z.string().uuid().parse(bookingId);
  return loadAssistantBookingById(id);
}
async function loadAssistantBookingById(id: string) {
  "use cache";
  cacheLife(portalCacheLife);
  cacheTag(portalCacheTags.bookings, bookingCacheTag(id));
  const booking = await prisma.booking.findUnique({
    where: { id },
    select: { id: true, publicCode: true, customerName: true, customerPhoneE164: true, source: true, status: true, requestedStartsAt: true, requestedEndsAt: true, subtotalCentavos: true, depositCentavos: true, deposit: { select: { status: true } }, services: { select: { id: true, serviceName: true, durationMinutes: true, priceCentavos: true } }, statusHistory: { select: { id: true, toStatus: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 10 } },
  });
  if (!booking) throw new DomainError("NOT_FOUND", "Booking not found.");
  return booking;
}

export async function getAssignedStaffBooking(bookingId: string) {
  const actor = await requireActor(["STAFF"]);
  if (!actor.staffId) throw new DomainError("FORBIDDEN", "Staff profile not found.");
  const id = z.string().uuid().parse(bookingId);
  const booking = await prisma.booking.findFirst({
    where: { id, status: "CONFIRMED", segments: { some: { staffId: actor.staffId, allocationState: "ACTIVE" } } },
    include: {
      services: true,
      segments: { where: { staffId: actor.staffId, allocationState: "ACTIVE" }, orderBy: { executionOrder: "asc" } },
    },
  });
  if (!booking) throw new DomainError("NOT_FOUND", "Assigned booking not found.");
  return booking;
}
