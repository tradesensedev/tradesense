import { z } from "zod";
import { ROLES, type AttachmentAccess, type AttachmentKind, type AttachmentOwnerType, type Role } from "./constants";
import { dateString, type AttachmentDto } from "./content";
import { emailSchema } from "./schemas";

const idString = z.string().min(1).max(40);
const page = {
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
};

// ---------------- users ----------------
// Create uses createUserSchema from ./schemas. Role changes and password resets are separate calls (each audited).
export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    timezone: z.string().trim().min(1).max(64),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const changeRoleSchema = z.object({ role: z.enum(ROLES) }).strict();
export const resetPasswordSchema = z.object({ password: z.string().min(10).max(200) }).strict();
export const disableTotpSchema = z.object({ confirm: z.literal(true) }).strict();

export const userListQuery = z.object({
  role: z.enum(ROLES).optional(),
  q: z.string().trim().max(100).optional(), // email or name
  ...page,
});

export interface UserAdminDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  timezone: string;
  createdAt: string;
  hasPassword: boolean;
  totpEnabled: boolean;
}

// ---------------- plans ----------------
export const createPlanSchema = z
  .object({
    code: z.string().trim().toLowerCase().regex(/^[a-z0-9_-]{2,30}$/, "Code: 2-30 letters, digits, _ -"),
    name: z.string().trim().min(1).max(100),
    durationDays: z.number().int().min(1).max(3650),
    priceUsd: z.number().min(0).max(100000),
    active: z.boolean().default(true),
    sortOrder: z.number().int().min(0).max(100000).default(0),
  })
  .strict();
export type CreatePlanInput = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    durationDays: z.number().int().min(1).max(3650),
    priceUsd: z.number().min(0).max(100000),
    active: z.boolean(),
    sortOrder: z.number().int().min(0).max(100000),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

// Region prices are used ONLY when settings.regional_pricing_enabled = true. PUT replaces the whole list.
export const regionPricesSchema = z
  .object({
    prices: z
      .array(
        z.object({
          countryCode: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "Two-letter country code"),
          priceUsd: z.number().min(0).max(100000),
        }),
      )
      .max(250),
  })
  .strict();
export type RegionPricesInput = z.infer<typeof regionPricesSchema>;

export interface RegionPriceDto {
  countryCode: string;
  priceUsd: number;
}

export interface PlanDto {
  id: string;
  code: string;
  name: string;
  durationDays: number;
  priceUsd: number;
  active: boolean;
  sortOrder: number;
  regionPrices: RegionPriceDto[];
}

// ---------------- saved views (filters live in the URL, so a view = a flat string map) ----------------
export const SAVED_VIEW_SCOPES = ["posts", "notes", "results", "users", "payments"] as const;
export type SavedViewScope = (typeof SAVED_VIEW_SCOPES)[number];

export const savedViewInputSchema = z
  .object({
    scope: z.enum(SAVED_VIEW_SCOPES),
    name: z.string().trim().min(1).max(60),
    filters: z.record(z.string().max(200)).refine((o) => Object.keys(o).length <= 40, "Too many filters"),
    columns: z.array(z.string().max(40)).max(40),
    shared: z.boolean().default(false),
  })
  .strict();
export type SavedViewInput = z.infer<typeof savedViewInputSchema>;

export const savedViewUpdateSchema = savedViewInputSchema
  .omit({ scope: true })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");
export type SavedViewUpdate = z.infer<typeof savedViewUpdateSchema>;

export const savedViewListQuery = z.object({ scope: z.enum(SAVED_VIEW_SCOPES) });

export interface SavedViewDto {
  id: string;
  scope: SavedViewScope;
  name: string;
  filters: Record<string, string>;
  columns: string[];
  shared: boolean;
  mine: boolean; // false = shared by a teammate (read-only for this user)
  ownerName: string | null;
  createdAt: string;
}

// ---------------- audit / revisions / media (read-only screens) ----------------
export const auditListQuery = z.object({
  userId: idString.optional(),
  action: z.string().trim().max(60).optional(), // exact action, or a prefix ending in "." e.g. "post."
  entity: z.string().trim().max(40).optional(),
  entityId: idString.optional(),
  dateFrom: dateString.optional(),
  dateTo: dateString.optional(),
  ...page,
});

export interface AuditEntryDto {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  diff: unknown; // parsed diff_json (null when absent)
  createdAt: string;
}

export const revisionListQuery = z.object({
  entityType: z.enum(["post", "note"]).optional(),
  entityId: idString.optional(),
  editedBy: idString.optional(),
  dateFrom: dateString.optional(),
  dateTo: dateString.optional(),
  ...page,
});

export interface RevisionDto {
  id: string;
  entityType: "post" | "note";
  entityId: string;
  entityLabel: string | null; // e.g. "XAUUSD daily 2026-10-05"
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  editedBy: string;
  editedByName: string | null;
  editedAt: string;
}

export const mediaListQuery = z.object({
  ownerType: z.enum(["post", "note", "result"]).optional(),
  kind: z.enum(["bias_chart", "result_chart", "note_chart", "other"]).optional(),
  access: z.enum(["inherit", "free", "paid", "public"]).optional(),
  uploadedBy: idString.optional(),
  locked: z.enum(["1", "0"]).optional(),
  q: z.string().trim().max(100).optional(), // caption or SHA-256 prefix
  dateFrom: dateString.optional(),
  dateTo: dateString.optional(),
  ...page,
});

export interface MediaItemDto extends AttachmentDto {
  uploadedByName: string | null;
  ownerLabel: string | null; // human label of the owning post/note/result
}

// Re-exported so screens import list-related types from one place.
export type { Role, AttachmentAccess, AttachmentKind, AttachmentOwnerType };
export { emailSchema };
