import "server-only";
import { requireActor } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
export async function getCustomerTrustProfiles(){await requireActor(["OWNER"]);return prisma.customerTrustProfile.findMany({orderBy:{updatedAt:"desc"},take:100})}
export async function getCustomerStoreCredits(phoneE164:string){await requireActor(["OWNER"]);return prisma.storeCredit.findMany({where:{customerPhoneE164:phoneE164,status:"ACTIVE",expiresAt:{gt:new Date()}},orderBy:{expiresAt:"asc"}})}
export async function getBookingOperations(bookingId:string,phoneE164:string){
  await requireActor(["OWNER"]);
  const [credits,sms]=await Promise.all([
    prisma.storeCredit.findMany({where:{customerPhoneE164:phoneE164},orderBy:{createdAt:"desc"},take:20}),
    prisma.smsOutbox.findMany({where:{eventKey:{startsWith:`${bookingId}:`}},orderBy:{createdAt:"desc"},take:20}),
  ]);
  return {credits,sms};
}

export async function getRecentCustomers() {
  await requireActor(["OWNER", "BOOKING_ASSISTANT"]);
  const bookings = await prisma.booking.findMany({
    select: { customerName: true, customerPhoneE164: true, requestedStartsAt: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const customers = new Map<string, { name: string; phoneE164: string; lastBookedAt: Date }>();
  for (const booking of bookings) {
    if (!customers.has(booking.customerPhoneE164)) {
      customers.set(booking.customerPhoneE164, {
        name: booking.customerName,
        phoneE164: booking.customerPhoneE164,
        lastBookedAt: booking.requestedStartsAt,
      });
    }
    if (customers.size === 50) break;
  }
  return [...customers.values()];
}
