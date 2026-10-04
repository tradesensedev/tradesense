import { newId } from "../../lib/ids";
import { nowIso } from "../../lib/time";
import type { AuditRepository, AuditRow } from "../types";
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

  async list(opts: { limit: number; offset: number }) {
    const { limit, offset } = clampPage(opts.limit, opts.offset);
    const res = await this.db
      .prepare("SELECT * FROM audit_log ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?")
      .bind(limit, offset)
      .all<DbAudit>();
    return res.results.map(
      (r): AuditRow => ({
        id: r.id,
        userId: r.user_id,
        action: r.action,
        entity: r.entity,
        entityId: r.entity_id,
        diffJson: r.diff_json,
        createdAt: r.created_at,
      }),
    );
  }
}
