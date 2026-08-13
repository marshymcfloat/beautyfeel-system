import { z } from "zod";

export const signInSchema = z.object({
  phone: z.string().min(10).max(30),
  password: z.string().min(8).max(128),
});
