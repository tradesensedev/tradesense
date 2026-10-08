import type { PublicNoteItem, PublicPostItem } from "@shared/public";
import { AccessBadge, BiasBadge, NoteStatusBadge } from "../admin/badges";
import { OutcomeBadge } from "../admin/resultBadges";
import { Badge } from "../ui";
import { KILLZONE_LABEL } from "../../lib/labels";
import { CONFIDENCE_LABEL, TYPE_LABEL, fmtDay, fmtUnlock } from "../../lib/publicFmt";

// Cards are ONE <button> (keyboard + screen reader friendly), so they hold inline elements only.
const cardCls = "block w-full space-y-1.5 rounded-md border border-slate-800 p-3 text-left hover:border-slate-600 focus:border-slate-400 focus:outline-none";

function LockLine({ state, unlocksAt }: { state: string; unlocksAt: string | null }) {
  const when = fmtUnlock(unlocksAt);
  return (
    <span className="block text-xs text-slate-400">
      🔒 {state === "delayed" ? "Free analysis, opens" : "Subscriber analysis"}
      {when ? ` · opens for everyone ${when}` : ""}
    </span>
  );
}

export function PostCard({ item, onOpen, showMarket = true, showDate = false }: { item: PublicPostItem; onOpen: (t: "post" | "note", id: string) => void; showMarket?: boolean; showDate?: boolean }) {
  const c = item.content;
  const date = item.type === "weekly" ? `Week of ${fmtDay(item.weekStartDate)}` : fmtDay(item.postDate);
  return (
    <button type="button" className={cardCls} onClick={() => onOpen("post", item.id)}>
      <span className="flex flex-wrap items-center gap-2 text-sm">
        {showMarket && <strong>{item.marketSymbol}</strong>}
        <Badge tone="slate">{TYPE_LABEL[item.type]}</Badge>
        <AccessBadge access={item.access} />
        {showDate && <span className="text-xs text-slate-400">{date}</span>}
        {c && <BiasBadge bias={c.bias} />}
        {c && <span className="text-xs text-slate-400">{CONFIDENCE_LABEL[c.confidence]}</span>}
        {c && <OutcomeBadge outcome={c.result?.outcome ?? null} corrected={c.result?.corrected} />}
        {item.bookmarked && <span aria-label="Bookmarked" title="Bookmarked">★</span>}
      </span>
      {c ? (
        <>
          <span className="block text-sm font-medium">{c.title}</span>
          {c.summary && <span className="block text-sm text-slate-400 line-clamp-2">{c.summary}</span>}
          <span className="flex flex-wrap items-center gap-1 text-xs text-slate-400">
            {c.tagNames.map((t) => <span key={t} className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">{t}</span>)}
            {c.screenshotCount > 0 && <span>🖼 {c.screenshotCount}</span>}
            {c.analystName && <span>by {c.analystName}</span>}
          </span>
        </>
      ) : (
        <LockLine state={item.lock.state} unlocksAt={item.lock.unlocksAt} />
      )}
    </button>
  );
}

export function NoteCard({ item, onOpen, showMarket = true, showDate = false }: { item: PublicNoteItem; onOpen: (t: "post" | "note", id: string) => void; showMarket?: boolean; showDate?: boolean }) {
  const c = item.content;
  return (
    <button type="button" className={cardCls} onClick={() => onOpen("note", item.id)}>
      <span className="flex flex-wrap items-center gap-2 text-sm">
        {showMarket && <strong>{item.marketSymbol}</strong>}
        <Badge tone="slate">{KILLZONE_LABEL[item.killzone]}</Badge>
        <AccessBadge access={item.access} />
        {showDate && <span className="text-xs text-slate-400">{fmtDay(item.noteDate)}</span>}
        {c && <NoteStatusBadge status={c.status} />}
        {item.bookmarked && <span aria-label="Bookmarked" title="Bookmarked">★</span>}
      </span>
      {c ? (
        <>
          <span className="block text-sm font-medium">{c.title}</span>
          <span className="flex flex-wrap items-center gap-1 text-xs text-slate-400">
            {c.tagNames.map((t) => <span key={t} className="rounded bg-slate-800 px-1.5 py-0.5 text-slate-300">{t}</span>)}
            {c.screenshotCount > 0 && <span>🖼 {c.screenshotCount}</span>}
          </span>
        </>
      ) : (
        <LockLine state={item.lock.state} unlocksAt={item.lock.unlocksAt} />
      )}
    </button>
  );
}
