import { z } from "zod";

export const createAssistantSchema = z.object({
  displayName: z.string().trim().min(2).max(100),
  phone: z.string().min(10).max(30),
});

export const assistantUserSchema = z.object({ userId: z.string().uuid() });
export const assistantActiveSchema = assistantUserSchema.extend({ active: z.boolean() });
