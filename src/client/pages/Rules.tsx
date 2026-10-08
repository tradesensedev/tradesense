import type { PublicRulesDto } from "@shared/publicDetail";
import Markdown from "../components/Markdown";
import { Badge, Notice, PageHeader } from "../components/ui";
import { errorMessage } from "../lib/api";
import { fmtDateTime } from "../lib/dates";
import { usePublicQuery } from "../lib/publicApi";

// The public, versioned rules every result is judged by. Each result shows the version it was judged under.
export default function Rules() {
  const q = usePublicQuery<PublicRulesDto>(["rules"], "/api/public/rules");
  const active = q.data?.items.find((r) => r.active);
  const older = (q.data?.items ?? []).filter((r) => !r.active);
  return (
    <main className="mx-auto max-w-3xl space-y-4">
      <PageHeader title="Evaluation rules" />
      <p className="text-sm text-slate-400">How a result is judged correct, wrong or partial. A result always keeps the rule version it was judged under; corrections are shown beside the original, never in place of it.</p>
      {q.isLoading && <p className="text-sm text-slate-400">Loading...</p>}
      {q.isError && <Notice kind="error">{errorMessage(q.error)}</Notice>}
      {q.data && !active && <Notice kind="info">No evaluation rules have been published yet.</Notice>}
      {active && (
        <section className="space-y-2 rounded-md border border-slate-700 p-4" aria-label="Current rules">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">Version {active.version}</h2>
            <Badge tone="green">Current</Badge>
            <span className="text-xs text-slate-400">in force since {fmtDateTime(active.activeFrom)}</span>
          </div>
          <Markdown>{active.textMd}</Markdown>
        </section>
      )}
      {older.length > 0 && (
        <section className="space-y-2" aria-label="Earlier versions">
          <h2 className="text-sm font-semibold">Earlier versions</h2>
          {older.map((r) => (
            <details key={r.version} className="rounded-md border border-slate-800 p-3">
              <summary className="cursor-pointer text-sm">Version {r.version} <span className="text-slate-400">(from {fmtDateTime(r.activeFrom)})</span></summary>
              <div className="mt-2"><Markdown>{r.textMd}</Markdown></div>
            </details>
          ))}
        </section>
      )}
    </main>
  );
}
