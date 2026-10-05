import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CONFIDENCES, KILLZONES, NOTE_STATUSES } from "@shared/constants";
import type { NoteDetail, PostDetail, PostDto, RevisionDto, SuggestLinksResponse } from "@shared/content";
import { can } from "@shared/permissions";
import AttachmentsPanel from "../../components/admin/AttachmentsPanel";
import { AccessBadge, NoteStatusBadge, StatusBadge } from "../../components/admin/badges";
import Markdown from "../../components/Markdown";
import { Badge, Field, Notice, btnDanger, btnGhost, btnPrimary, inputCls } from "../../components/ui";
import { useLookups } from "../../lib/admin";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { fmtDateTime, utcToday } from "../../lib/dates";
import { KILLZONE_LABEL, NOTE_STATUS_LABEL } from "../../lib/labels";

interface Form {
  marketId: string; killzone: string; noteDate: string; linkedPostId: string; status: string; confidence: string;
  title: string; noteMd: string; access: string; analystId: string; tagIds: string[];
}

const toForm = (d: NoteDetail): Form => ({
  marketId: d.note.marketId, killzone: d.note.killzone, noteDate: d.note.noteDate, linkedPostId: d.note.linkedPostId,
  status: d.note.status, confidence: d.note.confidence ?? "", title: d.note.title, noteMd: d.note.noteMd,
  access: d.note.access, analystId: d.note.analystId ?? "", tagIds: d.tagIds,
});

const norm = (f: Form): Form => ({ ...f, title: f.title.trim(), tagIds: [...f.tagIds].sort() });
const toApi = (k: keyof Form, f: Form): unknown => (k === "confidence" || k === "analystId" ? (f[k] === "" ? null : f[k]) : k === "title" ? f.title.trim() : f[k]);

function changes(saved: Form, now: Form): Record<string, unknown> {
  const a = norm(saved), b = norm(now), out: Record<string, unknown> = {};
  for (const k of Object.keys(b) as (keyof Form)[]) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) out[k] = toApi(k, now);
  return out;
}

const postLabel = (p: PostDto) => `${p.type} ${p.postDate} - ${p.title || "untitled"} (${p.status})`;

function Revisions({ noteId, count }: { noteId: string; count: number }) {
  const q = useQuery({ queryKey: ["note-revisions", noteId, count], queryFn: () => api<{ items: RevisionDto[] }>(`/api/admin/notes/${noteId}/revisions`) });
  const short = (v: unknown) => { const s = typeof v === "string" ? v : JSON.stringify(v); return s.length > 140 ? `${s.slice(0, 140)}...` : s; };
  return (
    <section className="space-y-2 rounded-md border border-slate-800 p-4 text-sm">
      <h2 className="font-medium">Edit history after publish ({count})</h2>
      {q.data?.items.map((r) => {
        const o = JSON.parse(r.oldJson) as Record<string, unknown>, n = JSON.parse(r.newJson) as Record<string, unknown>;
        return (
          <div key={r.id} className="border-t border-slate-800 pt-2">
            <p className="text-xs text-slate-400">{fmtDateTime(r.editedAt)} by {r.editedBy.slice(0, 8)}</p>
            {Object.keys(n).map((k) => <p key={k} className="break-words"><strong>{k}:</strong> <span className="text-red-300">{short(o[k])}</span> → <span className="text-green-300">{short(n[k])}</span></p>)}
          </div>
        );
      })}
    </section>
  );
}

