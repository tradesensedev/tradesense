import { z } from "zod";
import { ROLES } from "./constants";

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200),
  totp: z.string().regex(/^\d{6}$/).optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const magicRequestSchema = z.object({ email: emailSchema });
export const magicVerifySchema = z.object({ token: z.string().min(20).max(200) });

export const createUserSchema = z.object({
  email: emailSchema,
  name: z.string().trim().min(1).max(100),
  role: z.enum(ROLES),
  password: z.string().min(10).max(200).optional(),
  timezone: z.string().max(64).default("UTC"),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const timezoneSchema = z.object({ timezone: z.string().min(1).max(64) });
