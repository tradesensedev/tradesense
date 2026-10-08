import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { AccessInfo } from "@shared/public";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { fmtUnlock } from "../../lib/publicFmt";
import { btnGhost } from "../ui";

// What a viewer sees instead of locked or delayed content. Pricing link arrives with the pricing page (Phase 5):
// add it HERE, once, and every place that shows a lock gets it.
export function LockPlaceholder({ lock, access, compact = false }: { lock: AccessInfo; access: string; compact?: boolean }) {
  const { user } = useAuth();
  const when = fmtUnlock(lock.unlocksAt);
  const delayed = lock.state === "delayed";
  const title = delayed ? "Free analysis, available shortly" : access === "paid" ? "Subscriber analysis" : "Not available yet";
  const detail = delayed
    ? `Opens for everyone on ${when}. Subscribers see it immediately.`
    : when
      ? `Opens for everyone on ${when} (open archive). Subscribers see it immediately.`
      : "Available to subscribers.";
  return (
    <div className={`rounded-md border border-dashed border-slate-700 bg-slate-900/40 ${compact ? "p-2 text-xs" : "p-4 text-sm"}`} role="note">
      <p className="font-medium text-slate-200">🔒 {title}</p>
      <p className="mt-1 text-slate-400">{detail}</p>
      {!compact && !user && (
        <p className="mt-2">
          <Link to="/login" className="text-blue-300 underline">Sign in</Link> if you already have a plan.
        </p>
      )}
    </div>
  );
}

// Only for signed-in viewers. Optimistic toggle, then every public query is refreshed.
export function BookmarkButton({ type, id, bookmarked }: { type: "post" | "note"; id: string; bookmarked: boolean }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [on, setOn] = useState(bookmarked);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => setOn(bookmarked), [bookmarked]);
  if (!user) return null;

  async function toggle() {
    const next = !on;
    setOn(next);
    setErr(null);
    try {
      await api(`/api/public/bookmarks/${type}/${id}`, { method: next ? "PUT" : "DELETE" });
      void qc.invalidateQueries({ queryKey: ["public"] });
    } catch (e) {
      setOn(!next);
      setErr(errorMessage(e));
    }
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button type="button" className={btnGhost} aria-pressed={on} onClick={() => void toggle()}>
        {on ? "★ Bookmarked" : "☆ Bookmark"}
      </button>
      {err && <span className="text-xs text-red-300">{err}</span>}
    </span>
  );
}

export function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Tags">
      {tags.map((t) => (
        <li key={t} className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{t}</li>
      ))}
    </ul>
  );
}
