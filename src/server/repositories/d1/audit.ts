import { newId } from "../../lib/ids";
import { nowIso } from "../../lib/time";
import type { AuditFilter, AuditRepository, AuditRow } from "../types";
import { clampPage } from "./util";

interface DbAudit {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  diff_json: string | null;
  created_at: string;
}

const map = (r: DbAudit): AuditRow => ({
  id: r.id,
  userId: r.user_id,
  action: r.action,
  entity: r.entity,
  entityId: r.entity_id,
  diffJson: r.diff_json,
  createdAt: r.created_at,
});

export class D1AuditRepository implements AuditRepository {
  constructor(private db: D1Database) {}

  async add(entry: { userId: string | null; action: string; entity: string; entityId?: string | null; diff?: unknown }) {
    await this.db
      .prepare(
        "INSERT INTO audit_log (id, user_id, action, entity, entity_id, diff_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(
        newId(),
        entry.userId,
        entry.action,
        entry.entity,
        entry.entityId ?? null,
        entry.diff === undefined ? null : JSON.stringify(entry.diff),
        nowIso(),
      )
      .run();
  }

  async list(f: AuditFilter) {
    const where: string[] = [];
    const vals: unknown[] = [];
    if (f.userId) (where.push("user_id = ?"), vals.push(f.userId));
    if (f.action) {
      if (f.action.endsWith(".")) {
        // prefix match without LIKE wildcards
        where.push("substr(action, 1, ?) = ?");
        vals.push(f.action.length, f.action);
      } else {
        where.push("action = ?");
        vals.push(f.action);
      }
    }
    if (f.entity) (where.push("entity = ?"), vals.push(f.entity));
    if (f.entityId) (where.push("entity_id = ?"), vals.push(f.entityId));
    if (f.dateFrom) (where.push("substr(created_at, 1, 10) >= ?"), vals.push(f.dateFrom));
    if (f.dateTo) (where.push("substr(created_at, 1, 10) <= ?"), vals.push(f.dateTo));
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { limit, offset } = clampPage(f.limit, f.offset);
    const total = await this.db.prepare(`SELECT COUNT(*) AS n FROM audit_log ${w}`).bind(...vals).first<{ n: number }>();
    const res = await this.db
      .prepare(`SELECT * FROM audit_log ${w} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
      .bind(...vals, limit, offset)
      .all<DbAudit>();
    return { items: res.results.map(map), total: total?.n ?? 0 };
  }
}
