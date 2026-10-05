import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { BIASES, CONFIDENCES, POST_TYPES, SENTIMENTS } from "@shared/constants";
import type { PostDetail, RevisionDto } from "@shared/content";
import { can } from "@shared/permissions";
import AttachmentsPanel from "../../components/admin/AttachmentsPanel";
import { AccessBadge, BiasBadge, StatusBadge } from "../../components/admin/badges";
import Markdown from "../../components/Markdown";
import { Badge, Field, Notice, btnDanger, btnGhost, btnPrimary, inputCls } from "../../components/ui";
import { useLookups } from "../../lib/admin";
import { ApiError, api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { fmtDateTime, utcToday, weekStartOf } from "../../lib/dates";

interface Form {
  type: string; marketId: string; postDate: string; bias: string; confidence: string; sentiment: string;
  title: string; summary: string; bodyMd: string; keyDriversMd: string; riskEventsMd: string; invalidationMd: string;
  access: string; analystId: string; tagIds: string[]; validFrom: string; validUntil: string;
}

const isoToLocal = (iso: string | null) => (iso ? iso.slice(0, 16) : "");
const localToIso = (v: string) => (v ? `${v}:00.000Z` : null);

const toForm = (d: PostDetail): Form => ({
  type: d.post.type, marketId: d.post.marketId, postDate: d.post.postDate, bias: d.post.bias, confidence: d.post.confidence,
  sentiment: d.post.sentiment ?? "", title: d.post.title, summary: d.post.summary, bodyMd: d.post.bodyMd,
  keyDriversMd: d.post.keyDriversMd, riskEventsMd: d.post.riskEventsMd, invalidationMd: d.post.invalidationMd,
  access: d.post.access, analystId: d.post.analystId ?? "", tagIds: d.tagIds,
  validFrom: isoToLocal(d.post.validFrom), validUntil: isoToLocal(d.post.validUntil),
});

// Compare the way the server normalizes (trimmed title, weekly posts dated by their Monday), so autosave never loops.
const norm = (f: Form): Form => ({ ...f, title: f.title.trim(), postDate: f.type === "weekly" ? weekStartOf(f.postDate) : f.postDate, tagIds: [...f.tagIds].sort() });

function toApi(k: keyof Form, f: Form): unknown {
  if (k === "sentiment" || k === "analystId") return f[k] === "" ? null : f[k];
  if (k === "validFrom" || k === "validUntil") return localToIso(f[k]);
  if (k === "title") return f.title.trim();
  return f[k];
}

function changes(saved: Form, now: Form): Record<string, unknown> {
  const a = norm(saved), b = norm(now), out: Record<string, unknown> = {};
  for (const k of Object.keys(b) as (keyof Form)[]) if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) out[k] = toApi(k, now);
  return out;
}

