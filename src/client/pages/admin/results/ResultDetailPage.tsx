import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { OUTCOMES, type Outcome } from "@shared/constants";
import { can } from "@shared/permissions";
import type { ResultDetail } from "@shared/results";
import AttachmentsPanel from "../../../components/admin/AttachmentsPanel";
import { BiasBadge } from "../../../components/admin/badges";
import { OutcomeBadge } from "../../../components/admin/resultBadges";
import Markdown from "../../../components/Markdown";
import { Field, Notice, PageHeader, btnPrimary, inputCls } from "../../../components/ui";
import { useLookups } from "../../../lib/admin";
import { ApiError, api, errorMessage } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { fmtDateTime } from "../../../lib/dates";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// A result is never edited. A mistake is fixed with a correction, which is kept and shown beside the original.
function CorrectionForm({ detail, onSaved }: { detail: ResultDetail; onSaved: () => void }) {
  const choices = OUTCOMES.filter((o) => o !== detail.effectiveOutcome);
  const [newOutcome, setNewOutcome] = useState<Outcome | "">("");
  const [reasonMd, setReasonMd] = useState("");
  const save = useMutation({
    mutationFn: () => api<ResultDetail>(`/api/admin/results/${detail.result.id}/corrections`, { method: "POST", body: { newOutcome, reasonMd } }),
    onSuccess: () => {
      setNewOutcome("");
      setReasonMd("");
      onSaved();
    },
  });
  const go = () => {
    if (window.confirm("Add this correction? Corrections stay on record and cannot be removed.")) save.mutate();
  };

  return (
    <section className="space-y-3 rounded-md border border-slate-800 p-4">
      <h2 className="font-medium">Add a correction</h2>
      {save.isError && <Notice kind="error">{errorMessage(save.error)}</Notice>}
      <Field label="New outcome">
        <select className={inputCls} value={newOutcome} onChange={(e) => setNewOutcome(e.target.value as Outcome | "")}>
          <option value="">Choose...</option>{choices.map((o) => <option key={o} value={o}>{cap(o)}</option>)}
        </select>
      </Field>
      <Field label="Reason (required)" hint="Shown publicly with the correction.">
        <textarea className={inputCls} rows={3} maxLength={5000} value={reasonMd} onChange={(e) => setReasonMd(e.target.value)} />
      </Field>
      <button className={btnPrimary} disabled={!newOutcome || !reasonMd.trim() || save.isPending} onClick={go}>
        {save.isPending ? "Saving..." : "Save correction"}
      </button>
    </section>
  );
}

export default function ResultDetailPage() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const lookups = useLookups();

  const detail = useQuery({
    queryKey: ["results", "detail", id],
    queryFn: () => api<ResultDetail>(`/api/admin/results/${id}`),
    retry: (count, e) => !(e instanceof ApiError && e.status === 404) && count < 2,
  });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["results"] });
    void qc.invalidateQueries({ queryKey: ["lists"] });
  };

  if (detail.isLoading) return <p className="text-sm text-slate-400">Loading...</p>;
  if (detail.isError || !detail.data) return <Notice kind="error">{errorMessage(detail.error)}</Notice>;

  const d = detail.data;
  const symbol = lookups.data?.markets.find((m) => m.id === d.post.marketId)?.symbol ?? "?";
  const canCorrect = can(user?.role, "result:create");
  const canAttach = can(user?.role, "result:create") && can(user?.role, "attachment:manage");
  const corrected = d.corrections.length > 0;

  return (
    <>
      <PageHeader title={`Result: ${symbol} ${d.post.type} ${d.post.type === "daily" ? d.post.postDate : d.post.weekStartDate}`}>
        <Link to="/admin/results/all" className="text-sm text-slate-300 hover:underline">Back to all results</Link>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <section className="space-y-3 rounded-md border border-slate-800 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <OutcomeBadge outcome={d.effectiveOutcome} corrected={corrected} />
              {corrected && <span className="text-xs text-slate-400">Original outcome: {cap(d.result.outcome)}</span>}
            </div>
            <p className="text-xs text-slate-400">
              Judged under rule v{d.result.evaluationRuleVersion} by {d.result.evaluatedByName ?? "unknown"} on {fmtDateTime(d.result.evaluatedAt)}.
            </p>
            <h2 className="text-sm font-medium">Note</h2>
            <Markdown>{d.result.noteMd}</Markdown>
          </section>

          {corrected && (
            <section className="space-y-3 rounded-md border border-slate-800 p-4">
              <h2 className="font-medium">Corrections</h2>
              <ol className="space-y-3">
                {d.corrections.map((c) => (
                  <li key={c.id} className="rounded-md border border-slate-800 p-3 text-sm">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <OutcomeBadge outcome={c.newOutcome} />
                      <span className="text-xs text-slate-400">by {c.createdByName ?? "unknown"} on {fmtDateTime(c.createdAt)}</span>
                    </div>
                    <Markdown>{c.reasonMd}</Markdown>
                  </li>
                ))}
              </ol>
            </section>
          )}

          {canCorrect && <CorrectionForm detail={d} onSaved={refresh} />}

          <AttachmentsPanel
            ownerType="result"
            ownerId={d.result.id}
            items={d.attachments}
            canUpload={canAttach}
            canManage={canAttach}
            readOnly={false}
            onChanged={refresh}
          />
        </div>

        <aside className="space-y-2 text-sm lg:self-start">
          <p className="text-xs uppercase tracking-wide text-slate-500">The post</p>
          <div className="space-y-2 rounded-md border border-slate-800 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono">{symbol}</span>
              <BiasBadge bias={d.post.bias} />
              <span className="text-slate-400">{cap(d.post.confidence)} confidence</span>
            </div>
            <p>{d.post.title || "(untitled)"}</p>
            <p className="text-xs text-slate-400">Valid until {fmtDateTime(d.post.validUntil)}</p>
            <Link to={`/admin/posts/${d.post.id}`} className="text-blue-300 hover:underline">Open the post</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
