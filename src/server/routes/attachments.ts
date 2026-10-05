import { Hono, type Context } from "hono";
import { attachmentListQuery, updateAttachmentSchema, uploadFieldsSchema, type UploadResponse } from "@shared/attachments";
import type { AppEnv } from "../env";
import { audit } from "../lib/audit";
import { toAttachmentDto } from "../lib/dto";
import { badRequest } from "../lib/errors";
import { parseJson, parseQuery } from "../lib/validate";
import { AttachmentService } from "../services/attachments";
import type { Actor } from "../services/posts";

const attachments = new Hono<AppEnv>();
const svc = (c: Context<AppEnv>) => new AttachmentService(c.var.repos, c.env.BUCKET);
const actor = (c: Context<AppEnv>): Actor => ({ id: c.var.user!.id, role: c.var.user!.role });

// Authorization is per owner (post/note edit rights), enforced in the service.
attachments.get("/", async (c) => {
  const q = parseQuery(c, attachmentListQuery);
  const rows = await svc(c).list(q.ownerType, q.ownerId);
  return c.json({ items: rows.map(toAttachmentDto) });
});

const text = (v: unknown): string | undefined => (typeof v === "string" && v.trim() !== "" ? v : undefined);

// multipart/form-data: ownerType, ownerId, [kind], [access], [caption], files (repeat), captions (repeat, same order as files)
attachments.post("/", async (c) => {
  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    throw badRequest("Expected multipart/form-data");
  }
  const parsed = uploadFieldsSchema.safeParse({
    ownerType: text(form.get("ownerType")),
    ownerId: text(form.get("ownerId")),
    kind: text(form.get("kind")),
    access: text(form.get("access")),
    caption: text(form.get("caption")),
  });
  if (!parsed.success) throw badRequest("Validation failed", parsed.error.flatten());

  const files = (form.getAll("files") as unknown[]).filter((v): v is File => typeof v !== "string" && v instanceof File);
  const captions = (form.getAll("captions") as unknown[]).map((v) => (typeof v === "string" ? v : ""));
  const { items, skipped } = await svc(c).upload(actor(c), parsed.data, files, captions);
  for (const a of items) {
    await audit(c, "attachment.upload", "attachment", a.id, {
      ownerType: a.ownerType,
      ownerId: a.ownerId,
      sha256: a.sha256,
      size: a.size,
      mime: a.mime,
      locked: a.locked,
    });
  }
  const body: UploadResponse = { items: items.map(toAttachmentDto), skipped };
  return c.json(body, 201);
});

attachments.put("/:id", async (c) => {
  const id = c.req.param("id");
  const patch = await parseJson(c, updateAttachmentSchema);
  const { before, after } = await svc(c).update(actor(c), id, patch);
  await audit(c, "attachment.update", "attachment", id, {
    caption: before.caption !== after.caption ? { from: before.caption, to: after.caption } : undefined,
    access: before.access !== after.access ? { from: before.access, to: after.access } : undefined,
  });
  return c.json(toAttachmentDto(after));
});

attachments.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const before = await svc(c).delete(actor(c), id);
  await audit(c, "attachment.delete", "attachment", id, { ownerType: before.ownerType, ownerId: before.ownerId, sha256: before.sha256 });
  return c.json({ ok: true });
});

export default attachments;
