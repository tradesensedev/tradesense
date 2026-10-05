import type { PostType } from "@shared/constants";
import { nowIso } from "../../lib/time";
import type { PostFilter, PostPatch, PostRepository, PostRow, NewRevision } from "../types";
import { revisionStatement } from "./revisions";
import { buildSet, clampPage } from "./util";

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
  body_md: string;
  key_drivers_md: string;
  risk_events_md: string;
  invalidation_md: string;
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
}

const map = (r: DbPost): PostRow => ({
  id: r.id,
  type: r.type as PostRow["type"],
  marketId: r.market_id,
  postDate: r.post_date,
  weekStartDate: r.week_start_date,
  bias: r.bias as PostRow["bias"],
  confidence: r.confidence as PostRow["confidence"],
  sentiment: r.sentiment as PostRow["sentiment"],
  title: r.title,
  summary: r.summary,
  bodyMd: r.body_md,
  keyDriversMd: r.key_drivers_md,
  riskEventsMd: r.risk_events_md,
  invalidationMd: r.invalidation_md,
  access: r.access as PostRow["access"],
  status: r.status as PostRow["status"],
  publishAt: r.publish_at,
  validFrom: r.valid_from,
  validUntil: r.valid_until,
  analystId: r.analyst_id,
  createdBy: r.created_by,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  publishedAt: r.published_at,
});

const COLS: Record<string, string> = {
  type: "type",
  marketId: "market_id",
  postDate: "post_date",
  weekStartDate: "week_start_date",
  bias: "bias",
  confidence: "confidence",
  sentiment: "sentiment",
  title: "title",
  summary: "summary",
  bodyMd: "body_md",
  keyDriversMd: "key_drivers_md",
  riskEventsMd: "risk_events_md",
  invalidationMd: "invalidation_md",
  access: "access",
  status: "status",
  publishAt: "publish_at",
  validFrom: "valid_from",
  validUntil: "valid_until",
  analystId: "analyst_id",
  publishedAt: "published_at",
};

export class D1PostRepository implements PostRepository {
  constructor(private db: D1Database) {}

  async findById(id: string) {
    const r = await this.db.prepare("SELECT * FROM posts WHERE id = ?").bind(id).first<DbPost>();
    return r ? map(r) : null;
  }

  async findUnique(type: PostType, marketId: string, dateKey: string) {
    const col = type === "daily" ? "post_date" : "week_start_date";
    const r = await this.db
      .prepare(`SELECT * FROM posts WHERE type = ? AND market_id = ? AND ${col} = ?`)
      .bind(type, marketId, dateKey)
      .first<DbPost>();
    return r ? map(r) : null;
  }

  async suggestForNote(marketId: string, noteDate: string, weekStartDate: string) {
    const res = await this.db
      .prepare(
        "SELECT * FROM posts WHERE market_id = ? AND ((type = 'daily' AND post_date = ?) OR (type = 'weekly' AND week_start_date = ?)) " +
          "ORDER BY CASE type WHEN 'daily' THEN 0 ELSE 1 END",
      )
      .bind(marketId, noteDate, weekStartDate)
      .all<DbPost>();
    return res.results.map(map);
  }

  async list(f: PostFilter) {
    const where: string[] = [];
    const vals: unknown[] = [];
    if (f.status) (where.push("status = ?"), vals.push(f.status));
    if (f.type) (where.push("type = ?"), vals.push(f.type));
    if (f.marketId) (where.push("market_id = ?"), vals.push(f.marketId));
    if (f.analystId) (where.push("analyst_id = ?"), vals.push(f.analystId));
    if (f.createdBy) (where.push("created_by = ?"), vals.push(f.createdBy));
    if (f.dateFrom) (where.push("(CASE type WHEN 'daily' THEN post_date ELSE week_start_date END) >= ?"), vals.push(f.dateFrom));
    if (f.dateTo) (where.push("(CASE type WHEN 'daily' THEN post_date ELSE week_start_date END) <= ?"), vals.push(f.dateTo));
    if (f.q) {
      where.push("(title LIKE ? OR summary LIKE ? OR body_md LIKE ?)");
      const like = `%${f.q.replace(/[%_]/g, " ")}%`;
      vals.push(like, like, like);
    }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { limit, offset } = clampPage(f.limit, f.offset);
    const total = await this.db.prepare(`SELECT COUNT(*) AS n FROM posts ${w}`).bind(...vals).first<{ n: number }>();
    const res = await this.db
      .prepare(
        `SELECT * FROM posts ${w} ORDER BY (CASE type WHEN 'daily' THEN post_date ELSE week_start_date END) DESC, updated_at DESC, id DESC LIMIT ? OFFSET ?`,
      )
      .bind(...vals, limit, offset)
      .all<DbPost>();
    return { items: res.results.map(map), total: total?.n ?? 0 };
  }

  async create(row: Omit<PostRow, "createdAt" | "updatedAt">) {
    const now = nowIso();
    await this.db
      .prepare(
        "INSERT INTO posts (id, type, market_id, post_date, week_start_date, bias, confidence, sentiment, title, summary, body_md, " +
          "key_drivers_md, risk_events_md, invalidation_md, access, status, publish_at, valid_from, valid_until, analyst_id, " +
          "created_by, created_at, updated_at, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        row.id, row.type, row.marketId, row.postDate, row.weekStartDate, row.bias, row.confidence, row.sentiment,
        row.title, row.summary, row.bodyMd, row.keyDriversMd, row.riskEventsMd, row.invalidationMd, row.access,
        row.status, row.publishAt, row.validFrom, row.validUntil, row.analystId, row.createdBy, now, now, row.publishedAt,
      )
      .run();
    return { ...row, createdAt: now, updatedAt: now };
  }

  async update(id: string, patch: PostPatch, revision?: NewRevision) {
    const { sql, vals } = buildSet(patch as Record<string, unknown>, COLS);
    const set = sql ? `${sql}, updated_at = ?` : "updated_at = ?";
    const stmts = [this.db.prepare(`UPDATE posts SET ${set} WHERE id = ?`).bind(...vals, nowIso(), id)];
    if (revision) stmts.push(revisionStatement(this.db, revision));
    await this.db.batch(stmts); // atomic: both succeed or both roll back
    return (await this.findById(id))!;
  }

  async delete(id: string) {
    await this.db.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
  }

  async getTagIds(id: string) {
    const res = await this.db.prepare("SELECT tag_id FROM post_tags WHERE post_id = ?").bind(id).all<{ tag_id: string }>();
    return res.results.map((r) => r.tag_id);
  }

  async setTags(id: string, tagIds: string[]) {
    const stmts = [this.db.prepare("DELETE FROM post_tags WHERE post_id = ?").bind(id)];
    for (const t of new Set(tagIds)) {
      stmts.push(this.db.prepare("INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)").bind(id, t));
    }
    await this.db.batch(stmts);
  }
}
