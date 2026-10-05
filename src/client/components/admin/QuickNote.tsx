import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CONFIDENCES, KILLZONES, NOTE_STATUSES } from "@shared/constants";
import type { PostDto, SuggestLinksResponse } from "@shared/content";
import { can } from "@shared/permissions";
import { useLookups } from "../../lib/admin";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { utcToday } from "../../lib/dates";
import { KILLZONE_LABEL, NOTE_STATUS_LABEL } from "../../lib/labels";
import { Field, Notice, btnGhost, btnPrimary, inputCls } from "../ui";
import { StatusBadge } from "./badges";

const postLabel = (p: PostDto) => `${p.type} ${p.postDate} - ${p.title || "untitled"} (${p.status})`;

// Fast path: market -> killzone -> status -> short note -> save or publish. The linked post is picked automatically.
export default function QuickNote({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const { data: lk } = useLookups();
  const markets = (lk?.markets ?? []).filter((m) => m.active);
  const [marketId, setMarketId] = useState("");
  const [killzone, setKillzone] = useState<string>("london");
  const [status, setStatus] = useState<string>("followed");
  const [date, setDate] = useState(utcToday());
  const [text, setText] = useState("");
  const [confidence, setConfidence] = useState("");
  const [override, setOverride] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  const mid = marketId || markets[0]?.id || "";
  const sug = useQuery({
    queryKey: ["note-suggest", mid, date],
    enabled: !!mid && !!date,
    queryFn: () => api<SuggestLinksResponse>(`/api/admin/notes/suggest-links?marketId=${mid}&date=${date}`),
  });
  const options = [...(sug.data?.suggested ?? []), ...(sug.data?.recent ?? [])];
  const auto = sug.data?.suggested.find((p) => p.status === "published") ?? sug.data?.suggested[0] ?? null;
  const linked = options.find((p) => p.id === override) ?? auto;
  const mayPublish = can(user?.role, "note:publish");

  async function submit(publish: boolean) {
    setBusy(true);
    setMsg(null);
    try {
      const body: Record<string, unknown> = { marketId: mid, killzone, status, noteMd: text, noteDate: date, publish };
      if (override) body.linkedPostId = override;
      if (confidence) body.confidence = confidence;
      await api("/api/admin/notes/quick", { method: "POST", body });
      setMsg({ kind: "success", text: publish ? "Note published." : "Draft saved." });
      setText("");
      onDone();
    } catch (e) {
      setMsg({ kind: "error", text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 space-y-3 rounded-md border border-slate-800 p-4">
      <h2 className="font-medium">Quick note</h2>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Market">
          <select className={inputCls} value={mid} onChange={(e) => { setMarketId(e.target.value); setOverride(""); }}>
            {markets.map((m) => <option key={m.id} value={m.id}>{m.symbol}</option>)}
          </select>
        </Field>
        <Field label="Date (UTC)"><input type="date" className={inputCls} value={date} onChange={(e) => { setDate(e.target.value); setOverride(""); }} /></Field>
        <Field label="Confidence (optional)">
          <select className={inputCls} value={confidence} onChange={(e) => setConfidence(e.target.value)}>
            <option value="">Not set</option>{CONFIDENCES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <div>
        <p className="mb-1 text-sm font-medium text-slate-200">Killzone</p>
        <div className="flex flex-wrap gap-2">
          {KILLZONES.map((k) => <button key={k} type="button" className={killzone === k ? btnPrimary : btnGhost} onClick={() => setKillzone(k)}>{KILLZONE_LABEL[k]}</button>)}
        </div>
      </div>
      <div>
        <p className="mb-1 text-sm font-medium text-slate-200">Status</p>
        <div className="flex flex-wrap gap-2">
          {NOTE_STATUSES.map((s) => <button key={s} type="button" className={status === s ? btnPrimary : btnGhost} onClick={() => setStatus(s)}>{NOTE_STATUS_LABEL[s]}</button>)}
        </div>
      </div>
      <Field label="Note" hint="Short and factual. Ctrl+Enter saves a draft.">
        <textarea className={inputCls} rows={3} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && text.trim()) void submit(false); }} />
      </Field>
      <div className="space-y-1 text-sm">
        <p className="font-medium text-slate-200">Linked bias post</p>
        {sug.isLoading ? <p className="text-slate-400">Looking...</p> : linked ? (
          <p className="flex flex-wrap items-center gap-2 text-slate-300">{postLabel(linked)} <StatusBadge status={linked.status} /> {!override && <span className="text-xs text-slate-500">(picked automatically)</span>}</p>
        ) : (
          <Notice kind="warn">No daily or weekly post exists for this market and date. Create the bias post first.</Notice>
        )}
        {options.length > 1 && (
          <select className={inputCls} value={override} onChange={(e) => setOverride(e.target.value)}>
            <option value="">Pick automatically</option>
            {options.map((p) => <option key={p.id} value={p.id}>{postLabel(p)}</option>)}
          </select>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button className={btnGhost} disabled={busy || !text.trim() || !linked} onClick={() => void submit(false)}>Save draft</button>
        {mayPublish && (
          <button className={btnPrimary} disabled={busy || !text.trim() || linked?.status !== "published"} onClick={() => void submit(true)}>Publish now</button>
        )}
        {mayPublish && linked && linked.status !== "published" && <span className="text-xs text-slate-400">Publish the linked post first to publish this note.</span>}
        {!mayPublish && <span className="text-xs text-slate-400">Your role saves drafts; an editor publishes them.</span>}
      </div>
    </div>
  );
}
