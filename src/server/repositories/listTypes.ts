import type { Access, Bias, Confidence, Killzone, NoteStatus, PostType, PublishStatus, Sentiment } from "@shared/constants";
import type { NoteListRowDto, NoteSort, PostListRowDto, PostSort, ResultFilterValue } from "@shared/lists";

export type SortDir = "asc" | "desc";

export interface PostFilterBase {
  type?: PostType;
  marketIds?: string[];
  statuses?: PublishStatus[];
  biases?: Bias[];
  confidences?: Confidence[];
  sentiments?: Sentiment[];
  accesses?: Access[];
  results?: ResultFilterValue[]; // "pending" = no result yet
  analystId?: string;
  tagId?: string;
  hasScreenshot?: boolean;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
  q?: string;
}

export interface PostListFilter extends PostFilterBase {
  sort: PostSort;
  dir: SortDir;
  limit: number;
  offset: number;
}

export interface NoteFilterBase {
  marketIds?: string[];
  killzones?: Killzone[];
  statuses?: NoteStatus[];
  publishStatuses?: PublishStatus[];
  confidences?: Confidence[];
  accesses?: Access[];
  analystId?: string;
  tagId?: string;
  linkedPostId?: string;
  hasScreenshot?: boolean;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
  q?: string;
}

export interface NoteListFilter extends NoteFilterBase {
  sort: NoteSort;
  dir: SortDir;
  limit: number;
  offset: number;
}

export type PostListRow = PostListRowDto;
export type NoteListRow = NoteListRowDto;

// The one list engine for admin screens, bulk selection and CSV export. Phase 4 adds the public variant.
export interface ListRepository {
  posts(f: PostListFilter): Promise<{ items: PostListRow[]; total: number }>;
  notes(f: NoteListFilter): Promise<{ items: NoteListRow[]; total: number }>;
  // ids of everything matching a filter (for "select all matching" bulk actions), capped at `max`
  postIds(f: PostFilterBase, max: number): Promise<{ ids: string[]; total: number }>;
  noteIds(f: NoteFilterBase, max: number): Promise<{ ids: string[]; total: number }>;
}
