import type { AttachmentOwnerType } from "@shared/constants";
import { nowIso } from "../../lib/time";
import type { AttachmentRepository, AttachmentRow, NewAttachment } from "../types";
import { buildSet, toBool } from "./util";

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
}
