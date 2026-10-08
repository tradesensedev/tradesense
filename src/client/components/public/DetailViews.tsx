import type { ReactNode } from "react";
import type { PublicEditEntry } from "@shared/editHistory";
import type { PublicAttachmentItem, PublicNoteDetail, PublicPostDetail } from "@shared/publicDetail";
import { AccessBadge, BiasBadge, NoteStatusBadge } from "../admin/badges";
import { OutcomeBadge } from "../admin/resultBadges";
import Markdown from "../Markdown";
import { Badge, Notice } from "../ui";
import { errorMessage } from "../../lib/api";
import { fmtDateTime } from "../../lib/dates";
import { KILLZONE_LABEL } from "../../lib/labels";
import { usePublicMeta, usePublicQuery } from "../../lib/publicApi";
import { CONFIDENCE_LABEL, DEFAULT_DISCLAIMER, SENTIMENT_LABEL, TYPE_LABEL, fmtDay } from "../../lib/publicFmt";
import EditHistory from "./EditHistory";
import { BookmarkButton, LockPlaceholder, TagList } from "./PublicBits";

type Open = (type: "post" | "note", id: string) => void;
// The API adds editHistory next to the detail (empty while locked).
type WithHistory<T> = T & { editHistory: PublicEditEntry[] };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      {children}
    </section>
  );
}

function Attachments({ items }: { items: PublicAttachmentItem[] }) {
  if (items.length === 0) return null;
  return (
    <Section title="Screenshots">
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((a) =>
          a.url ? (
            <figure key={a.id} className="space-y-1">
              <a href={a.url} target="_blank" rel="noopener noreferrer">
                <img src={a.url} alt={a.caption || "Chart screenshot"} loading="lazy" className="w-full rounded border border-slate-800" />
              </a>
              {a.caption && <figcaption className="text-xs text-slate-400">{a.caption}</figcaption>}
            </figure>
          ) : (
            <LockPlaceholder key={a.id} lock={a.lock} access="paid" compact />
          ),
        )}
      </div>
    </Section>
  );
}

function Footer({ token }: { token: string | null | undefined }) {
  const meta = usePublicMeta();
  return (
    <footer className="space-y-1 border-t border-slate-800 pt-3 text-xs text-slate-500">
      <p>{meta.data?.settings.disclaimerText || DEFAULT_DISCLAIMER}</p>
      {token && <p className="font-mono text-[10px] text-slate-600">Ref {token}</p>}
    </footer>
  );
}

function Loading({ q }: { q: { isLoading: boolean; isError: boolean; error: unknown } }) {
  if (q.isLoading) return <p className="text-sm text-slate-400">Loading...</p>;
  if (q.isError) return <Notice kind="error">{errorMessage(q.error)}</Notice>;
  return null;
}

