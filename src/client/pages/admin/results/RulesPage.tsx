import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { can } from "@shared/permissions";
import type { RuleDto } from "@shared/results";
import Markdown from "../../../components/Markdown";
import { Badge, Field, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from "../../../components/ui";
import { api, errorMessage } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { fmtDateTime } from "../../../lib/dates";

// Rules are append-only. A change is a NEW version; past results keep the version they were judged under.
export default function RulesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canManage = can(user?.role, "rules:manage");
  const [textMd, setTextMd] = useState("");
  const [activate, setActivate] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const rules = useQuery({ queryKey: ["rules"], queryFn: () => api<{ items: RuleDto[] }>("/api/admin/rules") });
  const items = rules.data?.items ?? [];
  const active = items.find((r) => r.active);
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["rules"] });
    void qc.invalidateQueries({ queryKey: ["results"] });
  };

  const create = useMutation({
    mutationFn: () => api<RuleDto>("/api/admin/rules", { method: "POST", body: { textMd, activate } }),
    onSuccess: (r) => {
      setMsg(`Version ${r.version} saved${r.active ? " and made active" : ""}.`);
      setTextMd("");
      refresh();
    },
  });
  const makeActive = useMutation({
    mutationFn: (version: number) => api<{ items: RuleDto[] }>(`/api/admin/rules/${version}/activate`, { method: "POST", body: {} }),
    onSuccess: () => {
      setMsg("Active rule changed. New results will use it.");
      refresh();
    },
  });

  const error = create.error ?? makeActive.error ?? rules.error;

  return (
    <>
      <PageHeader title="Evaluation rules" />
      <p className="mb-3 text-sm text-slate-400">
        The written rule used to judge Correct, Partial or Wrong. Every result stores the version it was judged under, so changing the rule never changes past results.
      </p>
      {msg && <Notice kind="success">{msg}</Notice>}
      {error && <Notice kind="error">{errorMessage(error)}</Notice>}

      {canManage && (
        <section className="mb-5 space-y-3 rounded-md border border-slate-800 p-4">
          <h2 className="font-medium">New version</h2>
          <Field label="Rule text (markdown)" hint="Saved as the next version number. It cannot be edited afterwards.">
            <textarea className={`${inputCls} font-mono`} rows={8} maxLength={20000} value={textMd} onChange={(e) => setTextMd(e.target.value)} />
          </Field>
          {active && (
            <button type="button" className="text-xs text-blue-300 hover:underline" onClick={() => setTextMd(active.textMd)}>
              Start from the active version (v{active.version})
            </button>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={activate} onChange={(e) => setActivate(e.target.checked)} /> Make this version active now
          </label>
          <button className={btnPrimary} disabled={!textMd.trim() || create.isPending} onClick={() => { setMsg(null); create.mutate(); }}>
            {create.isPending ? "Saving..." : "Save new version"}
          </button>
        </section>
      )}

      {rules.isLoading && <p className="text-sm text-slate-400">Loading...</p>}
      <ul className="space-y-3">
        {items.map((r) => (
          <li key={r.id} className="rounded-md border border-slate-800 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <strong>Version {r.version}</strong>
              {r.active ? <Badge tone="green">Active</Badge> : <Badge>Not active</Badge>}
              <span className="text-xs text-slate-400">created {fmtDateTime(r.activeFrom)}</span>
              {canManage && !r.active && (
                <button
                  className={`${btnGhost} ml-auto`}
                  disabled={makeActive.isPending}
                  onClick={() => window.confirm(`Make version ${r.version} the active rule?`) && makeActive.mutate(r.version)}
                >
                  Make active
                </button>
              )}
            </div>
            <details className="mt-2" open={r.active}>
              <summary className="cursor-pointer text-sm text-slate-300">Rule text</summary>
              <div className="mt-2"><Markdown>{r.textMd}</Markdown></div>
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}
