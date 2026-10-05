import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MARKET_CATEGORIES } from "@shared/constants";
import type { MarketDto } from "@shared/types";
import { Badge, Field, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from "../../components/ui";
import { useLookups, useRefreshLookups } from "../../lib/admin";
import { api, errorMessage } from "../../lib/api";

interface Draft {
  name: string;
  category: string;
  sortOrder: string;
  active: boolean;
}

function Row({ m, onDone, onMsg }: { m: MarketDto; onDone: () => void; onMsg: (k: "error" | "success", t: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [d, setD] = useState<Draft>({ name: m.name, category: m.category, sortOrder: String(m.sortOrder), active: m.active });
  const save = useMutation({
    mutationFn: () =>
      api(`/api/admin/markets/${m.id}`, {
        method: "PUT",
        body: { name: d.name, category: d.category, sortOrder: Number(d.sortOrder) || 0, active: d.active },
      }),
    onSuccess: () => {
      setEditing(false);
      onMsg("success", `${m.symbol} saved.`);
      onDone();
    },
    onError: (e) => onMsg("error", errorMessage(e)),
  });

  if (!editing) {
    return (
      <tr className="border-t border-slate-800">
        <td className="py-2 pr-3 font-mono">{m.symbol}</td>
        <td className="pr-3">{m.name}</td>
        <td className="pr-3">{m.category}</td>
        <td className="pr-3">{m.sortOrder}</td>
        <td className="pr-3">{m.active ? <Badge tone="green">Active</Badge> : <Badge>Inactive</Badge>}</td>
        <td className="text-right"><button className={btnGhost} onClick={() => setEditing(true)}>Edit</button></td>
      </tr>
    );
  }
  return (
    <tr className="border-t border-slate-800 align-top">
      <td className="py-2 pr-3 font-mono">{m.symbol}</td>
      <td className="pr-3"><input className={inputCls} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></td>
      <td className="pr-3">
        <select className={inputCls} value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })}>
          {MARKET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </td>
      <td className="pr-3"><input className={inputCls} inputMode="numeric" value={d.sortOrder} onChange={(e) => setD({ ...d, sortOrder: e.target.value })} /></td>
      <td className="pr-3"><input type="checkbox" checked={d.active} onChange={(e) => setD({ ...d, active: e.target.checked })} /></td>
      <td className="space-x-2 text-right">
        <button className={btnPrimary} disabled={save.isPending} onClick={() => save.mutate()}>Save</button>
        <button className={btnGhost} onClick={() => setEditing(false)}>Cancel</button>
      </td>
    </tr>
  );
}

export default function MarketsPage() {
  const { data, isLoading, error } = useLookups();
  const refresh = useRefreshLookups();
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const empty = { symbol: "", name: "", category: "forex", sortOrder: "0", active: true };
  const [form, setForm] = useState(empty);

  const create = useMutation({
    mutationFn: () =>
      api("/api/admin/markets", {
        method: "POST",
        body: { symbol: form.symbol, name: form.name, category: form.category, sortOrder: Number(form.sortOrder) || 0, active: form.active },
      }),
    onSuccess: () => {
      setMsg({ kind: "success", text: `${form.symbol.toUpperCase()} added.` });
      setForm(empty);
      void refresh();
    },
    onError: (e) => setMsg({ kind: "error", text: errorMessage(e) }),
  });

  if (isLoading) return <p className="text-sm text-slate-400">Loading...</p>;
  if (error || !data) return <Notice kind="error">{errorMessage(error)}</Notice>;

  return (
    <>
      <PageHeader title="Markets" />
      <p className="mb-3 text-xs text-slate-400">Markets are never deleted because posts refer to them. Deactivate a market to stop using it. The symbol cannot be changed.</p>
      {msg && <div className="mb-3"><Notice kind={msg.kind}>{msg.text}</Notice></div>}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-400">
            <tr><th className="pb-2">Symbol</th><th>Name</th><th>Category</th><th>Order</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {data.markets.map((m) => (
              <Row key={m.id} m={m} onDone={() => void refresh()} onMsg={(kind, text) => setMsg({ kind, text })} />
            ))}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setMsg(null); create.mutate(); }}
        className="mt-6 grid max-w-3xl gap-3 rounded-md border border-slate-800 p-4 sm:grid-cols-2"
      >
        <h2 className="font-medium sm:col-span-2">Add market</h2>
        <Field label="Symbol" hint="Example: XAUUSD"><input className={inputCls} value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} required /></Field>
        <Field label="Name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
        <Field label="Category">
          <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {MARKET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Sort order" hint="Lower numbers appear first."><input className={inputCls} inputMode="numeric" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active
        </label>
        <div className="sm:col-span-2"><button className={btnPrimary} disabled={create.isPending}>{create.isPending ? "Adding..." : "Add market"}</button></div>
      </form>
    </>
  );
}
