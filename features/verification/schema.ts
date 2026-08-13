import { z } from "zod";

export const requestOtpSchema = z.object({ phone: z.string().min(10).max(30) });
export const verifyOtpSchema = z.object({
  verificationId: z.string().uuid(),
  phone: z.string().min(10).max(30),
  code: z.string().regex(/^\d{6}$/),
});
