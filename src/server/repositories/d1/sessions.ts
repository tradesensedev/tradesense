import type { SessionRepository, SessionRow } from "../types";

interface DbSession {
  id: string;
  user_id: string;
  csrf_token: string;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
  expires_at: string;
}

export class D1SessionRepository implements SessionRepository {
  constructor(private db: D1Database) {}

  async create(row: SessionRow) {
    await this.db
      .prepare(
        "INSERT INTO sessions (id, user_id, csrf_token, ip_hash, user_agent, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(row.id, row.userId, row.csrfToken, row.ipHash, row.userAgent, row.createdAt, row.expiresAt)
      .run();
  }

  async findById(id: string) {
    const r = await this.db.prepare("SELECT * FROM sessions WHERE id = ?").bind(id).first<DbSession>();
    if (!r) return null;
    return {
      id: r.id,
      userId: r.user_id,
      csrfToken: r.csrf_token,
      ipHash: r.ip_hash,
      userAgent: r.user_agent,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
    } satisfies SessionRow;
  }

  async delete(id: string) {
    await this.db.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
  }

  async deleteByUser(userId: string) {
    await this.db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
  }

  async deleteExpired(nowIso: string) {
    await this.db.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(nowIso).run();
  }
}
