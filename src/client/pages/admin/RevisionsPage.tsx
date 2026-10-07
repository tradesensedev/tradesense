import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { RevisionDto } from "@shared/admin";
import Pagination from "../../components/list/Pagination";
import { Notice, PageHeader, btnGhost, inputCls } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { fmtDateTime } from "../../lib/dates";
import { useListState } from "../../lib/useListState";

const LIMIT = 30;

function show(v: unknown): string {
  if (v === null || v === undefined || v === "") return "(empty)";
  const s = Array.isArray(v) ? v.join(", ") : typeof v === "object" ? JSON.stringify(v) : String(v);
  return s.length > 70 ? `${s.slice(0, 70)}...` : s;
}

// What changed in one edit of a published post or note: each field with its old and new value.
function Changes({ r }: { r: RevisionDto }) {
  const keys = [...new Set([...Object.keys(r.oldValues), ...Object.keys(r.newValues)])];
  if (keys.length === 0) return <span className="text-xs text-slate-500">-</span>;
  return (
    <ul className="space-y-0.5 text-xs">
      {keys.map((k) => (
        <li key={k}><span className="text-slate-400">{k}:</span> <span className="text-red-300 line-through">{show(r.oldValues[k])}</span> <span aria-hidden>→</span> <span className="text-green-300">{show(r.newValues[k])}</span></li>
      ))}
    </ul>
  );
}

export default function RevisionsPage() {
  const ls = useListState(LIMIT);
  const f = ls.filters;
  const list = useQuery({
    queryKey: ["revisions", ls.apiQuery],
    queryFn: () => api<{ items: RevisionDto[]; total: number }>(`/api/admin/revisions?${ls.apiQuery}`),
    placeholderData: keepPreviousData,
  });
  const items = list.data?.items ?? [];

  return (
    <>
      <PageHeader title="Revisions" />
      <p className="mb-3 text-sm text-slate-400">Edits made to posts and notes after they were published, with the old and new value of each field.</p>
      <div className="mb-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <select className={inputCls} value={f.entityType ?? ""} onChange={(e) => ls.set({ entityType: e.target.value })} aria-label="Type">
          <option value="">Posts and notes</option><option value="post">Posts</option><option value="note">Notes</option>
        </select>
        <input type="date" className={inputCls} value={f.dateFrom ?? ""} onChange={(e) => ls.set({ dateFrom: e.target.value })} title="From date" aria-label="From date" />
        <input type="date" className={inputCls} value={f.dateTo ?? ""} onChange={(e) => ls.set({ dateTo: e.target.value })} title="To date" aria-label="To date" />
        {ls.hasFilters && <button className={btnGhost} onClick={ls.clear}>Clear filters</button>}
      </div>

      {list.isError && <Notice kind="error">{errorMessage(list.error)}</Notice>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-400">
            <tr><th className="pb-2 pr-3 font-normal">When</th><th className="pr-3 font-normal">What</th><th className="pr-3 font-normal">Edited by</th><th className="font-normal">Changes</th></tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} className="border-t border-slate-800 align-top">
                <td className="py-2 pr-3 whitespace-nowrap">{fmtDateTime(r.editedAt)}</td>
                <td className="pr-3 whitespace-nowrap">
                  <Link to={`/admin/${r.entityType}s/${r.entityId}`} className="text-blue-300 hover:underline">{r.entityLabel ?? `${r.entityType} (deleted)`}</Link>
                </td>
                <td className="pr-3 whitespace-nowrap">{r.editedByName ?? "Unknown"}</td>
                <td><Changes r={r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.data && items.length === 0 && <p className="py-4 text-sm text-slate-400">No revisions yet.</p>}
        {list.isLoading && <p className="py-4 text-sm text-slate-400">Loading...</p>}
      </div>
      <Pagination offset={ls.offset} limit={LIMIT} total={list.data?.total ?? 0} onChange={(o) => ls.set({ offset: o ? String(o) : "" })} />
    </>
  );
}
