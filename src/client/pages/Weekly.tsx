import { Link, useSearchParams } from "react-router-dom";
import type { PublicFeedDto } from "@shared/public";
import DetailDrawer from "../components/public/DetailDrawer";
import { PostCard } from "../components/public/ItemCards";
import { Notice, PageHeader } from "../components/ui";
import { errorMessage } from "../lib/api";
import { addDays, utcToday, weekStartOf } from "../lib/dates";
import { useDrawer, usePublicMeta, usePublicQuery } from "../lib/publicApi";
import { fmtDay } from "../lib/publicFmt";

const isDay = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(`${s}T00:00:00Z`).getTime());
const navBtn = "rounded-md border border-slate-700 px-3 py-2 text-sm hover:border-slate-500";

// Weekly posts are dated by their Monday, so one week = one date in the feed's range filter.
export default function Weekly() {
  const [sp] = useSearchParams();
  const meta = usePublicMeta();
  const { open } = useDrawer();
  const today = meta.data?.today ?? utcToday();
  const qw = sp.get("week");
  const week = weekStartOf(isDay(qw) ? qw : today);
  const thisWeek = weekStartOf(today);
  const qs = `type=weekly&period=range&dateFrom=${week}&dateTo=${week}&sort=market&dir=asc&limit=50`;
  const q = usePublicQuery<PublicFeedDto>(["weekly", week], `/api/public/feed?${qs}`);
  return (
    <main className="space-y-4">
      <PageHeader title="Weekly outlook">
        <Link to={`/weekly?week=${addDays(week, -7)}`} className={navBtn} aria-label="Previous week">← Previous</Link>
        {week !== thisWeek && <Link to="/weekly" className={navBtn}>This week</Link>}
        <Link to={`/weekly?week=${addDays(week, 7)}`} className={navBtn} aria-label="Next week">Next →</Link>
      </PageHeader>
      <p className="text-sm text-slate-400">Week of {fmtDay(week)} (Monday to Sunday, UTC). One outlook per market.</p>
      {q.isLoading && <p className="text-sm text-slate-400">Loading...</p>}
      {q.isError && <Notice kind="error">{errorMessage(q.error)}</Notice>}
      {q.data && q.data.items.length === 0 && <Notice kind="info">No weekly outlook is published for this week yet.</Notice>}
      <ul className="grid gap-3 md:grid-cols-2">
        {(q.data?.items ?? []).map((i) => (i.kind === "post" ? <li key={i.post.id}><PostCard item={i.post} onOpen={open} /></li> : null))}
      </ul>
      <DetailDrawer />
    </main>
  );
}
