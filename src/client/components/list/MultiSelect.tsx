import { useEffect, useRef, useState } from "react";
import { inputCls } from "../ui";

export interface Option {
  value: string;
  label: string;
}

// A dropdown with checkboxes for filters that accept several values (markets, status, bias...).
export default function MultiSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const summary =
    value.length === 0 ? label : value.length === 1 ? (options.find((o) => o.value === value[0])?.label ?? value[0]!) : `${label} (${value.length})`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={`${inputCls} flex items-center justify-between text-left ${value.length ? "border-slate-400" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="truncate">{summary}</span>
        <span aria-hidden className="ml-2 text-xs text-slate-400">▾</span>
      </button>
      {open && (
        <div className="absolute z-20 mt-1 max-h-64 w-full min-w-44 overflow-auto rounded-md border border-slate-700 bg-slate-950 p-1 shadow-lg">
          {options.map((o) => (
            <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-900">
              <input type="checkbox" checked={value.includes(o.value)} onChange={() => toggle(o.value)} />
              {o.label}
            </label>
          ))}
          {value.length > 0 && (
            <button type="button" className="mt-1 w-full rounded px-2 py-1 text-left text-xs text-slate-400 hover:bg-slate-900" onClick={() => onChange([])}>
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
