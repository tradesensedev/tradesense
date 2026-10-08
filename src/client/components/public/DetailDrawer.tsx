import { useEffect, useRef, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useDrawer } from "../../lib/publicApi";
import { btnGhost } from "../ui";
import { NoteDetailView, PostDetailView } from "./DetailViews";

// Accessible side drawer: Esc and the backdrop close it, focus moves in and returns, the page behind does not scroll.
function Drawer({ onClose, fullHref, children }: { onClose: () => void; fullHref: string; children: ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      before?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" aria-label="Close details" tabIndex={-1} className="absolute inset-0 bg-black/60" onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-label="Details" className="relative flex h-full w-full flex-col border-l border-slate-700 bg-slate-950 sm:max-w-xl">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 p-3">
          <Link to={fullHref} className="text-sm text-blue-300 underline">Open full page</Link>
          <button ref={closeRef} type="button" className={btnGhost} onClick={onClose}>Close</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  );
}

// Put <DetailDrawer /> on any page: it opens when the URL has ?open=post:ID or ?open=note:ID (see useDrawer).
export default function DetailDrawer() {
  const { target, open, close } = useDrawer();
  if (!target) return null;
  return (
    <Drawer onClose={close} fullHref={`/${target.type}/${target.id}`}>
      {target.type === "post" ? <PostDetailView id={target.id} onOpen={open} /> : <NoteDetailView id={target.id} onOpen={open} />}
    </Drawer>
  );
}
