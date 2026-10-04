// KV-based counters. KV is eventually consistent, so this is a brake, not an exact meter.
// KV requires expirationTtl >= 60 seconds.
export async function isLimited(kv: KVNamespace, key: string, limit: number): Promise<boolean> {
  const v = await kv.get(key);
  return v !== null && parseInt(v, 10) >= limit;
}

export async function hit(kv: KVNamespace, key: string, windowSec: number): Promise<number> {
  const v = await kv.get(key);
  const n = (v ? parseInt(v, 10) : 0) + 1;
  await kv.put(key, String(n), { expirationTtl: Math.max(60, windowSec) });
  return n;
}

export async function resetLimit(kv: KVNamespace, key: string): Promise<void> {
  await kv.delete(key);
}
