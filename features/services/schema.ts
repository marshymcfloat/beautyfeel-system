import { z } from "zod";

export const serviceInputSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).nullable().optional(),
  priceCentavos: z.number().int().min(0).max(10_000_000),
  durationMinutes: z.number().int().min(5).max(480),
  bufferMinutes: z.number().int().min(0).max(120),
});

export const serviceActiveSchema = z.object({
  id: z.string().uuid(),
  active: z.boolean(),
});
