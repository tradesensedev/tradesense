import type { Killzone } from "@shared/constants";
import { KILLZONES } from "@shared/constants";
import type { PublicMatrixDto, PublicNoteItem, PublicPostItem } from "@shared/public";
import { BiasBadge, NoteStatusBadge } from "../admin/badges";
import { OutcomeBadge } from "../admin/resultBadges";
import { addDays } from "../../lib/dates";
import { KILLZONE_LABEL, NOTE_STATUS_LABEL } from "../../lib/labels";
import { fmtDay } from "../../lib/publicFmt";
import { fmtWindow } from "../../lib/tz";

type Open = (type: "post" | "note", id: string) => void;
const cell = "w-full rounded p-1.5 text-left hover:bg-slate-800 focus:bg-slate-800 focus:outline-none";
const shortDay = (d: string) => new Date(`${d}T00:00:00.000Z`).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
const OUTCOME_WORD: Record<string, string> = { correct: "correct", wrong: "wrong", partial: "partial" };

function postLabel(p: PublicPostItem, what: string): string {
  const c = p.content;
  if (!c) return `${p.marketSymbol} ${what}: locked analysis`;
  const bias = c.bias;
  const res = c.result ? `, result ${OUTCOME_WORD[c.result.outcome]}${c.result.corrected ? " (corrected)" : ""}` : ", result pending";
  return `${p.marketSymbol} ${what}: ${bias}${res}`;
}

function PostCell({ post, what, onOpen }: { post: PublicPostItem | undefined; what: string; onOpen: Open }) {
  if (!post) return <span className="block p-1.5 text-slate-600" aria-label={`${what}: nothing published`}>–</span>;
  const c = post.content;
  return (
    <button type="button" className={`${cell} space-y-1`} aria-label={postLabel(post, what)} onClick={() => onOpen("post", post.id)}>
      {c ? (
        <>
          <span className="block"><BiasBadge bias={c.bias} /></span>
          <span className="block"><OutcomeBadge outcome={c.result?.outcome ?? null} corrected={c.result?.corrected} /></span>
        </>
      ) : (
        <span className="block text-xs text-slate-400">🔒 Locked</span>
      )}
    </button>
  );
}

function NoteCell({ notes, label, onOpen }: { notes: PublicNoteItem[]; label: string; onOpen: Open }) {
  if (notes.length === 0) return <span className="block p-1.5 text-slate-600" aria-label={`${label}: no note`}>–</span>;
  return (
    <div className="space-y-1">
      {notes.map((n) => (
        <button
          key={n.id}
          type="button"
          className={cell}
          aria-label={`${n.marketSymbol} ${label}: ${n.content ? NOTE_STATUS_LABEL[n.content.status] : "locked note"}`}
          onClick={() => onOpen("note", n.id)}
        >
          {n.content ? <NoteStatusBadge status={n.content.status} /> : <span className="text-xs text-slate-400">🔒 Locked</span>}
        </button>
      ))}
    </div>
  );
}

export default function MatrixGrid({ data, today, tz, onOpen }: { data: PublicMatrixDto; today: string; tz: string; onOpen: Open }) {
  const days = [0, 1, 2, 3, 4].map((i) => addDays(data.weekStartDate, i));
  const daily = new Map(data.posts.filter((p) => p.type === "daily").map((p) => [p.postDate, p]));
  const weekly = data.posts.find((p) => p.type === "weekly");
  const notesAt = (k: Killzone, d: string) => data.notes.filter((n) => n.killzone === k && n.noteDate === d);
  const win = (k: Killzone) => fmtWindow(k, data.weekStartDate, tz);

  return (
    <>
      {/* Desktop / tablet: the matrix */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Bias matrix: daily bias and killzone note status per day, plus the weekly outlook</caption>
          <thead>
            <tr>
              <th scope="col" className="p-2 text-left text-xs font-medium text-slate-400">Time ({tz})</th>
              {days.map((d) => (
                <th key={d} scope="col" className={`p-2 text-left text-xs font-medium ${d === today ? "text-white" : "text-slate-400"}`} aria-current={d === today ? "date" : undefined}>
                  {shortDay(d)}{d === today ? " · today" : ""}
                </th>
              ))}
              <th scope="col" className="p-2 text-left text-xs font-medium text-slate-400">WEEKLY</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-800 align-top">
              <th scope="row" className="p-2 text-left text-sm font-medium">Daily bias</th>
              {days.map((d) => (
                <td key={d} className="border-l border-slate-800 p-1"><PostCell post={daily.get(d)} what={`${shortDay(d)} daily bias`} onOpen={onOpen} /></td>
              ))}
              <td className="border-l border-slate-800 p-1"><PostCell post={weekly} what="weekly outlook" onOpen={onOpen} /></td>
            </tr>
            {KILLZONES.map((k) => (
              <tr key={k} className="border-t border-slate-800 align-top">
                <th scope="row" className="p-2 text-left text-sm font-medium">
                  {KILLZONE_LABEL[k]}
                  <span className="block text-xs font-normal text-slate-400">{win(k)}</span>
                </th>
                {days.map((d) => (
                  <td key={d} className="border-l border-slate-800 p-1"><NoteCell notes={notesAt(k, d)} label={`${shortDay(d)} ${KILLZONE_LABEL[k]} note`} onOpen={onOpen} /></td>
                ))}
                <td className="border-l border-slate-800 p-2 text-slate-600" aria-hidden="true">·</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: weekly card first, then one stacked card per day */}
      <div className="space-y-3 md:hidden">
        <section className="rounded-md border border-slate-800 p-3" aria-label="Weekly outlook">
          <h3 className="mb-1 text-sm font-semibold">Weekly outlook</h3>
          <PostCell post={weekly} what="weekly outlook" onOpen={onOpen} />
        </section>
        {days.map((d) => (
          <section key={d} className={`rounded-md border p-3 ${d === today ? "border-slate-500" : "border-slate-800"}`} aria-label={fmtDay(d)}>
            <h3 className="mb-2 text-sm font-semibold">{fmtDay(d)}{d === today ? " · today" : ""}</h3>
            <div className="space-y-1">
              <div className="flex items-start gap-2"><span className="w-24 shrink-0 pt-1.5 text-xs text-slate-400">Daily bias</span><PostCell post={daily.get(d)} what={`${shortDay(d)} daily bias`} onOpen={onOpen} /></div>
              {KILLZONES.map((k) => (
                <div key={k} className="flex items-start gap-2">
                  <span className="w-24 shrink-0 pt-1.5 text-xs text-slate-400">{KILLZONE_LABEL[k]}<span className="block">{win(k)}</span></span>
                  <NoteCell notes={notesAt(k, d)} label={`${shortDay(d)} ${KILLZONE_LABEL[k]} note`} onOpen={onOpen} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
