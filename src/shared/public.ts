import { z } from "zod";
import {
  BIASES,
  CONFIDENCES,
  KILLZONES,
  NOTE_STATUSES,
  SENTIMENTS,
  ACCESS_LEVELS,
  type Access,
  type Bias,
  type Confidence,
  type Killzone,
  type NoteStatus,
  type Outcome,
  type PostType,
  type Sentiment,
} from "./constants";
import { dateString } from "./content";
import { RESULT_FILTER_VALUES } from "./lists";

// Public-site types and query schemas shared by server and client (Phase 4).

// What a visitor may see of one item. "locked" = paid and not entitled; "delayed" = free but still inside free_delay_hours.
export type AccessState = "open" | "locked" | "delayed";

export interface AccessInfo {
  state: AccessState;
  // When the item opens to this viewer without a plan (open archive / end of free delay). null = never without a plan.
  unlocksAt: string | null;
}

export const OPEN_ACCESS: AccessInfo = { state: "open", unlocksAt: null };

// ---------------- viewer + meta ----------------
export type ViewerState = "visitor" | "member" | "subscriber" | "staff";

export interface PublicMetaDto {
  today: string; // UTC calendar day
  viewer: { state: ViewerState; entitled: boolean };
  markets: { id: string; symbol: string; name: string; category: string }[];
  tags: { id: string; name: string; slug: string }[];
  analysts: { id: string; name: string }[];
  settings: {
    announcementBanner: string;
    disclaimerText: string;
    freeDelayHours: number;
    openArchiveDays: number;
    activeRuleVersion: number;
  };
}

// ---------------- items ----------------
// RULE: `content` is null unless lock.state === "open". Locked items carry metadata only (market, date, access).
export interface PublicPostContent {
  bias: Bias;
  confidence: Confidence;
  sentiment: Sentiment | null;
  title: string;
  summary: string;
  validUntil: string | null;
  analystName: string | null;
  tagNames: string[];
  screenshotCount: number;
  result: { outcome: Outcome; corrected: boolean } | null; // null = pending
}

export interface PublicPostItem {
  id: string;
  type: PostType;
  marketId: string;
  marketSymbol: string;
  postDate: string;
  weekStartDate: string;
  access: Access;
  publishedAt: string;
  lock: AccessInfo;
  bookmarked: boolean;
  content: PublicPostContent | null;
}

export interface PublicNoteContent {
  status: NoteStatus;
  confidence: Confidence | null;
  title: string;
  analystName: string | null;
  tagNames: string[];
  screenshotCount: number;
}

export interface PublicNoteItem {
  id: string;
  marketId: string;
  marketSymbol: string;
  killzone: Killzone;
  noteDate: string;
  linkedPostId: string;
  access: Access;
  publishedAt: string;
  lock: AccessInfo;
  bookmarked: boolean;
  content: PublicNoteContent | null;
}

export type PublicFeedItem = { kind: "post"; post: PublicPostItem } | { kind: "note"; note: PublicNoteItem };

// ---------------- responses ----------------
export interface PublicTodayDto {
  date: string;
  weekStartDate: string;
  posts: PublicPostItem[]; // daily posts of `date` + weekly posts of that week
  notes: PublicNoteItem[]; // notes of `date`
}

export interface PublicMatrixDto {
  weekStartDate: string; // Monday
  marketId: string | null;
  posts: PublicPostItem[]; // dailies Mon-Sun + the weekly post
  notes: PublicNoteItem[]; // notes Mon-Fri
}

export interface PublicHeatmapDto {
  month: string; // YYYY-MM
  from: string;
  to: string;
  marketId: string | null;
  posts: PublicPostItem[]; // daily posts only
}

export interface PublicFeedDto {
  items: PublicFeedItem[];
  total: number;
}

// ---------------- query schemas ----------------
const idString = z.string().min(1).max(40);
const csv = <T extends z.ZodTypeAny>(item: T) =>
  z
    .string()
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(item).max(30))
    .optional();
const flag = z.enum(["1", "0"]).optional();
const monthString = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be YYYY-MM");

export const publicTodayQuery = z.object({ date: dateString.optional() });
export const publicMatrixQuery = z.object({ week: dateString.optional(), marketId: idString.optional() });
export const publicHeatmapQuery = z.object({ month: monthString.optional(), marketId: idString.optional() });

export const PUBLIC_PERIODS = ["today", "week", "month", "date", "range"] as const;
export const PUBLIC_SORTS = ["date", "published", "market"] as const;
export type PublicSort = (typeof PUBLIC_SORTS)[number];

// The public feed uses the SAME filter language as the admin lists (names and comma-separated multi values).
// Differences: type also accepts "note", note status is `noteStatus`, and period/date/month/range replace dateFrom/dateTo.
export const publicFeedQuery = z.object({
  type: z.enum(["daily", "weekly", "note"]).optional(),
  marketId: csv(idString),
  killzone: csv(z.enum(KILLZONES)),
  bias: csv(z.enum(BIASES)),
  noteStatus: csv(z.enum(NOTE_STATUSES)),
  confidence: csv(z.enum(CONFIDENCES)),
  sentiment: csv(z.enum(SENTIMENTS)),
  result: csv(z.enum(RESULT_FILTER_VALUES)),
  access: csv(z.enum(ACCESS_LEVELS)),
  tagId: idString.optional(),
  analystId: idString.optional(),
  hasScreenshot: flag,
  bookmarked: flag,
  q: z.string().trim().max(100).optional(),
  period: z.enum(PUBLIC_PERIODS).optional(),
  date: dateString.optional(),
  month: monthString.optional(),
  dateFrom: dateString.optional(),
  dateTo: dateString.optional(),
  sort: z.enum(PUBLIC_SORTS).default("date"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(1000).default(0),
});
export type PublicFeedQuery = z.infer<typeof publicFeedQuery>;
