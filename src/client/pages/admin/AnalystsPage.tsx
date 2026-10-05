import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { AnalystDto } from "@shared/types";
import { Badge, Field, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from "../../components/ui";
import { useLookups, useRefreshLookups } from "../../lib/admin";
import { api, errorMessage } from "../../lib/api";

function Card({ a, onDone, onMsg }: { a: AnalystDto; onDone: () => void; onMsg: (k: "error" | "success", t: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [d, setD] = useState({ name: a.name, bio: a.bio, active: a.active });
  const save = useMutation({
    mutationFn: () => api(`/api/admin/analysts/${a.id}`, { method: "PUT", body: d }),
    onSuccess: () => {
      setEditing(false);
      onMsg("success", `${d.name} saved.`);
      onDone();
    },
    onError: (e) => onMsg("error", errorMessage(e)),
  });

  if (!editing) {
    return (
      <div className="rounded-md border border-slate-800 p-3 text-sm">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">{a.name}</span>
          <span className="flex items-center gap-2">
            {a.active ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>}
            <button className={btnGhost} onClick={() => setEditing(true)}>Edit</button>
          </span>
        </div>
        {a.bio && <p className="mt-2 whitespace-pre-wrap text-slate-300">{a.bio}</p>}
      </div>
    );
  }
  return (
    <div className="space-y-3 rounded-md border border-slate-600 p-3 text-sm">
      <Field label="Name"><input className={inputCls} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></Field>
      <Field label="Bio"><textarea className={inputCls} rows={3} maxLength={2000} value={d.bio} onChange={(e) => setD({ ...d, bio: e.target.value })} /></Field>
      <label className="flex items-center gap-2"><input type="checkbox" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} /> Active</label>
      <div className="space-x-2">
        <button className={btnPrimary} disabled={save.isPending} onClick={() => save.mutate()}>Save</button>
        <button className={btnGhost} onClick={() => setEditing(false)}>Cancel</button>
      </div>
    </div>
  );
}

export default function AnalystsPage() {
  const { data, isLoading, error } = useLookups();
  const refresh = useRefreshLookups();
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const empty = { name: "", bio: "", active: true };
  const [form, setForm] = useState(empty);

  const create = useMutation({
    mutationFn: () => api("/api/admin/analysts", { method: "POST", body: form }),
    onSuccess: () => {
      setMsg({ kind: "success", text: `${form.name} added.` });
      setForm(empty);
      void refresh();
    },
    onError: (e) => setMsg({ kind: "error", text: errorMessage(e) }),
  });

  if (isLoading) return <p className="text-sm text-slate-400">Loading...</p>;
  if (error || !data) return <Notice kind="error">{errorMessage(error)}</Notice>;

  return (
    <>
      <PageHeader title="Analysts" />
      <p className="mb-3 text-xs text-slate-400">Analysts are shown as the author of posts and notes. They are never deleted; deactivate instead.</p>
      {msg && <div className="mb-3"><Notice kind={msg.kind}>{msg.text}</Notice></div>}
      <div className="grid max-w-3xl gap-3">
        {data.analysts.map((a) => (
          <Card key={a.id} a={a} onDone={() => void refresh()} onMsg={(kind, text) => setMsg({ kind, text })} />
        ))}
        {data.analysts.length === 0 && <p className="text-sm text-slate-400">No analysts yet.</p>}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setMsg(null); create.mutate(); }}
        className="mt-6 max-w-3xl space-y-3 rounded-md border border-slate-800 p-4"
      >
        <h2 className="font-medium">Add analyst</h2>
        <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
        <Field label="Bio"><textarea className={inputCls} rows={3} maxLength={2000} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
        <button className={btnPrimary} disabled={create.isPending}>{create.isPending ? "Adding..." : "Add analyst"}</button>
      </form>
    </>
  );
}
