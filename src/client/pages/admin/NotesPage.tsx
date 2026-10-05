import { useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { KILLZONES, NOTE_STATUSES, PUBLISH_STATUSES } from "@shared/constants";
import type { NoteDto, Paged } from "@shared/content";
import { can } from "@shared/permissions";
import { AccessBadge, NoteStatusBadge, StatusBadge } from "../../components/admin/badges";
import QuickNote from "../../components/admin/QuickNote";
import { Notice, PageHeader, btnGhost, btnPrimary, inputCls } from "../../components/ui";
import { useLookups } from "../../lib/admin";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { KILLZONE_LABEL, NOTE_STATUS_LABEL } from "../../lib/labels";

const LIMIT = 25;

export default function NotesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const lookups = useLookups();
  const [showQuick, setShowQuick] = useState(true);
  const [f, setF] = useState({ publishStatus: "", status: "", killzone: "", marketId: "", dateFrom: "", dateTo: "", q: "", mine: false, offset: 0 });
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, offset: 0, ...p }));

  const qs = new URLSearchParams();
  for (const k of ["publishStatus", "status", "killzone", "marketId", "dateFrom", "dateTo", "q"] as const) if (f[k]) qs.set(k, f[k]);
  if (f.mine) qs.set("mine", "1");
  qs.set("limit", String(LIMIT));
  qs.set("offset", String(f.offset));

  const list = useQuery({
    queryKey: ["notes", qs.toString()],
    queryFn: () => api<Paged<NoteDto>>(`/api/admin/notes?${qs}`),
    placeholderData: keepPreviousData,
  });
  const markets = lookups.data?.markets ?? [];
  const symbol = (id: string) => markets.find((m) => m.id === id)?.symbol ?? "?";
  const total = list.data?.total ?? 0;

  return (
    <>
      <PageHeader title="Killzone notes">
        {can(user?.role, "note:create") && (
          <>
            <button className={btnGhost} onClick={() => setShowQuick((v) => !v)}>{showQuick ? "Hide quick note" : "Quick note"}</button>
            <Link to="/admin/notes/new" className={btnPrimary}>New note</Link>
          </>
        )}
      </PageHeader>

      {showQuick && can(user?.role, "note:create") && <QuickNote onDone={() => void qc.invalidateQueries({ queryKey: ["notes"] })} />}

      <div className="mb-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <select className={inputCls} value={f.publishStatus} onChange={(e) => set({ publishStatus: e.target.value })}>
          <option value="">All publish states</option>{PUBLISH_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={inputCls} value={f.status} onChange={(e) => set({ status: e.target.value })}>
          <option value="">All note statuses</option>{NOTE_STATUSES.map((s) => <option key={s} value={s}>{NOTE_STATUS_LABEL[s]}</option>)}
        </select>
        <select className={inputCls} value={f.killzone} onChange={(e) => set({ killzone: e.target.value })}>
          <option value="">All killzones</option>{KILLZONES.map((k) => <option key={k} value={k}>{KILLZONE_LABEL[k]}</option>)}
        </select>
        <select className={inputCls} value={f.marketId} onChange={(e) => set({ marketId: e.target.value })}>
          <option value="">All markets</option>{markets.map((m) => <option key={m.id} value={m.id}>{m.symbol}</option>)}
        </select>
        <input type="date" className={inputCls} value={f.dateFrom} onChange={(e) => set({ dateFrom: e.target.value })} title="From date" />
        <input type="date" className={inputCls} value={f.dateTo} onChange={(e) => set({ dateTo: e.target.value })} title="To date" />
        <input className={inputCls} placeholder="Search text" value={f.q} onChange={(e) => set({ q: e.target.value })} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.mine} onChange={(e) => set({ mine: e.target.checked })} /> Only my notes</label>
      </div>

      {list.isError && <Notice kind="error">{errorMessage(list.error)}</Notice>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-400">
            <tr><th className="pb-2">Date</th><th>Market</th><th>Killzone</th><th>Status</th><th>Title</th><th>Publish</th><th>Access</th></tr>
          </thead>
          <tbody>
            {list.data?.items.map((n) => (
              <tr key={n.id} className="border-t border-slate-800">
                <td className="py-2 pr-3 whitespace-nowrap">{n.noteDate}</td>
                <td className="pr-3 font-mono">{symbol(n.marketId)}</td>
                <td className="pr-3">{KILLZONE_LABEL[n.killzone]}</td>
                <td className="pr-3"><NoteStatusBadge status={n.status} /></td>
                <td className="pr-3"><Link to={`/admin/notes/${n.id}`} className="text-blue-300 hover:underline">{n.title || "(untitled)"}</Link></td>
                <td className="pr-3"><StatusBadge status={n.publishStatus} /></td>
                <td><AccessBadge access={n.access} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.data && list.data.items.length === 0 && <p className="py-4 text-sm text-slate-400">No notes match.</p>}
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
