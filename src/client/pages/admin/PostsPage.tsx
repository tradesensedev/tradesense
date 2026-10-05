import { useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { can } from "@shared/permissions";
import { POST_TYPES, PUBLISH_STATUSES } from "@shared/constants";
import type { Paged, PostDto } from "@shared/content";
import { AccessBadge, BiasBadge, StatusBadge } from "../../components/admin/badges";
import PostSpeedTools from "../../components/admin/PostSpeedTools";
import { Notice, PageHeader, btnGhost, btnPrimary, inputCls } from "../../components/ui";
import { useLookups } from "../../lib/admin";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";

const LIMIT = 25;

export default function PostsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const lookups = useLookups();
  const [showTools, setShowTools] = useState(false);
  const [f, setF] = useState({ status: "", type: "", marketId: "", dateFrom: "", dateTo: "", q: "", mine: false, offset: 0 });
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, offset: 0, ...p }));

  const qs = new URLSearchParams();
  for (const k of ["status", "type", "marketId", "dateFrom", "dateTo", "q"] as const) if (f[k]) qs.set(k, f[k]);
  if (f.mine) qs.set("mine", "1");
  qs.set("limit", String(LIMIT));
  qs.set("offset", String(f.offset));

  const list = useQuery({
    queryKey: ["posts", qs.toString()],
    queryFn: () => api<Paged<PostDto>>(`/api/admin/posts?${qs}`),
    placeholderData: keepPreviousData,
  });

  const markets = lookups.data?.markets ?? [];
  const analysts = lookups.data?.analysts ?? [];
  const symbol = (id: string) => markets.find((m) => m.id === id)?.symbol ?? "?";
  const analyst = (id: string | null) => analysts.find((a) => a.id === id)?.name ?? "-";
  const total = list.data?.total ?? 0;

  return (
    <>
      <PageHeader title="Posts">
        {can(user?.role, "post:create") && (
          <>
            <button className={btnGhost} onClick={() => setShowTools((v) => !v)}>{showTools ? "Hide speed tools" : "Speed tools"}</button>
            <Link to="/admin/posts/new" className={btnPrimary}>New post</Link>
          </>
        )}
      </PageHeader>

      {showTools && <PostSpeedTools onDone={() => void qc.invalidateQueries({ queryKey: ["posts"] })} />}

      <div className="mb-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <select className={inputCls} value={f.status} onChange={(e) => set({ status: e.target.value })}>
          <option value="">All statuses</option>{PUBLISH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={inputCls} value={f.type} onChange={(e) => set({ type: e.target.value })}>
          <option value="">Daily + weekly</option>{POST_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={inputCls} value={f.marketId} onChange={(e) => set({ marketId: e.target.value })}>
          <option value="">All markets</option>{markets.map((m) => <option key={m.id} value={m.id}>{m.symbol}</option>)}
        </select>
        <input type="date" className={inputCls} value={f.dateFrom} onChange={(e) => set({ dateFrom: e.target.value })} title="From date" />
        <input type="date" className={inputCls} value={f.dateTo} onChange={(e) => set({ dateTo: e.target.value })} title="To date" />
        <input className={inputCls} placeholder="Search text" value={f.q} onChange={(e) => set({ q: e.target.value })} />
      </div>
      <label className="mb-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.mine} onChange={(e) => set({ mine: e.target.checked })} /> Only my posts</label>

      {list.isError && <Notice kind="error">{errorMessage(list.error)}</Notice>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-400">
            <tr><th className="pb-2">Date</th><th>Type</th><th>Market</th><th>Bias</th><th>Title</th><th>Status</th><th>Access</th><th>Analyst</th></tr>
          </thead>
          <tbody>
            {list.data?.items.map((p) => (
              <tr key={p.id} className="border-t border-slate-800">
                <td className="py-2 pr-3 whitespace-nowrap">{p.postDate}</td>
                <td className="pr-3">{p.type}</td>
                <td className="pr-3 font-mono">{symbol(p.marketId)}</td>
                <td className="pr-3"><BiasBadge bias={p.bias} /></td>
                <td className="pr-3"><Link to={`/admin/posts/${p.id}`} className="text-blue-300 hover:underline">{p.title || "(untitled)"}</Link></td>
                <td className="pr-3"><StatusBadge status={p.status} /></td>
                <td className="pr-3"><AccessBadge access={p.access} /></td>
                <td>{analyst(p.analystId)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.data && list.data.items.length === 0 && <p className="py-4 text-sm text-slate-400">No posts match.</p>}
        {list.isLoading && <p className="py-4 text-sm text-slate-400">Loading...</p>}
      </div>

      <div className="mt-3 flex items-center gap-3 text-sm text-slate-400">
        <button className={btnGhost} disabled={f.offset === 0} onClick={() => setF((x) => ({ ...x, offset: Math.max(0, x.offset - LIMIT) }))}>Previous</button>
        <span>{total === 0 ? "0" : `${f.offset + 1}-${Math.min(f.offset + LIMIT, total)}`} of {total}</span>
        <button className={btnGhost} disabled={f.offset + LIMIT >= total} onClick={() => setF((x) => ({ ...x, offset: x.offset + LIMIT }))}>Next</button>
      </div>
    </>
  );
}
