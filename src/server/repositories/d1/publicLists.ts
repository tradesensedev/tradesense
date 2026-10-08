import type { Outcome } from "@shared/constants";
import { addDaysDate } from "../../lib/time";
import type {
  PublicListRepository,
  PublicNoteFilter,
  PublicNoteRow,
  PublicNoteSort,
  PublicPostFilter,
  PublicPostRow,
  PublicPostSort,
  PublicVisibility,
} from "../publicListTypes";
import { clampPage } from "./util";

// Public list engine. Differences from the admin engine (d1/lists.ts), all on purpose:
//  1) status = 'published' is written into the SQL, it is not a filter the caller can change.
//  2) content filters are combined with the viewer's "open" condition, so locked rows never match them.
//  3) sorts are a tiny allow-list of non-content columns.
// Every value is a bound parameter. NOTE: EFF must stay identical to the one in d1/lists.ts and d1/results.ts.
const SEP = "\u001f";
const EFF =
  "COALESCE((SELECT c.new_outcome FROM result_corrections c WHERE c.result_id = r.id ORDER BY c.created_at DESC, c.id DESC LIMIT 1), r.outcome)";
const POST_DATE = "(CASE p.type WHEN 'daily' THEN p.post_date ELSE p.week_start_date END)";
const POST_PUB = "COALESCE(p.published_at, p.updated_at)";
const NOTE_PUB = "COALESCE(n.published_at, n.updated_at)";

const like = (q: string) => `%${q.replace(/[%_]/g, " ")}%`;
const names = (s: string | null): string[] => (s ? s.split(SEP).sort((a, b) => a.localeCompare(b)) : []);

function inList(col: string, values: readonly string[], vals: unknown[]): string {
  vals.push(...values);
  return `${col} IN (${values.map(() => "?").join(", ")})`;
}

// SQL for "this row is open for this viewer". Mirrors isOpen() in services/access.ts.
// Weekly posts are old once Monday + 6 days <= archiveBefore, i.e. Monday <= archiveBefore - 6 days (no SQL date functions).
function openPost(v: PublicVisibility, vals: unknown[]): string | null {
  if (v.all) return null;
  const parts = [`(p.access = 'free' AND ${POST_PUB} <= ?)`];
  vals.push(v.freeBefore);
  if (v.archiveBefore !== null) {
    parts.push("(p.type = 'daily' AND p.post_date <= ?)", "(p.type = 'weekly' AND p.week_start_date <= ?)");
    vals.push(v.archiveBefore, addDaysDate(v.archiveBefore, -6));
  }
  return `(${parts.join(" OR ")})`;
}

function openNote(v: PublicVisibility, vals: unknown[]): string | null {
  if (v.all) return null;
  const parts = [`(n.access = 'free' AND ${NOTE_PUB} <= ?)`];
  vals.push(v.freeBefore);
  if (v.archiveBefore !== null) {
    parts.push("n.note_date <= ?");
    vals.push(v.archiveBefore);
  }
  return `(${parts.join(" OR ")})`;
}

// ---------------- posts ----------------
const POST_FROM =
  "FROM posts p JOIN markets m ON m.id = p.market_id LEFT JOIN analysts a ON a.id = p.analyst_id LEFT JOIN results r ON r.post_id = p.id";

const POST_SORT: Record<PublicPostSort, string> = { date: POST_DATE, published: POST_PUB, market: "m.symbol COLLATE NOCASE" };

function postWhere(f: PublicPostFilter): { w: string; vals: unknown[] } {
  const where: string[] = ["p.status = 'published'"];
  const vals: unknown[] = [];
  // metadata filters: always applied
  if (f.type) (where.push("p.type = ?"), vals.push(f.type));
  if (f.marketIds?.length) where.push(inList("p.market_id", f.marketIds, vals));
  if (f.accesses?.length) where.push(inList("p.access", f.accesses, vals));
  if (f.analystId) (where.push("p.analyst_id = ?"), vals.push(f.analystId));
  if (f.dateFrom) (where.push(`${POST_DATE} >= ?`), vals.push(f.dateFrom));
  if (f.dateTo) (where.push(`${POST_DATE} <= ?`), vals.push(f.dateTo));
  if (f.bookmarkedOnly && f.bookmarkedBy) {
    where.push("EXISTS (SELECT 1 FROM bookmarks b WHERE b.user_id = ? AND b.entity_type = 'post' AND b.entity_id = p.id)");
    vals.push(f.bookmarkedBy);
  }
  // content filters: only ever match rows the viewer may open
  const content: string[] = [];
  if (f.biases?.length) content.push(inList("p.bias", f.biases, vals));
  if (f.confidences?.length) content.push(inList("p.confidence", f.confidences, vals));
  if (f.sentiments?.length) content.push(inList("p.sentiment", f.sentiments, vals));
  if (f.results?.length) {
    const outcomes = f.results.filter((v) => v !== "pending");
    const parts: string[] = [];
    if (f.results.includes("pending")) parts.push("r.id IS NULL");
    if (outcomes.length) parts.push(`(r.id IS NOT NULL AND ${inList(EFF, outcomes, vals)})`);
    content.push(`(${parts.join(" OR ")})`);
  }
  if (f.tagId) (content.push("EXISTS (SELECT 1 FROM post_tags pt WHERE pt.post_id = p.id AND pt.tag_id = ?)"), vals.push(f.tagId));
  if (f.hasScreenshot !== undefined) {
    content.push(`${f.hasScreenshot ? "" : "NOT "}EXISTS (SELECT 1 FROM attachments att WHERE att.owner_type = 'post' AND att.owner_id = p.id)`);
  }
  if (f.q) {
    content.push("(p.title LIKE ? OR p.summary LIKE ? OR p.body_md LIKE ?)");
    vals.push(like(f.q), like(f.q), like(f.q));
  }
  if (content.length) {
    where.push(...content);
    const open = openPost(f.visibility, vals);
    if (open) where.push(open);
  }
  return { w: `WHERE ${where.join(" AND ")}`, vals };
}

