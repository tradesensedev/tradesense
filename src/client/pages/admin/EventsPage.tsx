import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { EventDto } from "@shared/events";
import { Badge, Field, Notice, PageHeader, btnDanger, btnGhost, btnPrimary, inputCls } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { utcToday } from "../../lib/dates";

type Msg = { kind: "error" | "success"; text: string } | null;
const IMPACT_TONE = { high: "red", medium: "amber", low: "slate" } as const;
const utcLabel = (iso: string) => `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;

function EventForm({ event, onDone }: { event?: EventDto; onDone: () => void }) {
  const [f, setF] = useState({
    title: event?.title ?? "",
    startsAt: event ? event.startsAt.slice(0, 16) : `${utcToday()}T12:30`, // datetime-local value, read as UTC
    impact: event?.impact ?? "medium",
    currency: event?.currency ?? "",
    descriptionMd: event?.descriptionMd ?? "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    const body = {
      title: f.title,
      startsAt: `${f.startsAt}:00.000Z`,
      impact: f.impact,
      currency: f.currency.trim() ? f.currency.trim().toUpperCase() : null,
      descriptionMd: f.descriptionMd,
    };
    try {
      if (event) await api(`/api/admin/events/${event.id}`, { method: "PATCH", body });
      else await api("/api/admin/events", { method: "POST", body });
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
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title"><input className={inputCls} maxLength={200} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <Field label="Date and time (UTC)"><input type="datetime-local" className={inputCls} value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} /></Field>
        <Field label="Impact">
          <select className={inputCls} value={f.impact} onChange={(e) => setF({ ...f, impact: e.target.value as EventDto["impact"] })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </Field>
        <Field label="Currency" hint="Optional, 3 letters, e.g. USD"><input className={inputCls} maxLength={3} value={f.currency} onChange={(e) => setF({ ...f, currency: e.target.value })} /></Field>
      </div>
      <Field label="Description (markdown, optional)"><textarea className={inputCls} rows={3} maxLength={5000} value={f.descriptionMd} onChange={(e) => setF({ ...f, descriptionMd: e.target.value })} /></Field>
      <button className={btnPrimary} disabled={busy || !f.title.trim() || !f.startsAt} onClick={() => void save()}>{busy ? "Saving..." : event ? "Save event" : "Create event"}</button>
    </div>
  );
}

export default function EventsPage() {
  const qc = useQueryClient();
  const [from, setFrom] = useState(utcToday());
  const [to, setTo] = useState("");
  const [impact, setImpact] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [msg, setMsg] = useState<Msg>(null);

  const params = new URLSearchParams({ order: "asc" });
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (impact) params.set("impact", impact);
  const events = useQuery({
    queryKey: ["admin-events", from, to, impact],
    queryFn: () => api<{ items: EventDto[]; total: number }>(`/api/admin/events?${params.toString()}`),
  });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["admin-events"] });

  async function remove(e: EventDto) {
    if (!window.confirm(`Delete "${e.title}"? This cannot be undone.`)) return;
    try {
      await api(`/api/admin/events/${e.id}`, { method: "DELETE" });
      setMsg({ kind: "success", text: "Event deleted." });
      refresh();
    } catch (err) {
      setMsg({ kind: "error", text: errorMessage(err) });
    }
  }

  return (
    <>
      <PageHeader title="Events">
        <button className={btnPrimary} onClick={() => setShowNew((v) => !v)}>{showNew ? "Close" : "New event"}</button>
      </PageHeader>
      <p className="mb-3 text-sm text-slate-400">Economic calendar entries shown on the public Event Calendar. Times are UTC.</p>
      {showNew && <div className="mb-4"><EventForm onDone={() => { setShowNew(false); refresh(); }} /></div>}
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <Field label="From"><input type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="To"><input type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        <Field label="Impact">
          <select className={inputCls} value={impact} onChange={(e) => setImpact(e.target.value)}>
            <option value="">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </Field>
      </div>
      {msg && <div className="mb-3"><Notice kind={msg.kind}>{msg.text}</Notice></div>}
      {events.isError && <Notice kind="error">{errorMessage(events.error)}</Notice>}
      {events.isLoading && <p className="text-sm text-slate-400">Loading...</p>}
      <ul className="space-y-3">
        {(events.data?.items ?? []).map((e) => (
          <li key={e.id} className="space-y-2 rounded-md border border-slate-800 p-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-mono text-xs text-slate-400">{utcLabel(e.startsAt)}</span>
              <strong>{e.title}</strong>
              <Badge tone={IMPACT_TONE[e.impact]}>{e.impact}</Badge>
              {e.currency && <Badge tone="blue">{e.currency}</Badge>}
              <span className="ml-auto flex gap-2">
                <button className={btnGhost} aria-expanded={openId === e.id} onClick={() => setOpenId(openId === e.id ? null : e.id)}>{openId === e.id ? "Close" : "Edit"}</button>
                <button className={btnDanger} onClick={() => void remove(e)}>Delete</button>
              </span>
            </div>
            {openId === e.id && <EventForm event={e} onDone={refresh} />}
          </li>
        ))}
      </ul>
      {events.data && events.data.items.length === 0 && <p className="py-4 text-sm text-slate-400">No events in this range.</p>}
      {events.data && events.data.total > events.data.items.length && (
        <p className="py-2 text-xs text-slate-400">Showing the first {events.data.items.length} of {events.data.total}. Narrow the date range to see the rest.</p>
      )}
    </>
  );
}
