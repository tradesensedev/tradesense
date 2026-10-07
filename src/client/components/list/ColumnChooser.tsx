import { useEffect, useRef, useState } from "react";
import type { ColumnDef } from "@shared/lists";
import { btnGhost } from "../ui";

export default function ColumnChooser({
  defs,
  visible,
  onChange,
  onReset,
}: {
  defs: readonly ColumnDef[];
  visible: string[];
  onChange: (ids: string[]) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const toggle = (id: string) => {
    const next = visible.includes(id) ? visible.filter((x) => x !== id) : [...visible, id];
    if (next.length > 0) onChange(next); // never an empty table
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" className={btnGhost} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Columns
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 max-h-80 w-56 overflow-auto rounded-md border border-slate-700 bg-slate-950 p-1 shadow-lg">
          {defs.map((d) => (
            <label key={d.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-900">
              <input type="checkbox" checked={visible.includes(d.id)} onChange={() => toggle(d.id)} />
              {d.label}
            </label>
          ))}
          <button type="button" className="mt-1 w-full rounded px-2 py-1 text-left text-xs text-slate-400 hover:bg-slate-900" onClick={onReset}>
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
}
