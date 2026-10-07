import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { AuditEntryDto, UserAdminDto } from "@shared/admin";
import Pagination from "../../components/list/Pagination";
import SearchBox from "../../components/list/SearchBox";
import { Notice, PageHeader, btnGhost, inputCls } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { fmtDateTime } from "../../lib/dates";
import { useListState } from "../../lib/useListState";

const LIMIT = 50;

// Where an audited entity can be opened in the admin.
function entityLink(a: AuditEntryDto): string | null {
  if (!a.entityId) return null;
  if (a.entity === "post") return `/admin/posts/${a.entityId}`;
  if (a.entity === "note") return `/admin/notes/${a.entityId}`;
  if (a.entity === "result") return `/admin/results/${a.entityId}`;
  return null;
}

export default function AuditPage() {
  const ls = useListState(LIMIT);
  const f = ls.filters;

  const list = useQuery({
    queryKey: ["audit", ls.apiQuery],
    queryFn: () => api<{ items: AuditEntryDto[]; total: number }>(`/api/admin/audit?${ls.apiQuery}`),
    placeholderData: keepPreviousData,
  });
  const users = useQuery({ queryKey: ["users", "all"], queryFn: () => api<{ items: UserAdminDto[] }>("/api/admin/users?limit=200") });
  const items = list.data?.items ?? [];

  return (
    <>
      <PageHeader title="Audit log" />
      <p className="mb-3 text-sm text-slate-400">Every admin action, newest first. This list is read-only. Enter an action ending in a dot (like post.) to match a whole group.</p>

      <div className="mb-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <select className={inputCls} value={f.userId ?? ""} onChange={(e) => ls.set({ userId: e.target.value })} aria-label="User">
          <option value="">Any user</option>{(users.data?.items ?? []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <SearchBox value={f.action ?? ""} onChange={(v) => ls.set({ action: v })} placeholder="Action, e.g. post.publish" />
        <SearchBox value={f.entity ?? ""} onChange={(v) => ls.set({ entity: v })} placeholder="Entity, e.g. result" />
        <SearchBox value={f.entityId ?? ""} onChange={(v) => ls.set({ entityId: v })} placeholder="Entity id" />
        <input type="date" className={inputCls} value={f.dateFrom ?? ""} onChange={(e) => ls.set({ dateFrom: e.target.value })} title="From date" aria-label="From date" />
        <input type="date" className={inputCls} value={f.dateTo ?? ""} onChange={(e) => ls.set({ dateTo: e.target.value })} title="To date" aria-label="To date" />
        {ls.hasFilters && <button className={btnGhost} onClick={ls.clear}>Clear filters</button>}
      </div>

      {list.isError && <Notice kind="error">{errorMessage(list.error)}</Notice>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-400">
            <tr><th className="pb-2 pr-3 font-normal">When</th><th className="pr-3 font-normal">Who</th><th className="pr-3 font-normal">Action</th><th className="pr-3 font-normal">Entity</th><th className="font-normal">Details</th></tr>
          </thead>
          <tbody>
            {items.map((a) => {
              const link = entityLink(a);
              return (
                <tr key={a.id} className="border-t border-slate-800 align-top">
                  <td className="py-2 pr-3 whitespace-nowrap">{fmtDateTime(a.createdAt)}</td>
                  <td className="pr-3 whitespace-nowrap">{a.userName ?? (a.userId ? "Unknown user" : "System")}</td>
                  <td className="pr-3 font-mono text-xs">{a.action}</td>
                  <td className="pr-3 whitespace-nowrap">
                    {a.entity}{" "}
                    {a.entityId && (link ? <Link to={link} className="font-mono text-xs text-blue-300 hover:underline">{a.entityId.slice(-8)}</Link> : <span className="font-mono text-xs text-slate-400">{a.entityId.slice(-8)}</span>)}
                  </td>
                  <td>
                    {a.diff !== null && a.diff !== undefined ? (
                      <details><summary className="cursor-pointer text-xs text-slate-300">Show</summary><pre className="mt-1 max-w-xl overflow-auto whitespace-pre-wrap break-words rounded bg-slate-900 p-2 text-xs">{JSON.stringify(a.diff, null, 2)}</pre></details>
                    ) : <span className="text-xs text-slate-500">-</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.data && items.length === 0 && <p className="py-4 text-sm text-slate-400">No entries match.</p>}
        {list.isLoading && <p className="py-4 text-sm text-slate-400">Loading...</p>}
      </div>
      <Pagination offset={ls.offset} limit={LIMIT} total={list.data?.total ?? 0} onChange={(o) => ls.set({ offset: o ? String(o) : "" })} />
    </>
  );
}
