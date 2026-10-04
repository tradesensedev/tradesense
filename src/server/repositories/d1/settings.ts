import { nowIso } from "../../lib/time";
import type { SettingRow, SettingsRepository } from "../types";

interface DbSetting {
  key: string;
  value_json: string;
  updated_by: string | null;
  updated_at: string;
}

const map = (r: DbSetting): SettingRow => ({
  key: r.key,
  valueJson: r.value_json,
  updatedBy: r.updated_by,
  updatedAt: r.updated_at,
});

export class D1SettingsRepository implements SettingsRepository {
  constructor(private db: D1Database) {}

  async get(key: string) {
    const r = await this.db.prepare("SELECT * FROM settings WHERE key = ?").bind(key).first<DbSetting>();
    return r ? map(r) : null;
  }

  async getAll() {
    const res = await this.db.prepare("SELECT * FROM settings ORDER BY key").all<DbSetting>();
    return res.results.map(map);
  }

  async set(key: string, valueJson: string, updatedBy: string | null) {
    await this.db
      .prepare(
        "INSERT INTO settings (key, value_json, updated_by, updated_at) VALUES (?, ?, ?, ?) " +
          "ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_by = excluded.updated_by, updated_at = excluded.updated_at",
      )
      .bind(key, valueJson, updatedBy, nowIso())
      .run();
  }
}
