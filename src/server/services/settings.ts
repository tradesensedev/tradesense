import { SETTING_DEFAULTS, SETTING_SCHEMAS, type SettingKey, type Settings, type SettingsPatch } from "@shared/settings";
import type { Repositories } from "../repositories/types";

export class SettingsService {
  constructor(private repos: Repositories) {}

  // Stored values override defaults; an invalid stored value falls back to the default.
  async getAll(): Promise<Settings> {
    const rows = await this.repos.settings.getAll();
    const out: Record<string, unknown> = { ...SETTING_DEFAULTS };
    for (const row of rows) {
      if (!(row.key in SETTING_SCHEMAS)) continue;
      const key = row.key as SettingKey;
      try {
        const parsed = SETTING_SCHEMAS[key].safeParse(JSON.parse(row.valueJson));
        if (parsed.success) out[key] = parsed.data;
      } catch {
        // keep default
      }
    }
    return out as Settings;
  }

  async update(userId: string, patch: SettingsPatch) {
    const before = await this.getAll();
    const diff: Record<string, { from: unknown; to: unknown }> = {};
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) continue;
      const key = k as SettingKey;
      if (JSON.stringify(before[key]) === JSON.stringify(v)) continue;
      await this.repos.settings.set(key, JSON.stringify(v), userId);
      diff[key] = { from: before[key], to: v };
    }
    return { settings: await this.getAll(), diff };
  }
}
