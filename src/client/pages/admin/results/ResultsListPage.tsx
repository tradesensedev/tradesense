import type { ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { OUTCOMES, POST_TYPES } from "@shared/constants";
import type { ListResponse } from "@shared/lists";
import type { ResultListItemDto, RuleDto } from "@shared/results";
import { BiasBadge } from "../../../components/admin/badges";
import { OutcomeBadge } from "../../../components/admin/resultBadges";
import ColumnChooser from "../../../components/list/ColumnChooser";
import ExportLink from "../../../components/list/ExportLink";
import Pagination, { SortTh } from "../../../components/list/Pagination";
import SavedViewsMenu from "../../../components/list/SavedViewsMenu";
import SearchBox from "../../../components/list/SearchBox";
import { Notice, PageHeader, btnGhost, inputCls } from "../../../components/ui";
import { useLookups } from "../../../lib/admin";
import { api, errorMessage } from "../../../lib/api";
import { fmtDateTime } from "../../../lib/dates";
import { useColumns } from "../../../lib/useColumns";
import { useListState } from "../../../lib/useListState";

const LIMIT = 25;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ResultsListPage() {
  const lookups = useLookups();
  const ls = useListState(LIMIT);
  const cols = useColumns("results");

  const list = useQuery({
    queryKey: ["results", "list", ls.apiQuery],
    queryFn: () => api<ListResponse<ResultListItemDto>>(`/api/admin/results?${ls.apiQuery}`),
    placeholderData: keepPreviousData,
  });
  const rules = useQuery({ queryKey: ["rules"], queryFn: () => api<{ items: RuleDto[] }>("/api/admin/rules") });

  const items = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const markets = lookups.data?.markets ?? [];
  const symbol = (id: string) => markets.find((m) => m.id === id)?.symbol ?? "?";
  const f = ls.filters;

  const cell: Record<string, (r: ResultListItemDto) => ReactNode> = {
    date: (r) => (r.post.type === "daily" ? r.post.postDate : r.post.weekStartDate),
    market: (r) => <span className="font-mono">{symbol(r.post.marketId)}</span>,
    type: (r) => r.post.type,
    bias: (r) => <BiasBadge bias={r.post.bias} />,
    outcome: (r) => <OutcomeBadge outcome={r.effectiveOutcome} corrected={r.correctionCount > 0} />,
    original: (r) => cap(r.result.outcome),
    corrections: (r) => r.correctionCount,
    ruleVersion: (r) => `v${r.result.evaluationRuleVersion}`,
    evaluatedBy: (r) => r.result.evaluatedByName ?? "-",
    evaluatedAt: (r) => fmtDateTime(r.result.evaluatedAt),
    note: (r) => (r.result.noteMd.length > 80 ? `${r.result.noteMd.slice(0, 80)}...` : r.result.noteMd),
    title: (r) => r.post.title || "(untitled)",
  };
  const shown = cols.defs.filter((d) => cols.visible.includes(d.id));

  return (
    <>
      <PageHeader title="All results" />
      <div className="mb-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <select className={inputCls} value={f.outcome ?? ""} onChange={(e) => ls.set({ outcome: e.target.value })} aria-label="Outcome">
          <option value="">Any outcome</option>{OUTCOMES.map((o) => <option key={o} value={o}>{cap(o)}</option>)}
        </select>
        <select className={inputCls} value={f.marketId ?? ""} onChange={(e) => ls.set({ marketId: e.target.value })} aria-label="Market">
          <option value="">All markets</option>{markets.map((m) => <option key={m.id} value={m.id}>{m.symbol}</option>)}
        </select>
        <select className={inputCls} value={f.type ?? ""} onChange={(e) => ls.set({ type: e.target.value })} aria-label="Type">
          <option value="">Daily + weekly</option>{POST_TYPES.map((t) => <option key={t} value={t}>{cap(t)}</option>)}
        </select>
        <select className={inputCls} value={f.ruleVersion ?? ""} onChange={(e) => ls.set({ ruleVersion: e.target.value })} aria-label="Rule version">
          <option value="">Any rule version</option>{(rules.data?.items ?? []).map((r) => <option key={r.id} value={r.version}>Rule v{r.version}</option>)}
        </select>
        <input type="date" className={inputCls} value={f.dateFrom ?? ""} onChange={(e) => ls.set({ dateFrom: e.target.value })} title="Post date from" aria-label="Post date from" />
        <input type="date" className={inputCls} value={f.dateTo ?? ""} onChange={(e) => ls.set({ dateTo: e.target.value })} title="Post date to" aria-label="Post date to" />
        <SearchBox value={f.q ?? ""} onChange={(v) => ls.set({ q: v })} placeholder="Search title or note" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {ls.hasFilters && <button className={btnGhost} onClick={ls.clear}>Clear filters</button>}
        <span className="mr-auto" />
        <SavedViewsMenu
          scope="results"
          filters={ls.filters}
          columns={cols.visible}
          onApply={(v) => {
            ls.replaceFilters(v.filters);
            if (v.columns.length > 0) cols.set(v.columns);
          }}
        />
        <ColumnChooser defs={cols.defs} visible={cols.visible} onChange={cols.set} onReset={cols.reset} />
        <ExportLink kind="results" query={ls.exportQuery} columns={cols.visible} />
      </div>

      {list.isError && <Notice kind="error">{errorMessage(list.error)}</Notice>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-400">
            <tr>{shown.map((d) => <SortTh key={d.id} label={d.label} sort="" dir="desc" onSort={() => undefined} />)}</tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.result.id} className="border-t border-slate-800">
                {shown.map((d, i) => (
                  <td key={d.id} className="py-2 pr-3 whitespace-nowrap">
                    {i === 0 ? <Link to={`/admin/results/${r.result.id}`} className="text-blue-300 hover:underline">{cell[d.id]?.(r)}</Link> : cell[d.id]?.(r)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {list.data && items.length === 0 && <p className="py-4 text-sm text-slate-400">No results match.</p>}
        {list.isLoading && <p className="py-4 text-sm text-slate-400">Loading...</p>}
      </div>

      <Pagination offset={ls.offset} limit={LIMIT} total={total} onChange={(o) => ls.set({ offset: o ? String(o) : "" })} />
    </>
  );
}
