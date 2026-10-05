import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { BIASES, CONFIDENCES } from "@shared/constants";
import type { BatchResult } from "@shared/content";
import type { MarketDto } from "@shared/types";
import { useLookups } from "../../lib/admin";
import { api, errorMessage } from "../../lib/api";
import { addDays, utcToday } from "../../lib/dates";
import { Field, Notice, btnGhost, btnPrimary, inputCls } from "../ui";

type Tool = "duplicate" | "template" | "bulk";
type Msg = { kind: "error" | "success"; text: string } | null;
type Kind = "daily" | "weekly";

function summarize(res: BatchResult, markets: MarketDto[]): string {
  const sym = (id: string) => markets.find((m) => m.id === id)?.symbol ?? id;
  let t = `Created ${res.created.length} draft${res.created.length === 1 ? "" : "s"}.`;
  if (res.skipped.length) t += ` Skipped: ${res.skipped.map((s) => `${sym(s.marketId)} (${s.reason})`).join(", ")}.`;
  return t;
}

function MarketPicker({ markets, value, onChange }: { markets: MarketDto[]; value: Set<string>; onChange: (v: Set<string>) => void }) {
  const toggle = (id: string) => {
    const n = new Set(value);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    onChange(n);
  };
  return (
    <div>
      <div className="mb-1 flex gap-3 text-xs">
        <button type="button" className="text-blue-300 underline" onClick={() => onChange(new Set(markets.map((m) => m.id)))}>Select all</button>
        <button type="button" className="text-blue-300 underline" onClick={() => onChange(new Set())}>Clear</button>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {markets.map((m) => (
          <label key={m.id} className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={value.has(m.id)} onChange={() => toggle(m.id)} /> {m.symbol}
          </label>
        ))}
      </div>
    </div>
  );
}

function KindSelect({ value, onChange }: { value: Kind; onChange: (v: Kind) => void }) {
  return (
    <Field label="Type">
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value as Kind)}>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
      </select>
    </Field>
  );
}

function DuplicateTool({ markets, onDone, setMsg }: { markets: MarketDto[]; onDone: () => void; setMsg: (m: Msg) => void }) {
  const [type, setType] = useState<Kind>("daily");
  const [fromDate, setFromDate] = useState(addDays(utcToday(), -1));
  const [toDate, setToDate] = useState(utcToday());
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const run = useMutation({
    mutationFn: () =>
      api<BatchResult>("/api/admin/posts/duplicate", {
        method: "POST",
        body: { type, fromDate, toDate, ...(picked.size ? { marketIds: [...picked] } : {}) },
      }),
    onSuccess: (r) => { setMsg({ kind: "success", text: summarize(r, markets) }); onDone(); },
    onError: (e) => setMsg({ kind: "error", text: errorMessage(e) }),
  });
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setMsg(null); run.mutate(); }}>
      <p className="text-xs text-slate-400">Copies the posts of one day (or week) into another as drafts, keeping text, bias, tags and access. Markets that already have a post on the target date are skipped.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <KindSelect value={type} onChange={setType} />
        <Field label="Copy from"><input type="date" className={inputCls} value={fromDate} onChange={(e) => setFromDate(e.target.value)} required /></Field>
        <Field label="Copy to"><input type="date" className={inputCls} value={toDate} onChange={(e) => setToDate(e.target.value)} required /></Field>
      </div>
      <Field label="Markets" hint="Leave all unticked to copy every market that has a post on the source date.">
        <MarketPicker markets={markets} value={picked} onChange={setPicked} />
      </Field>
      <button className={btnPrimary} disabled={run.isPending}>{run.isPending ? "Copying..." : "Duplicate as drafts"}</button>
    </form>
  );
}

function TemplateTool({ markets, onDone, setMsg }: { markets: MarketDto[]; onDone: () => void; setMsg: (m: Msg) => void }) {
  const [type, setType] = useState<Kind>("daily");
  const [date, setDate] = useState(utcToday());
  const [picked, setPicked] = useState<Set<string>>(new Set(markets.map((m) => m.id)));
  const run = useMutation({
    mutationFn: () => api<BatchResult>("/api/admin/posts/template", { method: "POST", body: { type, date, marketIds: [...picked] } }),
    onSuccess: (r) => { setMsg({ kind: "success", text: summarize(r, markets) }); onDone(); },
    onError: (e) => setMsg({ kind: "error", text: errorMessage(e) }),
  });
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setMsg(null); run.mutate(); }}>
      <p className="text-xs text-slate-400">Creates one empty draft per selected market. Each carries [TODO] markers, so it cannot be published until you replace them.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <KindSelect value={type} onChange={setType} />
        <Field label="Date" hint={type === "weekly" ? "Any date inside the week." : undefined}><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} required /></Field>
      </div>
      <Field label="Markets"><MarketPicker markets={markets} value={picked} onChange={setPicked} /></Field>
      <button className={btnPrimary} disabled={run.isPending || picked.size === 0}>{run.isPending ? "Creating..." : `Create ${picked.size} template draft${picked.size === 1 ? "" : "s"}`}</button>
    </form>
  );
}

