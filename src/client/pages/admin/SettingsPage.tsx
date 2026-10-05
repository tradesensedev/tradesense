import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SettingKey, Settings } from "@shared/settings";
import { Badge, Field, Notice, PageHeader, btnPrimary, inputCls } from "../../components/ui";
import { useRefreshLookups } from "../../lib/admin";
import { api, errorMessage } from "../../lib/api";

interface SettingsResponse {
  settings: Settings;
  readonly: SettingKey[];
}

// Numbers and lists are edited as text, converted when saving.
interface Form {
  default_access_daily: Settings["default_access_daily"];
  default_access_weekly: Settings["default_access_weekly"];
  default_access_killzone_note: Settings["default_access_killzone_note"];
  default_access_screenshot: Settings["default_access_screenshot"];
  free_delay_hours: string;
  open_archive_days: string;
  announcement_banner: string;
  disclaimer_text: string;
  regional_pricing_enabled: boolean;
  reminder_days: string;
  refund_policy_text: string;
}

const toForm = (s: Settings): Form => ({
  default_access_daily: s.default_access_daily,
  default_access_weekly: s.default_access_weekly,
  default_access_killzone_note: s.default_access_killzone_note,
  default_access_screenshot: s.default_access_screenshot,
  free_delay_hours: String(s.free_delay_hours),
  open_archive_days: String(s.open_archive_days),
  announcement_banner: s.announcement_banner,
  disclaimer_text: s.disclaimer_text,
  regional_pricing_enabled: s.regional_pricing_enabled,
  reminder_days: s.reminder_days.join(", "),
  refund_policy_text: s.refund_policy_text,
});

// Returns only the keys that changed, or an error sentence.
function toPatch(f: Form, cur: Settings): { patch: Record<string, unknown> } | { error: string } {
  const whole = (label: string, v: string, min: number): number | string => {
    const n = Number(v.trim());
    return v.trim() !== "" && Number.isInteger(n) && n >= min ? n : `${label} must be a whole number, ${min} or more`;
  };
  const delay = whole("Free delay hours", f.free_delay_hours, 0);
  if (typeof delay === "string") return { error: delay };
  const archive = whole("Open archive days", f.open_archive_days, 0);
  if (typeof archive === "string") return { error: archive };
  const days = f.reminder_days.split(/[,\s]+/).filter(Boolean).map(Number);
  if (days.some((d) => !Number.isInteger(d) || d < 1)) return { error: "Reminder days must be whole numbers like 7, 3, 1" };
  const sorted = [...new Set(days)].sort((a, b) => b - a);

  const next: Record<string, unknown> = {
    default_access_daily: f.default_access_daily,
    default_access_weekly: f.default_access_weekly,
    default_access_killzone_note: f.default_access_killzone_note,
    default_access_screenshot: f.default_access_screenshot,
    free_delay_hours: delay,
    open_archive_days: archive,
    announcement_banner: f.announcement_banner,
    disclaimer_text: f.disclaimer_text,
    regional_pricing_enabled: f.regional_pricing_enabled,
    reminder_days: sorted,
    refund_policy_text: f.refund_policy_text,
  };
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(next)) {
    if (JSON.stringify(v) !== JSON.stringify(cur[k as SettingKey])) patch[k] = v;
  }
  return { patch };
}

function AccessSelect({ value, onChange, withInherit }: { value: string; onChange: (v: string) => void; withInherit?: boolean }) {
  return (
    <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
      {withInherit && <option value="inherit">Same as its post or note</option>}
      <option value="free">Free</option>
      <option value="paid">Paid</option>
      {withInherit && <option value="public">Public (everyone)</option>}
    </select>
  );
}