interface DbPost {
  id: string;
  type: string;
  market_id: string;
  post_date: string;
  week_start_date: string;
  bias: string;
  confidence: string;
  sentiment: string | null;
  title: string;
  summary: string;
  access: string;
  pub_at: string;
  valid_until: string | null;
  analyst_id: string | null;
  market_symbol: string;
  analyst_name: string | null;
  screenshot_count: number;
  tag_names: string | null;
  result_id: string | null;
  effective_outcome: string | null;
  correction_count: number;
  bookmarked: number;
}

const mapPost = (r: DbPost): PublicPostRow => ({
  id: r.id,
  type: r.type as PublicPostRow["type"],
  marketId: r.market_id,
  marketSymbol: r.market_symbol,
  postDate: r.post_date,
  weekStartDate: r.week_start_date,
  contentDate: r.type === "weekly" ? addDaysDate(r.week_start_date, 6) : r.post_date,
  bias: r.bias as PublicPostRow["bias"],
  confidence: r.confidence as PublicPostRow["confidence"],
  sentiment: r.sentiment as PublicPostRow["sentiment"],
  title: r.title,
  summary: r.summary,
  access: r.access as PublicPostRow["access"],
  publishedAt: r.pub_at,
  validUntil: r.valid_until,
  analystId: r.analyst_id,
  analystName: r.analyst_name,
  tagNames: names(r.tag_names),
  screenshotCount: r.screenshot_count,
  resultOutcome: r.result_id ? (r.effective_outcome as Outcome) : null,
  correctionCount: r.correction_count,
  bookmarked: r.bookmarked > 0,
});

// ---------------- notes ----------------
const NOTE_FROM = "FROM killzone_notes n JOIN markets m ON m.id = n.market_id LEFT JOIN analysts a ON a.id = n.analyst_id";

const NOTE_SORT: Record<PublicNoteSort, string> = {
  date: "n.note_date",
  published: NOTE_PUB,
  market: "m.symbol COLLATE NOCASE",
  killzone: "(CASE n.killzone WHEN 'asia' THEN 1 WHEN 'london' THEN 2 WHEN 'ny_am' THEN 3 ELSE 4 END)",
};

function noteWhere(f: PublicNoteFilter): { w: string; vals: unknown[] } {
  const where: string[] = ["n.publish_status = 'published'"];
  const vals: unknown[] = [];
  if (f.marketIds?.length) where.push(inList("n.market_id", f.marketIds, vals));
  if (f.killzones?.length) where.push(inList("n.killzone", f.killzones, vals));
  if (f.accesses?.length) where.push(inList("n.access", f.accesses, vals));
  if (f.analystId) (where.push("n.analyst_id = ?"), vals.push(f.analystId));
  if (f.linkedPostId) (where.push("n.linked_post_id = ?"), vals.push(f.linkedPostId));
  if (f.dateFrom) (where.push("n.note_date >= ?"), vals.push(f.dateFrom));
  if (f.dateTo) (where.push("n.note_date <= ?"), vals.push(f.dateTo));
  if (f.bookmarkedOnly && f.bookmarkedBy) {
    where.push("EXISTS (SELECT 1 FROM bookmarks b WHERE b.user_id = ? AND b.entity_type = 'note' AND b.entity_id = n.id)");
    vals.push(f.bookmarkedBy);
  }
  const content: string[] = [];
  if (f.statuses?.length) content.push(inList("n.status", f.statuses, vals));
  if (f.confidences?.length) content.push(inList("n.confidence", f.confidences, vals));
  if (f.tagId) (content.push("EXISTS (SELECT 1 FROM note_tags nt WHERE nt.note_id = n.id AND nt.tag_id = ?)"), vals.push(f.tagId));
  if (f.hasScreenshot !== undefined) {
    content.push(`${f.hasScreenshot ? "" : "NOT "}EXISTS (SELECT 1 FROM attachments att WHERE att.owner_type = 'note' AND att.owner_id = n.id)`);
  }
  if (f.q) {
    content.push("(n.title LIKE ? OR n.note_md LIKE ?)");
    vals.push(like(f.q), like(f.q));
  }
  if (content.length) {
    where.push(...content);
    const open = openNote(f.visibility, vals);
    if (open) where.push(open);
  }
  return { w: `WHERE ${where.join(" AND ")}`, vals };
}

