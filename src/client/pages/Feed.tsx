import { Link, useSearchParams } from "react-router-dom";
import type { PublicFeedDto } from "@shared/public";
import DetailDrawer from "../components/public/DetailDrawer";
import FeedFilters, { FEED_KEYS, activeFilterCount, type SetParams } from "../components/public/FeedFilters";
import { NoteCard, PostCard } from "../components/public/ItemCards";
import { Notice, PageHeader, btnGhost } from "../components/ui";
import { errorMessage } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useDrawer, usePublicMeta, usePublicQuery } from "../lib/publicApi";

const PAGE_SIZE = 20;

export default function Feed() {
  const [sp, setSp] = useSearchParams();
  const { user } = useAuth();
  const meta = usePublicMeta();
  const { open } = useDrawer();
  const page = Math.max(0, Number.parseInt(sp.get("page") ?? "0", 10) || 0);
  const bookmarks = sp.get("bookmarked") === "1";

  // Changing any filter returns to page 1 and keeps the rest of the URL (including an open drawer).
  const set: SetParams = (patch) =>
    setSp((prev) => {
      const n = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) (v ? n.set(k, v) : n.delete(k));
      n.delete("page");
      return n;
    }, { replace: true });
  const goPage = (p: number) =>
    setSp((prev) => {
      const n = new URLSearchParams(prev);
      p > 0 ? n.set("page", String(p)) : n.delete("page");
      return n;
    });

  const apiQuery = new URLSearchParams();
  for (const k of FEED_KEYS) {
    const v = sp.get(k);
    if (v) apiQuery.set(k, v);
  }
  apiQuery.set("limit", String(PAGE_SIZE));
  apiQuery.set("offset", String(page * PAGE_SIZE));
  const qs = apiQuery.toString();
  const needsLogin = bookmarks && !user;
  const q = usePublicQuery<PublicFeedDto>(["feed", qs], `/api/public/feed?${qs}`, !needsLogin);
  const total = q.data?.total ?? 0;
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE + (q.data?.items.length ?? 0));

  return (
    <main className="space-y-4">
      <PageHeader title={bookmarks ? "Your bookmarks" : "Feed"}>
        {activeFilterCount(sp) > 0 && <Link to="/feed" className={btnGhost}>Clear filters</Link>}
      </PageHeader>
      <FeedFilters sp={sp} set={set} meta={meta.data} signedIn={!!user} entitled={!!meta.data?.viewer.entitled} />

      {needsLogin && <Notice kind="info"><Link to="/login" className="underline">Sign in</Link> to see your bookmarks.</Notice>}
      {q.isLoading && !needsLogin && <p className="text-sm text-slate-400">Loading...</p>}
      {q.isError && (
        <Notice kind="error">
          {errorMessage(q.error)} <Link to="/feed" className="underline">Clear filters</Link>
        </Notice>
      )}
      {q.data && q.data.items.length === 0 && (
        <Notice kind="info">{bookmarks ? "You have no bookmarks matching these filters." : "Nothing matches these filters."}</Notice>
      )}
      {q.data && q.data.items.length > 0 && (
        <>
          <p className="text-sm text-slate-400" aria-live="polite">Showing {from}-{to} of {total}</p>
          <ul className="grid gap-3 md:grid-cols-2">
            {q.data.items.map((i) => (
              <li key={i.kind === "post" ? `p-${i.post.id}` : `n-${i.note.id}`}>
                {i.kind === "post" ? <PostCard item={i.post} onOpen={open} showDate /> : <NoteCard item={i.note} onOpen={open} showDate />}
              </li>
            ))}
          </ul>
          <nav className="flex items-center justify-between" aria-label="Pages">
            <button className={btnGhost} disabled={page === 0} onClick={() => goPage(page - 1)}>← Newer</button>
            <span className="text-sm text-slate-400">Page {page + 1}</span>
            <button className={btnGhost} disabled={to >= total} onClick={() => goPage(page + 1)}>Older →</button>
          </nav>
        </>
      )}
      <DetailDrawer />
    </main>
  );
}
