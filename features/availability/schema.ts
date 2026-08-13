import { z } from "zod";

export const availabilityInputSchema = z.object({
  date: z.iso.date(),
  serviceIds: z.array(z.string().uuid()).min(1).max(6),
}).refine((value) => new Set(value.serviceIds).size === value.serviceIds.length, {
  message: "Each service may only be selected once.",
});
