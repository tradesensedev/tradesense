import { useCallback, useEffect, useState } from "react";

// Row selection for a list. It clears itself whenever `resetKey` changes (a new filter, sort or page means a new set of rows).
export function useSelection(resetKey: string) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [allMatching, setAllMatching] = useState(false);

  useEffect(() => {
    setIds(new Set());
    setAllMatching(false);
  }, [resetKey]);

  const toggle = useCallback((id: string) => {
    setAllMatching(false);
    setIds((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const togglePage = useCallback((pageIds: string[]) => {
    setAllMatching(false);
    setIds((s) => (pageIds.length > 0 && pageIds.every((id) => s.has(id)) ? new Set() : new Set(pageIds)));
  }, []);

  const clear = useCallback(() => {
    setIds(new Set());
    setAllMatching(false);
  }, []);

  return { ids, allMatching, setAllMatching, toggle, togglePage, clear };
}
