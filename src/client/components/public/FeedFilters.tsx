import { useState, type ReactNode } from "react";
import type { PublicMetaDto } from "@shared/public";
import { KILLZONES, NOTE_STATUSES } from "@shared/constants";
import { Field, inputCls } from "../ui";
import { KILLZONE_LABEL, NOTE_STATUS_LABEL } from "../../lib/labels";
import { CONFIDENCE_LABEL } from "../../lib/publicFmt";

// Filter keys = the API query names (the public feed speaks the same filter language as the admin lists).
export const FEED_KEYS = [
  "type", "marketId", "killzone", "bias", "noteStatus", "confidence", "sentiment", "result", "access", "tagId", "analystId",
  "hasScreenshot", "bookmarked", "q", "period", "date", "month", "dateFrom", "dateTo", "sort", "dir",
] as const;
// Everything except sorting counts as an "active filter".
const NOT_FILTERS = new Set(["sort", "dir", "date", "month", "dateFrom", "dateTo"]);
export const activeFilterCount = (sp: URLSearchParams) => FEED_KEYS.filter((k) => !NOT_FILTERS.has(k) && sp.get(k)).length;

type Opt = [string, string];
function Sel({ label, value, onChange, options, any = "Any" }: { label: string; value: string; onChange: (v: string) => void; options: Opt[]; any?: string }) {
  return (
    <Field label={label}>
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{any}</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </Field>
  );
}

const SORTS: Opt[] = [
  ["date:desc", "Newest first"],
  ["date:asc", "Oldest first"],
  ["published:desc", "Recently published"],
  ["market:asc", "Market A-Z"],
];

export type SetParams = (patch: Record<string, string | undefined>) => void;

export default function FeedFilters({ sp, set, meta, signedIn, entitled }: { sp: URLSearchParams; set: SetParams; meta: PublicMetaDto | undefined; signedIn: boolean; entitled: boolean }) {
  const g = (k: string) => sp.get(k) ?? "";
  const [q, setQ] = useState(g("q"));
  const period = g("period");
  const sortValue = `${g("sort") || "date"}:${g("dir") || "desc"}`;
  const contentFilter = !!(g("bias") || g("result") || g("sentiment") || g("noteStatus") || g("confidence") || g("tagId") || g("hasScreenshot") || g("q"));
  const conflict = !!(g("bias") || g("result") || g("sentiment")) && !!(g("killzone") || g("noteStatus"));
  const n = activeFilterCount(sp);

  const row = (children: ReactNode) => <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
  return (
    <details open className="rounded-md border border-slate-800 p-3">
      <summary className="cursor-pointer text-sm font-medium">Filters{n > 0 ? ` (${n} active)` : ""}</summary>
      <div className="mt-3 space-y-3">
        <form className="flex gap-2" role="search" onSubmit={(e) => { e.preventDefault(); set({ q: q.trim() || undefined }); }}>
          <input className={inputCls} type="search" aria-label="Search" placeholder="Search title, summary and text" value={q} maxLength={100} onChange={(e) => setQ(e.target.value)} />
          <button className="rounded-md border border-slate-600 px-3 text-sm hover:border-slate-400" type="submit">Search</button>
        </form>
        {row(<>
          <Sel label="Type" value={g("type")} onChange={(v) => set({ type: v || undefined })} options={[["daily", "Daily bias"], ["weekly", "Weekly outlook"], ["note", "Killzone notes"]]} any="All" />
          <Sel label="Market" value={g("marketId")} onChange={(v) => set({ marketId: v || undefined })} options={(meta?.markets ?? []).map((m): Opt => [m.id, `${m.symbol} - ${m.name}`])} any="All markets" />
          <Sel label="Access" value={g("access")} onChange={(v) => set({ access: v || undefined })} options={[["free", "Free"], ["paid", "Subscriber"]]} any="All" />
          <Sel label="Sort" value={sortValue} onChange={(v) => { const [s, d] = v.split(":"); set({ sort: s === "date" && d === "desc" ? undefined : s, dir: s === "date" && d === "desc" ? undefined : d }); }} options={SORTS} any="Newest first" />
        </>)}
        {row(<>
          <Sel label="Period" value={period} onChange={(v) => set({ period: v || undefined, date: undefined, month: undefined, dateFrom: undefined, dateTo: undefined })} options={[["today", "Today"], ["week", "This week"], ["month", "This month"], ["date", "A single day"], ["range", "Date range"]]} any="Any time" />
          {period === "date" && <Field label="Day"><input type="date" className={inputCls} value={g("date")} onChange={(e) => set({ date: e.target.value || undefined })} /></Field>}
          {period === "month" && <Field label="Month"><input type="month" className={inputCls} value={g("month")} onChange={(e) => set({ month: e.target.value || undefined })} /></Field>}
          {period === "range" && <>
            <Field label="From"><input type="date" className={inputCls} value={g("dateFrom")} onChange={(e) => set({ dateFrom: e.target.value || undefined })} /></Field>
            <Field label="To"><input type="date" className={inputCls} value={g("dateTo")} onChange={(e) => set({ dateTo: e.target.value || undefined })} /></Field>
          </>}
        </>)}
        {row(<>
          <Sel label="Bias" value={g("bias")} onChange={(v) => set({ bias: v || undefined })} options={[["bullish", "▲ Bullish"], ["bearish", "▼ Bearish"], ["neutral", "● Neutral"]]} />
          <Sel label="Confidence" value={g("confidence")} onChange={(v) => set({ confidence: v || undefined })} options={Object.entries(CONFIDENCE_LABEL)} />
          <Sel label="Result" value={g("result")} onChange={(v) => set({ result: v || undefined })} options={[["correct", "✓ Correct"], ["wrong", "✗ Wrong"], ["partial", "◐ Partial"], ["pending", "○ Pending"]]} />
          <Sel label="Killzone" value={g("killzone")} onChange={(v) => set({ killzone: v || undefined })} options={KILLZONES.map((k): Opt => [k, KILLZONE_LABEL[k] ?? k])} />
          <Sel label="Note status" value={g("noteStatus")} onChange={(v) => set({ noteStatus: v || undefined })} options={NOTE_STATUSES.map((s): Opt => [s, NOTE_STATUS_LABEL[s] ?? s])} />
          <Sel label="Tag" value={g("tagId")} onChange={(v) => set({ tagId: v || undefined })} options={(meta?.tags ?? []).map((t): Opt => [t.id, t.name])} />
          <Sel label="Analyst" value={g("analystId")} onChange={(v) => set({ analystId: v || undefined })} options={(meta?.analysts ?? []).map((a): Opt => [a.id, a.name])} />
        </>)}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={g("hasScreenshot") === "1"} onChange={(e) => set({ hasScreenshot: e.target.checked ? "1" : undefined })} /> Has screenshot</label>
          {signedIn && <label className="flex items-center gap-2"><input type="checkbox" checked={g("bookmarked") === "1"} onChange={(e) => set({ bookmarked: e.target.checked ? "1" : undefined })} /> Bookmarked only</label>}
        </div>
        {conflict && <p className="text-xs text-amber-200">Bias, result and sentiment apply to daily/weekly posts; killzone and note status apply to notes. Using both together shows nothing.</p>}
        {contentFilter && !entitled && <p className="text-xs text-slate-400">Filters on bias, result, tags, confidence and text only match analysis you can open. Locked items are never matched.</p>}
      </div>
    </details>
  );
}
