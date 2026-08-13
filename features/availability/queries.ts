import "server-only";
import { prisma } from "@/lib/db/prisma";
import { availabilityInputSchema } from "./schema";
import { listAvailableSlots } from "./repository";

export async function getAvailableSlots(input: unknown) {
  const data = availabilityInputSchema.parse(input);
  return listAvailableSlots(prisma, data.date, data.serviceIds);
}
