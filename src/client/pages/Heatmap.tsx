import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { PublicHeatmapDto, PublicPostItem } from "@shared/public";
import DetailDrawer from "../components/public/DetailDrawer";
import { Field, Notice, PageHeader, inputCls } from "../components/ui";
import { errorMessage } from "../lib/api";
import { useDrawer, usePublicMeta, usePublicQuery } from "../lib/publicApi";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
const navBtn = "rounded-md border border-slate-700 px-3 py-2 text-sm hover:border-slate-500";
const BIAS_ICON = { bullish: "▲", bearish: "▼", neutral: "●" } as const;
const RESULT_ICON = { correct: "✓", wrong: "✗", partial: "◐" } as const;
const BIAS_CLS = { bullish: "border-emerald-700 bg-emerald-900/40", bearish: "border-red-700 bg-red-900/40", neutral: "border-slate-600 bg-slate-800" } as const;

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Mon-first calendar: leading blanks, one entry per day, trailing blanks up to a full week.
export function monthCells(month: string): (string | null)[] {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (string | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) cells.push(`${month}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function label(p: PublicPostItem | undefined, date: string): string {
  if (!p) return `${date}: nothing published`;
  const c = p.content;
  if (!c) return `${date}: locked analysis`;
  return `${date}: ${c.bias}, ${c.result ? `result ${c.result.outcome}${c.result.corrected ? " (corrected)" : ""}` : "result pending"}`;
}

export default function Heatmap() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const meta = usePublicMeta();
  const { open } = useDrawer();
  const qm = sp.get("month");
  const month = qm && MONTH_RE.test(qm) ? qm : (meta.data?.today ?? new Date().toISOString().slice(0, 10)).slice(0, 7);
  const markets = meta.data?.markets ?? [];
  const market = markets.find((m) => m.id === sp.get("market")) ?? markets[0];
  const go = (mo: string, mk: string | undefined) => `/heatmap?month=${mo}${mk ? `&market=${mk}` : ""}`;
  const q = usePublicQuery<PublicHeatmapDto>(["heatmap", month, market?.id ?? ""], `/api/public/heatmap?month=${month}&marketId=${market?.id ?? ""}`, !!market);
  const byDate = new Map((q.data?.posts ?? []).map((p) => [p.postDate, p]));
  const open_ = (q.data?.posts ?? []).filter((p) => p.content);
  const count = (o: string | null) => open_.filter((p) => (p.content?.result?.outcome ?? null) === o).length;
  const title = new Date(`${month}-01T00:00:00Z`).toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });

  return (
    <main className="space-y-4">
      <PageHeader title="Month heatmap">
        <Link to={go(shiftMonth(month, -1), market?.id)} className={navBtn} aria-label="Previous month">← Previous</Link>
        <Link to={go(shiftMonth(month, 1), market?.id)} className={navBtn} aria-label="Next month">Next →</Link>
      </PageHeader>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Market">
          <select className={inputCls} value={market?.id ?? ""} onChange={(e) => nav(go(month, e.target.value))}>
            {markets.map((m) => <option key={m.id} value={m.id}>{m.symbol} - {m.name}</option>)}
          </select>
        </Field>
        <p className="pb-2 text-sm font-medium">{title}</p>
      </div>
      {meta.data && markets.length === 0 && <Notice kind="info">No markets are set up yet.</Notice>}
      {q.isError && <Notice kind="error">{errorMessage(q.error)}</Notice>}
      {q.isLoading && <p className="text-sm text-slate-400">Loading...</p>}

      {q.data && (
        <>
          <div role="grid" aria-label={`Daily bias for ${title}`} className="grid grid-cols-7 gap-1 text-center">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} role="columnheader" className="text-xs text-slate-400">{d}</div>)}
            {monthCells(month).map((date, i) => {
              if (!date) return <div key={`b${i}`} role="gridcell" aria-hidden="true" />;
              const p = byDate.get(date);
              const c = p?.content;
              const cls = !p ? "border-slate-900 text-slate-600" : c ? BIAS_CLS[c.bias] : "border-dashed border-slate-600 bg-slate-900";
              return (
                <div key={date} role="gridcell">
                  <button type="button" disabled={!p} aria-label={label(p, date)} onClick={() => p && open("post", p.id)} className={`flex h-16 w-full flex-col items-center justify-between rounded border p-1 text-xs ${cls} ${p ? "hover:border-slate-300" : "cursor-default"}`}>
                    <span className="self-start text-slate-300">{Number(date.slice(8))}</span>
                    {p && <span className="text-sm">{c ? <>{BIAS_ICON[c.bias]} {c.result ? RESULT_ICON[c.result.outcome] : "○"}</> : "🔒"}</span>}
                  </button>
                </div>
              );
            })}
          </div>
          <section className="space-y-2 rounded-md border border-slate-800 p-3 text-xs text-slate-300" aria-label="Legend and totals">
            <p><strong className="text-slate-100">Legend:</strong> ▲ bullish (green) · ▼ bearish (red) · ● neutral (grey) · 🔒 subscriber analysis · result ✓ correct, ✗ wrong, ◐ partial, ○ pending. Weekends have no daily post.</p>
            <p>Visible this month: {open_.length} posts · ✓ {count("correct")} · ✗ {count("wrong")} · ◐ {count("partial")} · ○ {count(null)} pending. Locked posts are not counted.</p>
          </section>
        </>
      )}
      <DetailDrawer />
    </main>
  );
}
