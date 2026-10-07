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
  type Access,
  type Bias,
  type Confidence,
  type Killzone,
  type NoteStatus,
  type Outcome,
  type PostType,
  type PublishStatus,
  type Sentiment,
} from "./constants";
import { dateString } from "./content";

// ONE filter language for admin lists (the public site reuses it in Phase 4). State lives in the URL query string.
// Multi-value filters are comma separated: ?marketId=a,b&bias=bullish,bearish
const idString = z.string().min(1).max(40);
const csv = <T extends z.ZodTypeAny>(item: T) =>
  z
    .string()
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(item).max(30))
    .optional();
const flag = z.enum(["1", "0"]).optional();
const page = {
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
};

export const RESULT_FILTER_VALUES = ["correct", "wrong", "partial", "pending"] as const;
export type ResultFilterValue = (typeof RESULT_FILTER_VALUES)[number];

// ---------------- posts ----------------
export const POST_SORTS = ["date", "market", "bias", "confidence", "status", "updated", "published", "title", "result"] as const;
export type PostSort = (typeof POST_SORTS)[number];

const postFilterShape = {
  type: z.enum(POST_TYPES).optional(),
  marketId: csv(idString),
  status: csv(z.enum(PUBLISH_STATUSES)),
  bias: csv(z.enum(BIASES)),
  confidence: csv(z.enum(CONFIDENCES)),
  sentiment: csv(z.enum(SENTIMENTS)),
  access: csv(z.enum(ACCESS_LEVELS)),
  result: csv(z.enum(RESULT_FILTER_VALUES)),
  analystId: idString.optional(),
  tagId: idString.optional(), // driver tag
  hasScreenshot: flag,
  mine: flag,
  dateFrom: dateString.optional(),
  dateTo: dateString.optional(),
  q: z.string().trim().max(100).optional(),
};