interface BulkRow { on: boolean; bias: string; confidence: string; title: string }

function BulkTool({ markets, onDone, setMsg }: { markets: MarketDto[]; onDone: () => void; setMsg: (m: Msg) => void }) {
  const [type, setType] = useState<Kind>("daily");
  const [date, setDate] = useState(utcToday());
  const [rows, setRows] = useState<Record<string, BulkRow>>({});
  const row = (id: string): BulkRow => rows[id] ?? { on: false, bias: "neutral", confidence: "medium", title: "" };
  const patch = (id: string, p: Partial<BulkRow>) => setRows((r) => ({ ...r, [id]: { ...row(id), ...p } }));
  const chosen = markets.filter((m) => row(m.id).on);

  const run = useMutation({
    mutationFn: () =>
      api<{ results: ({ ok: true } | { ok: false; index: number; error: { message: string } })[] }>("/api/admin/posts/bulk", {
        method: "POST",
        body: {
          items: chosen.map((m) => ({
            type, marketId: m.id, postDate: date, bias: row(m.id).bias, confidence: row(m.id).confidence,
            title: row(m.id).title || `${m.symbol} ${type} bias - ${date}`,
          })),
        },
      }),
    onSuccess: (r) => {
      const ok = r.results.filter((x) => x.ok).length;
      const failed = r.results.flatMap((x) => (x.ok ? [] : [`${chosen[x.index]?.symbol ?? "?"}: ${x.error.message}`]));
      setMsg({ kind: failed.length ? "error" : "success", text: `Created ${ok} draft${ok === 1 ? "" : "s"}.${failed.length ? ` Failed: ${failed.join("; ")}` : ""}` });
      onDone();
    },
    onError: (e) => setMsg({ kind: "error", text: errorMessage(e) }),
  });
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); setMsg(null); run.mutate(); }}>
      <p className="text-xs text-slate-400">Tick the markets, set bias and confidence, and create all drafts at once. Add the written analysis afterwards in each editor.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <KindSelect value={type} onChange={setType} />
        <Field label="Date"><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} required /></Field>
      </div>
      <div className="space-y-2">
        {markets.map((m) => (
          <div key={m.id} className="grid items-center gap-2 sm:grid-cols-[110px_130px_130px_1fr]">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={row(m.id).on} onChange={(e) => patch(m.id, { on: e.target.checked })} /> {m.symbol}</label>
            <select className={inputCls} value={row(m.id).bias} onChange={(e) => patch(m.id, { bias: e.target.value })}>{BIASES.map((b) => <option key={b} value={b}>{b}</option>)}</select>
            <select className={inputCls} value={row(m.id).confidence} onChange={(e) => patch(m.id, { confidence: e.target.value })}>{CONFIDENCES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            <input className={inputCls} placeholder="Title (optional)" value={row(m.id).title} onChange={(e) => patch(m.id, { title: e.target.value })} />
          </div>
        ))}
      </div>
      <button className={btnPrimary} disabled={run.isPending || chosen.length === 0}>{run.isPending ? "Creating..." : `Create ${chosen.length} draft${chosen.length === 1 ? "" : "s"}`}</button>
    </form>
  );
}

export default function PostSpeedTools({ onDone }: { onDone: () => void }) {
  const { data } = useLookups();
  const [tool, setTool] = useState<Tool>("duplicate");
  const [msg, setMsg] = useState<Msg>(null);
  if (!data) return null;
  const markets = data.markets.filter((m) => m.active);
  const tabs: [Tool, string][] = [["duplicate", "Duplicate yesterday"], ["template", "Full-day template"], ["bulk", "Bulk create"]];
  return (
    <div className="mb-4 space-y-3 rounded-md border border-slate-800 p-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map(([k, label]) => (
          <button key={k} type="button" onClick={() => { setTool(k); setMsg(null); }} className={tool === k ? `${btnPrimary}` : btnGhost}>{label}</button>
        ))}
      </div>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {tool === "duplicate" && <DuplicateTool markets={markets} onDone={onDone} setMsg={setMsg} />}
      {tool === "template" && <TemplateTool markets={markets} onDone={onDone} setMsg={setMsg} />}
      {tool === "bulk" && <BulkTool markets={markets} onDone={onDone} setMsg={setMsg} />}
    </div>
  );
}
