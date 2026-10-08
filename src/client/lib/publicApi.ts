import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import type { PublicMetaDto } from "@shared/public";
import { api } from "./api";
import { useAuth } from "./auth";

// Every public query is keyed by the viewer, because what is unlocked differs per viewer.
// After login/logout the key changes, so nothing from the previous viewer is ever shown.
// After a bookmark change, invalidate ["public"] to refresh all of them.
export function usePublicQuery<T>(key: unknown[], path: string, enabled = true) {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ["public", user?.id ?? "anon", ...key],
    queryFn: () => api<T>(path),
    enabled: enabled && !loading,
    staleTime: 30_000,
  });
}

export function usePublicMeta() {
  return usePublicQuery<PublicMetaDto>(["meta"], "/api/public/meta");
}

// The side drawer lives in the URL (?open=post:ID or ?open=note:ID): refresh, back button and sharing all work.
export type DrawerTarget = { type: "post" | "note"; id: string };

export function useDrawer() {
  const [sp, setSp] = useSearchParams();
  const m = /^(post|note):([A-Za-z0-9]{1,40})$/.exec(sp.get("open") ?? "");
  const target: DrawerTarget | null = m ? { type: m[1] as "post" | "note", id: m[2]! } : null;
  const open = useCallback(
    (type: "post" | "note", id: string) =>
      setSp((prev) => {
        const n = new URLSearchParams(prev);
        n.set("open", `${type}:${id}`);
        return n;
      }),
    [setSp],
  );
  const close = useCallback(
    () =>
      setSp((prev) => {
        const n = new URLSearchParams(prev);
        n.delete("open");
        return n;
      }),
    [setSp],
  );
  return { target, open, close };
}
