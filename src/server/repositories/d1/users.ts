import type { Role } from "@shared/constants";
import { newId } from "../../lib/ids";
import { nowIso } from "../../lib/time";
import type { UserRepository, UserRow } from "../types";
import { clampPage } from "./util";

interface DbUser {
  id: string;
  email: string;
  name: string;
  role: string;
  password_hash: string | null;
  totp_secret: string | null;
  timezone: string;
  created_at: string;
}

const map = (r: DbUser): UserRow => ({
  id: r.id,
  email: r.email,
  name: r.name,
  role: r.role as Role,
  passwordHash: r.password_hash,
  totpSecret: r.totp_secret,
  timezone: r.timezone,
  createdAt: r.created_at,
});

export class D1UserRepository implements UserRepository {
  constructor(private db: D1Database) {}

  async findById(id: string) {
    const r = await this.db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first<DbUser>();
    return r ? map(r) : null;
  }

  async findByEmail(email: string) {
    const r = await this.db
      .prepare("SELECT * FROM users WHERE email = ?")
      .bind(email.trim().toLowerCase())
      .first<DbUser>();
    return r ? map(r) : null;
  }

  async create(input: Omit<UserRow, "id" | "createdAt">) {
    const id = newId();
    const createdAt = nowIso();
    await this.db
      .prepare(
        "INSERT INTO users (id, email, name, role, password_hash, totp_secret, timezone, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(id, input.email.trim().toLowerCase(), input.name, input.role, input.passwordHash, input.totpSecret, input.timezone, createdAt)
      .run();
    return { ...input, email: input.email.trim().toLowerCase(), id, createdAt };
  }

  async update(
    id: string,
    patch: Partial<Pick<UserRow, "name" | "role" | "passwordHash" | "totpSecret" | "timezone">>,
  ) {
    const cols: string[] = [];
    const vals: unknown[] = [];
    if (patch.name !== undefined) (cols.push("name = ?"), vals.push(patch.name));
    if (patch.role !== undefined) (cols.push("role = ?"), vals.push(patch.role));
    if (patch.passwordHash !== undefined) (cols.push("password_hash = ?"), vals.push(patch.passwordHash));
    if (patch.totpSecret !== undefined) (cols.push("totp_secret = ?"), vals.push(patch.totpSecret));
    if (patch.timezone !== undefined) (cols.push("timezone = ?"), vals.push(patch.timezone));
    if (cols.length === 0) return;
    await this.db
      .prepare(`UPDATE users SET ${cols.join(", ")} WHERE id = ?`)
      .bind(...vals, id)
      .run();
  }

  async list(opts: { limit: number; offset: number }) {
    const { limit, offset } = clampPage(opts.limit, opts.offset);
    const res = await this.db
      .prepare("SELECT * FROM users ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?")
      .bind(limit, offset)
      .all<DbUser>();
    return res.results.map(map);
  }

  async count() {
    const r = await this.db.prepare("SELECT COUNT(*) AS n FROM users").first<{ n: number }>();
    return r?.n ?? 0;
  }
}
