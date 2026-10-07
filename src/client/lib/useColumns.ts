import { useCallback, useState } from "react";
import { LIST_COLUMNS, type ListKind } from "@shared/lists";

// Which columns a person sees is a personal preference, kept in this browser. (A saved view can also carry a column set.)
const key = (kind: ListKind) => `ts.columns.${kind}`;

function read(kind: ListKind): string[] | null {
  try {
    const raw = localStorage.getItem(key(kind));
    if (!raw) return null;
    const ids = JSON.parse(raw) as unknown;
    return Array.isArray(ids) ? ids.filter((i): i is string => typeof i === "string") : null;
  } catch {
    return null; // storage blocked or corrupted: fall back to the defaults
  }
}

export function useColumns(kind: ListKind) {
  const defs = LIST_COLUMNS[kind];
  const defaults = defs.filter((d) => d.default).map((d) => d.id);
  const [stored, setStored] = useState<string[] | null>(() => read(kind));

  // Always in the chooser's order, and only ids that still exist.
  const known = new Set(defs.map((d) => d.id));
  const chosen = (stored ?? defaults).filter((id) => known.has(id));
  const visible = defs.map((d) => d.id).filter((id) => chosen.includes(id));

  const set = useCallback(
    (ids: string[]) => {
      setStored(ids);
      try {
        localStorage.setItem(key(kind), JSON.stringify(ids));
      } catch {
        /* private mode: the choice just lasts for this page */
      }
    },
    [kind],
  );

  const reset = useCallback(() => {
    setStored(null);
    try {
      localStorage.removeItem(key(kind));
    } catch {
      /* ignore */
    }
  }, [kind]);

  return { visible: visible.length > 0 ? visible : defaults, set, reset, defs };
}
