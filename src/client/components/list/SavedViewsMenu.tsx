import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { can } from "@shared/permissions";
import type { SavedViewDto, SavedViewScope } from "@shared/admin";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { Badge, Notice, btnGhost, btnPrimary, inputCls } from "../ui";

// Saved views = the current filters (and chosen columns) under a name. Private by default, can be shared with the team.
export default function SavedViewsMenu({
  scope,
  filters,
  columns,
  onApply,
}: {
  scope: SavedViewScope;
  filters: Record<string, string>;
  columns: string[];
  onApply: (view: SavedViewDto) => void;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [shared, setShared] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const key = ["views", scope];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const views = useQuery({ queryKey: key, queryFn: () => api<{ items: SavedViewDto[] }>(`/api/admin/views?scope=${scope}`), enabled: open });

  const save = useMutation({
    mutationFn: () => api<SavedViewDto>("/api/admin/views", { method: "POST", body: { scope, name, filters, columns, shared } }),
    onSuccess: () => {
      setName("");
      setShared(false);
      void qc.invalidateQueries({ queryKey: key });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api<{ ok: true }>(`/api/admin/views/${id}`, { method: "DELETE" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: key }),
  });

  const error = save.error ?? remove.error ?? views.error;
  const items = views.data?.items ?? [];
  const isAdmin = can(user?.role, "user:manage");

  return (
    <div className="relative" ref={ref}>
      <button type="button" className={btnGhost} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        Saved views
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-80 rounded-md border border-slate-700 bg-slate-950 p-2 shadow-lg">
          {error && <Notice kind="error">{errorMessage(error)}</Notice>}
          {views.isLoading && <p className="p-2 text-sm text-slate-400">Loading...</p>}
          {!views.isLoading && items.length === 0 && <p className="p-2 text-sm text-slate-400">No saved views yet.</p>}
          <ul className="max-h-56 overflow-auto">
            {items.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-2 rounded px-2 py-1 hover:bg-slate-900">
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left text-sm"
                  onClick={() => {
                    onApply(v);
                    setOpen(false);
                  }}
                  title={v.mine ? v.name : `${v.name} (shared by ${v.ownerName ?? "a teammate"})`}
                >
                  {v.name} {v.shared && <Badge tone="blue">{v.mine ? "Shared" : `By ${v.ownerName ?? "team"}`}</Badge>}
                </button>
                {(v.mine || (v.shared && isAdmin)) && (
                  <button
                    type="button"
                    className="text-xs text-red-300 hover:underline disabled:opacity-50"
                    disabled={remove.isPending}
                    onClick={() => window.confirm(`Delete the view "${v.name}"?`) && remove.mutate(v.id)}
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-2 space-y-2 border-t border-slate-800 pt-2">
            <p className="text-xs text-slate-400">Save the current filters and columns as a view.</p>
            <input className={inputCls} placeholder="View name" maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={shared} onChange={(e) => setShared(e.target.checked)} /> Share with the team
            </label>
            <button type="button" className={btnPrimary} disabled={!name.trim() || save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? "Saving..." : "Save view"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
