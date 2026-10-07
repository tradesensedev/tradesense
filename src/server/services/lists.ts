import type { z } from "zod";
import {
  LIST_COLUMNS,
  type ColumnDef,
  type ListKind,
  type NoteListRowDto,
  type PostListRowDto,
  type noteFilterOnly,
  type noteListQueryV2,
  type postFilterOnly,
  type postListQueryV2,
} from "@shared/lists";
import type { resultListQuery, ResultListItemDto } from "@shared/results";
import { toCsv, type CsvColumn } from "../lib/csv";
import type { NoteFilterBase, PostFilterBase } from "../repositories/listTypes";
import type { Repositories } from "../repositories/types";
import { ResultService } from "./results";

export const EXPORT_MAX_ROWS = 5000;
const PAGE = 200;

type PostFilterQuery = z.infer<typeof postFilterOnly>;
type NoteFilterQuery = z.infer<typeof noteFilterOnly>;

// Query-string shape -> repository filter. "mine" is resolved here, so the repository never sees the session.
export function postFilterFromQuery(q: PostFilterQuery, actorId: string): PostFilterBase {
  return {
    type: q.type,
    marketIds: q.marketId,
    statuses: q.status,
    biases: q.bias,
    confidences: q.confidence,
    sentiments: q.sentiment,
    accesses: q.access,
    results: q.result,
    analystId: q.analystId,
    tagId: q.tagId,
    hasScreenshot: q.hasScreenshot === undefined ? undefined : q.hasScreenshot === "1",
    createdBy: q.mine === "1" ? actorId : undefined,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    q: q.q,
  };
}

export function noteFilterFromQuery(q: NoteFilterQuery, actorId: string): NoteFilterBase {
  return {
    marketIds: q.marketId,
    killzones: q.killzone,
    statuses: q.status,
    publishStatuses: q.publishStatus,
    confidences: q.confidence,
    accesses: q.access,
    analystId: q.analystId,
    tagId: q.tagId,
    linkedPostId: q.linkedPostId,
    hasScreenshot: q.hasScreenshot === undefined ? undefined : q.hasScreenshot === "1",
    createdBy: q.mine === "1" ? actorId : undefined,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    q: q.q,
  };
}

// ---------- CSV columns, keyed by the same ids as the column chooser (shared/lists.ts) ----------
const postDate = (p: PostListRowDto) => (p.type === "daily" ? p.postDate : p.weekStartDate);

const POST_CSV: Record<string, CsvColumn<PostListRowDto>> = {
  date: { id: "date", label: "Date", value: postDate },
  market: { id: "market", label: "Market", value: (p) => p.marketSymbol },
  type: { id: "type", label: "Type", value: (p) => p.type },
  bias: { id: "bias", label: "Bias", value: (p) => p.bias },
  confidence: { id: "confidence", label: "Confidence", value: (p) => p.confidence },
  result: { id: "result", label: "Result", value: (p) => p.resultOutcome ?? "pending" },
  status: { id: "status", label: "Status", value: (p) => p.status },
  access: { id: "access", label: "Access", value: (p) => p.access },
  title: { id: "title", label: "Title", value: (p) => p.title },
  sentiment: { id: "sentiment", label: "Sentiment", value: (p) => p.sentiment },
  tags: { id: "tags", label: "Tags", value: (p) => p.tagNames.join("; ") },
  screenshots: { id: "screenshots", label: "Screenshots", value: (p) => p.screenshotCount },
  analyst: { id: "analyst", label: "Analyst", value: (p) => p.analystName },
  createdBy: { id: "createdBy", label: "Created by", value: (p) => p.createdByName },
  validUntil: { id: "validUntil", label: "Valid until", value: (p) => p.validUntil },
  publishAt: { id: "publishAt", label: "Scheduled for", value: (p) => p.publishAt },
  published: { id: "published", label: "Published at", value: (p) => p.publishedAt },
  updated: { id: "updated", label: "Updated", value: (p) => p.updatedAt },
};

const NOTE_CSV: Record<string, CsvColumn<NoteListRowDto>> = {
  date: { id: "date", label: "Date", value: (n) => n.noteDate },
  market: { id: "market", label: "Market", value: (n) => n.marketSymbol },
  killzone: { id: "killzone", label: "Killzone", value: (n) => n.killzone },
  status: { id: "status", label: "Note status", value: (n) => n.status },
  publish: { id: "publish", label: "Publish", value: (n) => n.publishStatus },
  confidence: { id: "confidence", label: "Confidence", value: (n) => n.confidence },
  access: { id: "access", label: "Access", value: (n) => n.access },
  title: { id: "title", label: "Title", value: (n) => n.title },
  tags: { id: "tags", label: "Tags", value: (n) => n.tagNames.join("; ") },
  screenshots: { id: "screenshots", label: "Screenshots", value: (n) => n.screenshotCount },
  analyst: { id: "analyst", label: "Analyst", value: (n) => n.analystName },
  createdBy: { id: "createdBy", label: "Created by", value: (n) => n.createdByName },
  publishAt: { id: "publishAt", label: "Scheduled for", value: (n) => n.publishAt },
  published: { id: "published", label: "Published at", value: (n) => n.publishedAt },
  updated: { id: "updated", label: "Updated", value: (n) => n.updatedAt },
};

