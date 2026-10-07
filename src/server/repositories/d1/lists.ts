import type { Outcome } from "@shared/constants";
import type { NoteSort, PostSort } from "@shared/lists";
import type {
  ListRepository,
  NoteFilterBase,
  NoteListFilter,
  NoteListRow,
  PostFilterBase,
  PostListFilter,
  PostListRow,
} from "../listTypes";
import { clampPage } from "./util";

// Admin list engine: every filter is a bound parameter, every sort comes from an allow-list. No user text reaches the SQL string.
const SEP = "\u001f"; // separates tag names inside group_concat

const EFF =
  "COALESCE((SELECT c.new_outcome FROM result_corrections c WHERE c.result_id = r.id ORDER BY c.created_at DESC, c.id DESC LIMIT 1), r.outcome)";
const POST_DATE = "(CASE p.type WHEN 'daily' THEN p.post_date ELSE p.week_start_date END)";

const like = (q: string) => `%${q.replace(/[%_]/g, " ")}%`;

function inList(col: string, values: readonly string[], vals: unknown[]): string {
  vals.push(...values);
  return `${col} IN (${values.map(() => "?").join(", ")})`;
}

const names = (s: string | null): string[] => (s ? s.split(SEP).sort((a, b) => a.localeCompare(b)) : []);

// ---------------- posts ----------------
const POST_FROM =
  "FROM posts p JOIN markets m ON m.id = p.market_id LEFT JOIN analysts a ON a.id = p.analyst_id " +
  "LEFT JOIN users u ON u.id = p.created_by LEFT JOIN results r ON r.post_id = p.id";

const POST_SORT: Record<PostSort, string> = {
  date: POST_DATE,
  market: "m.symbol COLLATE NOCASE",
  bias: "p.bias",
  confidence: "(CASE p.confidence WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END)",
  status: "p.status",
  updated: "p.updated_at",
  published: "p.published_at",
  title: "p.title COLLATE NOCASE",
  result: `COALESCE(${EFF}, '')`,
};

function postWhere(f: PostFilterBase): { w: string; vals: unknown[] } {
  const where: string[] = [];
  const vals: unknown[] = [];
  if (f.type) (where.push("p.type = ?"), vals.push(f.type));
  if (f.marketIds?.length) where.push(inList("p.market_id", f.marketIds, vals));
  if (f.statuses?.length) where.push(inList("p.status", f.statuses, vals));
  if (f.biases?.length) where.push(inList("p.bias", f.biases, vals));
  if (f.confidences?.length) where.push(inList("p.confidence", f.confidences, vals));
  if (f.sentiments?.length) where.push(inList("p.sentiment", f.sentiments, vals));
  if (f.accesses?.length) where.push(inList("p.access", f.accesses, vals));
  if (f.results?.length) {
    const outcomes = f.results.filter((v) => v !== "pending");
    const parts: string[] = [];
    if (f.results.includes("pending")) parts.push("r.id IS NULL");
    if (outcomes.length) parts.push(`(r.id IS NOT NULL AND ${inList(EFF, outcomes, vals)})`);
    where.push(`(${parts.join(" OR ")})`);
  }
  if (f.analystId) (where.push("p.analyst_id = ?"), vals.push(f.analystId));
  if (f.createdBy) (where.push("p.created_by = ?"), vals.push(f.createdBy));
  if (f.tagId) (where.push("EXISTS (SELECT 1 FROM post_tags pt WHERE pt.post_id = p.id AND pt.tag_id = ?)"), vals.push(f.tagId));
  if (f.hasScreenshot !== undefined) {
    where.push(`${f.hasScreenshot ? "" : "NOT "}EXISTS (SELECT 1 FROM attachments att WHERE att.owner_type = 'post' AND att.owner_id = p.id)`);
  }
  if (f.dateFrom) (where.push(`${POST_DATE} >= ?`), vals.push(f.dateFrom));
  if (f.dateTo) (where.push(`${POST_DATE} <= ?`), vals.push(f.dateTo));
  if (f.q) {
    where.push("(p.title LIKE ? OR p.summary LIKE ? OR p.body_md LIKE ?)");
    vals.push(like(f.q), like(f.q), like(f.q));
  }
  return { w: where.length ? `WHERE ${where.join(" AND ")}` : "", vals };
}

interface DbPostRow {
  id: string;
  type: string;
  market_id: string;
  post_date: string;
  week_start_date: string;
  bias: string;
  confidence: string;
  sentiment: string | null;
  title: string;
  access: string;
  status: string;
  publish_at: string | null;
  valid_from: string | null;
  valid_until: string | null;
  analyst_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  market_symbol: string;
  analyst_name: string | null;
  created_by_name: string | null;
  screenshot_count: number;
  tag_names: string | null;
  result_id: string | null;
  effective_outcome: string | null;
  correction_count: number;
}

