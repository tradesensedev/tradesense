// D1 helpers. Only files inside repositories/d1 may touch D1Database.
export const toBool = (v: unknown): boolean => v === 1 || v === true;
export const fromBool = (v: boolean): number => (v ? 1 : 0);

export function clampPage(limit: number, offset: number): { limit: number; offset: number } {
  return {
    limit: Math.min(Math.max(Math.trunc(limit) || 50, 1), 500),
    offset: Math.max(Math.trunc(offset) || 0, 0),
  };
}
