import type { ReactNode } from "react";

// Shared look for every admin screen. Change styling here, once.
export const inputCls =
  "w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:opacity-60";
export const btnPrimary = "rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 disabled:opacity-50";
export const btnGhost = "rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-slate-500 disabled:opacity-50";
export const btnDanger = "rounded-md border border-red-800 px-3 py-2 text-sm text-red-300 hover:bg-red-950 disabled:opacity-50";

export function PageHeader({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

const NOTICE: Record<string, string> = {
  error: "border-red-800 bg-red-950/50 text-red-200",
  success: "border-green-800 bg-green-950/50 text-green-200",
  info: "border-slate-700 bg-slate-900 text-slate-200",
  warn: "border-amber-800 bg-amber-950/50 text-amber-200",
};

export function Notice({ kind = "info", children }: { kind?: "error" | "success" | "info" | "warn"; children: ReactNode }) {
  return <div className={`rounded-md border px-3 py-2 text-sm ${NOTICE[kind]}`}>{children}</div>;
}

const TONES: Record<string, string> = {
  green: "bg-green-900/60 text-green-200",
  red: "bg-red-900/60 text-red-200",
  amber: "bg-amber-900/60 text-amber-200",
  slate: "bg-slate-800 text-slate-300",
  blue: "bg-blue-900/60 text-blue-200",
};

export function Badge({ tone = "slate", children }: { tone?: "green" | "red" | "amber" | "slate" | "blue"; children: ReactNode }) {
  return <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}>{children}</span>;
}
