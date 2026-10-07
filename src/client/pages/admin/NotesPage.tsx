import { useState, type ReactNode } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CONFIDENCES, KILLZONES, NOTE_STATUSES, PUBLISH_STATUSES } from "@shared/constants";
import type { ListResponse, NoteListRowDto } from "@shared/lists";
import { can } from "@shared/permissions";
import { AccessBadge, NoteStatusBadge, StatusBadge } from "../../components/admin/badges";
import QuickNote from "../../components/admin/QuickNote";
import BulkBar from "../../components/list/BulkBar";
import ColumnChooser from "../../components/list/ColumnChooser";
import ExportLink from "../../components/list/ExportLink";
import MultiSelect from "../../components/list/MultiSelect";
import Pagination, { SortTh } from "../../components/list/Pagination";
import SavedViewsMenu from "../../components/list/SavedViewsMenu";
import SearchBox from "../../components/list/SearchBox";
import { Notice, PageHeader, btnGhost, btnPrimary, inputCls } from "../../components/ui";
import { useLookups } from "../../lib/admin";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { fmtDateTime } from "../../lib/dates";
import { KILLZONE_LABEL, NOTE_STATUS_LABEL } from "../../lib/labels";
import { useColumns } from "../../lib/useColumns";
import { splitCsv, useListState } from "../../lib/useListState";
import { useSelection } from "../../lib/useSelection";

const LIMIT = 25;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const opts = (values: readonly string[], labels?: Record<string, string>) => values.map((v) => ({ value: v, label: labels?.[v] ?? cap(v) }));