interface DbNote {
  id: string;
  market_id: string;
  killzone: string;
  note_date: string;
  linked_post_id: string;
  status: string;
  confidence: string | null;
  title: string;
  access: string;
  pub_at: string;
  analyst_id: string | null;
  market_symbol: string;
  analyst_name: string | null;
  screenshot_count: number;
  tag_names: string | null;
  bookmarked: number;
}

const mapNote = (r: DbNote): PublicNoteRow => ({
  id: r.id,
  marketId: r.market_id,
  marketSymbol: r.market_symbol,
  killzone: r.killzone as PublicNoteRow["killzone"],
  noteDate: r.note_date,
  contentDate: r.note_date,
  linkedPostId: r.linked_post_id,
  status: r.status as PublicNoteRow["status"],
  confidence: r.confidence as PublicNoteRow["confidence"],
  title: r.title,
  access: r.access as PublicNoteRow["access"],
  publishedAt: r.pub_at,
  analystId: r.analyst_id,
  analystName: r.analyst_name,
  tagNames: names(r.tag_names),
  screenshotCount: r.screenshot_count,
  bookmarked: r.bookmarked > 0,
});

export class D1PublicListRepository implements PublicListRepository {
  constructor(private db: D1Database) {}

  async posts(f: PublicPostFilter) {
    const { w, vals } = postWhere(f);
    const { limit, offset } = clampPage(f.limit, f.offset);
    const dir = f.dir === "asc" ? "ASC" : "DESC";
    const total = await this.db.prepare(`SELECT COUNT(*) AS n ${POST_FROM} ${w}`).bind(...vals).first<{ n: number }>();
    // the bookmark flag binds first (it sits in the SELECT list, before the WHERE)
    const bm = f.bookmarkedBy
      ? "(SELECT COUNT(*) FROM bookmarks b2 WHERE b2.user_id = ? AND b2.entity_type = 'post' AND b2.entity_id = p.id) AS bookmarked"
      : "0 AS bookmarked";
    const res = await this.db
      .prepare(
        `SELECT p.id, p.type, p.market_id, p.post_date, p.week_start_date, p.bias, p.confidence, p.sentiment, p.title, p.summary, p.access, ` +
          `${POST_PUB} AS pub_at, p.valid_until, p.analyst_id, m.symbol AS market_symbol, a.name AS analyst_name, ` +
          `(SELECT COUNT(*) FROM attachments att WHERE att.owner_type = 'post' AND att.owner_id = p.id) AS screenshot_count, ` +
          `(SELECT group_concat(t.name, char(31)) FROM post_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.post_id = p.id) AS tag_names, ` +
          `r.id AS result_id, ${EFF} AS effective_outcome, ` +
          `(SELECT COUNT(*) FROM result_corrections c2 WHERE c2.result_id = r.id) AS correction_count, ${bm} ` +
          `${POST_FROM} ${w} ORDER BY ${POST_SORT[f.sort]} ${dir}, p.id ${dir} LIMIT ? OFFSET ?`,
      )
      .bind(...(f.bookmarkedBy ? [f.bookmarkedBy] : []), ...vals, limit, offset)
      .all<DbPost>();
    return { items: res.results.map(mapPost), total: total?.n ?? 0 };
  }

  async notes(f: PublicNoteFilter) {
    const { w, vals } = noteWhere(f);
    const { limit, offset } = clampPage(f.limit, f.offset);
    const dir = f.dir === "asc" ? "ASC" : "DESC";
    const total = await this.db.prepare(`SELECT COUNT(*) AS n ${NOTE_FROM} ${w}`).bind(...vals).first<{ n: number }>();
    const bm = f.bookmarkedBy
      ? "(SELECT COUNT(*) FROM bookmarks b2 WHERE b2.user_id = ? AND b2.entity_type = 'note' AND b2.entity_id = n.id) AS bookmarked"
      : "0 AS bookmarked";
    const res = await this.db
      .prepare(
        `SELECT n.id, n.market_id, n.killzone, n.note_date, n.linked_post_id, n.status, n.confidence, n.title, n.access, ` +
          `${NOTE_PUB} AS pub_at, n.analyst_id, m.symbol AS market_symbol, a.name AS analyst_name, ` +
          `(SELECT COUNT(*) FROM attachments att WHERE att.owner_type = 'note' AND att.owner_id = n.id) AS screenshot_count, ` +
          `(SELECT group_concat(t.name, char(31)) FROM note_tags nt JOIN tags t ON t.id = nt.tag_id WHERE nt.note_id = n.id) AS tag_names, ${bm} ` +
          `${NOTE_FROM} ${w} ORDER BY ${NOTE_SORT[f.sort]} ${dir}, n.id ${dir} LIMIT ? OFFSET ?`,
      )
      .bind(...(f.bookmarkedBy ? [f.bookmarkedBy] : []), ...vals, limit, offset)
      .all<DbNote>();
    return { items: res.results.map(mapNote), total: total?.n ?? 0 };
  }
}
