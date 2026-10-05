import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { TagDto } from "@shared/types";
import { Notice, PageHeader, btnDanger, btnGhost, btnPrimary, inputCls } from "../../components/ui";
import { useLookups, useRefreshLookups } from "../../lib/admin";
import { api, errorMessage } from "../../lib/api";

function Row({ t, onDone, onMsg }: { t: TagDto; onDone: () => void; onMsg: (k: "error" | "success", t: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(t.name);
  const rename = useMutation({
    mutationFn: () => api(`/api/admin/tags/${t.id}`, { method: "PUT", body: { name } }),
    onSuccess: () => {
      setEditing(false);
      onMsg("success", "Tag renamed.");
      onDone();
    },
    onError: (e) => onMsg("error", errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: () => api(`/api/admin/tags/${t.id}`, { method: "DELETE" }),
    onSuccess: () => {
      onMsg("success", `Tag "${t.name}" deleted.`);
      onDone();
    },
    onError: (e) => onMsg("error", errorMessage(e)),
  });

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 py-2 text-sm">
      {editing ? (
        <input className={`${inputCls} max-w-xs`} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      ) : (
        <span>
          {t.name} <span className="text-xs text-slate-500">({t.uses} use{t.uses === 1 ? "" : "s"})</span>
        </span>
      )}
      <span className="space-x-2">
        {editing ? (
          <>
            <button className={btnPrimary} disabled={rename.isPending} onClick={() => rename.mutate()}>Save</button>
            <button className={btnGhost} onClick={() => { setEditing(false); setName(t.name); }}>Cancel</button>
          </>
        ) : (
          <>
            <button className={btnGhost} onClick={() => setEditing(true)}>Rename</button>
            <button
              className={btnDanger}
              disabled={t.uses > 0 || remove.isPending}
              title={t.uses > 0 ? "In use: rename it, or remove it from its items first" : "Delete tag"}
              onClick={() => { if (window.confirm(`Delete tag "${t.name}"?`)) remove.mutate(); }}
            >
              Delete
            </button>
          </>
        )}
      </span>
    </li>
  );
}

export default function TagsPage() {
  const { data, isLoading, error } = useLookups();
  const refresh = useRefreshLookups();
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [name, setName] = useState("");

  const create = useMutation({
    mutationFn: () => api("/api/admin/tags", { method: "POST", body: { name } }),
    onSuccess: () => {
      setMsg({ kind: "success", text: `Tag "${name}" added.` });
      setName("");
      void refresh();
    },
    onError: (e) => setMsg({ kind: "error", text: errorMessage(e) }),
  });

  if (isLoading) return <p className="text-sm text-slate-400">Loading...</p>;
  if (error || !data) return <Notice kind="error">{errorMessage(error)}</Notice>;

  return (
    <>
      <PageHeader title="Driver tags" />
      <p className="mb-3 text-xs text-slate-400">Tags describe what drove a bias (for example CPI, FOMC, DXY strength). A tag that is in use cannot be deleted.</p>
      {msg && <div className="mb-3"><Notice kind={msg.kind}>{msg.text}</Notice></div>}

      <form
        onSubmit={(e) => { e.preventDefault(); setMsg(null); create.mutate(); }}
        className="mb-4 flex max-w-md gap-2"
      >
        <input className={inputCls} placeholder="New tag name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={50} />
        <button className={btnPrimary} disabled={create.isPending}>Add</button>
      </form>

      <ul className="max-w-2xl">
        {data.tags.map((t) => (
          <Row key={t.id} t={t} onDone={() => void refresh()} onMsg={(kind, text) => setMsg({ kind, text })} />
        ))}
        {data.tags.length === 0 && <li className="text-sm text-slate-400">No tags yet.</li>}
      </ul>
    </>
  );
}
