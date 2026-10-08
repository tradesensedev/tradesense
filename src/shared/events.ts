import { z } from "zod";
import { dateString } from "./content";

// Economic-calendar events entered by hand (Phase 4). Times are UTC.
export const EVENT_IMPACTS = ["low", "medium", "high"] as const;
export type EventImpactValue = (typeof EVENT_IMPACTS)[number];

const startsAt = z
  .string()
  .datetime()
  .transform((s) => new Date(s).toISOString());
const currency = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{3}$/, "Currency: 3 letters, e.g. USD")
  .nullable();

export const createEventSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    startsAt,
    impact: z.enum(EVENT_IMPACTS).default("medium"),
    currency: currency.default(null),
    descriptionMd: z.string().max(5000).default(""),
  })
  .strict();
export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    startsAt,
    impact: z.enum(EVENT_IMPACTS),
    currency,
    descriptionMd: z.string().max(5000),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

const csv = <T extends z.ZodTypeAny>(item: T) =>
  z
    .string()
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(item).max(10))
    .optional();

// Admin list query. from/to are UTC calendar days, both inclusive.
export const eventListQuery = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
  impact: csv(z.enum(EVENT_IMPACTS)),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).optional(),
  q: z.string().trim().max(100).optional(),
  order: z.enum(["asc", "desc"]).default("asc"),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export interface EventDto {
  id: string;
  title: string;
  startsAt: string;
  impact: EventImpactValue;
  currency: string | null;
  source: "calendar" | "manual";
  descriptionMd: string;
  createdBy: string | null;
  createdAt: string;
}
