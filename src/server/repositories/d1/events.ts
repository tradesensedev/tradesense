import { newId } from "../../lib/ids";
import type { EventFilter, EventRepository, EventRow } from "../publicTypes";
import { buildSet, clampPage } from "./util";

interface DbEvent {
  id: string;
  title: string;
  starts_at: string;
  impact: string;
  currency: string | null;
  source: string;
  description_md: string;
  created_by: string | null;
  created_at: string;
}

const map = (r: DbEvent): EventRow => ({
  id: r.id,
  title: r.title,
  startsAt: r.starts_at,
  impact: r.impact as EventRow["impact"],
  currency: r.currency,
  source: r.source as EventRow["source"],
  descriptionMd: r.description_md,
  createdBy: r.created_by,
  createdAt: r.created_at,
});

const COLS: Record<string, string> = {
  title: "title",
  startsAt: "starts_at",
  impact: "impact",
  currency: "currency",
  descriptionMd: "description_md",
};

const like = (q: string) => `%${q.replace(/[%_]/g, " ")}%`;

export class D1EventRepository implements EventRepository {
  constructor(private db: D1Database) {}

  async list(f: EventFilter) {
    const where: string[] = [];
    const vals: unknown[] = [];
    if (f.from) (where.push("starts_at >= ?"), vals.push(f.from));
    if (f.to) (where.push("starts_at < ?"), vals.push(f.to));
    if (f.impacts?.length) {
      where.push(`impact IN (${f.impacts.map(() => "?").join(", ")})`);
      vals.push(...f.impacts);
    }
    if (f.currency) (where.push("currency = ?"), vals.push(f.currency));
    if (f.q) (where.push("(title LIKE ? OR description_md LIKE ?)"), vals.push(like(f.q), like(f.q)));
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const dir = f.order === "desc" ? "DESC" : "ASC";
    const { limit, offset } = clampPage(f.limit, f.offset);
    const total = await this.db.prepare(`SELECT COUNT(*) AS n FROM events ${w}`).bind(...vals).first<{ n: number }>();
    const res = await this.db
      .prepare(`SELECT * FROM events ${w} ORDER BY starts_at ${dir}, id ${dir} LIMIT ? OFFSET ?`)
      .bind(...vals, limit, offset)
      .all<DbEvent>();
    return { items: res.results.map(map), total: total?.n ?? 0 };
  }

  async findById(id: string) {
    const r = await this.db.prepare("SELECT * FROM events WHERE id = ?").bind(id).first<DbEvent>();
    return r ? map(r) : null;
  }

  async create(row: Omit<EventRow, "createdAt">) {
    const id = row.id || newId();
    await this.db
      .prepare(
        "INSERT INTO events (id, title, starts_at, impact, currency, source, description_md, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(id, row.title, row.startsAt, row.impact, row.currency, row.source, row.descriptionMd, row.createdBy)
      .run();
    return (await this.findById(id))!;
  }

  async update(id: string, patch: Parameters<EventRepository["update"]>[1]) {
    const { sql, vals } = buildSet(patch as Record<string, unknown>, COLS);
    if (!sql) return;
    await this.db.prepare(`UPDATE events SET ${sql} WHERE id = ?`).bind(...vals, id).run();
  }

  async delete(id: string) {
    await this.db.prepare("DELETE FROM events WHERE id = ?").bind(id).run();
  }
}