export function PostDetailView({ id, onOpen }: { id: string; onOpen: Open }) {
  const q = usePublicQuery<WithHistory<PublicPostDetail>>(["post", id], `/api/public/posts/${id}`);
  if (!q.data) return <Loading q={q} />;
  const { item, detail, editHistory } = q.data;
  const c = item.content;
  const day = item.type === "weekly" ? `Week of ${fmtDay(item.weekStartDate)}` : fmtDay(item.postDate);
  return (
    <article className="space-y-5">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <strong className="text-base">{item.marketSymbol}</strong>
          <Badge tone="slate">{TYPE_LABEL[item.type]}</Badge>
          <AccessBadge access={item.access} />
          <span className="text-slate-400">{day}</span>
          <span className="ml-auto"><BookmarkButton type="post" id={item.id} bookmarked={item.bookmarked} /></span>
        </div>
        {c && (
          <>
            <h2 className="text-lg font-semibold">{c.title}</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <BiasBadge bias={c.bias} />
              <span className="text-slate-300">Confidence: {CONFIDENCE_LABEL[c.confidence]}</span>
              {c.sentiment && <Badge tone="slate">{SENTIMENT_LABEL[c.sentiment]}</Badge>}
              {c.analystName && <span className="text-slate-400">by {c.analystName}</span>}
              <OutcomeBadge outcome={detail?.result?.effectiveOutcome ?? null} corrected={(detail?.result?.corrections.length ?? 0) > 0} />
            </div>
            <TagList tags={c.tagNames} />
            {c.validUntil && <p className="text-xs text-slate-400">Valid until {fmtDateTime(c.validUntil)}{detail?.validFrom ? ` (from ${fmtDateTime(detail.validFrom)})` : ""}</p>}
          </>
        )}
      </header>

      {!detail || !c ? (
        <LockPlaceholder lock={item.lock} access={item.access} />
      ) : (
        <>
          {c.summary.trim() && <Markdown>{c.summary}</Markdown>}
          {detail.bodyMd.trim() && <Markdown>{detail.bodyMd}</Markdown>}
          {detail.keyDriversMd.trim() && <Section title="Key drivers"><Markdown>{detail.keyDriversMd}</Markdown></Section>}
          {detail.riskEventsMd.trim() && <Section title="Risk events"><Markdown>{detail.riskEventsMd}</Markdown></Section>}
          {detail.invalidationMd.trim() && <Section title="Invalidation"><Markdown>{detail.invalidationMd}</Markdown></Section>}
          <Attachments items={detail.attachments} />

          {detail.result && (
            <Section title="Result">
              <div className="space-y-3 rounded-md border border-slate-800 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-400">Original ({fmtDateTime(detail.result.evaluatedAt)}, rule v{detail.result.ruleVersion}):</span>
                  <OutcomeBadge outcome={detail.result.outcome} />
                </div>
                {detail.result.noteMd.trim() && <Markdown>{detail.result.noteMd}</Markdown>}
                {detail.result.corrections.length > 0 && (
                  <div className="space-y-2 border-t border-slate-800 pt-3">
                    <p className="font-medium text-amber-200">Corrected after publication</p>
                    <ul className="space-y-2">
                      {detail.result.corrections.map((x, i) => (
                        <li key={`${x.createdAt}-${i}`} className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-slate-400">{fmtDateTime(x.createdAt)}:</span>
                            <OutcomeBadge outcome={x.newOutcome} />
                          </div>
                          {x.reasonMd.trim() && <Markdown>{x.reasonMd}</Markdown>}
                        </li>
                      ))}
                    </ul>
                    <p className="flex items-center gap-2 text-slate-300">Current outcome: <OutcomeBadge outcome={detail.result.effectiveOutcome} /></p>
                  </div>
                )}
                <Attachments items={detail.result.attachments} />
              </div>
            </Section>
          )}

          {detail.notes.length > 0 && (
            <Section title="Killzone notes for this post">
              <ul className="space-y-2">
                {detail.notes.map((n) => (
                  <li key={n.id}>
                    <button type="button" onClick={() => onOpen("note", n.id)} className="flex w-full flex-wrap items-center gap-2 rounded-md border border-slate-800 p-2 text-left text-sm hover:border-slate-600">
                      <strong>{KILLZONE_LABEL[n.killzone]}</strong>
                      {n.content ? <><NoteStatusBadge status={n.content.status} /><span>{n.content.title}</span></> : <span className="text-slate-400">🔒 Locked</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          <EditHistory entries={editHistory} />
        </>
      )}
      <Footer token={detail?.watermark?.footer} />
    </article>
  );
}

export function NoteDetailView({ id, onOpen }: { id: string; onOpen: Open }) {
  const q = usePublicQuery<WithHistory<PublicNoteDetail>>(["note", id], `/api/public/notes/${id}`);
  if (!q.data) return <Loading q={q} />;
  const { item, detail, editHistory } = q.data;
  const c = item.content;
  const lp = detail?.linkedPost;
  return (
    <article className="space-y-5">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <strong className="text-base">{item.marketSymbol}</strong>
          <Badge tone="slate">{KILLZONE_LABEL[item.killzone]} killzone</Badge>
          <AccessBadge access={item.access} />
          <span className="text-slate-400">{fmtDay(item.noteDate)}</span>
          <span className="ml-auto"><BookmarkButton type="note" id={item.id} bookmarked={item.bookmarked} /></span>
        </div>
        {c && (
          <>
            <h2 className="text-lg font-semibold">{c.title}</h2>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <NoteStatusBadge status={c.status} />
              {c.confidence && <span className="text-slate-300">Confidence: {CONFIDENCE_LABEL[c.confidence]}</span>}
              {c.analystName && <span className="text-slate-400">by {c.analystName}</span>}
            </div>
            <TagList tags={c.tagNames} />
          </>
        )}
      </header>

      {!detail || !c ? (
        <LockPlaceholder lock={item.lock} access={item.access} />
      ) : (
        <>
          {detail.noteMd.trim() && <Markdown>{detail.noteMd}</Markdown>}
          <Attachments items={detail.attachments} />
          {lp && (
            <Section title="Linked post">
              <button type="button" onClick={() => onOpen("post", lp.id)} className="w-full rounded-md border border-slate-800 p-2 text-left text-sm hover:border-slate-600">
                {lp.title ?? "🔒 Locked post"} <span className="text-slate-400">({TYPE_LABEL[lp.type]}, {fmtDay(lp.type === "weekly" ? lp.weekStartDate : lp.postDate)})</span>
              </button>
            </Section>
          )}
          <EditHistory entries={editHistory} />
        </>
      )}
      <Footer token={detail?.watermark?.footer} />
    </article>
  );
}