const mapPost = (r: DbPostRow): PostListRow => ({
  id: r.id,
  type: r.type as PostListRow["type"],
  marketId: r.market_id,
  marketSymbol: r.market_symbol,
  postDate: r.post_date,
  weekStartDate: r.week_start_date,
  bias: r.bias as PostListRow["bias"],
  confidence: r.confidence as PostListRow["confidence"],
  sentiment: r.sentiment as PostListRow["sentiment"],
  title: r.title,
  access: r.access as PostListRow["access"],
  status: r.status as PostListRow["status"],
  publishAt: r.publish_at,
  validFrom: r.valid_from,
  validUntil: r.valid_until,
  analystId: r.analyst_id,
  analystName: r.analyst_name,
  createdBy: r.created_by,
  createdByName: r.created_by_name,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  publishedAt: r.published_at,
  tagNames: names(r.tag_names),
  screenshotCount: r.screenshot_count,
  resultOutcome: r.result_id ? (r.effective_outcome as Outcome) : null,
  correctionCount: r.correction_count,
});

// ---------------- notes ----------------
const NOTE_FROM =
  "FROM killzone_notes n JOIN markets m ON m.id = n.market_id LEFT JOIN analysts a ON a.id = n.analyst_id " +
  "LEFT JOIN users u ON u.id = n.created_by";

const NOTE_SORT: Record<NoteSort, string> = {
  date: "n.note_date",
  market: "m.symbol COLLATE NOCASE",
  killzone: "n.killzone",
  status: "n.status",
  publish: "n.publish_status",
  updated: "n.updated_at",
  title: "n.title COLLATE NOCASE",
};

function noteWhere(f: NoteFilterBase): { w: string; vals: unknown[] } {
  const where: string[] = [];
  const vals: unknown[] = [];
  if (f.marketIds?.length) where.push(inList("n.market_id", f.marketIds, vals));
  if (f.killzones?.length) where.push(inList("n.killzone", f.killzones, vals));
  if (f.statuses?.length) where.push(inList("n.status", f.statuses, vals));
  if (f.publishStatuses?.length) where.push(inList("n.publish_status", f.publishStatuses, vals));
  if (f.confidences?.length) where.push(inList("n.confidence", f.confidences, vals));
  if (f.accesses?.length) where.push(inList("n.access", f.accesses, vals));
  if (f.analystId) (where.push("n.analyst_id = ?"), vals.push(f.analystId));
  if (f.createdBy) (where.push("n.created_by = ?"), vals.push(f.createdBy));
  if (f.linkedPostId) (where.push("n.linked_post_id = ?"), vals.push(f.linkedPostId));
  if (f.tagId) (where.push("EXISTS (SELECT 1 FROM note_tags nt WHERE nt.note_id = n.id AND nt.tag_id = ?)"), vals.push(f.tagId));
  if (f.hasScreenshot !== undefined) {
    where.push(`${f.hasScreenshot ? "" : "NOT "}EXISTS (SELECT 1 FROM attachments att WHERE att.owner_type = 'note' AND att.owner_id = n.id)`);
  }
  if (f.dateFrom) (where.push("n.note_date >= ?"), vals.push(f.dateFrom));
  if (f.dateTo) (where.push("n.note_date <= ?"), vals.push(f.dateTo));
  if (f.q) {
    where.push("(n.title LIKE ? OR n.note_md LIKE ?)");
    vals.push(like(f.q), like(f.q));
  }
  return { w: where.length ? `WHERE ${where.join(" AND ")}` : "", vals };
}

interface DbNoteRow {
  id: string;
  market_id: string;
  killzone: string;
  note_date: string;
  linked_post_id: string;
  status: string;
  confidence: string | null;
  title: string;
  access: string;
  publish_status: string;
  publish_at: string | null;
  analyst_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  market_symbol: string;
  analyst_name: string | null;
  created_by_name: string | null;
  screenshot_count: number;
  tag_names: string | null;
}

const mapNote = (r: DbNoteRow): NoteListRow => ({
  id: r.id,
  marketId: r.market_id,
  marketSymbol: r.market_symbol,
  killzone: r.killzone as NoteListRow["killzone"],
  noteDate: r.note_date,
  linkedPostId: r.linked_post_id,
  status: r.status as NoteListRow["status"],
  confidence: r.confidence as NoteListRow["confidence"],
  title: r.title,
  access: r.access as NoteListRow["access"],
  publishStatus: r.publish_status as NoteListRow["publishStatus"],
  publishAt: r.publish_at,
  analystId: r.analyst_id,
  analystName: r.analyst_name,
  createdBy: r.created_by,
  createdByName: r.created_by_name,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  publishedAt: r.published_at,
  tagNames: names(r.tag_names),
  screenshotCount: r.screenshot_count,
});

