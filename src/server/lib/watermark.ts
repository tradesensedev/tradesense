import { sha256Hex } from "./ids";

// Invisible per-user watermark. The user id (a ULID, 26 characters of Crockford base32) is written as 5 bits per
// character using two zero-width characters (U+200B = 0, U+200C = 1) between two U+2060 markers.
// A copied or re-posted text still carries it; decodeWatermarks() gives the user id back (for leak investigations).
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const ZERO = "\u200B";
const ONE = "\u200C";
const MARK = "\u2060";

export function watermarkCode(userId: string): string {
  let bits = "";
  for (const ch of userId.toUpperCase()) bits += Math.max(ALPHABET.indexOf(ch), 0).toString(2).padStart(5, "0");
  return MARK + bits.replace(/0/g, ZERO).replace(/1/g, ONE) + MARK;
}

export function decodeWatermarks(text: string): string[] {
  const out: string[] = [];
  const re = /\u2060([\u200B\u200C]+)\u2060/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const bits = [...m[1]!].map((c) => (c === ONE ? "1" : "0")).join("");
    let id = "";
    for (let i = 0; i + 5 <= bits.length; i += 5) id += ALPHABET[parseInt(bits.slice(i, i + 5), 2)] ?? "";
    out.push(id);
  }
  return out;
}

// Adds the code at the end of up to `max` paragraphs, spread evenly (always the last one). Paragraphs that contain a
// code fence are skipped so code blocks stay intact.
export function injectWatermark(text: string, code: string, max: number): string {
  if (!text.trim() || max <= 0) return text;
  const parts = text.split(/(\n{2,})/); // paragraphs at even indexes, separators at odd ones
  const candidates: number[] = [];
  let inFence = false;
  for (let i = 0; i < parts.length; i += 2) {
    const p = parts[i]!;
    const fences = (p.match(/```/g) ?? []).length;
    if (!inFence && fences === 0 && p.trim()) candidates.push(i);
    if (fences % 2 === 1) inFence = !inFence;
  }
  if (candidates.length === 0) return text + code;
  const n = Math.min(max, candidates.length);
  const chosen = new Set<number>();
  for (let k = 0; k < n; k++) chosen.add(candidates[Math.round(((k + 1) * candidates.length) / n) - 1]!);
  return parts.map((p, i) => (chosen.has(i) ? p + code : p)).join("");
}

// Visible token under the content: lets a screenshot be traced to a user + page (recompute it per user to match).
export async function footerToken(userId: string, entityId: string, salt: string): Promise<string> {
  return (await sha256Hex(`wm:${salt}:${userId}:${entityId}`)).slice(0, 10).toUpperCase();
}
