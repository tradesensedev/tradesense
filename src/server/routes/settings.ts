import { Hono } from "hono";
import { READONLY_SETTING_KEYS, settingsPatchSchema } from "@shared/settings";
import type { AppEnv } from "../env";
import { audit } from "../lib/audit";
import { parseJson } from "../lib/validate";
import { requirePermission } from "../middleware";
import { SettingsService } from "../services/settings";

const settings = new Hono<AppEnv>();

// Any staff member may read (editors need the defaults). Only admin may change.
settings.get("/", async (c) => {
  const all = await new SettingsService(c.var.repos).getAll();
  return c.json({ settings: all, readonly: READONLY_SETTING_KEYS });
});

settings.put("/", requirePermission("settings:manage"), async (c) => {
  const patch = await parseJson(c, settingsPatchSchema);
  const { settings: next, diff } = await new SettingsService(c.var.repos).update(c.var.user!.id, patch);
  if (Object.keys(diff).length > 0) await audit(c, "settings.update", "settings", null, diff);
  return c.json({ settings: next, readonly: READONLY_SETTING_KEYS });
});

export default settings;
