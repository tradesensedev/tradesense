import { z } from "zod";
import { MARKET_CATEGORIES, ROLES } from "./constants";

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

const nonEmpty = (v: object) => Object.keys(v).length > 0;

// ---- markets ----
export const createMarketSchema = z.object({
  symbol: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9._-]{2,20}$/, "Symbol: 2-20 letters, digits, . _ -"),
  name: z.string().trim().min(1).max(100),
  category: z.enum(MARKET_CATEGORIES),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});
export type CreateMarketInput = z.infer<typeof createMarketSchema>;

export const updateMarketSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    category: z.enum(MARKET_CATEGORIES),
    active: z.boolean(),
    sortOrder: z.number().int().min(0).max(100000),
  })
  .partial()
  .strict()
  .refine(nonEmpty, "Nothing to update");
export type UpdateMarketInput = z.infer<typeof updateMarketSchema>;

// ---- analysts ----
export const createAnalystSchema = z.object({
  name: z.string().trim().min(1).max(100),
  bio: z.string().trim().max(2000).default(""),
  active: z.boolean().default(true),
});
export type CreateAnalystInput = z.infer<typeof createAnalystSchema>;

export const updateAnalystSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    bio: z.string().trim().max(2000),
    active: z.boolean(),
  })
  .partial()
  .strict()
  .refine(nonEmpty, "Nothing to update");
export type UpdateAnalystInput = z.infer<typeof updateAnalystSchema>;

// ---- tags (driver tags) ----
export const tagInputSchema = z.object({ name: z.string().trim().min(1).max(50) });
export type TagInput = z.infer<typeof tagInputSchema>;
