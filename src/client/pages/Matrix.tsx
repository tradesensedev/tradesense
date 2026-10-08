import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { PublicMatrixDto } from "@shared/public";
import { BiasBadge, NoteStatusBadge } from "../components/admin/badges";
import { OutcomeBadge } from "../components/admin/resultBadges";
import DetailDrawer from "../components/public/DetailDrawer";
import MatrixGrid from "../components/public/MatrixGrid";
import { Field, Notice, PageHeader, inputCls } from "../components/ui";
import { errorMessage } from "../lib/api";
import { addDays, utcToday, weekStartOf } from "../lib/dates";
import { useDrawer, usePublicMeta, usePublicQuery } from "../lib/publicApi";
import { fmtDay } from "../lib/publicFmt";
import { useTimezone } from "../lib/tz";

const isDay = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime());
const navBtn = "rounded-md border border-slate-700 px-3 py-2 text-sm hover:border-slate-500";

function Legend() {
  return (
    <section className="space-y-2 rounded-md border border-slate-800 p-3 text-xs text-slate-300" aria-label="Legend">
      <p className="font-medium text-slate-100">Legend</p>
      <div className="flex flex-wrap items-center gap-2"><span className="w-24 text-slate-400">Daily bias</span><BiasBadge bias="bullish" /><BiasBadge bias="bearish" /><BiasBadge bias="neutral" /></div>
      <div className="flex flex-wrap items-center gap-2"><span className="w-24 text-slate-400">Result</span><OutcomeBadge outcome="correct" /><OutcomeBadge outcome="wrong" /><OutcomeBadge outcome="partial" /><OutcomeBadge outcome={null} /></div>
      <div className="flex flex-wrap items-center gap-2"><span className="w-24 text-slate-400">Killzone note</span><NoteStatusBadge status="followed" /><NoteStatusBadge status="non_followed" /><NoteStatusBadge status="invalidation" /><NoteStatusBadge status="neutral" /></div>
      <p className="text-slate-400">🔒 Subscriber analysis (opens for everyone after the open-archive period). – nothing published. Killzone times are typical windows shown in your timezone.</p>
    </section>
  );
}

export default function Matrix() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const meta = usePublicMeta();
  const [tz, setTz, tzOptions] = useTimezone();
  const { open } = useDrawer();
  const today = meta.data?.today ?? utcToday();
  const qw = sp.get("week");
  const week = weekStartOf(isDay(qw) ? qw : today);
  const markets = meta.data?.markets ?? [];
  const wanted = sp.get("market");
  const market = markets.find((m) => m.id === wanted) ?? markets[0];
  const go = (w: string, m: string | undefined) => `/matrix?week=${w}${m ? `&market=${m}` : ""}`;

  const q = usePublicQuery<PublicMatrixDto>(["matrix", week, market?.id ?? ""], `/api/public/matrix?week=${week}&marketId=${market?.id ?? ""}`, !!market);
  const thisWeek = weekStartOf(today);

  return (
    <main className="space-y-4">
      <PageHeader title="Bias matrix">
        <Link to={go(addDays(week, -7), market?.id)} className={navBtn} aria-label="Previous week">← Previous</Link>
        {week !== thisWeek && <Link to={go(thisWeek, market?.id)} className={navBtn}>This week</Link>}
        <Link to={go(addDays(week, 7), market?.id)} className={navBtn} aria-label="Next week">Next →</Link>
      </PageHeader>
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Market">
          <select className={inputCls} value={market?.id ?? ""} onChange={(e) => nav(go(week, e.target.value))}>
            {markets.map((m) => <option key={m.id} value={m.id}>{m.symbol} - {m.name}</option>)}
          </select>
        </Field>
        <Field label="Timezone for killzone times">
          <select className={inputCls} value={tz} onChange={(e) => setTz(e.target.value)}>
            {tzOptions.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </Field>
        <p className="pb-2 text-sm text-slate-400">Week of {fmtDay(week)}</p>
      </div>

      {meta.data && markets.length === 0 && <Notice kind="info">No markets are set up yet.</Notice>}
      {q.isLoading && <p className="text-sm text-slate-400">Loading...</p>}
      {q.isError && <Notice kind="error">{errorMessage(q.error)}</Notice>}
      {q.data && <MatrixGrid data={q.data} today={today} tz={tz} onOpen={open} />}
      <Legend />
      <DetailDrawer />
    </main>
  );
}
