import type { Repositories } from "../repositories/types";

// Human labels for post/note/result ids, cached for one request (revisions and media screens list many rows).
export class EntityLabels {
  private markets: Map<string, string> | null = null;
  private cache = new Map<string, string | null>();

  constructor(private repos: Repositories) {}

  private async symbol(marketId: string): Promise<string> {
    if (!this.markets) {
      this.markets = new Map((await this.repos.markets.list()).map((m) => [m.id, m.symbol]));
    }
    return this.markets.get(marketId) ?? "?";
  }

  async label(type: "post" | "note" | "result", id: string): Promise<string | null> {
    const key = `${type}:${id}`;
    if (this.cache.has(key)) return this.cache.get(key)!;
    const value = await this.build(type, id);
    this.cache.set(key, value);
    return value;
  }

  private async build(type: "post" | "note" | "result", id: string): Promise<string | null> {
    if (type === "post") {
      const p = await this.repos.posts.findById(id);
      return p ? `${await this.symbol(p.marketId)} ${p.type} ${p.type === "daily" ? p.postDate : p.weekStartDate}` : null;
    }
    if (type === "note") {
      const n = await this.repos.notes.findById(id);
      return n ? `${await this.symbol(n.marketId)} ${n.killzone} note ${n.noteDate}` : null;
    }
    const r = await this.repos.results.findById(id);
    const post = r ? await this.label("post", r.postId) : null;
    return post ? `Result: ${post}` : null;
  }
}

export function safeJson<T>(text: string | null, fallback: T): T {
  if (!text) return fallback;
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}
