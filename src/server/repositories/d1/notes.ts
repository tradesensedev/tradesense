import { nowIso } from "../../lib/time";
import type { NewRevision, NoteFilter, NotePatch, NoteRepository, NoteRow } from "../types";
import { revisionStatement } from "./revisions";
import { buildSet, clampPage } from "./util";

interface DbNote {
  id: string;
  market_id: string;
  killzone: string;
  note_date: string;
  linked_post_id: string;
  status: string;
  confidence: string | null;
  title: string;
  note_md: string;
  access: string;
  publish_status: string;
  publish_at: string | null;
  analyst_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

const map = (r: DbNote): NoteRow => ({
  id: r.id,
  marketId: r.market_id,
  killzone: r.killzone as NoteRow["killzone"],
  noteDate: r.note_date,
  linkedPostId: r.linked_post_id,
  status: r.status as NoteRow["status"],
  confidence: r.confidence as NoteRow["confidence"],
  title: r.title,
  noteMd: r.note_md,
  access: r.access as NoteRow["access"],
  publishStatus: r.publish_status as NoteRow["publishStatus"],
  publishAt: r.publish_at,
  analystId: r.analyst_id,
  createdBy: r.created_by,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  publishedAt: r.published_at,
});

const COLS: Record<string, string> = {
  marketId: "market_id",
  killzone: "killzone",
  noteDate: "note_date",
  linkedPostId: "linked_post_id",
  status: "status",
  confidence: "confidence",
  title: "title",
  noteMd: "note_md",
  access: "access",
  publishStatus: "publish_status",
  publishAt: "publish_at",
  analystId: "analyst_id",
  publishedAt: "published_at",
};

export class D1NoteRepository implements NoteRepository {
  constructor(private db: D1Database) {}

  async findById(id: string) {
    const r = await this.db.prepare("SELECT * FROM killzone_notes WHERE id = ?").bind(id).first<DbNote>();
    return r ? map(r) : null;
  }

  async list(f: NoteFilter) {
    const where: string[] = [];
    const vals: unknown[] = [];
    if (f.publishStatus) (where.push("publish_status = ?"), vals.push(f.publishStatus));
    if (f.status) (where.push("status = ?"), vals.push(f.status));
    if (f.killzone) (where.push("killzone = ?"), vals.push(f.killzone));
    if (f.marketId) (where.push("market_id = ?"), vals.push(f.marketId));
    if (f.analystId) (where.push("analyst_id = ?"), vals.push(f.analystId));
    if (f.createdBy) (where.push("created_by = ?"), vals.push(f.createdBy));
    if (f.linkedPostId) (where.push("linked_post_id = ?"), vals.push(f.linkedPostId));
    if (f.dateFrom) (where.push("note_date >= ?"), vals.push(f.dateFrom));
    if (f.dateTo) (where.push("note_date <= ?"), vals.push(f.dateTo));
    if (f.q) {
      where.push("(title LIKE ? OR note_md LIKE ?)");
      const like = `%${f.q.replace(/[%_]/g, " ")}%`;
      vals.push(like, like);
    }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { limit, offset } = clampPage(f.limit, f.offset);
    const total = await this.db.prepare(`SELECT COUNT(*) AS n FROM killzone_notes ${w}`).bind(...vals).first<{ n: number }>();
    const res = await this.db
      .prepare(`SELECT * FROM killzone_notes ${w} ORDER BY note_date DESC, updated_at DESC, id DESC LIMIT ? OFFSET ?`)
      .bind(...vals, limit, offset)
      .all<DbNote>();
    return { items: res.results.map(map), total: total?.n ?? 0 };
  }

  async create(row: Omit<NoteRow, "createdAt" | "updatedAt">) {
    const now = nowIso();
    await this.db
      .prepare(
        "INSERT INTO killzone_notes (id, market_id, killzone, note_date, linked_post_id, status, confidence, title, note_md, access, " +
          "publish_status, publish_at, analyst_id, created_by, created_at, updated_at, published_at) " +
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        row.id, row.marketId, row.killzone, row.noteDate, row.linkedPostId, row.status, row.confidence, row.title,
        row.noteMd, row.access, row.publishStatus, row.publishAt, row.analystId, row.createdBy, now, now, row.publishedAt,
      )
      .run();
    return { ...row, createdAt: now, updatedAt: now };
  }

  async update(id: string, patch: NotePatch, revision?: NewRevision) {
    const { sql, vals } = buildSet(patch as Record<string, unknown>, COLS);
    const set = sql ? `${sql}, updated_at = ?` : "updated_at = ?";
    const stmts = [this.db.prepare(`UPDATE killzone_notes SET ${set} WHERE id = ?`).bind(...vals, nowIso(), id)];
    if (revision) stmts.push(revisionStatement(this.db, revision));
    await this.db.batch(stmts);
    return (await this.findById(id))!;
  }

  async delete(id: string) {
    await this.db.prepare("DELETE FROM killzone_notes WHERE id = ?").bind(id).run();
  }

  async getTagIds(id: string) {
    const res = await this.db.prepare("SELECT tag_id FROM note_tags WHERE note_id = ?").bind(id).all<{ tag_id: string }>();
    return res.results.map((r) => r.tag_id);
  }

  async setTags(id: string, tagIds: string[]) {
    const stmts = [this.db.prepare("DELETE FROM note_tags WHERE note_id = ?").bind(id)];
    for (const t of new Set(tagIds)) {
      stmts.push(this.db.prepare("INSERT INTO note_tags (note_id, tag_id) VALUES (?, ?)").bind(id, t));
    }
    await this.db.batch(stmts);
  }
}
