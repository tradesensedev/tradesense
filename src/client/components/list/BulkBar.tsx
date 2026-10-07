import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ACCESS_LEVELS } from "@shared/constants";
import { MAX_BULK_ITEMS, type BulkAction, type BulkResponse } from "@shared/lists";
import { can, type Permission } from "@shared/permissions";
import { useLookups } from "../../lib/admin";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { Notice, btnGhost, btnPrimary, inputCls } from "../ui";

type Kind = "posts" | "notes";

const LABEL: Record<BulkAction, string> = {
  publish: "Publish now",
  unschedule: "Unschedule (back to draft)",
  set_access: "Set access",
  add_tag: "Add tag",
  remove_tag: "Remove tag",
  delete: "Delete drafts",
};

function permissionFor(kind: Kind, action: BulkAction): Permission {
  const publish = action === "publish" || action === "unschedule";
  return kind === "posts" ? (publish ? "post:publish" : "post:edit") : publish ? "note:publish" : "note:edit";
}

// Runs one action on the selected rows (or on everything matching the filter). Each row goes through the same rules as the
// single-item screens, so locked or not-allowed rows are reported back and never block the others.
export default function BulkBar({
  kind,
  ids,
  allMatching,
  totalMatching,
  filters,
  onToggleAllMatching,
  onClear,
  onDone,
  labelOf,
}: {
  kind: Kind;
  ids: string[];
  allMatching: boolean;
  totalMatching: number;
  filters: Record<string, string>; // the list's filters, used when "all matching" is on
  onToggleAllMatching: (on: boolean) => void;
  onClear: () => void;
  onDone: () => void;
  labelOf?: (id: string) => string;
}) {
  const { user } = useAuth();
  const lookups = useLookups();
  const [action, setAction] = useState<BulkAction | "">("");
  const [access, setAccess] = useState<(typeof ACCESS_LEVELS)[number]>("free");
  const [tagId, setTagId] = useState("");
  const [result, setResult] = useState<BulkResponse | null>(null);

  const actions = (Object.keys(LABEL) as BulkAction[]).filter((a) => can(user?.role, permissionFor(kind, a)));
  const count = allMatching ? Math.min(totalMatching, MAX_BULK_ITEMS) : ids.length;
  const needsTag = action === "add_tag" || action === "remove_tag";
  const blocked = !action || (needsTag && !tagId) || (action === "delete" && allMatching);

  const run = useMutation({
    mutationFn: () =>
      api<BulkResponse>(`/api/admin/lists/${kind}/bulk`, {
        method: "POST",
        body: {
          action,
          selection: allMatching ? { filter: filters } : { ids },
          ...(action === "set_access" && { access }),
          ...(needsTag && { tagId }),
        },
      }),
    onSuccess: (r) => {
      setResult(r);
      onDone();
    },
  });

  const go = () => {
    if (!action) return;
    const what = allMatching ? `all ${totalMatching} matching rows` : `${ids.length} selected row(s)`;
    const risky = action === "publish" || action === "delete" || allMatching;
    if (risky && !window.confirm(`${LABEL[action]}: ${what}?`)) return;
    setResult(null);
    run.mutate();
  };

  const failures = result?.results.filter((r) => !r.ok) ?? [];

  return (
    <div className="mb-3 space-y-2">
      {ids.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-700 bg-slate-900 p-2 text-sm">
          <strong>{allMatching ? `All ${totalMatching} matching` : `${ids.length} selected`}</strong>
          {!allMatching && totalMatching > ids.length && (
            <button type="button" className="text-blue-300 hover:underline" onClick={() => onToggleAllMatching(true)}>
              Select all {totalMatching} matching
            </button>
          )}
          {allMatching && (
            <button type="button" className="text-blue-300 hover:underline" onClick={() => onToggleAllMatching(false)}>
              Only this page
            </button>
          )}
          <span className="mx-1 text-slate-600" aria-hidden>|</span>
          <select className={`${inputCls} w-auto`} value={action} onChange={(e) => setAction(e.target.value as BulkAction | "")} aria-label="Bulk action">
            <option value="">Choose action...</option>
            {actions.map((a) => (
              <option key={a} value={a} disabled={a === "delete" && allMatching}>{LABEL[a]}</option>
            ))}
          </select>
          {action === "set_access" && (
            <select className={`${inputCls} w-auto`} value={access} onChange={(e) => setAccess(e.target.value as typeof access)} aria-label="Access level">
              {ACCESS_LEVELS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          )}
          {needsTag && (
            <select className={`${inputCls} w-auto`} value={tagId} onChange={(e) => setTagId(e.target.value)} aria-label="Tag">
              <option value="">Choose tag...</option>
              {(lookups.data?.tags ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <button type="button" className={btnPrimary} disabled={blocked || run.isPending} onClick={go}>
            {run.isPending ? "Working..." : `Run on ${count}`}
          </button>
          <button type="button" className={btnGhost} onClick={onClear}>Clear selection</button>
        </div>
      )}

      {run.isError && <Notice kind="error">{errorMessage(run.error)}</Notice>}
      {result && (
        <Notice kind={result.failCount > 0 ? "warn" : "success"}>
          {LABEL[result.action]}: {result.okCount} done{result.failCount > 0 ? `, ${result.failCount} not changed` : ""}.
          {result.truncated && " Only the first 100 rows ran in this go. Run it again for the rest."}
          {failures.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-xs">
              {failures.slice(0, 10).map((f) => (
                <li key={f.id}>{labelOf?.(f.id) ?? f.id}: {f.error}</li>
              ))}
              {failures.length > 10 && <li>and {failures.length - 10} more</li>}
            </ul>
          )}
        </Notice>
      )}
    </div>
  );
}