export default function NoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const lookups = useLookups();
  const detail = useQuery({ queryKey: ["note", id], enabled: !!id, queryFn: () => api<NoteDetail>(`/api/admin/notes/${id}`) });
  const [form, setForm] = useState<Form | null>(null);
  const [saved, setSaved] = useState<Form | null>(null);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [schedAt, setSchedAt] = useState("");
  const saving = useRef(false);
  const failed = useRef("");
  const inited = useRef<string | null>(null);

  const markets = lookups.data?.markets ?? [];
  const settings = lookups.data?.settings;
  const note = detail.data?.note;
  const published = note?.publishStatus === "published";
  const readOnly = !!note && user?.role === "analyst" && (note.createdBy !== user.id || note.publishStatus !== "draft");
  const canPublish = can(user?.role, "note:publish");
  const dirty = !!form && !!saved && Object.keys(changes(saved, form)).length > 0;
  const lockCore = published || readOnly;

  useEffect(() => {
    if (detail.data && inited.current !== detail.data.note.id) {
      inited.current = detail.data.note.id;
      const f = toForm(detail.data);
      setForm(f);
      setSaved(f);
    }
  }, [detail.data]);
  useEffect(() => {
    if (!id && lookups.data && !form) {
      const m = lookups.data.markets.find((x) => x.active);
      setForm({ marketId: m?.id ?? "", killzone: "london", noteDate: utcToday(), linkedPostId: "", status: "neutral", confidence: "", title: "", noteMd: "", access: lookups.data.settings.default_access_killzone_note, analystId: "", tagIds: [] });
    }
  }, [id, lookups.data, form]);

  // linked-post auto-suggest: the daily post of that day, else the weekly post of that week
  const mid = form?.marketId ?? "";
  const date = form?.noteDate ?? "";
  const sug = useQuery({
    queryKey: ["note-suggest", mid, date],
    enabled: !!mid && !!date && !lockCore,
    queryFn: () => api<SuggestLinksResponse>(`/api/admin/notes/suggest-links?marketId=${mid}&date=${date}`),
  });
  const current = useQuery({
    queryKey: ["post", form?.linkedPostId],
    enabled: !!form?.linkedPostId,
    queryFn: () => api<PostDetail>(`/api/admin/posts/${form!.linkedPostId}`),
  });
  const auto = sug.data?.suggested.find((p) => p.status === "published") ?? sug.data?.suggested[0] ?? null;
  const options: PostDto[] = [...(sug.data?.suggested ?? []), ...(sug.data?.recent ?? [])];
  if (current.data && !options.some((p) => p.id === current.data!.post.id)) options.push(current.data.post);
  const linked = options.find((p) => p.id === form?.linkedPostId) ?? null;

  useEffect(() => {
    if (!form || lockCore || sug.isLoading) return;
    const wrongMarket = current.data && current.data.post.marketId !== form.marketId;
    if ((!form.linkedPostId || wrongMarket) && auto && auto.id !== form.linkedPostId) setForm({ ...form, linkedPostId: auto.id });
    if (wrongMarket && !auto && form.linkedPostId) setForm({ ...form, linkedPostId: "" });
  }, [form?.marketId, form?.noteDate, form?.linkedPostId, sug.data, current.data]);

  async function save(): Promise<boolean> {
    if (!id || !form || !saved || saving.current) return true;
    const patch = changes(saved, form);
    if (Object.keys(patch).length === 0) return true;
    saving.current = true;
    setState("saving");
    try {
      const d = await api<NoteDetail>(`/api/admin/notes/${id}`, { method: "PUT", body: patch });
      qc.setQueryData(["note", id], d);
      setSaved(toForm(d));
      setLastSaved(new Date());
      setState("saved");
      setMsg(null);
      void qc.invalidateQueries({ queryKey: ["notes"] });
      return true;
    } catch (e) {
      failed.current = JSON.stringify(form);
      setState("error");
      setMsg({ kind: "error", text: errorMessage(e) });
      return false;
    } finally {
      saving.current = false;
    }
  }
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    if (!id || !form || !dirty || published || readOnly) return;
    if (JSON.stringify(form) === failed.current) return;
    const t = setTimeout(() => void saveRef.current(), 2000);
    return () => clearTimeout(t);
  }, [form, saved, dirty, published, readOnly, id]);

  async function act(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setMsg(null);
    try {
      if (dirty && !(await save())) return;
      await fn();
      const d = await api<NoteDetail>(`/api/admin/notes/${id}`);
      qc.setQueryData(["note", id], d);
      const f = toForm(d);
      setSaved(f);
      setForm(f);
      void qc.invalidateQueries({ queryKey: ["notes"] });
      setMsg({ kind: "success", text: ok });
    } catch (e) {
      setMsg({ kind: "error", text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  async function create() {
    if (!form) return;
    setBusy(true);
    setMsg(null);
    try {
      const body: Record<string, unknown> = { marketId: form.marketId, killzone: form.killzone, noteDate: form.noteDate, linkedPostId: form.linkedPostId, status: form.status, title: form.title, noteMd: form.noteMd, access: form.access, tagIds: form.tagIds };
      if (form.confidence) body.confidence = form.confidence;
      if (form.analystId) body.analystId = form.analystId;
      const d = await api<NoteDetail>("/api/admin/notes", { method: "POST", body });
      void qc.invalidateQueries({ queryKey: ["notes"] });
      nav(`/admin/notes/${d.note.id}`, { replace: true });
    } catch (e) {
      setMsg({ kind: "error", text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  if (!form || (id && !detail.data)) {
    return detail.isError ? <Notice kind="error">{errorMessage(detail.error)}</Notice> : <p className="text-sm text-slate-400">Loading...</p>;
  }
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const symbol = markets.find((m) => m.id === form.marketId)?.symbol ?? "?";
  const analyst = lookups.data?.analysts.find((a) => a.id === form.analystId)?.name;
  const tagNames = (lookups.data?.tags ?? []).filter((t) => form.tagIds.includes(t.id));
  const lock = (on: boolean) => (on ? " (locked)" : "");

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/notes" className="text-sm text-blue-300 hover:underline">← Notes</Link>
          <h1 className="text-xl font-semibold">{id ? "Edit note" : "New note"}</h1>
          {note && <StatusBadge status={note.publishStatus} />}
          {note?.publishedAt && <span className="text-xs text-slate-400">published {fmtDateTime(note.publishedAt)}</span>}
          {note?.publishStatus === "scheduled" && <span className="text-xs text-slate-400">goes live {fmtDateTime(note.publishAt)}</span>}
        </div>
        {id && !readOnly && (
          <span className="text-xs text-slate-400">
            {published ? (dirty ? "Unsaved changes" : "All changes saved") : state === "saving" ? "Saving..." : dirty ? "Unsaved changes (autosaves)" : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : "Autosave on"}
          </span>
        )}
      </div>

      {readOnly && <div className="mb-3"><Notice kind="warn">Analysts can only edit their own drafts. This note is read-only for you.</Notice></div>}
      {published && !readOnly && <div className="mb-3"><Notice kind="info">Published. Market, killzone, date, status and linked post are locked. Text edits are allowed and every change is recorded in the edit history.</Notice></div>}
      {msg && <div className="mb-3"><Notice kind={msg.kind}>{msg.text}</Notice></div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <section className="grid gap-3 rounded-md border border-slate-800 p-4 sm:grid-cols-2">
            <Field label={`Market${lock(lockCore)}`}>
              <select className={inputCls} disabled={lockCore} value={form.marketId} onChange={(e) => set("marketId", e.target.value)}>
                {markets.filter((m) => m.active || m.id === form.marketId).map((m) => <option key={m.id} value={m.id}>{m.symbol}</option>)}
              </select>
            </Field>
            <Field label={`Date (UTC)${lock(lockCore)}`}><input type="date" className={inputCls} disabled={lockCore} value={form.noteDate} onChange={(e) => set("noteDate", e.target.value)} /></Field>
            <Field label={`Killzone${lock(lockCore)}`}>
              <select className={inputCls} disabled={lockCore} value={form.killzone} onChange={(e) => set("killzone", e.target.value)}>{KILLZONES.map((k) => <option key={k} value={k}>{KILLZONE_LABEL[k]}</option>)}</select>
            </Field>
            <Field label={`Status${lock(lockCore)}`}>
              <select className={inputCls} disabled={lockCore} value={form.status} onChange={(e) => set("status", e.target.value)}>{NOTE_STATUSES.map((s) => <option key={s} value={s}>{NOTE_STATUS_LABEL[s]}</option>)}</select>
            </Field>
            <div className="sm:col-span-2">
              <Field label={`Linked bias post${lock(lockCore)}`} hint={lockCore ? undefined : auto ? "Picked automatically from the market and date. You can choose another." : "No daily or weekly post found for this market and date. Create the bias post first."}>
                <select className={inputCls} disabled={lockCore} value={form.linkedPostId} onChange={(e) => set("linkedPostId", e.target.value)}>
                  <option value="">{lockCore ? "-" : "Choose a post"}</option>
                  {options.map((p) => <option key={p.id} value={p.id}>{postLabel(p)}</option>)}
                </select>
              </Field>
              {linked && <p className="mt-1 flex items-center gap-2 text-xs text-slate-400">Linked post: <StatusBadge status={linked.status} /> <Link className="text-blue-300 underline" to={`/admin/posts/${linked.id}`}>open</Link></p>}
            </div>
            <Field label="Confidence">
              <select className={inputCls} disabled={readOnly} value={form.confidence} onChange={(e) => set("confidence", e.target.value)}>
                <option value="">Not set</option>{CONFIDENCES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Access">
              <select className={inputCls} disabled={readOnly} value={form.access} onChange={(e) => set("access", e.target.value)}><option value="free">Free</option><option value="paid">Paid</option></select>
            </Field>
            <Field label="Analyst">
              <select className={inputCls} disabled={readOnly} value={form.analystId} onChange={(e) => set("analystId", e.target.value)}>
                <option value="">None</option>
                {(lookups.data?.analysts ?? []).filter((a) => a.active || a.id === form.analystId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
          </section>

          <section className="space-y-3 rounded-md border border-slate-800 p-4">
            <Field label="Title"><input className={inputCls} maxLength={200} disabled={readOnly} value={form.title} onChange={(e) => set("title", e.target.value)} /></Field>
            <Field label="Note (markdown)"><textarea className={`${inputCls} font-mono`} rows={8} disabled={readOnly} value={form.noteMd} onChange={(e) => set("noteMd", e.target.value)} /></Field>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-200">Driver tags</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {(lookups.data?.tags ?? []).map((t) => (
                  <label key={t.id} className="flex items-center gap-1 text-sm">
                    <input type="checkbox" disabled={readOnly} checked={form.tagIds.includes(t.id)} onChange={(e) => set("tagIds", e.target.checked ? [...form.tagIds, t.id] : form.tagIds.filter((x) => x !== t.id))} /> {t.name}
                  </label>
                ))}
                {(lookups.data?.tags.length ?? 0) === 0 && <span className="text-sm text-slate-400">No tags yet.</span>}
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-2">
            {!id && <button className={btnPrimary} disabled={busy || !form.marketId || !form.linkedPostId} onClick={() => void create()}>{busy ? "Creating..." : "Create draft"}</button>}
            {id && !readOnly && published && <button className={btnPrimary} disabled={busy || !dirty} onClick={() => void act(async () => { await save(); }, "Changes saved and recorded in the edit history.")}>Save changes</button>}
            {id && !readOnly && !published && <button className={btnGhost} disabled={busy || !dirty} onClick={() => void save()}>Save now</button>}
            {id && !published && canPublish && !readOnly && (
              <>
                <button className={btnPrimary} disabled={busy} onClick={() => { if (window.confirm("Publish now? After publishing, market, killzone, date, status and linked post are locked.")) void act(() => api(`/api/admin/notes/${id}/publish`, { method: "POST" }), "Published."); }}>Publish now</button>
                {note?.publishStatus === "scheduled" ? (
                  <button className={btnGhost} disabled={busy} onClick={() => void act(() => api(`/api/admin/notes/${id}/unschedule`, { method: "POST" }), "Back to draft.")}>Unschedule</button>
                ) : (
                  <span className="flex items-center gap-2">
                    <input type="datetime-local" className={`${inputCls} w-52`} value={schedAt} onChange={(e) => setSchedAt(e.target.value)} title="Your local time" />
                    <button className={btnGhost} disabled={busy || !schedAt} onClick={() => void act(() => api(`/api/admin/notes/${id}/schedule`, { method: "POST", body: { publishAt: new Date(schedAt).toISOString() } }), "Scheduled.")}>Schedule</button>
                  </span>
                )}
              </>
            )}
            {id && !published && !readOnly && can(user?.role, "note:edit") && (
              <button className={btnDanger} disabled={busy} onClick={() => { if (window.confirm("Delete this draft?")) void (async () => { try { await api(`/api/admin/notes/${id}`, { method: "DELETE" }); void qc.invalidateQueries({ queryKey: ["notes"] }); nav("/admin/notes"); } catch (e) { setMsg({ kind: "error", text: errorMessage(e) }); } })(); }}>Delete</button>
            )}
          </div>

          {id && detail.data && (
            <>
              <AttachmentsPanel ownerType="note" ownerId={id} items={detail.data.attachments} readOnly={readOnly} canUpload={!published || can(user?.role, "attachment:manage")} canManage={can(user?.role, "attachment:manage")} onChanged={() => void qc.invalidateQueries({ queryKey: ["note", id] })} />
              {detail.data.revisionCount > 0 && <Revisions noteId={id} count={detail.data.revisionCount} />}
            </>
          )}
          {!id && <p className="text-xs text-slate-400">Create the draft first, then add screenshots and publish.</p>}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <p className="text-xs uppercase tracking-wide text-slate-500">Live preview</p>
          <article className="space-y-3 rounded-md border border-slate-700 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-semibold">{symbol}</span>
              <Badge tone="blue">{KILLZONE_LABEL[form.killzone]}</Badge>
              <NoteStatusBadge status={form.status} />
              {form.confidence && <Badge>Confidence: {form.confidence}</Badge>}
              <AccessBadge access={form.access} />
            </div>
            <p className="text-xs text-slate-400">{form.noteDate}{analyst ? ` · ${analyst}` : ""}{linked ? ` · linked to ${linked.type} post ${linked.postDate}` : ""}</p>
            <h2 className="text-lg font-semibold">{form.title || "(untitled)"}</h2>
            <Markdown>{form.noteMd}</Markdown>
            {tagNames.length > 0 && <div className="flex flex-wrap gap-1">{tagNames.map((t) => <Badge key={t.id}>{t.name}</Badge>)}</div>}
            {detail.data?.attachments.map((a) => <figure key={a.id}><img src={a.url} alt={a.caption || "Screenshot"} className="rounded border border-slate-700" />{a.caption && <figcaption className="mt-1 text-xs text-slate-400">{a.caption}</figcaption>}</figure>)}
            <p className="border-t border-slate-800 pt-2 text-xs text-slate-500">{settings?.disclaimer_text}</p>
          </article>
        </aside>
      </div>
    </>
  );
}
