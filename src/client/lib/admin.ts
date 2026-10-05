import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LookupsResponse } from "@shared/types";
import { api } from "./api";

// Markets, analysts, tags and settings in one cached call. Every admin form uses it for its dropdowns.
export const LOOKUPS_KEY = ["lookups"];

export function useLookups() {
  return useQuery({
    queryKey: LOOKUPS_KEY,
    queryFn: () => api<LookupsResponse>("/api/admin/lookups"),
    staleTime: 30_000,
  });
}

export function useRefreshLookups() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: LOOKUPS_KEY });
}
