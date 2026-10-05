// D1 helpers. Only files inside repositories/d1 may touch D1Database.
export const toBool = (v: unknown): boolean => v === 1 || v === true;
export const fromBool = (v: boolean): number => (v ? 1 : 0);

export function clampPage(limit: number, offset: number): { limit: number; offset: number } {
  return {
    limit: Math.min(Math.max(Math.trunc(limit) || 50, 1), 500),
    offset: Math.max(Math.trunc(offset) || 0, 0),
  };
}

// Builds "col = ?, col2 = ?" from a camelCase patch. Keys not in `cols` are ignored (never interpolated).
export function buildSet(
  patch: Record<string, unknown>,
  cols: Record<string, string>,
  bools: readonly string[] = [],
): { sql: string; vals: unknown[] } {
  const parts: string[] = [];
  const vals: unknown[] = [];
  for (const [key, col] of Object.entries(cols)) {
    if (!(key in patch) || patch[key] === undefined) continue;
    parts.push(`${col} = ?`);
    const v = patch[key];
    vals.push(bools.includes(key) ? fromBool(v as boolean) : v);
  }
  return { sql: parts.join(", "), vals };
}