export default function SettingsPage() {
  const qc = useQueryClient();
  const refreshLookups = useRefreshLookups();
  const q = useQuery({ queryKey: ["settings"], queryFn: () => api<SettingsResponse>("/api/admin/settings") });
  const [form, setForm] = useState<Form | null>(null);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (q.data) setForm(toForm(q.data.settings));
  }, [q.data]);

  const save = useMutation({
    mutationFn: (patch: Record<string, unknown>) => api<SettingsResponse>("/api/admin/settings", { method: "PUT", body: patch }),
    onSuccess: (data) => {
      qc.setQueryData(["settings"], data);
      void refreshLookups();
      setMsg({ kind: "success", text: "Settings saved." });
    },
    onError: (e) => setMsg({ kind: "error", text: errorMessage(e) }),
  });

  if (q.isLoading || !form || !q.data) return <p className="text-sm text-slate-400">Loading...</p>;
  if (q.isError) return <Notice kind="error">{errorMessage(q.error)}</Notice>;
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    const r = toPatch(form!, q.data!.settings);
    if ("error" in r) return setMsg({ kind: "error", text: r.error });
    if (Object.keys(r.patch).length === 0) return setMsg({ kind: "success", text: "Nothing changed." });
    save.mutate(r.patch);
  }

  return (
    <>
      <PageHeader title="Settings" />
      <form onSubmit={submit} className="max-w-3xl space-y-6">
        <section className="space-y-3 rounded-md border border-slate-800 p-4">
          <h2 className="font-medium">Access defaults</h2>
          <p className="text-xs text-slate-400">Used when a new item is created. Every post, note and screenshot can still be overridden individually.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Daily post"><AccessSelect value={form.default_access_daily} onChange={(v) => set("default_access_daily", v as Form["default_access_daily"])} /></Field>
            <Field label="Weekly post"><AccessSelect value={form.default_access_weekly} onChange={(v) => set("default_access_weekly", v as Form["default_access_weekly"])} /></Field>
            <Field label="Killzone note"><AccessSelect value={form.default_access_killzone_note} onChange={(v) => set("default_access_killzone_note", v as Form["default_access_killzone_note"])} /></Field>
            <Field label="Screenshot"><AccessSelect withInherit value={form.default_access_screenshot} onChange={(v) => set("default_access_screenshot", v as Form["default_access_screenshot"])} /></Field>
          </div>
        </section>

        <section className="space-y-3 rounded-md border border-slate-800 p-4">
          <h2 className="font-medium">Visibility timing</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Free delay (hours)" hint="Delay before free viewers see an item. 0 means no delay. Applied by the public site in Phase 4.">
              <input className={inputCls} inputMode="numeric" value={form.free_delay_hours} onChange={(e) => set("free_delay_hours", e.target.value)} />
            </Field>
            <Field label="Open archive (days)" hint="Items older than this are open to everyone so visitors can verify past calls.">
              <input className={inputCls} inputMode="numeric" value={form.open_archive_days} onChange={(e) => set("open_archive_days", e.target.value)} />
            </Field>
          </div>
        </section>

        <section className="space-y-3 rounded-md border border-slate-800 p-4">
          <h2 className="font-medium">Site text</h2>
          <Field label="Announcement banner" hint="Shown at the top of the public site. Leave empty for no banner. No urgency tricks or profit claims.">
            <input className={inputCls} maxLength={500} value={form.announcement_banner} onChange={(e) => set("announcement_banner", e.target.value)} />
          </Field>
          <Field label="Disclaimer text" hint="Shown in the footer and on every post and note.">
            <textarea className={inputCls} rows={3} maxLength={2000} value={form.disclaimer_text} onChange={(e) => set("disclaimer_text", e.target.value)} />
          </Field>
          <Field label="Refund policy text">
            <textarea className={inputCls} rows={3} maxLength={5000} value={form.refund_policy_text} onChange={(e) => set("refund_policy_text", e.target.value)} />
          </Field>
        </section>

        <section className="space-y-3 rounded-md border border-slate-800 p-4">
          <h2 className="font-medium">Subscriptions</h2>
          <Field label="Renewal reminder days" hint="Days before expiry when a reminder email is sent, separated by commas. Example: 7, 3, 1">
            <input className={inputCls} value={form.reminder_days} onChange={(e) => set("reminder_days", e.target.value)} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.regional_pricing_enabled} onChange={(e) => set("regional_pricing_enabled", e.target.checked)} />
            Regional pricing enabled <span className="text-xs text-slate-400">(off = one flat global price)</span>
          </label>
        </section>

        <section className="space-y-2 rounded-md border border-slate-800 p-4">
          <h2 className="font-medium">Evaluation rules</h2>
          <p className="text-sm text-slate-300">
            Active rule version: <Badge tone="blue">v{q.data.settings.active_evaluation_rule_version}</Badge>
          </p>
          <p className="text-xs text-slate-400">Read-only here. It changes on the evaluation rules screen (Phase 3).</p>
        </section>

        {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
        <button className={btnPrimary} disabled={save.isPending}>{save.isPending ? "Saving..." : "Save settings"}</button>
      </form>
    </>
  );
}
