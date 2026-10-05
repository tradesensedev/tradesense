import { z } from "zod";
import {
  ACCESS_LEVELS,
  BIASES,
  CONFIDENCES,
  KILLZONES,
  NOTE_STATUSES,
  POST_TYPES,
  PUBLISH_STATUSES,
  SENTIMENTS,
  type AttachmentAccess,
  type AttachmentKind,
  type AttachmentOwnerType,
} from "./constants";

const nonEmpty = (v: object) => Object.keys(v).length > 0;

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .refine((s) => !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s), "Invalid date");
export const isoString = z.string().datetime();
const idString = z.string().min(1).max(40);

// ---------------- posts ----------------
const postOptional = {
  sentiment: z.enum(SENTIMENTS).nullable().optional(),
  title: z.string().trim().max(200).optional(),
  summary: z.string().max(1000).optional(),
  bodyMd: z.string().max(50000).optional(),
  keyDriversMd: z.string().max(10000).optional(),
  riskEventsMd: z.string().max(10000).optional(),
  invalidationMd: z.string().max(10000).optional(), // text only, never a price level
  access: z.enum(ACCESS_LEVELS).optional(),
  publishAt: isoString.nullable().optional(),
  validFrom: isoString.nullable().optional(),
  validUntil: isoString.nullable().optional(),
  analystId: idString.nullable().optional(),
  tagIds: z.array(idString).max(30).optional(),
};

export const createPostSchema = z
  .object({
    type: z.enum(POST_TYPES),
    marketId: idString,
    postDate: dateString,
    bias: z.enum(BIASES),
    confidence: z.enum(CONFIDENCES),
    ...postOptional,
  })
  .strict();
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = createPostSchema.partial().refine(nonEmpty, "Nothing to update");
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

export const scheduleSchema = z.object({ publishAt: isoString });

export const duplicatePostsSchema = z.object({
  type: z.enum(POST_TYPES).default("daily"),
  fromDate: dateString,
  toDate: dateString,
  marketIds: z.array(idString).max(50).optional(),
});

export const templatePostsSchema = z.object({
  type: z.enum(POST_TYPES).default("daily"),
  date: dateString,
  marketIds: z.array(idString).min(1).max(50),
});

export const bulkPostsSchema = z.object({ items: z.array(createPostSchema).min(1).max(50) });

export const postListQuery = z.object({
  status: z.enum(PUBLISH_STATUSES).optional(),
  type: z.enum(POST_TYPES).optional(),
  marketId: idString.optional(),
  analystId: idString.optional(),
  mine: z.enum(["1", "0"]).optional(),
  dateFrom: dateString.optional(),
  dateTo: dateString.optional(),
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// ---------------- notes ----------------
const noteOptional = {
  confidence: z.enum(CONFIDENCES).nullable().optional(),
  title: z.string().trim().max(200).optional(),
  noteMd: z.string().max(20000).optional(),
  access: z.enum(ACCESS_LEVELS).optional(),
  publishAt: isoString.nullable().optional(),
  analystId: idString.nullable().optional(),
  tagIds: z.array(idString).max(30).optional(),
};

export const createNoteSchema = z
  .object({
    marketId: idString,
    killzone: z.enum(KILLZONES),
    noteDate: dateString,
    linkedPostId: idString,
    status: z.enum(NOTE_STATUSES),
    ...noteOptional,
  })
  .strict();
export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const updateNoteSchema = createNoteSchema.partial().refine(nonEmpty, "Nothing to update");
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

// Quick entry: market -> killzone -> status -> short note -> publish. Link is auto-picked when omitted.
export const quickNoteSchema = z
  .object({
    marketId: idString,
    killzone: z.enum(KILLZONES),
    status: z.enum(NOTE_STATUSES),
    noteMd: z.string().min(1).max(20000),
    title: z.string().trim().max(200).optional(),
    noteDate: dateString.optional(),
    linkedPostId: idString.optional(),
    confidence: z.enum(CONFIDENCES).nullable().optional(),
    publish: z.boolean().default(false),
  })
  .strict();
export type QuickNoteInput = z.infer<typeof quickNoteSchema>;

export const noteListQuery = z.object({
  publishStatus: z.enum(PUBLISH_STATUSES).optional(),
  status: z.enum(NOTE_STATUSES).optional(),
  killzone: z.enum(KILLZONES).optional(),
  marketId: idString.optional(),
  analystId: idString.optional(),
  linkedPostId: idString.optional(),
  mine: z.enum(["1", "0"]).optional(),
  dateFrom: dateString.optional(),
  dateTo: dateString.optional(),
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const suggestLinksQuery = z.object({ marketId: idString, date: dateString });

// ---------------- DTOs (JSON shapes returned by the admin API) ----------------
export interface PostDto {
  id: string;
  type: (typeof POST_TYPES)[number];
  marketId: string;
  postDate: string;
  weekStartDate: string;
  bias: (typeof BIASES)[number];
  confidence: (typeof CONFIDENCES)[number];
  sentiment: (typeof SENTIMENTS)[number] | null;
  title: string;
  summary: string;
  bodyMd: string;
  keyDriversMd: string;
  riskEventsMd: string;
  invalidationMd: string;
  access: (typeof ACCESS_LEVELS)[number];
  status: (typeof PUBLISH_STATUSES)[number];
  publishAt: string | null;
  validFrom: string | null;
  validUntil: string | null;
  analystId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface NoteDto {
  id: string;
  marketId: string;
  killzone: (typeof KILLZONES)[number];
  noteDate: string;
  linkedPostId: string;
  status: (typeof NOTE_STATUSES)[number];
  confidence: (typeof CONFIDENCES)[number] | null;
  title: string;
  noteMd: string;
  access: (typeof ACCESS_LEVELS)[number];
  publishStatus: (typeof PUBLISH_STATUSES)[number];
  publishAt: string | null;
  analystId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export interface AttachmentDto {
  id: string;
  ownerType: AttachmentOwnerType;
  ownerId: string;
  kind: AttachmentKind;
  mime: string;
  size: number;
  sha256: string;
  caption: string;
  access: AttachmentAccess;
  uploadedBy: string;
  uploadedAt: string;
  locked: boolean;
  url: string;
}

export interface PostDetail {
  post: PostDto;
  tagIds: string[];
  attachments: AttachmentDto[];
  revisionCount: number;
}

export interface NoteDetail {
  note: NoteDto;
  tagIds: string[];
  attachments: AttachmentDto[];
  revisionCount: number;
}

export interface Paged<T> {
  items: T[];
  total: number;
}

export interface BatchResult {
  created: PostDto[];
  skipped: { marketId: string; reason: string }[];
}

export interface RevisionDto {
  id: string;
  entityType: "post" | "note";
  entityId: string;
  oldJson: string;
  newJson: string;
  editedBy: string;
  editedAt: string;
}

export interface SuggestLinksResponse {
  suggested: PostDto[];
  recent: PostDto[];
}
