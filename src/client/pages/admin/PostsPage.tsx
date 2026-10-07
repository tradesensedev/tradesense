import { useState, type ReactNode } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ACCESS_LEVELS, BIASES, CONFIDENCES, POST_TYPES, PUBLISH_STATUSES } from "@shared/constants";
import { RESULT_FILTER_VALUES, type ListResponse, type PostListRowDto } from "@shared/lists";
import { can } from "@shared/permissions";
import { AccessBadge, BiasBadge, StatusBadge } from "../../components/admin/badges";
import PostSpeedTools from "../../components/admin/PostSpeedTools";
import { OutcomeBadge } from "../../components/admin/resultBadges";
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
import { useColumns } from "../../lib/useColumns";
import { splitCsv, useListState } from "../../lib/useListState";
import { useSelection } from "../../lib/useSelection";

const LIMIT = 25;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const opts = (values: readonly string[]) => values.map((v) => ({ value: v, label: cap(v) }));

export default function PostsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const lookups = useLookups();
  const [showTools, setShowTools] = useState(false);
  const ls = useListState(LIMIT);
  const cols = useColumns("posts");
  const sel = useSelection(ls.apiQuery);

  const list = useQuery({
    queryKey: ["lists", "posts", ls.apiQuery],
    queryFn: () => api<ListResponse<PostListRowDto>>(`/api/admin/lists/posts?${ls.apiQuery}`),
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
    void qc.invalidateQueries({ queryKey: ["posts"] });
  };

  const cell: Record<string, (p: PostListRowDto) => ReactNode> = {
    date: (p) => (p.type === "daily" ? p.postDate : p.weekStartDate),
    market: (p) => <span className="font-mono">{p.marketSymbol}</span>,
    type: (p) => p.type,
    bias: (p) => <BiasBadge bias={p.bias} />,
    confidence: (p) => cap(p.confidence),
    result: (p) => <OutcomeBadge outcome={p.resultOutcome} corrected={p.correctionCount > 0} />,
    status: (p) => <StatusBadge status={p.status} />,
    access: (p) => <AccessBadge access={p.access} />,
    title: (p) => p.title || "(untitled)",
    sentiment: (p) => (p.sentiment ? cap(p.sentiment) : "-"),
    tags: (p) => (p.tagNames.length ? p.tagNames.join(", ") : "-"),
    screenshots: (p) => p.screenshotCount,
    analyst: (p) => p.analystName ?? "-",
    createdBy: (p) => p.createdByName ?? "-",
    validUntil: (p) => fmtDateTime(p.validUntil),
    publishAt: (p) => fmtDateTime(p.publishAt),
    published: (p) => fmtDateTime(p.publishedAt),
    updated: (p) => fmtDateTime(p.updatedAt),
  };
  const shown = cols.defs.filter((d) => cols.visible.includes(d.id));
  const pageIds = items.map((p) => p.id);
  const labelOf = (id: string) => {
    const p = items.find((x) => x.id === id);
    return p ? `${p.marketSymbol} ${p.type} ${p.type === "daily" ? p.postDate : p.weekStartDate}` : id;
  };

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

      {showTools && <PostSpeedTools onDone={refresh} />}

      <div className="mb-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <MultiSelect label="Status" options={opts(PUBLISH_STATUSES)} value={splitCsv(f.status)} onChange={(v) => ls.set({ status: v.join(",") })} />
        <MultiSelect label="Markets" options={markets} value={splitCsv(f.marketId)} onChange={(v) => ls.set({ marketId: v.join(",") })} />
        <MultiSelect label="Bias" options={opts(BIASES)} value={splitCsv(f.bias)} onChange={(v) => ls.set({ bias: v.join(",") })} />
        <MultiSelect label="Confidence" options={opts(CONFIDENCES)} value={splitCsv(f.confidence)} onChange={(v) => ls.set({ confidence: v.join(",") })} />
        <MultiSelect label="Result" options={opts(RESULT_FILTER_VALUES)} value={splitCsv(f.result)} onChange={(v) => ls.set({ result: v.join(",") })} />
        <MultiSelect label="Access" options={opts(ACCESS_LEVELS)} value={splitCsv(f.access)} onChange={(v) => ls.set({ access: v.join(",") })} />
        <select className={inputCls} value={f.type ?? ""} onChange={(e) => ls.set({ type: e.target.value })} aria-label="Type">
          <option value="">Daily + weekly</option>{POST_TYPES.map((t) => <option key={t} value={t}>{cap(t)}</option>)}
        </select>
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
          <input type="checkbox" checked={f.mine === "1"} onChange={(e) => ls.set({ mine: e.target.checked ? "1" : "" })} /> Only my posts
        </label>
        {ls.hasFilters && <button className={btnGhost} onClick={ls.clear}>Clear filters</button>}
        <SavedViewsMenu
          scope="posts"
          filters={ls.filters}
          columns={cols.visible}
          onApply={(v) => {
            ls.replaceFilters(v.filters);
            if (v.columns.length > 0) cols.set(v.columns);
          }}
        />
        <ColumnChooser defs={cols.defs} visible={cols.visible} onChange={cols.set} onReset={cols.reset} />
        <ExportLink kind="posts" query={ls.exportQuery} columns={cols.visible} />
      </div>

      <BulkBar
        kind="posts"
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
            {items.map((p) => (
              <tr key={p.id} className="border-t border-slate-800">
                <td className="py-2 pr-2">
                  <input type="checkbox" aria-label={`Select ${labelOf(p.id)}`} checked={sel.ids.has(p.id)} onChange={() => sel.toggle(p.id)} />
                </td>
                {shown.map((d, i) => (
                  <td key={d.id} className="py-2 pr-3 whitespace-nowrap">
                    {i === 0 ? <Link to={`/admin/posts/${p.id}`} className="text-blue-300 hover:underline">{cell[d.id]?.(p)}</Link> : cell[d.id]?.(p)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {list.data && items.length === 0 && <p className="py-4 text-sm text-slate-400">No posts match.</p>}
        {list.isLoading && <p className="py-4 text-sm text-slate-400">Loading...</p>}
      </div>

      <Pagination offset={ls.offset} limit={LIMIT} total={total} onChange={(o) => ls.set({ offset: o ? String(o) : "" })} />
    </>
  );
}