type ResultRow = ResultListItemDto & { marketSymbol: string };
const RESULT_CSV: Record<string, CsvColumn<ResultRow>> = {
  date: { id: "date", label: "Post date", value: (r) => (r.post.type === "daily" ? r.post.postDate : r.post.weekStartDate) },
  market: { id: "market", label: "Market", value: (r) => r.marketSymbol },
  type: { id: "type", label: "Type", value: (r) => r.post.type },
  bias: { id: "bias", label: "Bias", value: (r) => r.post.bias },
  outcome: { id: "outcome", label: "Outcome", value: (r) => r.effectiveOutcome },
  original: { id: "original", label: "Original outcome", value: (r) => r.result.outcome },
  corrections: { id: "corrections", label: "Corrections", value: (r) => r.correctionCount },
  ruleVersion: { id: "ruleVersion", label: "Rule version", value: (r) => r.result.evaluationRuleVersion },
  evaluatedBy: { id: "evaluatedBy", label: "Evaluated by", value: (r) => r.result.evaluatedByName },
  evaluatedAt: { id: "evaluatedAt", label: "Evaluated at", value: (r) => r.result.evaluatedAt },
  note: { id: "note", label: "Note", value: (r) => r.result.noteMd },
  title: { id: "title", label: "Post title", value: (r) => r.post.title },
};

// Keep the chooser's order. Unknown ids are dropped. No selection = the default columns.
function pickColumns<T>(kind: ListKind, all: Record<string, CsvColumn<T>>, wanted?: string[]): CsvColumn<T>[] {
  const defs: readonly ColumnDef[] = LIST_COLUMNS[kind];
  const ids = defs.filter((d) => (wanted && wanted.length > 0 ? wanted.includes(d.id) : d.default)).map((d) => d.id);
  return ids.map((id) => all[id]).filter((c): c is CsvColumn<T> => !!c);
}

// Fetch page after page until `max` rows (the list endpoints cap one page at 200).
async function collect<T>(fetchPage: (limit: number, offset: number) => Promise<{ items: T[]; total: number }>) {
  const rows: T[] = [];
  let total = 0;
  for (let offset = 0; rows.length < EXPORT_MAX_ROWS; offset += PAGE) {
    const res = await fetchPage(PAGE, offset);
    total = res.total;
    rows.push(...res.items);
    if (res.items.length < PAGE || rows.length >= res.total) break;
  }
  return { rows: rows.slice(0, EXPORT_MAX_ROWS), total };
}

export interface ExportResult {
  csv: string;
  count: number;
  truncated: boolean;
}

export class ListService {
  constructor(private repos: Repositories) {}

  posts(q: z.infer<typeof postListQueryV2>, actorId: string) {
    return this.repos.lists.posts({ ...postFilterFromQuery(q, actorId), sort: q.sort, dir: q.dir, limit: q.limit, offset: q.offset });
  }

  notes(q: z.infer<typeof noteListQueryV2>, actorId: string) {
    return this.repos.lists.notes({ ...noteFilterFromQuery(q, actorId), sort: q.sort, dir: q.dir, limit: q.limit, offset: q.offset });
  }

  async exportPosts(q: z.infer<typeof postListQueryV2>, actorId: string, columns?: string[]): Promise<ExportResult> {
    const base = postFilterFromQuery(q, actorId);
    const { rows, total } = await collect((limit, offset) => this.repos.lists.posts({ ...base, sort: q.sort, dir: q.dir, limit, offset }));
    return { csv: toCsv(pickColumns("posts", POST_CSV, columns), rows), count: rows.length, truncated: total > rows.length };
  }

  async exportNotes(q: z.infer<typeof noteListQueryV2>, actorId: string, columns?: string[]): Promise<ExportResult> {
    const base = noteFilterFromQuery(q, actorId);
    const { rows, total } = await collect((limit, offset) => this.repos.lists.notes({ ...base, sort: q.sort, dir: q.dir, limit, offset }));
    return { csv: toCsv(pickColumns("notes", NOTE_CSV, columns), rows), count: rows.length, truncated: total > rows.length };
  }

  async exportResults(q: z.infer<typeof resultListQuery>, columns?: string[]): Promise<ExportResult> {
    const results = new ResultService(this.repos);
    const symbols = new Map((await this.repos.markets.list()).map((m) => [m.id, m.symbol]));
    const { rows, total } = await collect((limit, offset) => results.list({ ...q, limit, offset }));
    const withSymbol: ResultRow[] = rows.map((r) => ({ ...r, marketSymbol: symbols.get(r.post.marketId) ?? "?" }));
    return { csv: toCsv(pickColumns("results", RESULT_CSV, columns), withSymbol), count: withSymbol.length, truncated: total > withSymbol.length };
  }
}
