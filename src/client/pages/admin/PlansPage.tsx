import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { PlanDto } from "@shared/admin";
import { Badge, Field, Notice, PageHeader, btnGhost, btnPrimary, inputCls } from "../../components/ui";
import { useLookups } from "../../lib/admin";
import { api, errorMessage } from "../../lib/api";

type Msg = { kind: "error" | "success"; text: string } | null;
const money = (n: number) => `$${n.toFixed(2)}`;

function PlanForm({ plan, onDone }: { plan?: PlanDto; onDone: () => void }) {
  const [f, setF] = useState({
    code: plan?.code ?? "",
    name: plan?.name ?? "",
    durationDays: String(plan?.durationDays ?? 30),
    priceUsd: String(plan?.priceUsd ?? 0),
    sortOrder: String(plan?.sortOrder ?? 0),
    active: plan?.active ?? true,
  });
  const [prices, setPrices] = useState(plan?.regionPrices.map((r) => ({ countryCode: r.countryCode, priceUsd: String(r.priceUsd) })) ?? []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const lookups = useLookups();
  const regional = lookups.data?.settings.regional_pricing_enabled ?? false;

  const body = { name: f.name, durationDays: Number(f.durationDays), priceUsd: Number(f.priceUsd), sortOrder: Number(f.sortOrder), active: f.active };

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      if (plan) {
        await api(`/api/admin/plans/${plan.id}`, { method: "PATCH", body });
        await api(`/api/admin/plans/${plan.id}/region-prices`, {
          method: "PUT",
          body: { prices: prices.filter((p) => p.countryCode.trim()).map((p) => ({ countryCode: p.countryCode.trim().toUpperCase(), priceUsd: Number(p.priceUsd) })) },
        });
      } else {
        await api("/api/admin/plans", { method: "POST", body: { code: f.code, ...body } });
      }
      setMsg({ kind: "success", text: "Saved." });
      onDone();
    } catch (e) {
      setMsg({ kind: "error", text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-slate-700 bg-slate-900/50 p-3">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="grid gap-3 sm:grid-cols-3">
        {!plan && <Field label="Code" hint="2-30 letters, digits, - _. Cannot change later."><input className={inputCls} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></Field>}
        <Field label="Name"><input className={inputCls} maxLength={100} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Duration (days)"><input type="number" min={1} className={inputCls} value={f.durationDays} onChange={(e) => setF({ ...f, durationDays: e.target.value })} /></Field>
        <Field label="Price (USD)"><input type="number" min={0} step="0.01" className={inputCls} value={f.priceUsd} onChange={(e) => setF({ ...f, priceUsd: e.target.value })} /></Field>
        <Field label="Sort order"><input type="number" min={0} className={inputCls} value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: e.target.value })} /></Field>
        <label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active (on sale)</label>
      </div>

      {plan && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Regional prices</p>
          <p className="text-xs text-slate-400">{regional ? "Regional pricing is ON: these prices replace the base price for the listed countries." : "Regional pricing is OFF in Settings, so these prices are stored but not used."}</p>
          {prices.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className={`${inputCls} w-24`} placeholder="BD" maxLength={2} value={p.countryCode} onChange={(e) => setPrices(prices.map((x, k) => (k === i ? { ...x, countryCode: e.target.value } : x)))} aria-label="Country code" />
              <input type="number" min={0} step="0.01" className={`${inputCls} w-32`} value={p.priceUsd} onChange={(e) => setPrices(prices.map((x, k) => (k === i ? { ...x, priceUsd: e.target.value } : x)))} aria-label="Price in USD" />
              <button className={btnGhost} onClick={() => setPrices(prices.filter((_, k) => k !== i))}>Remove</button>
            </div>
          ))}
          <button className={btnGhost} onClick={() => setPrices([...prices, { countryCode: "", priceUsd: "0" }])}>Add country</button>
        </div>
      )}

      <button className={btnPrimary} disabled={busy || !f.name.trim() || (!plan && !f.code.trim())} onClick={() => void save()}>{busy ? "Saving..." : plan ? "Save plan" : "Create plan"}</button>
    </div>
  );
}

export default function PlansPage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const plans = useQuery({ queryKey: ["plans"], queryFn: () => api<{ items: PlanDto[] }>("/api/admin/plans") });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["plans"] });

  return (
    <>
      <PageHeader title="Plans">
        <button className={btnPrimary} onClick={() => setShowNew((v) => !v)}>{showNew ? "Close" : "New plan"}</button>
      </PageHeader>
      <p className="mb-3 text-sm text-slate-400">Plans are never deleted, because payments and subscriptions point at them. Switch a plan off with Active to stop selling it.</p>
      {showNew && <div className="mb-4"><PlanForm onDone={() => { setShowNew(false); refresh(); }} /></div>}
      {plans.isError && <Notice kind="error">{errorMessage(plans.error)}</Notice>}
      {plans.isLoading && <p className="text-sm text-slate-400">Loading...</p>}
      <ul className="space-y-3">
        {(plans.data?.items ?? []).map((p) => (
          <li key={p.id} className="space-y-2 rounded-md border border-slate-800 p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <strong>{p.name}</strong>
              <span className="font-mono text-xs text-slate-400">{p.code}</span>
              {p.active ? <Badge tone="green">Active</Badge> : <Badge>Off</Badge>}
              <span>{money(p.priceUsd)} for {p.durationDays} days</span>
              {p.regionPrices.length > 0 && <Badge tone="blue">{p.regionPrices.length} regional</Badge>}
              <button className={`${btnGhost} ml-auto`} aria-expanded={openId === p.id} onClick={() => setOpenId(openId === p.id ? null : p.id)}>{openId === p.id ? "Close" : "Edit"}</button>
            </div>
            {openId === p.id && <PlanForm plan={p} onDone={refresh} />}
          </li>
        ))}
      </ul>
      {plans.data && plans.data.items.length === 0 && <p className="py-4 text-sm text-slate-400">No plans yet.</p>}
    </>
  );
}
