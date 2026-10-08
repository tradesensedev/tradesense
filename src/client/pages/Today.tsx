import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { PublicNoteItem, PublicTodayDto } from "@shared/public";
import { KILLZONES } from "@shared/constants";
import DetailDrawer from "../components/public/DetailDrawer";
import { NoteCard, PostCard } from "../components/public/ItemCards";
import { Notice, PageHeader, inputCls } from "../components/ui";
import { errorMessage } from "../lib/api";
import { addDays, utcToday } from "../lib/dates";
import { KILLZONE_LABEL } from "../lib/labels";
import { useDrawer, usePublicMeta, usePublicQuery } from "../lib/publicApi";
import { fmtDay } from "../lib/publicFmt";

const isDay = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime());

export default function Today() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const meta = usePublicMeta();
  const today = meta.data?.today ?? utcToday();
  const qd = sp.get("date");
  const date = isDay(qd) ? qd : today;
  const q = usePublicQuery<PublicTodayDto>(["today", date], `/api/public/today?date=${date}`);
  const { open } = useDrawer();
  const data = q.data;

  const weekly = data?.posts.filter((p) => p.type === "weekly") ?? [];
  const daily = data?.posts.filter((p) => p.type === "daily") ?? [];
  const notes = data?.notes ?? [];
  const byZone = KILLZONES.map((k) => ({ k, items: notes.filter((n) => n.killzone === k) })).filter((g) => g.items.length > 0);
  const anyLocked = [...(data?.posts ?? []), ...notes].some((i) => i.lock.state !== "open");
  const empty = !!data && weekly.length + daily.length + notes.length === 0;
  const archiveDays = meta.data?.settings.openArchiveDays ?? 0;

  return (
    <main className="space-y-6">
      <PageHeader title={date === today ? "Today" : `Analysis for ${fmtDay(date)}`}>
        <Link to={`/?date=${addDays(date, -1)}`} className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:border-slate-500" aria-label="Previous day">← Previous</Link>
        <input type="date" aria-label="Pick a day" className={`${inputCls} !w-auto`} value={date} max={today} onChange={(e) => e.target.value && nav(`/?date=${e.target.value}`)} />
        <Link to={`/?date=${addDays(date, 1)}`} className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:border-slate-500" aria-label="Next day">Next →</Link>
        {date !== today && <Link to="/" className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:border-slate-500">Today</Link>}
      </PageHeader>
      <p className="text-sm text-slate-400">{fmtDay(date)} (UTC day). Bias and killzone notes per market.</p>

      {q.isLoading && <p className="text-sm text-slate-400">Loading...</p>}
      {q.isError && <Notice kind="error">{errorMessage(q.error)}</Notice>}
      {empty && (
        <Notice kind="info">
          Nothing is published for this day yet. <Link to={`/?date=${addDays(date, -1)}`} className="underline">See the previous day</Link>.
        </Notice>
      )}
      {anyLocked && (
        <p className="text-xs text-slate-400">
          🔒 marks subscriber analysis{archiveDays > 0 ? `; items older than ${archiveDays} days are open to everyone` : ""}. Free analysis may appear after a short delay.
        </p>
      )}

      {weekly.length > 0 && (
        <section className="space-y-2" aria-labelledby="weekly-h">
          <h2 id="weekly-h" className="text-base font-semibold">Weekly outlook</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {weekly.map((p) => <li key={p.id}><PostCard item={p} onOpen={open} showDate /></li>)}
          </ul>
        </section>
      )}

      {daily.length > 0 && (
        <section className="space-y-2" aria-labelledby="daily-h">
          <h2 id="daily-h" className="text-base font-semibold">Daily bias</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {daily.map((p) => <li key={p.id}><PostCard item={p} onOpen={open} /></li>)}
          </ul>
        </section>
      )}

      {byZone.length > 0 && (
        <section className="space-y-3" aria-labelledby="kz-h">
          <h2 id="kz-h" className="text-base font-semibold">Killzone notes</h2>
          {byZone.map((g) => (
            <div key={g.k} className="space-y-2">
              <h3 className="text-sm font-medium text-slate-300">{KILLZONE_LABEL[g.k]}</h3>
              <ul className="grid gap-3 md:grid-cols-2">
                {g.items.map((n: PublicNoteItem) => <li key={n.id}><NoteCard item={n} onOpen={open} /></li>)}
              </ul>
            </div>
          ))}
        </section>
      )}
      <DetailDrawer />
    </main>
  );
}
