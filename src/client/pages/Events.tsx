import { useState } from "react";
import type { PublicEventDto } from "@shared/publicDetail";
import Markdown from "../components/Markdown";
import { Badge, Field, Notice, PageHeader, inputCls } from "../components/ui";
import { errorMessage } from "../lib/api";
import { usePublicQuery } from "../lib/publicApi";
import { useTimezone } from "../lib/tz";

const TONE = { high: "red", medium: "amber", low: "slate" } as const;
const WORD = { high: "High impact", medium: "Medium impact", low: "Low impact" } as const;

export default function Events() {
  const [tz, setTz, tzOptions] = useTimezone();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [impact, setImpact] = useState("");
  const [currency, setCurrency] = useState("");
  const p = new URLSearchParams({ limit: "200" });
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  if (impact) p.set("impact", impact);
  if (/^[A-Za-z]{3}$/.test(currency)) p.set("currency", currency.toUpperCase());
  const qs = p.toString();
  const q = usePublicQuery<{ items: PublicEventDto[]; total: number }>(["events", qs, tz], `/api/public/events?${qs}`);

  // Group by the viewer's local day (in the chosen timezone).
  const days = new Map<string, PublicEventDto[]>();
  for (const e of q.data?.items ?? []) {
    const key = new Date(e.startsAt).toLocaleDateString("en-CA", { timeZone: tz });
    days.set(key, [...(days.get(key) ?? []), e]);
  }
  const dayTitle = (e: PublicEventDto) => new Date(e.startsAt).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz });
  const time = (e: PublicEventDto) => new Date(e.startsAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz });

  return (
    <main className="space-y-4">
      <PageHeader title="Event calendar" />
      <p className="text-sm text-slate-400">Economic events. Without dates, the next 30 days are shown. Times are in {tz}.</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
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
        <Field label="Currency" hint="3 letters, e.g. USD"><input className={inputCls} maxLength={3} value={currency} onChange={(e) => setCurrency(e.target.value)} /></Field>
        <Field label="Timezone">
          <select className={inputCls} value={tz} onChange={(e) => setTz(e.target.value)}>
            {tzOptions.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>
        </Field>
      </div>
      {q.isLoading && <p className="text-sm text-slate-400">Loading...</p>}
      {q.isError && <Notice kind="error">{errorMessage(q.error)}</Notice>}
      {q.data && q.data.items.length === 0 && <Notice kind="info">No events in this range.</Notice>}
      {[...days.entries()].map(([day, items]) => (
        <section key={day} className="space-y-2" aria-label={dayTitle(items[0]!)}>
          <h2 className="text-sm font-semibold text-slate-200">{dayTitle(items[0]!)}</h2>
          <ul className="space-y-2">
            {items.map((e) => (
              <li key={e.id} className="space-y-1 rounded-md border border-slate-800 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs text-slate-400">{time(e)}</span>
                  <strong>{e.title}</strong>
                  <Badge tone={TONE[e.impact]}>{WORD[e.impact]}</Badge>
                  {e.currency && <Badge tone="blue">{e.currency}</Badge>}
                </div>
                {e.descriptionMd.trim() && <Markdown>{e.descriptionMd}</Markdown>}
              </li>
            ))}
          </ul>
        </section>
      ))}
      {q.data && q.data.total > q.data.items.length && <p className="text-xs text-slate-400">Showing the first {q.data.items.length} of {q.data.total}. Narrow the dates to see the rest.</p>}
    </main>
  );
}
