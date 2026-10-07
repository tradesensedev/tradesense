import { nowIso } from "../../lib/time";
import type { SavedViewRepository, SavedViewRow } from "../types";
import { buildSet, fromBool, toBool } from "./util";

interface DbView {
  id: string;
  user_id: string;
  scope: string;
  name: string;
  filters_json: string;
  columns_json: string;
  shared: number;
  created_at: string;
}

const map = (r: DbView): SavedViewRow => ({
  id: r.id,
  userId: r.user_id,
  scope: r.scope,
  name: r.name,
  filtersJson: r.filters_json,
  columnsJson: r.columns_json,
  shared: toBool(r.shared),
  createdAt: r.created_at,
});

const COLS: Record<string, string> = {
  name: "name",
  filtersJson: "filters_json",
  columnsJson: "columns_json",
  shared: "shared",
};

export class D1SavedViewRepository implements SavedViewRepository {
  constructor(private db: D1Database) {}

  async listVisible(scope: string, userId: string) {
    const res = await this.db
      .prepare("SELECT * FROM saved_views WHERE scope = ? AND (user_id = ? OR shared = 1) ORDER BY name COLLATE NOCASE, id")
      .bind(scope, userId)
      .all<DbView>();
    return res.results.map(map);
  }

  async findById(id: string) {
    const r = await this.db.prepare("SELECT * FROM saved_views WHERE id = ?").bind(id).first<DbView>();
    return r ? map(r) : null;
  }

  async create(row: Omit<SavedViewRow, "createdAt">) {
    const at = nowIso();
    await this.db
      .prepare(
        "INSERT INTO saved_views (id, user_id, scope, name, filters_json, columns_json, shared, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(row.id, row.userId, row.scope, row.name, row.filtersJson, row.columnsJson, fromBool(row.shared), at)
      .run();
    return { ...row, createdAt: at };
  }

  async update(id: string, patch: Partial<Pick<SavedViewRow, "name" | "filtersJson" | "columnsJson" | "shared">>) {
    const { sql, vals } = buildSet(patch as Record<string, unknown>, COLS, ["shared"]);
    if (!sql) return;
    await this.db.prepare(`UPDATE saved_views SET ${sql} WHERE id = ?`).bind(...vals, id).run();
  }

  async delete(id: string) {
    await this.db.prepare("DELETE FROM saved_views WHERE id = ?").bind(id).run();
  }
}
