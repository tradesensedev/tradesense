import type { Access, Bias, Confidence, Killzone, NoteStatus, Outcome, PostType, Sentiment } from "@shared/constants";
import type { NoteFilterBase, PostFilterBase, SortDir } from "./listTypes";

// Public variant of the list engine (Phase 4). SAME filter language as the admin lists (shared/lists.ts),
// but: published rows only (hard-coded in SQL), no admin fields, and every row is access-checked by the caller.
// Added to Repositories by declaration merging (see listAugment.ts).

// Same shape as Visibility in services/access.ts (kept structural so repositories never import services).
export interface PublicVisibility {
  all: boolean; // entitled viewer
  freeBefore: string; // FREE items published at or before this instant are open
  archiveBefore: string | null; // items with content date <= this YYYY-MM-DD are open (weekly: whole week over)
}

// Content filters (bias, confidence, sentiment, result, tag, note status, screenshot, keyword) only ever match rows the
// viewer may open, otherwise a filter would reveal locked content. Metadata filters (type, market, date, killzone,
// access, analyst) always apply. Sorting is limited to non-content columns for the same reason.
export const PUBLIC_POST_SORTS = ["date", "published", "market"] as const;
export const PUBLIC_NOTE_SORTS = ["date", "published", "market", "killzone"] as const;
export type PublicPostSort = (typeof PUBLIC_POST_SORTS)[number];
export type PublicNoteSort = (typeof PUBLIC_NOTE_SORTS)[number];

export interface PublicPostFilter extends Omit<PostFilterBase, "statuses" | "createdBy"> {
  visibility: PublicVisibility;
  bookmarkedBy?: string; // fills the `bookmarked` flag for this user
  bookmarkedOnly?: boolean; // needs bookmarkedBy
  sort: PublicPostSort;
  dir: SortDir;
  limit: number;
  offset: number;
}

export interface PublicNoteFilter extends Omit<NoteFilterBase, "publishStatuses" | "createdBy"> {
  visibility: PublicVisibility;
  bookmarkedBy?: string;
  bookmarkedOnly?: boolean;
  sort: PublicNoteSort;
  dir: SortDir;
  limit: number;
  offset: number;
}

// Rows still carry the content fields (bias, title, summary...). The SERVICE decides per row whether to send them
// (isOpen from services/access.ts) and replaces them by a locked placeholder otherwise.
export interface PublicPostRow {
  id: string;
  type: PostType;
  marketId: string;
  marketSymbol: string;
  postDate: string;
  weekStartDate: string;
  contentDate: string; // postDate, or Monday + 6 days for weekly
  bias: Bias;
  confidence: Confidence;
  sentiment: Sentiment | null;
  title: string;
  summary: string;
  access: Access;
  publishedAt: string; // published_at, falls back to updated_at
  validUntil: string | null;
  analystId: string | null;
  analystName: string | null;
  tagNames: string[];
  screenshotCount: number;
  resultOutcome: Outcome | null; // effective outcome (latest correction wins); null = pending
  correctionCount: number;
  bookmarked: boolean;
}

export interface PublicNoteRow {
  id: string;
  marketId: string;
  marketSymbol: string;
  killzone: Killzone;
  noteDate: string;
  contentDate: string; // = noteDate
  linkedPostId: string;
  status: NoteStatus;
  confidence: Confidence | null;
  title: string;
  access: Access;
  publishedAt: string;
  analystId: string | null;
  analystName: string | null;
  tagNames: string[];
  screenshotCount: number;
  bookmarked: boolean;
}

export interface PublicListRepository {
  posts(f: PublicPostFilter): Promise<{ items: PublicPostRow[]; total: number }>;
  notes(f: PublicNoteFilter): Promise<{ items: PublicNoteRow[]; total: number }>;
}

declare module "./types" {
  interface Repositories {
    publicLists: PublicListRepository;
  }
}