export class D1ListRepository implements ListRepository {
  constructor(private db: D1Database) {}

  async posts(f: PostListFilter) {
    const { w, vals } = postWhere(f);
    const { limit, offset } = clampPage(f.limit, f.offset);
    const dir = f.dir === "asc" ? "ASC" : "DESC";
    const total = await this.db.prepare(`SELECT COUNT(*) AS n ${POST_FROM} ${w}`).bind(...vals).first<{ n: number }>();
    const res = await this.db
      .prepare(
        `SELECT p.id, p.type, p.market_id, p.post_date, p.week_start_date, p.bias, p.confidence, p.sentiment, p.title, p.access, p.status, ` +
          `p.publish_at, p.valid_from, p.valid_until, p.analyst_id, p.created_by, p.created_at, p.updated_at, p.published_at, ` +
          `m.symbol AS market_symbol, a.name AS analyst_name, u.name AS created_by_name, ` +
          `(SELECT COUNT(*) FROM attachments att WHERE att.owner_type = 'post' AND att.owner_id = p.id) AS screenshot_count, ` +
          `(SELECT group_concat(t.name, char(31)) FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id) AS tag_names, ` +
          `r.id AS result_id, ${EFF} AS effective_outcome, ` +
          `(SELECT COUNT(*) FROM result_corrections c2 WHERE c2.result_id = r.id) AS correction_count ` +
          `${POST_FROM} ${w} ORDER BY ${POST_SORT[f.sort]} ${dir}, p.updated_at DESC, p.id DESC LIMIT ? OFFSET ?`,
      )
      .bind(...vals, limit, offset)
      .all<DbPostRow>();
    return { items: res.results.map(mapPost), total: total?.n ?? 0 };
  }

  async postIds(f: PostFilterBase, max: number) {
    const { w, vals } = postWhere(f);
    const total = await this.db.prepare(`SELECT COUNT(*) AS n ${POST_FROM} ${w}`).bind(...vals).first<{ n: number }>();
    const res = await this.db
      .prepare(`SELECT p.id ${POST_FROM} ${w} ORDER BY ${POST_DATE} DESC, p.id DESC LIMIT ?`)
      .bind(...vals, Math.max(1, Math.min(max, 5000)))
      .all<{ id: string }>();
    return { ids: res.results.map((r) => r.id), total: total?.n ?? 0 };
  }

  async notes(f: NoteListFilter) {
    const { w, vals } = noteWhere(f);
    const { limit, offset } = clampPage(f.limit, f.offset);
    const dir = f.dir === "asc" ? "ASC" : "DESC";
    const total = await this.db.prepare(`SELECT COUNT(*) AS n ${NOTE_FROM} ${w}`).bind(...vals).first<{ n: number }>();
    const res = await this.db
      .prepare(
        `SELECT n.id, n.market_id, n.killzone, n.note_date, n.linked_post_id, n.status, n.confidence, n.title, n.access, n.publish_status, ` +
          `n.publish_at, n.analyst_id, n.created_by, n.created_at, n.updated_at, n.published_at, ` +
          `m.symbol AS market_symbol, a.name AS analyst_name, u.name AS created_by_name, ` +
          `(SELECT COUNT(*) FROM attachments att WHERE att.owner_type = 'note' AND att.owner_id = n.id) AS screenshot_count, ` +
          `(SELECT group_concat(t.name, char(31)) FROM note_tags nt JOIN tags t ON t.id = nt.tag_id WHERE nt.note_id = n.id) AS tag_names ` +
          `${NOTE_FROM} ${w} ORDER BY ${NOTE_SORT[f.sort]} ${dir}, n.updated_at DESC, n.id DESC LIMIT ? OFFSET ?`,
      )
      .bind(...vals, limit, offset)
      .all<DbNoteRow>();
    return { items: res.results.map(mapNote), total: total?.n ?? 0 };
  }

  async noteIds(f: NoteFilterBase, max: number) {
    const { w, vals } = noteWhere(f);
    const total = await this.db.prepare(`SELECT COUNT(*) AS n ${NOTE_FROM} ${w}`).bind(...vals).first<{ n: number }>();
    const res = await this.db
      .prepare(`SELECT n.id ${NOTE_FROM} ${w} ORDER BY n.note_date DESC, n.id DESC LIMIT ?`)
      .bind(...vals, Math.max(1, Math.min(max, 5000)))
      .all<{ id: string }>();
    return { ids: res.results.map((r) => r.id), total: total?.n ?? 0 };
  }
}