export const postListQueryV2 = z.object({
  ...postFilterShape,
  sort: z.enum(POST_SORTS).default("date"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  ...page,
});
export const postFilterOnly = z.object(postFilterShape);

// ---------------- notes ----------------
export const NOTE_SORTS = ["date", "market", "killzone", "status", "publish", "updated", "title"] as const;
export type NoteSort = (typeof NOTE_SORTS)[number];

const noteFilterShape = {
  marketId: csv(idString),
  killzone: csv(z.enum(KILLZONES)),
  status: csv(z.enum(NOTE_STATUSES)), // followed / non_followed / invalidation / neutral
  publishStatus: csv(z.enum(PUBLISH_STATUSES)),
  confidence: csv(z.enum(CONFIDENCES)),
  access: csv(z.enum(ACCESS_LEVELS)),
  analystId: idString.optional(),
  tagId: idString.optional(),
  linkedPostId: idString.optional(),
  hasScreenshot: flag,
  mine: flag,
  dateFrom: dateString.optional(),
  dateTo: dateString.optional(),
  q: z.string().trim().max(100).optional(),
};

export const noteListQueryV2 = z.object({
  ...noteFilterShape,
  sort: z.enum(NOTE_SORTS).default("date"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  ...page,
});
export const noteFilterOnly = z.object(noteFilterShape);

// ---------------- row DTOs ----------------
export interface PostListRowDto {
  id: string;
  type: PostType;
  marketId: string;
  marketSymbol: string;
  postDate: string;
  weekStartDate: string;
  bias: Bias;
  confidence: Confidence;
  sentiment: Sentiment | null;
  title: string;
  access: Access;
  status: PublishStatus;
  publishAt: string | null;
  validFrom: string | null;
  validUntil: string | null;
  analystId: string | null;
  analystName: string | null;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  tagNames: string[];
  screenshotCount: number;
  resultOutcome: Outcome | null; // effective outcome (latest correction wins); null = pending
  correctionCount: number;
}

export interface NoteListRowDto {
  id: string;
  marketId: string;
  marketSymbol: string;
  killzone: Killzone;
  noteDate: string;
  linkedPostId: string;
  status: NoteStatus;
  confidence: Confidence | null;
  title: string;
  access: Access;
  publishStatus: PublishStatus;
  publishAt: string | null;
  analystId: string | null;
  analystName: string | null;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  tagNames: string[];
  screenshotCount: number;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
}

// ---------------- column chooser (ids are shared by the screens and the CSV export) ----------------
export interface ColumnDef {
  id: string;
  label: string;
  default: boolean; // shown until the user picks their own set
  sort?: string; // sort key sent to the API when the header is clicked
}

export const POST_COLUMNS: readonly ColumnDef[] = [
  { id: "date", label: "Date", default: true, sort: "date" },
  { id: "market", label: "Market", default: true, sort: "market" },
  { id: "type", label: "Type", default: true },
  { id: "bias", label: "Bias", default: true, sort: "bias" },
  { id: "confidence", label: "Confidence", default: true, sort: "confidence" },
  { id: "result", label: "Result", default: true, sort: "result" },
  { id: "status", label: "Status", default: true, sort: "status" },
  { id: "access", label: "Access", default: true },
  { id: "title", label: "Title", default: false, sort: "title" },
  { id: "sentiment", label: "Sentiment", default: false },
  { id: "tags", label: "Tags", default: false },
  { id: "screenshots", label: "Screenshots", default: false },
  { id: "analyst", label: "Analyst", default: false },
  { id: "createdBy", label: "Created by", default: false },
  { id: "validUntil", label: "Valid until", default: false },
  { id: "publishAt", label: "Scheduled for", default: false },
  { id: "published", label: "Published at", default: false, sort: "published" },
  { id: "updated", label: "Updated", default: true, sort: "updated" },
];

export const NOTE_COLUMNS: readonly ColumnDef[] = [
  { id: "date", label: "Date", default: true, sort: "date" },
  { id: "market", label: "Market", default: true, sort: "market" },
  { id: "killzone", label: "Killzone", default: true, sort: "killzone" },
  { id: "status", label: "Note status", default: true, sort: "status" },
  { id: "publish", label: "Publish", default: true, sort: "publish" },
  { id: "confidence", label: "Confidence", default: false },
  { id: "access", label: "Access", default: true },
  { id: "title", label: "Title", default: false, sort: "title" },
  { id: "tags", label: "Tags", default: false },
  { id: "screenshots", label: "Screenshots", default: false },
  { id: "analyst", label: "Analyst", default: false },
  { id: "createdBy", label: "Created by", default: false },
  { id: "publishAt", label: "Scheduled for", default: false },
  { id: "published", label: "Published at", default: false },
  { id: "updated", label: "Updated", default: true, sort: "updated" },
];

export const RESULT_COLUMNS: readonly ColumnDef[] = [
  { id: "date", label: "Post date", default: true },
  { id: "market", label: "Market", default: true },
  { id: "type", label: "Type", default: true },
  { id: "bias", label: "Bias", default: true },
  { id: "outcome", label: "Outcome", default: true },
  { id: "original", label: "Original outcome", default: false },
  { id: "corrections", label: "Corrections", default: false },
  { id: "ruleVersion", label: "Rule version", default: true },
  { id: "evaluatedBy", label: "Evaluated by", default: true },
  { id: "evaluatedAt", label: "Evaluated at", default: true },
  { id: "note", label: "Note", default: false },
  { id: "title", label: "Post title", default: false },
];

export const LIST_COLUMNS = { posts: POST_COLUMNS, notes: NOTE_COLUMNS, results: RESULT_COLUMNS } as const;
export type ListKind = keyof typeof LIST_COLUMNS;

export const columnsQuery = z.object({
  columns: z
    .string()
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(z.string().max(40)).max(40))
    .optional(),
});

// ---------------- bulk actions (posts and notes) ----------------
export const BULK_ACTIONS = ["publish", "unschedule", "delete", "set_access", "add_tag", "remove_tag"] as const;
export type BulkAction = (typeof BULK_ACTIONS)[number];
export const MAX_BULK_ITEMS = 200;

// selection = explicit ids, or "everything matching this filter" (the filter is the same query-string map the list uses)
export const bulkSchema = z
  .object({
    action: z.enum(BULK_ACTIONS),
    selection: z.union([
      z.object({ ids: z.array(idString).min(1).max(MAX_BULK_ITEMS) }).strict(),
      z.object({ filter: z.record(z.string().max(200)) }).strict(),
    ]),
    access: z.enum(ACCESS_LEVELS).optional(),
    tagId: idString.optional(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (v.action === "set_access" && !v.access) ctx.addIssue({ code: "custom", path: ["access"], message: "Choose an access level" });
    if ((v.action === "add_tag" || v.action === "remove_tag") && !v.tagId) {
      ctx.addIssue({ code: "custom", path: ["tagId"], message: "Choose a tag" });
    }
  });
export type BulkInput = z.infer<typeof bulkSchema>;

export interface BulkItemResult {
  id: string;
  ok: boolean;
  error?: string;
}

export interface BulkResponse {
  action: BulkAction;
  results: BulkItemResult[];
  okCount: number;
  failCount: number;
  truncated: boolean; // a filter matched more than MAX_BULK_ITEMS; only the first batch ran
}
