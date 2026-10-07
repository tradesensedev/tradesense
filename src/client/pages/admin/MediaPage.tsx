import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ATTACHMENT_ACCESS, ATTACHMENT_KINDS } from "@shared/constants";
import type { MediaItemDto } from "@shared/admin";
import Pagination from "../../components/list/Pagination";
import SearchBox from "../../components/list/SearchBox";
import { Badge, Notice, PageHeader, btnGhost, inputCls } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { fmtDateTime } from "../../lib/dates";
import { useListState } from "../../lib/useListState";

const LIMIT = 24;

export default function MediaPage() {
  const ls = useListState(LIMIT);
  const f = ls.filters;
  const list = useQuery({
    queryKey: ["media", ls.apiQuery],
    queryFn: () => api<{ items: MediaItemDto[]; total: number }>(`/api/admin/media?${ls.apiQuery}`),
    placeholderData: keepPreviousData,
  });
  const items = list.data?.items ?? [];

  return (
    <>
      <PageHeader title="Media library" />
      <p className="mb-3 text-sm text-slate-400">Every uploaded screenshot, with what it belongs to. Search by caption or the start of a SHA-256 fingerprint.</p>
      <div className="mb-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <select className={inputCls} value={f.ownerType ?? ""} onChange={(e) => ls.set({ ownerType: e.target.value })} aria-label="Belongs to">
          <option value="">Posts, notes, results</option><option value="post">Posts</option><option value="note">Notes</option><option value="result">Results</option>
        </select>
        <select className={inputCls} value={f.kind ?? ""} onChange={(e) => ls.set({ kind: e.target.value })} aria-label="Kind">
          <option value="">Any kind</option>{ATTACHMENT_KINDS.map((k) => <option key={k} value={k}>{k.replace("_", " ")}</option>)}
        </select>
        <select className={inputCls} value={f.access ?? ""} onChange={(e) => ls.set({ access: e.target.value })} aria-label="Access">
          <option value="">Any access</option>{ATTACHMENT_ACCESS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className={inputCls} value={f.locked ?? ""} onChange={(e) => ls.set({ locked: e.target.value })} aria-label="Locked">
          <option value="">Locked or editable</option><option value="1">Locked</option><option value="0">Editable</option>
        </select>
        <SearchBox value={f.q ?? ""} onChange={(v) => ls.set({ q: v })} placeholder="Caption or SHA-256" />
        <input type="date" className={inputCls} value={f.dateFrom ?? ""} onChange={(e) => ls.set({ dateFrom: e.target.value })} title="Uploaded from" aria-label="Uploaded from" />
        <input type="date" className={inputCls} value={f.dateTo ?? ""} onChange={(e) => ls.set({ dateTo: e.target.value })} title="Uploaded to" aria-label="Uploaded to" />
        {ls.hasFilters && <button className={btnGhost} onClick={ls.clear}>Clear filters</button>}
      </div>

      {list.isError && <Notice kind="error">{errorMessage(list.error)}</Notice>}
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => (
          <li key={a.id} className="space-y-2 rounded-md border border-slate-800 p-3 text-sm">
            <a href={a.url} target="_blank" rel="noopener noreferrer"><img src={a.url} alt={a.caption || "Screenshot"} loading="lazy" className="max-h-40 w-full rounded border border-slate-700 object-contain" /></a>
            <div className="flex flex-wrap gap-1">
              {a.locked ? <Badge tone="amber">Locked</Badge> : <Badge>Editable</Badge>}
              <Badge tone="blue">{a.kind.replace("_", " ")}</Badge>
              <Badge>Access: {a.access}</Badge>
            </div>
            {a.caption && <p>{a.caption}</p>}
            <p className="text-xs">
              {a.ownerLabel ? <Link to={`/admin/${a.ownerType}s/${a.ownerId}`} className="text-blue-300 hover:underline">{a.ownerLabel}</Link> : <span className="text-slate-400">{a.ownerType} (removed)</span>}
            </p>
            <p className="text-xs text-slate-400">{Math.round(a.size / 1024)} KB, by {a.uploadedByName ?? "unknown"}, {fmtDateTime(a.uploadedAt)}</p>
            <p className="font-mono text-[11px] text-slate-500">SHA-256 {a.sha256.slice(0, 16)}...</p>
          </li>
        ))}
      </ul>
      {list.data && items.length === 0 && <p className="py-4 text-sm text-slate-400">No screenshots match.</p>}
      {list.isLoading && <p className="py-4 text-sm text-slate-400">Loading...</p>}
      <Pagination offset={ls.offset} limit={LIMIT} total={list.data?.total ?? 0} onChange={(o) => ls.set({ offset: o ? String(o) : "" })} />
    </>
  );
}
