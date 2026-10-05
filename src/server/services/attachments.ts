import {
  ALLOWED_UPLOAD_MIME,
  MAX_UPLOAD_BYTES,
  type AttachmentOwnerType,
} from "@shared/constants";
import type { UpdateAttachmentInput, UploadFields } from "@shared/attachments";
import { can } from "@shared/permissions";
import { AppError, badRequest, forbidden, notFound } from "../lib/errors";
import { newId, sha256Hex } from "../lib/ids";
import type { AttachmentRow, Repositories, UserRow } from "../repositories/types";
import { SettingsService } from "./settings";
import type { Actor } from "./posts";

export const MAX_FILES_PER_UPLOAD = 10;

const EXT: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

// Never trust the browser-declared type: read the file signature.
export function sniffImageMime(b: Uint8Array): string | null {
  const at = (i: number, ...bytes: number[]) => bytes.every((v, k) => b[i + k] === v);
  if (at(0, 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (at(0, 0xff, 0xd8, 0xff)) return "image/jpeg";
  if (at(0, 0x47, 0x49, 0x46, 0x38) && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61) return "image/gif";
  if (at(0, 0x52, 0x49, 0x46, 0x46) && at(8, 0x57, 0x45, 0x42, 0x50)) return "image/webp";
  return null;
}

export class AttachmentService {
  constructor(
    private repos: Repositories,
    private bucket: R2Bucket,
  ) {}

  async list(ownerType: AttachmentOwnerType, ownerId: string) {
    return this.repos.attachments.listByOwner(ownerType, ownerId);
  }

  // ---------- upload ----------
  async upload(actor: Actor, fields: UploadFields, files: File[], captions: string[]) {
    if (files.length === 0) throw badRequest("No files received");
    if (files.length > MAX_FILES_PER_UPLOAD) throw badRequest(`At most ${MAX_FILES_PER_UPLOAD} files per upload`);
    await this.assertOwnerWritable(actor, fields.ownerType, fields.ownerId);

    // 1) validate everything first, so a bad file never leaves a half-finished upload
    const prepared: { file: File; bytes: Uint8Array; mime: string }[] = [];
    for (const file of files) {
      if (file.size === 0) throw badRequest(`${file.name}: file is empty`);
      if (file.size > MAX_UPLOAD_BYTES) throw new AppError(413, "too_large", `${file.name}: larger than ${MAX_UPLOAD_BYTES / 1024 / 1024} MB`);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const mime = sniffImageMime(bytes);
      if (!mime || !(ALLOWED_UPLOAD_MIME as readonly string[]).includes(mime)) {
        throw new AppError(415, "unsupported_type", `${file.name}: only PNG, JPEG, WebP or GIF images are allowed`);
      }
      prepared.push({ file, bytes, mime });
    }

    const settings = await new SettingsService(this.repos).getAll();
    const existing = await this.repos.attachments.listByOwner(fields.ownerType, fields.ownerId);
    const seen = new Set(existing.map((a) => a.sha256));
    const kind = fields.kind ?? (fields.ownerType === "post" ? "bias_chart" : "note_chart");
    const access = fields.access ?? settings.default_access_screenshot;
    // only editors/admins may pick a per-image access level
    if (fields.access && fields.access !== settings.default_access_screenshot && !can(actor.role, "attachment:manage")) {
      throw forbidden("Your role cannot set per-image access");
    }

    const items: AttachmentRow[] = [];
    const skipped: { name: string; reason: string }[] = [];
    for (const [i, p] of prepared.entries()) {
      const hash = await sha256Hex(p.bytes); // computed here, never client-supplied
      if (seen.has(hash)) {
        skipped.push({ name: p.file.name, reason: "Same image is already attached" });
        continue;
      }
      seen.add(hash);
      const id = newId();
      const r2Key = `attachments/${fields.ownerType}/${fields.ownerId}/${id}.${EXT[p.mime]}`;
      await this.bucket.put(r2Key, p.bytes, { httpMetadata: { contentType: p.mime }, sha256: hash }); // R2 verifies the checksum
      try {
        items.push(
          await this.repos.attachments.create({
            id,
            ownerType: fields.ownerType,
            ownerId: fields.ownerId,
            kind,
            r2Key,
            mime: p.mime,
            size: p.bytes.byteLength,
            sha256: hash,
            caption: (captions[i] ?? fields.caption ?? "").trim().slice(0, 300),
            access,
            uploadedBy: actor.id,
          }),
        );
      } catch (e) {
        await this.bucket.delete(r2Key); // do not leave orphan objects behind
        throw e;
      }
    }
    return { items, skipped };
  }

  // ---------- caption / access (allowed even when locked) ----------
  async update(actor: Actor, id: string, patch: UpdateAttachmentInput) {
    const before = await this.mustFind(id);
    await this.assertOwnerWritable(actor, before.ownerType, before.ownerId);
    if (patch.access !== undefined && !can(actor.role, "attachment:manage")) throw forbidden("Your role cannot change per-image access");
    await this.repos.attachments.update(id, patch);
    return { before, after: (await this.repos.attachments.findById(id))! };
  }

  // ---------- delete (never when locked) ----------
  async delete(actor: Actor, id: string) {
    const before = await this.mustFind(id);
    await this.assertOwnerWritable(actor, before.ownerType, before.ownerId);
    if (before.locked) throw new AppError(409, "locked", "This screenshot is locked (its post or note is published) and cannot be deleted");
    await this.repos.attachments.delete(id);
    await this.bucket.delete(before.r2Key);
    return before;
  }

  // ---------- who may view a file (used by GET /files/:id) ----------
  // Staff: always. Everyone else: only 'public' screenshots of published content.
  // Phase 4 replaces the non-staff branch with the entitlement check (plan, free delay, open archive).
  async canView(user: UserRow | null, att: AttachmentRow): Promise<boolean> {
    if (user && can(user.role, "admin:access")) return true;
    const owner = await this.ownerInfo(att.ownerType, att.ownerId);
    if (!owner || !owner.published) return false;
    const effective = att.access === "inherit" ? owner.access : att.access;
    return effective === "public";
  }

  async openFile(id: string, user: UserRow | null) {
    const att = await this.repos.attachments.findById(id);
    // 404 for "missing" and "not allowed" alike, so ids cannot be probed
    if (!att || !(await this.canView(user, att))) throw notFound();
    const object = await this.bucket.get(att.r2Key);
    if (!object) throw notFound();
    return { att, object };
  }

  // ---------- rules ----------
  private async mustFind(id: string) {
    const a = await this.repos.attachments.findById(id);
    if (!a) throw notFound("Attachment not found");
    return a;
  }

  private async ownerInfo(type: AttachmentOwnerType, id: string) {
    if (type === "post") {
      const p = await this.repos.posts.findById(id);
      return p ? { published: p.status === "published", access: p.access, createdBy: p.createdBy, draft: p.status === "draft" } : null;
    }
    if (type === "note") {
      const n = await this.repos.notes.findById(id);
      return n ? { published: n.publishStatus === "published", access: n.access, createdBy: n.createdBy, draft: n.publishStatus === "draft" } : null;
    }
    return null; // result attachments arrive with the results queue (Phase 3)
  }

  // Same edit rights as the owning post/note. Analysts: own drafts only. Published owners: editors/admins only.
  private async assertOwnerWritable(actor: Actor, type: AttachmentOwnerType, id: string) {
    if (type === "result") {
      if (!can(actor.role, "attachment:manage")) throw forbidden();
      return;
    }
    const owner = await this.ownerInfo(type, id);
    if (!owner) throw notFound(type === "post" ? "Post not found" : "Note not found");
    if (!can(actor.role, type === "post" ? "post:edit" : "note:edit")) throw forbidden();
    if (actor.role === "analyst" && (owner.createdBy !== actor.id || !owner.draft)) {
      throw forbidden("Analysts can only change screenshots on their own drafts");
    }
    if (owner.published && !can(actor.role, "attachment:manage")) {
      throw forbidden("Only an editor can add screenshots to published content");
    }
  }
}
