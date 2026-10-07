import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

// Every list keeps its state in the URL (?status=draft&marketId=a,b&sort=market&dir=asc&offset=25),
// so a refresh, a bookmark or a pasted link shows the same view. Sort and paging are not "filters".
const NON_FILTER = ["sort", "dir", "limit", "offset"];

export function splitCsv(v: string | undefined): string[] {
  return v ? v.split(",").filter(Boolean) : [];
}

export function useListState(limit = 25) {
  const [sp, setSp] = useSearchParams();

  const filters = useMemo(() => {
    const out: Record<string, string> = {};
    sp.forEach((v, k) => {
      if (!NON_FILTER.includes(k) && v !== "") out[k] = v;
    });
    return out;
  }, [sp]);

  const sort = sp.get("sort") ?? "";
  const dir: "asc" | "desc" = sp.get("dir") === "asc" ? "asc" : "desc";
  const offset = Math.max(0, Number(sp.get("offset") ?? 0) || 0);

  // Changing a filter or the sort goes back to page 1. Pass offset in the patch to page instead.
  const set = useCallback(
    (patch: Record<string, string | undefined>) => {
      setSp(
        (prev) => {
          const n = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(patch)) {
            if (v === undefined || v === "") n.delete(k);
            else n.set(k, v);
          }
          if (!("offset" in patch)) n.delete("offset");
          return n;
        },
        { replace: true },
      );
    },
    [setSp],
  );

  // Used when a saved view is applied: filters are replaced, the current sort stays.
  const replaceFilters = useCallback(
    (next: Record<string, string>) => {
      setSp(
        (prev) => {
          const n = new URLSearchParams();
          for (const k of NON_FILTER) {
            const v = prev.get(k);
            if (v && k !== "offset") n.set(k, v);
          }
          for (const [k, v] of Object.entries(next)) if (v !== "") n.set(k, v);
          return n;
        },
        { replace: true },
      );
    },
    [setSp],
  );

  const clear = useCallback(() => setSp(new URLSearchParams(), { replace: true }), [setSp]);

  // Query string for the API: filters + sort + paging.
  const apiQuery = useMemo(() => {
    const n = new URLSearchParams(filters);
    if (sort) n.set("sort", sort);
    n.set("dir", dir);
    n.set("limit", String(limit));
    n.set("offset", String(offset));
    return n.toString();
  }, [filters, sort, dir, limit, offset]);

  // Same without paging, for the CSV export (the server pages through everything itself).
  const exportQuery = useMemo(() => {
    const n = new URLSearchParams(filters);
    if (sort) n.set("sort", sort);
    n.set("dir", dir);
    return n.toString();
  }, [filters, sort, dir]);

  const toggleSort = useCallback(
    (key: string) => set(sort === key ? { sort: key, dir: dir === "asc" ? "desc" : "asc" } : { sort: key, dir: "asc" }),
    [set, sort, dir],
  );

  return { filters, sort, dir, offset, limit, set, replaceFilters, clear, apiQuery, exportQuery, toggleSort, hasFilters: Object.keys(filters).length > 0 };
}
