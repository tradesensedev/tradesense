import { newId } from "../../lib/ids";
import type { AnalystRepository, AnalystRow } from "../types";
import { fromBool, toBool } from "./util";

interface DbAnalyst {
  id: string;
  name: string;
  bio: string;
  avatar_attachment_id: string | null;
  active: number;
}

const map = (r: DbAnalyst): AnalystRow => ({
  id: r.id,
  name: r.name,
  bio: r.bio,
  avatarAttachmentId: r.avatar_attachment_id,
  active: toBool(r.active),
});

export class D1AnalystRepository implements AnalystRepository {
  constructor(private db: D1Database) {}

  async list(opts?: { activeOnly?: boolean }) {
    const sql = opts?.activeOnly
      ? "SELECT * FROM analysts WHERE active = 1 ORDER BY name"
      : "SELECT * FROM analysts ORDER BY name";
    const res = await this.db.prepare(sql).all<DbAnalyst>();
    return res.results.map(map);
  }

  async findById(id: string) {
    const r = await this.db.prepare("SELECT * FROM analysts WHERE id = ?").bind(id).first<DbAnalyst>();
    return r ? map(r) : null;
  }

  async create(input: Omit<AnalystRow, "id" | "avatarAttachmentId">) {
    const id = newId();
    await this.db
      .prepare("INSERT INTO analysts (id, name, bio, active) VALUES (?, ?, ?, ?)")
      .bind(id, input.name, input.bio, fromBool(input.active))
      .run();
    return { ...input, id, avatarAttachmentId: null };
  }

  async update(id: string, patch: Partial<Pick<AnalystRow, "name" | "bio" | "active">>) {
    const cols: string[] = [];
    const vals: unknown[] = [];
    if (patch.name !== undefined) (cols.push("name = ?"), vals.push(patch.name));
    if (patch.bio !== undefined) (cols.push("bio = ?"), vals.push(patch.bio));
    if (patch.active !== undefined) (cols.push("active = ?"), vals.push(fromBool(patch.active)));
    if (cols.length === 0) return;
    await this.db
      .prepare(`UPDATE analysts SET ${cols.join(", ")} WHERE id = ?`)
      .bind(...vals, id)
      .run();
  }
}