export default function NotesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const lookups = useLookups();
  const [showQuick, setShowQuick] = useState(true);
  const ls = useListState(LIMIT);
  const cols = useColumns("notes");
  const sel = useSelection(ls.apiQuery);

  const list = useQuery({
    queryKey: ["lists", "notes", ls.apiQuery],
    queryFn: () => api<ListResponse<NoteListRowDto>>(`/api/admin/lists/notes?${ls.apiQuery}`),
    placeholderData: keepPreviousData,
  });

  const items = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const markets = (lookups.data?.markets ?? []).map((m) => ({ value: m.id, label: m.symbol }));
  const tags = lookups.data?.tags ?? [];
  const analysts = lookups.data?.analysts ?? [];
  const f = ls.filters;
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["lists"] });
    void qc.invalidateQueries({ queryKey: ["notes"] });
  };

  const cell: Record<string, (n: NoteListRowDto) => ReactNode> = {
    date: (n) => n.noteDate,
    market: (n) => <span className="font-mono">{n.marketSymbol}</span>,
    killzone: (n) => KILLZONE_LABEL[n.killzone] ?? n.killzone,
    status: (n) => <NoteStatusBadge status={n.status} />,
    publish: (n) => <StatusBadge status={n.publishStatus} />,
    confidence: (n) => (n.confidence ? cap(n.confidence) : "-"),
    access: (n) => <AccessBadge access={n.access} />,
    title: (n) => n.title || "(untitled)",
    tags: (n) => (n.tagNames.length ? n.tagNames.join(", ") : "-"),
    screenshots: (n) => n.screenshotCount,
    analyst: (n) => n.analystName ?? "-",
    createdBy: (n) => n.createdByName ?? "-",
    publishAt: (n) => fmtDateTime(n.publishAt),
    published: (n) => fmtDateTime(n.publishedAt),
    updated: (n) => fmtDateTime(n.updatedAt),
  };
  const shown = cols.defs.filter((d) => cols.visible.includes(d.id));
  const pageIds = items.map((n) => n.id);
  const labelOf = (id: string) => {
    const n = items.find((x) => x.id === id);
    return n ? `${n.marketSymbol} ${KILLZONE_LABEL[n.killzone] ?? n.killzone} ${n.noteDate}` : id;
  };

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

      {showQuick && can(user?.role, "note:create") && <QuickNote onDone={refresh} />}

      <div className="mb-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <MultiSelect label="Publish state" options={opts(PUBLISH_STATUSES)} value={splitCsv(f.publishStatus)} onChange={(v) => ls.set({ publishStatus: v.join(",") })} />
        <MultiSelect label="Note status" options={opts(NOTE_STATUSES, NOTE_STATUS_LABEL)} value={splitCsv(f.status)} onChange={(v) => ls.set({ status: v.join(",") })} />
        <MultiSelect label="Killzone" options={opts(KILLZONES, KILLZONE_LABEL)} value={splitCsv(f.killzone)} onChange={(v) => ls.set({ killzone: v.join(",") })} />
        <MultiSelect label="Markets" options={markets} value={splitCsv(f.marketId)} onChange={(v) => ls.set({ marketId: v.join(",") })} />
        <MultiSelect label="Confidence" options={opts(CONFIDENCES)} value={splitCsv(f.confidence)} onChange={(v) => ls.set({ confidence: v.join(",") })} />
        <MultiSelect label="Access" options={opts(["free", "paid"])} value={splitCsv(f.access)} onChange={(v) => ls.set({ access: v.join(",") })} />
        <select className={inputCls} value={f.tagId ?? ""} onChange={(e) => ls.set({ tagId: e.target.value })} aria-label="Driver tag">
          <option value="">Any driver tag</option>{tags.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className={inputCls} value={f.analystId ?? ""} onChange={(e) => ls.set({ analystId: e.target.value })} aria-label="Analyst">
          <option value="">Any analyst</option>{analysts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select className={inputCls} value={f.hasScreenshot ?? ""} onChange={(e) => ls.set({ hasScreenshot: e.target.value })} aria-label="Screenshots">
          <option value="">Screenshots: any</option><option value="1">With screenshots</option><option value="0">Without screenshots</option>
        </select>
        <input type="date" className={inputCls} value={f.dateFrom ?? ""} onChange={(e) => ls.set({ dateFrom: e.target.value })} title="From date" aria-label="From date" />
        <input type="date" className={inputCls} value={f.dateTo ?? ""} onChange={(e) => ls.set({ dateTo: e.target.value })} title="To date" aria-label="To date" />
        <SearchBox value={f.q ?? ""} onChange={(v) => ls.set({ q: v })} />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <label className="mr-auto flex items-center gap-2 text-sm">
          <input type="checkbox" checked={f.mine === "1"} onChange={(e) => ls.set({ mine: e.target.checked ? "1" : "" })} /> Only my notes
        </label>
        {ls.hasFilters && <button className={btnGhost} onClick={ls.clear}>Clear filters</button>}
        <SavedViewsMenu
          scope="notes"
          filters={ls.filters}
          columns={cols.visible}
          onApply={(v) => {
            ls.replaceFilters(v.filters);
            if (v.columns.length > 0) cols.set(v.columns);
          }}
        />
        <ColumnChooser defs={cols.defs} visible={cols.visible} onChange={cols.set} onReset={cols.reset} />
        <ExportLink kind="notes" query={ls.exportQuery} columns={cols.visible} />
      </div>

      <BulkBar
        kind="notes"
        ids={[...sel.ids]}
        allMatching={sel.allMatching}
        totalMatching={total}
        filters={ls.filters}
        onToggleAllMatching={sel.setAllMatching}
        onClear={sel.clear}
        onDone={() => {
          sel.clear();
          refresh();
        }}
        labelOf={labelOf}
      />

      {list.isError && <Notice kind="error">{errorMessage(list.error)}</Notice>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-400">
            <tr>
              <th className="w-8 pb-2">
                <input type="checkbox" aria-label="Select all rows on this page" checked={pageIds.length > 0 && pageIds.every((id) => sel.ids.has(id))} onChange={() => sel.togglePage(pageIds)} />
              </th>
              {shown.map((d) => <SortTh key={d.id} label={d.label} sortKey={d.sort} sort={ls.sort} dir={ls.dir} onSort={ls.toggleSort} />)}
            </tr>
          </thead>
          <tbody>
            {items.map((n) => (
              <tr key={n.id} className="border-t border-slate-800">
                <td className="py-2 pr-2">
                  <input type="checkbox" aria-label={`Select ${labelOf(n.id)}`} checked={sel.ids.has(n.id)} onChange={() => sel.toggle(n.id)} />
                </td>
                {shown.map((d, i) => (
                  <td key={d.id} className="py-2 pr-3 whitespace-nowrap">
                    {i === 0 ? <Link to={`/admin/notes/${n.id}`} className="text-blue-300 hover:underline">{cell[d.id]?.(n)}</Link> : cell[d.id]?.(n)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {list.data && items.length === 0 && <p className="py-4 text-sm text-slate-400">No notes match.</p>}
        {list.isLoading && <p className="py-4 text-sm text-slate-400">Loading...</p>}
      </div>

      <Pagination offset={ls.offset} limit={LIMIT} total={total} onChange={(o) => ls.set({ offset: o ? String(o) : "" })} />
    </>
  );
}
