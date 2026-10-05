// { field: { from, to } } for every field whose value differs. Used in audit entries.
export function changedFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  skip: readonly string[] = ["updatedAt"],
): Record<string, { from: unknown; to: unknown }> {
  const out: Record<string, { from: unknown; to: unknown }> = {};
  for (const key of Object.keys(after)) {
    if (skip.includes(key)) continue;
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) out[key] = { from: before[key], to: after[key] };
  }
  return out;
}
