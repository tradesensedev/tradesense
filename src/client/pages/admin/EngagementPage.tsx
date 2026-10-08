import { Fragment, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { can } from "@shared/permissions";
import type { EngagementDto, ViewerDto } from "@shared/engagement";
import type { ListResponse, NoteListRowDto, PostListRowDto } from "@shared/lists";
import { AccessBadge } from "../../components/admin/badges";
import { Field, Notice, PageHeader, btnGhost, inputCls } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { addDays, fmtDateTime, utcToday } from "../../lib/dates";
import { KILLZONE_LABEL } from "../../lib/labels";
import { usePublicMeta } from "../../lib/publicApi";

const PAGE = 25;
type Kind = "post" | "note";
interface Row {
  id: string;
  date: string;
  what: string;
  market: string;
  title: string;
  access: string;
}

function toRow(kind: Kind, r: PostListRowDto | NoteListRowDto): Row {
  if (kind === "post") {
    const p = r as PostListRowDto;
    return { id: p.id, date: p.type === "weekly" ? `Week of ${p.weekStartDate}` : p.postDate, what: p.type, market: p.marketSymbol, title: p.title, access: p.access };
  }
  const n = r as NoteListRowDto;
  return { id: n.id, date: n.noteDate, what: `${KILLZONE_LABEL[n.killzone] ?? n.killzone} note`, market: n.marketSymbol, title: n.title, access: n.access };
}

function Viewers({ kind, id }: { kind: Kind; id: string }) {
  const q = useQuery({ queryKey: ["admin-viewers", kind, id], queryFn: () => api<{ items: ViewerDto[] }>(`/api/admin/engagement/viewers?type=${kind}&id=${id}`) });
  if (q.isLoading) return <p className="text-xs text-slate-400">Loading...</p>;
  if (q.isError) return <Notice kind="error">{errorMessage(q.error)}</Notice>;
  if (!q.data?.items.length) return <p className="text-xs text-slate-400">No signed-in viewer yet. (Logged-out visitors are only counted in Views.)</p>;
  return (
    <table className="w-full text-xs">
      <thead><tr className="text-left text-slate-400"><th className="p-1">Name</th><th className="p-1">Email</th><th className="p-1">Views</th><th className="p-1">Last viewed</th></tr></thead>
      <tbody>
        {q.data.items.map((v) => (
          <tr key={v.userId} className="border-t border-slate-800"><td className="p-1">{v.name}</td><td className="p-1">{v.email}</td><td className="p-1">{v.views}</td><td className="p-1">{fmtDateTime(v.lastViewedAt)}</td></tr>
        ))}
      </tbody>
    </table>
  );
}

export default function EngagementPage() {
  const { user } = useAuth();
  const meta = usePublicMeta();
  const canSeeViewers = can(user?.role, "user:manage");
  const [kind, setKind] = useState<Kind>("post");
  const [from, setFrom] = useState(addDays(utcToday(), -30));
  const [to, setTo] = useState("");
  const [market, setMarket] = useState("");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  const p = new URLSearchParams({ limit: String(PAGE), offset: String(page * PAGE), sort: "date", dir: "desc" });
  p.set(kind === "post" ? "status" : "publishStatus", "published");
  if (from) p.set("dateFrom", from);
  if (to) p.set("dateTo", to);
  if (market) p.set("marketId", market);
  const rows = useQuery({
    queryKey: ["admin-engagement-rows", kind, p.toString()],
    queryFn: async () => {
      const r = await api<ListResponse<PostListRowDto | NoteListRowDto>>(`/api/admin/lists/${kind === "post" ? "posts" : "notes"}?${p.toString()}`);
      return { total: r.total, items: r.items.map((x) => toRow(kind, x)) };
    },
  });
  const ids = (rows.data?.items ?? []).map((r) => r.id);
  const counts = useQuery({
    queryKey: ["admin-engagement-counts", kind, ids.join(",")],
    queryFn: () => api<Record<string, EngagementDto>>(`/api/admin/engagement?type=${kind}&ids=${ids.join(",")}`),
    enabled: ids.length > 0,
  });
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(0); setOpenId(null); };
  const total = rows.data?.total ?? 0;

  return (
    <>
      <PageHeader title="Engagement" />
      <p className="mb-3 text-sm text-slate-400">Views and bookmarks of published items. Only opened content counts (not locked placeholders), staff previews are not counted, and a repeat view by the same person within 10 minutes counts once. Viewers = distinct signed-in users; logged-out visitors are included in Views only.</p>
      <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Show">
          <select className={inputCls} value={kind} onChange={(e) => reset(setKind)(e.target.value as Kind)}>
            <option value="post">Posts</option>
            <option value="note">Killzone notes</option>
          </select>
        </Field>
        <Field label="From"><input type="date" className={inputCls} value={from} onChange={(e) => reset(setFrom)(e.target.value)} /></Field>
        <Field label="To"><input type="date" className={inputCls} value={to} onChange={(e) => reset(setTo)(e.target.value)} /></Field>
        <Field label="Market">
          <select className={inputCls} value={market} onChange={(e) => reset(setMarket)(e.target.value)}>
            <option value="">All markets</option>
            {(meta.data?.markets ?? []).map((m) => <option key={m.id} value={m.id}>{m.symbol}</option>)}
          </select>
        </Field>
      </div>
      {rows.isError && <Notice kind="error">{errorMessage(rows.error)}</Notice>}
      {counts.isError && <Notice kind="error">{errorMessage(counts.error)}</Notice>}
      {rows.isLoading && <p className="text-sm text-slate-400">Loading...</p>}
      {rows.data && rows.data.items.length === 0 && <p className="py-4 text-sm text-slate-400">No published items in this range.</p>}
      {rows.data && rows.data.items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400">
                <th className="p-2">Date</th><th className="p-2">Item</th><th className="p-2">Market</th><th className="p-2">Access</th>
                <th className="p-2 text-right">Views</th><th className="p-2 text-right">Viewers</th><th className="p-2 text-right">Bookmarks</th>{canSeeViewers && <th className="p-2"><span className="sr-only">Who viewed</span></th>}
              </tr>
            </thead>
            <tbody>
              {rows.data.items.map((r) => {
                const c = counts.data?.[r.id];
                return (
                  <Fragment key={r.id}>
                    <tr className="border-t border-slate-800">
                      <td className="p-2 whitespace-nowrap">{r.date}</td>
                      <td className="p-2"><span className="text-xs text-slate-400">{r.what}</span><br />{r.title}</td>
                      <td className="p-2">{r.market}</td>
                      <td className="p-2"><AccessBadge access={r.access as "free" | "paid"} /></td>
                      <td className="p-2 text-right tabular-nums">{c ? c.views : "…"}</td>
                      <td className="p-2 text-right tabular-nums">{c ? c.viewers : "…"}</td>
                      <td className="p-2 text-right tabular-nums">{c ? c.bookmarks : "…"}</td>
                      {canSeeViewers && (
                        <td className="p-2 text-right">
                          <button className={btnGhost} aria-expanded={openId === r.id} onClick={() => setOpenId(openId === r.id ? null : r.id)}>{openId === r.id ? "Hide" : "Who viewed"}</button>
                        </td>
                      )}
                    </tr>
                    {openId === r.id && <tr className="bg-slate-900/40"><td colSpan={8} className="p-3"><Viewers kind={kind} id={r.id} /></td></tr>}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {total > PAGE && (
        <div className="mt-3 flex items-center justify-between">
          <button className={btnGhost} disabled={page === 0} onClick={() => { setPage(page - 1); setOpenId(null); }}>← Newer</button>
          <span className="text-sm text-slate-400">{page * PAGE + 1}-{Math.min(total, (page + 1) * PAGE)} of {total}</span>
          <button className={btnGhost} disabled={(page + 1) * PAGE >= total} onClick={() => { setPage(page + 1); setOpenId(null); }}>Older →</button>
        </div>
      )}
    </>
  );
}
