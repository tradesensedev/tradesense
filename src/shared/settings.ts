import { z } from "zod";

// Single registry of every settings key: schema + default. Server and client both use it.
export const SETTING_SCHEMAS = {
  default_access_daily: z.enum(["free", "paid"]),
  default_access_weekly: z.enum(["free", "paid"]),
  default_access_killzone_note: z.enum(["free", "paid"]),
  default_access_screenshot: z.enum(["inherit", "free", "paid", "public"]),
  free_delay_hours: z.number().int().min(0).max(720),
  open_archive_days: z.number().int().min(0).max(3650),
  announcement_banner: z.string().max(500),
  disclaimer_text: z.string().trim().min(1).max(2000),
  active_evaluation_rule_version: z.number().int().min(1),
  regional_pricing_enabled: z.boolean(),
  reminder_days: z
    .array(z.number().int().min(1).max(365))
    .max(10)
    .transform((a) => [...new Set(a)].sort((x, y) => y - x)),
  refund_policy_text: z.string().max(5000),
} as const;

export type SettingKey = keyof typeof SETTING_SCHEMAS;
export type Settings = { [K in SettingKey]: z.infer<(typeof SETTING_SCHEMAS)[K]> };

export const SETTING_DEFAULTS: Settings = {
  default_access_daily: "free",
  default_access_weekly: "paid",
  default_access_killzone_note: "paid",
  default_access_screenshot: "inherit",
  free_delay_hours: 0,
  open_archive_days: 7,
  announcement_banner: "",
  disclaimer_text:
    "TradeSense provides market research and education only. This is not financial advice. Past performance is not indicative of future results.",
  active_evaluation_rule_version: 1,
  regional_pricing_enabled: false,
  reminder_days: [7, 3, 1],
  refund_policy_text: "Payments are made in cryptocurrency and are generally non-refundable.",
};

// Changed through the evaluation rules screen (Phase 3), never through the settings form.
export const READONLY_SETTING_KEYS: SettingKey[] = ["active_evaluation_rule_version"];

const { active_evaluation_rule_version: _readonly, ...editableShape } = SETTING_SCHEMAS;

export const settingsPatchSchema = z
  .object(editableShape)
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, "No settings provided");
export type SettingsPatch = z.infer<typeof settingsPatchSchema>;
