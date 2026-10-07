import type { AttachmentOwnerType } from "@shared/constants";
import { nowIso } from "../../lib/time";
import type { AttachmentFilter, AttachmentRepository, AttachmentRow, NewAttachment } from "../types";
import { buildSet, clampPage, fromBool, toBool } from "./util";

interface DbAttachment {
  id: string;
  owner_type: string;
  owner_id: string;
  kind: string;
  r2_key: string;
  mime: string;
  size: number;
  sha256: string;
  caption: string;
  access: string;
  uploaded_by: string;
  uploaded_at: string;
  locked: number;
}

const map = (r: DbAttachment): AttachmentRow => ({
  id: r.id,
  ownerType: r.owner_type as AttachmentRow["ownerType"],
  ownerId: r.owner_id,
  kind: r.kind as AttachmentRow["kind"],
  r2Key: r.r2_key,
  mime: r.mime,
  size: r.size,
  sha256: r.sha256,
  caption: r.caption,
  access: r.access as AttachmentRow["access"],
  uploadedBy: r.uploaded_by,
  uploadedAt: r.uploaded_at,
  locked: toBool(r.locked),
});

const like = (q: string) => `%${q.replace(/[%_]/g, " ")}%`;

export class D1AttachmentRepository implements AttachmentRepository {
  constructor(private db: D1Database) {}

  async findById(id: string) {
    const r = await this.db.prepare("SELECT * FROM attachments WHERE id = ?").bind(id).first<DbAttachment>();
    return r ? map(r) : null;
  }

  async listByOwner(ownerType: AttachmentOwnerType, ownerId: string) {
    const res = await this.db
      .prepare("SELECT * FROM attachments WHERE owner_type = ? AND owner_id = ? ORDER BY uploaded_at, id")
      .bind(ownerType, ownerId)
      .all<DbAttachment>();
    return res.results.map(map);
  }

  async create(row: NewAttachment) {
    await this.db
      .prepare(
        "INSERT INTO attachments (id, owner_type, owner_id, kind, r2_key, mime, size, sha256, caption, access, uploaded_by, uploaded_at, locked) " +
          "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)",
      )
      .bind(row.id, row.ownerType, row.ownerId, row.kind, row.r2Key, row.mime, row.size, row.sha256, row.caption, row.access, row.uploadedBy, nowIso())
      .run();
    return (await this.findById(row.id))!; // re-read: the auto-lock trigger may have set locked = 1
  }

  async update(id: string, patch: Partial<Pick<AttachmentRow, "caption" | "access">>) {
    const { sql, vals } = buildSet(patch as Record<string, unknown>, { caption: "caption", access: "access" });
    if (!sql) return;
    await this.db.prepare(`UPDATE attachments SET ${sql} WHERE id = ?`).bind(...vals, id).run();
  }

  async delete(id: string) {
    await this.db.prepare("DELETE FROM attachments WHERE id = ?").bind(id).run();
  }

  // Global list for the Media screen.
  async list(f: AttachmentFilter) {
    const where: string[] = [];
    const vals: unknown[] = [];
    if (f.ownerType) (where.push("owner_type = ?"), vals.push(f.ownerType));
    if (f.kind) (where.push("kind = ?"), vals.push(f.kind));
    if (f.access) (where.push("access = ?"), vals.push(f.access));
    if (f.uploadedBy) (where.push("uploaded_by = ?"), vals.push(f.uploadedBy));
    if (f.locked !== undefined) (where.push("locked = ?"), vals.push(fromBool(f.locked)));
    if (f.q) {
      where.push("(caption LIKE ? OR sha256 LIKE ?)");
      vals.push(like(f.q), `${f.q.toLowerCase().replace(/[%_]/g, "")}%`);
    }
    if (f.dateFrom) (where.push("substr(uploaded_at, 1, 10) >= ?"), vals.push(f.dateFrom));
    if (f.dateTo) (where.push("substr(uploaded_at, 1, 10) <= ?"), vals.push(f.dateTo));
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { limit, offset } = clampPage(f.limit, f.offset);
    const total = await this.db.prepare(`SELECT COUNT(*) AS n FROM attachments ${w}`).bind(...vals).first<{ n: number }>();
    const res = await this.db
      .prepare(`SELECT * FROM attachments ${w} ORDER BY uploaded_at DESC, id DESC LIMIT ? OFFSET ?`)
      .bind(...vals, limit, offset)
      .all<DbAttachment>();
    return { items: res.results.map(map), total: total?.n ?? 0 };
  }
}
