import type { MagicLinkRepository, MagicLinkRow } from "../types";

interface DbMagic {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
}

export class D1MagicLinkRepository implements MagicLinkRepository {
  constructor(private db: D1Database) {}

  async create(row: Omit<MagicLinkRow, "usedAt">) {
    await this.db
      .prepare("INSERT INTO magic_link_tokens (id, email, created_at, expires_at) VALUES (?, ?, ?, ?)")
      .bind(row.id, row.email.trim().toLowerCase(), row.createdAt, row.expiresAt)
      .run();
  }

  // Single atomic statement: valid + unused + not expired -> mark used and return it.
  async consume(id: string, nowIso: string) {
    const r = await this.db
      .prepare(
        "UPDATE magic_link_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL AND expires_at > ? RETURNING *",
      )
      .bind(nowIso, id, nowIso)
      .first<DbMagic>();
    if (!r) return null;
    return { id: r.id, email: r.email, createdAt: r.created_at, expiresAt: r.expires_at, usedAt: r.used_at };
  }
}
