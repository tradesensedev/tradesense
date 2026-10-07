import { Fragment, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { OUTCOMES, POST_TYPES, type Outcome } from "@shared/constants";
import { can } from "@shared/permissions";
import type { QueueItemDto, QueueResponse, ResultDetail } from "@shared/results";
import { BiasBadge } from "../../../components/admin/badges";
import Pagination from "../../../components/list/Pagination";
import Markdown from "../../../components/Markdown";
import { Field, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from "../../../components/ui";
import { useLookups } from "../../../lib/admin";
import { api, errorMessage } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { fmtDateTime } from "../../../lib/dates";
import { useListState } from "../../../lib/useListState";

const LIMIT = 25;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const OUTCOME_LABEL: Record<Outcome, string> = { correct: "✓ Correct", partial: "◐ Partial", wrong: "✗ Wrong" };

function overdue(h: number): string {
  if (h < 1) return "just expired";
  if (h < 48) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}

// One result per post, written once. The server stamps the active rule version, the evaluator and the time.
function EvaluateForm({ post, ruleVersion, onSaved }: { post: QueueItemDto; ruleVersion: number; onSaved: (detail: ResultDetail) => void }) {
  const [outcome, setOutcome] = useState<Outcome | "">("");
  const [noteMd, setNoteMd] = useState("");
  const save = useMutation({
    mutationFn: () => api<ResultDetail>("/api/admin/results", { method: "POST", body: { postId: post.id, outcome, noteMd } }),
    onSuccess: onSaved,
  });
  const ready = outcome !== "" && noteMd.trim().length > 0;

  return (
    <div className="space-y-3 rounded-md border border-slate-700 bg-slate-900/50 p-3">
      {save.isError && <Notice kind="error">{errorMessage(save.error)}</Notice>}
      <fieldset>
        <legend className="mb-1 text-xs text-slate-400">Outcome (judged by evaluation rule v{ruleVersion})</legend>
        <div className="flex flex-wrap gap-2">
          {OUTCOMES.map((o) => (
            <label key={o} className={`cursor-pointer rounded-md border px-3 py-2 text-sm ${outcome === o ? "border-slate-100 bg-slate-100 text-slate-900" : "border-slate-700 hover:border-slate-500"}`}>
              <input type="radio" name={`outcome-${post.id}`} className="sr-only" checked={outcome === o} onChange={() => setOutcome(o)} />
              {OUTCOME_LABEL[o]}
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Note (required)" hint="Why this outcome. Shown with the result. Results cannot be edited later; mistakes are fixed with a correction.">
        <textarea className={inputCls} rows={3} maxLength={5000} value={noteMd} onChange={(e) => setNoteMd(e.target.value)} />
      </Field>
      <button className={btnPrimary} disabled={!ready || save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? "Saving..." : "Save result"}
      </button>
    </div>
  );
}

export default function ResultsQueuePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const lookups = useLookups();
  const ls = useListState(LIMIT);
  const [openId, setOpenId] = useState<string | null>(null);
  const [saved, setSaved] = useState<ResultDetail | null>(null);
  const canEvaluate = can(user?.role, "result:create");

  const queue = useQuery({
    queryKey: ["results", "queue", ls.apiQuery],
    queryFn: () => api<QueueResponse>(`/api/admin/results/queue?${ls.apiQuery}`),
    placeholderData: keepPreviousData,
  });

  const items = queue.data?.items ?? [];
  const total = queue.data?.total ?? 0;
  const markets = lookups.data?.markets ?? [];
  const symbol = (id: string) => markets.find((m) => m.id === id)?.symbol ?? "?";
  const f = ls.filters;

  return (
    <>
      <PageHeader title="Results queue" />
      <p className="mb-3 text-sm text-slate-400">Published posts whose valid-until time has passed and that have no result yet. Oldest first.</p>

      {queue.data && (
        <details className="mb-3 rounded-md border border-slate-800 p-3 text-sm">
          <summary className="cursor-pointer">Active evaluation rule (v{queue.data.activeRuleVersion})</summary>
          <div className="mt-2"><Markdown>{queue.data.activeRuleText}</Markdown></div>
        </details>
      )}

      {saved && (
        <Notice kind="success">
          Result saved for {saved.post.title || "the post"}.{" "}
          <Link to={`/admin/results/${saved.result.id}`} className="underline">Open it to add a result screenshot</Link>.
        </Notice>
      )}

      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <select className={inputCls} value={f.marketId ?? ""} onChange={(e) => ls.set({ marketId: e.target.value })} aria-label="Market">
          <option value="">All markets</option>{markets.map((m) => <option key={m.id} value={m.id}>{m.symbol}</option>)}
        </select>
        <select className={inputCls} value={f.type ?? ""} onChange={(e) => ls.set({ type: e.target.value })} aria-label="Type">
          <option value="">Daily + weekly</option>{POST_TYPES.map((t) => <option key={t} value={t}>{cap(t)}</option>)}
        </select>
        {ls.hasFilters && <button className={btnGhost} onClick={ls.clear}>Clear filters</button>}
      </div>

      {queue.isError && <Notice kind="error">{errorMessage(queue.error)}</Notice>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-400">
            <tr><th className="pb-2 pr-3 font-normal">Date</th><th className="pr-3 font-normal">Type</th><th className="pr-3 font-normal">Market</th><th className="pr-3 font-normal">Bias</th><th className="pr-3 font-normal">Title</th><th className="pr-3 font-normal">Valid until</th><th className="pr-3 font-normal">Overdue</th><th /></tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <Fragment key={p.id}>
                <tr className="border-t border-slate-800">
                  <td className="py-2 pr-3 whitespace-nowrap">{p.type === "daily" ? p.postDate : p.weekStartDate}</td>
                  <td className="pr-3">{p.type}</td>
                  <td className="pr-3 font-mono">{symbol(p.marketId)}</td>
                  <td className="pr-3"><BiasBadge bias={p.bias} /></td>
                  <td className="pr-3"><Link to={`/admin/posts/${p.id}`} className="text-blue-300 hover:underline">{p.title || "(untitled)"}</Link></td>
                  <td className="pr-3 whitespace-nowrap">{fmtDateTime(p.validUntil)}</td>
                  <td className="pr-3 whitespace-nowrap">{overdue(p.hoursOverdue)}</td>
                  <td className="text-right">
                    {canEvaluate && (
                      <button className={btnGhost} aria-expanded={openId === p.id} onClick={() => setOpenId(openId === p.id ? null : p.id)}>
                        {openId === p.id ? "Close" : "Evaluate"}
                      </button>
                    )}
                  </td>
                </tr>
                {openId === p.id && queue.data && (
                  <tr>
                    <td colSpan={8} className="pb-3">
                      <EvaluateForm
                        post={p}
                        ruleVersion={queue.data.activeRuleVersion}
                        onSaved={(detail) => {
                          setSaved(detail);
                          setOpenId(null);
                          void qc.invalidateQueries({ queryKey: ["results"] });
                          void qc.invalidateQueries({ queryKey: ["lists"] });
                        }}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
        {queue.data && items.length === 0 && <p className="py-4 text-sm text-slate-400">Nothing to evaluate. All expired posts have a result.</p>}
        {queue.isLoading && <p className="py-4 text-sm text-slate-400">Loading...</p>}
      </div>

      <Pagination offset={ls.offset} limit={LIMIT} total={total} onChange={(o) => ls.set({ offset: o ? String(o) : "" })} />
    </>
  );
}