function Revisions({ postId, count }: { postId: string; count: number }) {
  const q = useQuery({ queryKey: ["post-revisions", postId, count], queryFn: () => api<{ items: RevisionDto[] }>(`/api/admin/posts/${postId}/revisions`) });
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

export default function PostEditorPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const lookups = useLookups();
  const detail = useQuery({ queryKey: ["post", id], enabled: !!id, queryFn: () => api<PostDetail>(`/api/admin/posts/${id}`) });
  const [form, setForm] = useState<Form | null>(null);
  const [saved, setSaved] = useState<Form | null>(null);
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [schedAt, setSchedAt] = useState("");
  const saving = useRef(false);
  const failed = useRef("");
  const inited = useRef<string | null>(null);

  const markets = lookups.data?.markets ?? [];
  const settings = lookups.data?.settings;
  const post = detail.data?.post;
  const published = post?.status === "published";
  const readOnly = !!post && user?.role === "analyst" && (post.createdBy !== user.id || post.status !== "draft");
  const canPublish = can(user?.role, "post:publish");
  const dirty = !!form && !!saved && Object.keys(changes(saved, form)).length > 0;

  // load the server copy once per post; new posts start from defaults
  useEffect(() => {
    if (detail.data && inited.current !== detail.data.post.id) {
      inited.current = detail.data.post.id;
      const f = toForm(detail.data);
      setForm(f);
      setSaved(f);
    }
  }, [detail.data]);
  useEffect(() => {
    if (!id && lookups.data && !form) {
      const s = lookups.data.settings;
      const m = lookups.data.markets.find((x) => x.active);
      setForm({ type: "daily", marketId: m?.id ?? "", postDate: utcToday(), bias: "neutral", confidence: "medium", sentiment: "", title: "", summary: "", bodyMd: "", keyDriversMd: "", riskEventsMd: "", invalidationMd: "", access: s.default_access_daily, analystId: "", tagIds: [], validFrom: "", validUntil: "" });
    }
  }, [id, lookups.data, form]);

  async function save(): Promise<boolean> {
    if (!id || !form || !saved || saving.current) return true;
    const patch = changes(saved, form);
    if (Object.keys(patch).length === 0) return true;
    saving.current = true;
    setState("saving");
    try {
      const d = await api<PostDetail>(`/api/admin/posts/${id}`, { method: "PUT", body: patch });
      qc.setQueryData(["post", id], d);
      const srv = toForm(d);
      setSaved(srv);
      // keep whatever was typed meanwhile; take the server's validity window if the date moved it
      setForm((f) => (f ? { ...f, validFrom: "validFrom" in patch ? f.validFrom : srv.validFrom, validUntil: "validUntil" in patch ? f.validUntil : srv.validUntil } : f));
      setLastSaved(new Date());
      setState("saved");
      setMsg(null);
      void qc.invalidateQueries({ queryKey: ["posts"] });
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

  // autosave drafts and scheduled posts 2 seconds after the last change (published posts use the explicit button)
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
      const d = await api<PostDetail>(`/api/admin/posts/${id}`);
      qc.setQueryData(["post", id], d);
      const f = toForm(d);
      setSaved(f);
      setForm(f);
      void qc.invalidateQueries({ queryKey: ["posts"] });
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
    setExistingId(null);
    try {
      const body: Record<string, unknown> = { type: form.type, marketId: form.marketId, postDate: form.postDate, bias: form.bias, confidence: form.confidence, title: form.title, summary: form.summary, bodyMd: form.bodyMd, keyDriversMd: form.keyDriversMd, riskEventsMd: form.riskEventsMd, invalidationMd: form.invalidationMd, access: form.access, tagIds: form.tagIds };
      if (form.sentiment) body.sentiment = form.sentiment;
      if (form.analystId) body.analystId = form.analystId;
      if (form.validFrom) body.validFrom = localToIso(form.validFrom);
      if (form.validUntil) body.validUntil = localToIso(form.validUntil);
      const d = await api<PostDetail>("/api/admin/posts", { method: "POST", body });
      void qc.invalidateQueries({ queryKey: ["posts"] });
      nav(`/admin/posts/${d.post.id}`, { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.code === "conflict") setExistingId((e.details as { existingId?: string } | undefined)?.existingId ?? null);
      setMsg({ kind: "error", text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  if (!form || (id && !detail.data)) {
    return detail.isError ? <Notice kind="error">{errorMessage(detail.error)}</Notice> : <p className="text-sm text-slate-400">Loading...</p>;
  }
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));
  const lockCore = published || readOnly;
  const lockText = readOnly;
  const symbol = markets.find((m) => m.id === form.marketId)?.symbol ?? "?";
  const analyst = lookups.data?.analysts.find((a) => a.id === form.analystId)?.name;
  const tagNames = (lookups.data?.tags ?? []).filter((t) => form.tagIds.includes(t.id));
  const lock = (on: boolean) => (on ? " (locked)" : "");

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/posts" className="text-sm text-blue-300 hover:underline">← Posts</Link>
          <h1 className="text-xl font-semibold">{id ? "Edit post" : "New post"}</h1>
          {post && <StatusBadge status={post.status} />}
          {post?.publishedAt && <span className="text-xs text-slate-400">published {fmtDateTime(post.publishedAt)}</span>}
          {post?.status === "scheduled" && <span className="text-xs text-slate-400">goes live {fmtDateTime(post.publishAt)}</span>}
        </div>
        {id && !readOnly && (
          <span className="text-xs text-slate-400">
            {published ? (dirty ? "Unsaved changes" : "All changes saved") : state === "saving" ? "Saving..." : dirty ? "Unsaved changes (autosaves)" : lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : "Autosave on"}
          </span>
        )}
      </div>

      {readOnly && <div className="mb-3"><Notice kind="warn">Analysts can only edit their own drafts. This post is read-only for you.</Notice></div>}
      {published && !readOnly && <div className="mb-3"><Notice kind="info">Published. Market, date, bias, confidence and validity window are locked. Text edits are allowed and every change is recorded in the edit history.</Notice></div>}
      {msg && <div className="mb-3"><Notice kind={msg.kind}>{msg.text}{existingId && <> <Link className="underline" to={`/admin/posts/${existingId}`}>Open the existing post</Link></>}</Notice></div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <section className="grid gap-3 rounded-md border border-slate-800 p-4 sm:grid-cols-2">
            <Field label={`Type${lock(lockCore)}`}>
              <select className={inputCls} disabled={lockCore} value={form.type} onChange={(e) => { set("type", e.target.value); if (!id && settings) set("access", e.target.value === "weekly" ? settings.default_access_weekly : settings.default_access_daily); }}>
                {POST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label={`Market${lock(lockCore)}`}>
              <select className={inputCls} disabled={lockCore} value={form.marketId} onChange={(e) => set("marketId", e.target.value)}>
                {markets.filter((m) => m.active || m.id === form.marketId).map((m) => <option key={m.id} value={m.id}>{m.symbol}</option>)}
              </select>
            </Field>
            <Field label={`Date${lock(lockCore)}`} hint={form.type === "weekly" ? `Weekly posts use their Monday (${weekStartOf(form.postDate)}).` : "UTC calendar day."}>
              <input type="date" className={inputCls} disabled={lockCore} value={form.postDate} onChange={(e) => set("postDate", e.target.value)} />
            </Field>
            <Field label="Analyst">
              <select className={inputCls} disabled={lockText} value={form.analystId} onChange={(e) => set("analystId", e.target.value)}>
                <option value="">None</option>
                {(lookups.data?.analysts ?? []).filter((a) => a.active || a.id === form.analystId).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
            <Field label={`Bias${lock(lockCore)}`}>
              <select className={inputCls} disabled={lockCore} value={form.bias} onChange={(e) => set("bias", e.target.value)}>{BIASES.map((b) => <option key={b} value={b}>{b}</option>)}</select>
            </Field>
            <Field label={`Confidence${lock(lockCore)}`}>
              <select className={inputCls} disabled={lockCore} value={form.confidence} onChange={(e) => set("confidence", e.target.value)}>{CONFIDENCES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            </Field>
            <Field label="Sentiment">
              <select className={inputCls} disabled={lockText} value={form.sentiment} onChange={(e) => set("sentiment", e.target.value)}>
                <option value="">Not set</option>{SENTIMENTS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
              </select>
            </Field>
            <Field label="Access">
              <select className={inputCls} disabled={lockText} value={form.access} onChange={(e) => set("access", e.target.value)}><option value="free">Free</option><option value="paid">Paid</option></select>
            </Field>
            <Field label={`Valid from (UTC)${lock(lockCore)}`} hint="Empty = default for the date."><input type="datetime-local" className={inputCls} disabled={lockCore} value={form.validFrom} onChange={(e) => set("validFrom", e.target.value)} /></Field>
            <Field label={`Valid until (UTC)${lock(lockCore)}`}><input type="datetime-local" className={inputCls} disabled={lockCore} value={form.validUntil} onChange={(e) => set("validUntil", e.target.value)} /></Field>
          </section>

          <section className="space-y-3 rounded-md border border-slate-800 p-4">
            <Field label="Title"><input className={inputCls} maxLength={200} disabled={lockText} value={form.title} onChange={(e) => set("title", e.target.value)} /></Field>
            <Field label="Summary" hint="One or two sentences shown in lists."><textarea className={inputCls} rows={2} maxLength={1000} disabled={lockText} value={form.summary} onChange={(e) => set("summary", e.target.value)} /></Field>
            <Field label="Analysis (markdown)"><textarea className={`${inputCls} font-mono`} rows={12} disabled={lockText} value={form.bodyMd} onChange={(e) => set("bodyMd", e.target.value)} /></Field>
            <Field label="Key drivers (markdown)"><textarea className={`${inputCls} font-mono`} rows={4} disabled={lockText} value={form.keyDriversMd} onChange={(e) => set("keyDriversMd", e.target.value)} /></Field>
            <Field label="Risk events (markdown)"><textarea className={`${inputCls} font-mono`} rows={4} disabled={lockText} value={form.riskEventsMd} onChange={(e) => set("riskEventsMd", e.target.value)} /></Field>
            <Field label="Invalidation (words only)" hint="What would make this view wrong. No price levels, entries, stops or targets."><textarea className={`${inputCls} font-mono`} rows={3} disabled={lockText} value={form.invalidationMd} onChange={(e) => set("invalidationMd", e.target.value)} /></Field>
          </section>

          <section className="space-y-2 rounded-md border border-slate-800 p-4">
            <h2 className="text-sm font-medium">Driver tags</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {(lookups.data?.tags ?? []).map((t) => (
                <label key={t.id} className="flex items-center gap-1 text-sm">
                  <input type="checkbox" disabled={lockText} checked={form.tagIds.includes(t.id)} onChange={(e) => set("tagIds", e.target.checked ? [...form.tagIds, t.id] : form.tagIds.filter((x) => x !== t.id))} /> {t.name}
                </label>
              ))}
              {(lookups.data?.tags.length ?? 0) === 0 && <span className="text-sm text-slate-400">No tags yet.</span>}
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-2">
            {!id && <button className={btnPrimary} disabled={busy || !form.marketId} onClick={() => void create()}>{busy ? "Creating..." : "Create draft"}</button>}
            {id && !readOnly && published && <button className={btnPrimary} disabled={busy || !dirty} onClick={() => void act(async () => { await save(); }, "Changes saved and recorded in the edit history.")}>Save changes</button>}
            {id && !readOnly && !published && <button className={btnGhost} disabled={busy || !dirty} onClick={() => void save()}>Save now</button>}
            {id && !published && canPublish && !readOnly && (
              <>
                <button className={btnPrimary} disabled={busy} onClick={() => { if (window.confirm("Publish now? After publishing, market, date, bias, confidence and validity are locked.")) void act(() => api(`/api/admin/posts/${id}/publish`, { method: "POST" }), "Published."); }}>Publish now</button>
                {post?.status === "scheduled" ? (
                  <button className={btnGhost} disabled={busy} onClick={() => void act(() => api(`/api/admin/posts/${id}/unschedule`, { method: "POST" }), "Back to draft.")}>Unschedule</button>
                ) : (
                  <span className="flex items-center gap-2">
                    <input type="datetime-local" className={`${inputCls} w-52`} value={schedAt} onChange={(e) => setSchedAt(e.target.value)} title="Your local time" />
                    <button className={btnGhost} disabled={busy || !schedAt} onClick={() => void act(() => api(`/api/admin/posts/${id}/schedule`, { method: "POST", body: { publishAt: new Date(schedAt).toISOString() } }), "Scheduled.")}>Schedule</button>
                  </span>
                )}
              </>
            )}
            {id && !published && !readOnly && can(user?.role, "post:edit") && (
              <button className={btnDanger} disabled={busy} onClick={() => { if (window.confirm("Delete this draft?")) void (async () => { try { await api(`/api/admin/posts/${id}`, { method: "DELETE" }); void qc.invalidateQueries({ queryKey: ["posts"] }); nav("/admin/posts"); } catch (e) { setMsg({ kind: "error", text: errorMessage(e) }); } })(); }}>Delete</button>
            )}
          </div>

          {id && detail.data && (
            <>
              <AttachmentsPanel ownerType="post" ownerId={id} items={detail.data.attachments} readOnly={readOnly} canUpload={!published || can(user?.role, "attachment:manage")} canManage={can(user?.role, "attachment:manage")} onChanged={() => void qc.invalidateQueries({ queryKey: ["post", id] })} />
              {detail.data.revisionCount > 0 && <Revisions postId={id} count={detail.data.revisionCount} />}
            </>
          )}
          {!id && <p className="text-xs text-slate-400">Create the draft first, then add screenshots and publish.</p>}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <p className="text-xs uppercase tracking-wide text-slate-500">Live preview</p>
          <article className="space-y-3 rounded-md border border-slate-700 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-base font-semibold">{symbol}</span>
              <BiasBadge bias={form.bias} />
              <Badge>Confidence: {form.confidence}</Badge>
              {form.sentiment && <Badge tone="blue">{form.sentiment.replace("_", " ")}</Badge>}
              <AccessBadge access={form.access} />
            </div>
            <p className="text-xs text-slate-400">{form.type} · {form.type === "weekly" ? weekStartOf(form.postDate) : form.postDate}{analyst ? ` · ${analyst}` : ""}</p>
            <h2 className="text-lg font-semibold">{form.title || "(untitled)"}</h2>
            {form.summary && <p className="text-sm text-slate-300">{form.summary}</p>}
            <Markdown>{form.bodyMd}</Markdown>
            {form.keyDriversMd && <div><h3 className="mb-1 text-sm font-semibold">Key drivers</h3><Markdown>{form.keyDriversMd}</Markdown></div>}
            {form.riskEventsMd && <div><h3 className="mb-1 text-sm font-semibold">Risk events</h3><Markdown>{form.riskEventsMd}</Markdown></div>}
            {form.invalidationMd && <div><h3 className="mb-1 text-sm font-semibold">What would invalidate this view</h3><Markdown>{form.invalidationMd}</Markdown></div>}
            {tagNames.length > 0 && <div className="flex flex-wrap gap-1">{tagNames.map((t) => <Badge key={t.id}>{t.name}</Badge>)}</div>}
            {detail.data?.attachments.map((a) => <figure key={a.id}><img src={a.url} alt={a.caption || "Screenshot"} className="rounded border border-slate-700" />{a.caption && <figcaption className="mt-1 text-xs text-slate-400">{a.caption}</figcaption>}</figure>)}
            <p className="border-t border-slate-800 pt-2 text-xs text-slate-500">{settings?.disclaimer_text}</p>
          </article>
        </aside>
      </div>
    </>
  );
}
