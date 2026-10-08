import type { PublicEntityType } from "@shared/constants";
import { newId } from "../../lib/ids";
import type { ViewerRow, ViewLogRepository } from "../publicTypes";

const MAX_IDS = 90;

export class D1ViewLogRepository implements ViewLogRepository {
  constructor(private db: D1Database) {}

  async add(row: { userId: string | null; entityType: PublicEntityType; entityId: string; ipHash: string | null }) {
    await this.db
      .prepare("INSERT INTO view_log (id, user_id, entity_type, entity_id, ip_hash) VALUES (?, ?, ?, ?, ?)")
      .bind(newId(), row.userId, row.entityType, row.entityId, row.ipHash)
      .run();
  }

  async existsSince(
    who: { userId: string | null; ipHash: string | null },
    entityType: PublicEntityType,
    entityId: string,
    sinceIso: string,
  ) {
    const base = "SELECT 1 AS x FROM view_log WHERE entity_type = ? AND entity_id = ? AND viewed_at >= ? AND ";
    const r = who.userId
      ? await this.db.prepare(`${base}user_id = ? LIMIT 1`).bind(entityType, entityId, sinceIso, who.userId).first()
      : await this.db.prepare(`${base}user_id IS NULL AND ip_hash IS ? LIMIT 1`).bind(entityType, entityId, sinceIso, who.ipHash).first();
    return r !== null;
  }

  async countByEntities(entityType: PublicEntityType, ids: string[]) {
    const list = ids.slice(0, MAX_IDS);
    const out: Record<string, { views: number; viewers: number }> = {};
    if (list.length === 0) return out;
    const res = await this.db
      .prepare(
        `SELECT entity_id, COUNT(*) AS views, COUNT(DISTINCT user_id) AS viewers FROM view_log ` +
          `WHERE entity_type = ? AND entity_id IN (${list.map(() => "?").join(", ")}) GROUP BY entity_id`,
      )
      .bind(entityType, ...list)
      .all<{ entity_id: string; views: number; viewers: number }>();
    for (const r of res.results) out[r.entity_id] = { views: r.views, viewers: r.viewers };
    return out;
  }

  async viewersOf(entityType: PublicEntityType, entityId: string, limit: number) {
    const res = await this.db
      .prepare(
        "SELECT v.user_id AS user_id, u.name AS name, u.email AS email, COUNT(*) AS views, MAX(v.viewed_at) AS last_viewed_at " +
          "FROM view_log v JOIN users u ON u.id = v.user_id WHERE v.entity_type = ? AND v.entity_id = ? " +
          "GROUP BY v.user_id, u.name, u.email ORDER BY last_viewed_at DESC LIMIT ?",
      )
      .bind(entityType, entityId, Math.min(Math.max(limit, 1), 200))
      .all<{ user_id: string; name: string; email: string; views: number; last_viewed_at: string }>();
    return res.results.map(
      (r): ViewerRow => ({ userId: r.user_id, name: r.name, email: r.email, views: r.views, lastViewedAt: r.last_viewed_at }),
    );
  }
}
