import type { BookmarkRepository, BookmarkRow } from "../publicTypes";

interface DbBookmark {
  user_id: string;
  entity_type: string;
  entity_id: string;
  created_at: string;
}

const MAX_IDS = 90; // D1 allows 100 bound values per statement

export class D1BookmarkRepository implements BookmarkRepository {
  constructor(private db: D1Database) {}

  async add(userId: string, entityType: "post" | "note", entityId: string) {
    await this.db
      .prepare("INSERT INTO bookmarks (user_id, entity_type, entity_id) VALUES (?, ?, ?) ON CONFLICT (user_id, entity_type, entity_id) DO NOTHING")
      .bind(userId, entityType, entityId)
      .run();
  }

  async remove(userId: string, entityType: "post" | "note", entityId: string) {
    await this.db
      .prepare("DELETE FROM bookmarks WHERE user_id = ? AND entity_type = ? AND entity_id = ?")
      .bind(userId, entityType, entityId)
      .run();
  }

  async listByUser(userId: string, entityType: "post" | "note", limit: number, offset: number) {
    const total = await this.db
      .prepare("SELECT COUNT(*) AS n FROM bookmarks WHERE user_id = ? AND entity_type = ?")
      .bind(userId, entityType)
      .first<{ n: number }>();
    const res = await this.db
      .prepare("SELECT * FROM bookmarks WHERE user_id = ? AND entity_type = ? ORDER BY created_at DESC, entity_id DESC LIMIT ? OFFSET ?")
      .bind(userId, entityType, Math.min(Math.max(limit, 1), 200), Math.max(offset, 0))
      .all<DbBookmark>();
    const items = res.results.map(
      (r): BookmarkRow => ({ userId: r.user_id, entityType: r.entity_type as BookmarkRow["entityType"], entityId: r.entity_id, createdAt: r.created_at }),
    );
    return { items, total: total?.n ?? 0 };
  }

  async filterBookmarked(userId: string, entityType: "post" | "note", ids: string[]) {
    const list = ids.slice(0, MAX_IDS);
    if (list.length === 0) return [];
    const res = await this.db
      .prepare(`SELECT entity_id FROM bookmarks WHERE user_id = ? AND entity_type = ? AND entity_id IN (${list.map(() => "?").join(", ")})`)
      .bind(userId, entityType, ...list)
      .all<{ entity_id: string }>();
    return res.results.map((r) => r.entity_id);
  }

  async countByEntities(entityType: "post" | "note", ids: string[]) {
    const list = ids.slice(0, MAX_IDS);
    const out: Record<string, number> = {};
    if (list.length === 0) return out;
    const res = await this.db
      .prepare(
        `SELECT entity_id, COUNT(*) AS n FROM bookmarks WHERE entity_type = ? AND entity_id IN (${list.map(() => "?").join(", ")}) GROUP BY entity_id`,
      )
      .bind(entityType, ...list)
      .all<{ entity_id: string; n: number }>();
    for (const r of res.results) out[r.entity_id] = r.n;
    return out;
  }
}
