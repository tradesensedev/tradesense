import { Hono, type Context } from "hono";
import {
  createNoteSchema,
  noteListQuery,
  quickNoteSchema,
  scheduleSchema,
  suggestLinksQuery,
  updateNoteSchema,
} from "@shared/content";
import type { AppEnv } from "../env";
import { audit } from "../lib/audit";
import { changedFields } from "../lib/diff";
import { notFound } from "../lib/errors";
import { parseJson, parseQuery } from "../lib/validate";
import { requirePermission } from "../middleware";
import { NoteService } from "../services/notes";
import type { Actor } from "../services/posts";

const notes = new Hono<AppEnv>();
const svc = (c: Context<AppEnv>) => new NoteService(c.var.repos);
const actor = (c: Context<AppEnv>): Actor => ({ id: c.var.user!.id, role: c.var.user!.role });

notes.get("/", async (c) => {
  const q = parseQuery(c, noteListQuery);
  const res = await c.var.repos.notes.list({
    publishStatus: q.publishStatus,
    status: q.status,
    killzone: q.killzone,
    marketId: q.marketId,
    analystId: q.analystId,
    linkedPostId: q.linkedPostId,
    createdBy: q.mine === "1" ? c.var.user!.id : undefined,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    q: q.q,
    limit: q.limit,
    offset: q.offset,
  });
  return c.json(res);
});

// Linked-post auto-suggest for the editor (static paths before /:id).
notes.get("/suggest-links", async (c) => {
  const q = parseQuery(c, suggestLinksQuery);
  return c.json(await svc(c).suggestLinks(q.marketId, q.date));
});

notes.post("/quick", requirePermission("note:create"), async (c) => {
  const input = await parseJson(c, quickNoteSchema);
  const row = await svc(c).quick(actor(c), input);
  await audit(c, input.publish ? "note.create_publish" : "note.create", "note", row.id, {
    via: "quick",
    marketId: row.marketId,
    killzone: row.killzone,
    status: row.status,
    linkedPostId: row.linkedPostId,
  });
  return c.json(await svc(c).detail(row.id), 201);
});

notes.get("/:id", async (c) => c.json(await svc(c).detail(c.req.param("id"))));

notes.get("/:id/revisions", async (c) => {
  const id = c.req.param("id");
  if (!(await c.var.repos.notes.findById(id))) throw notFound("Note not found");
  return c.json({ items: await c.var.repos.revisions.listByEntity("note", id) });
});

notes.post("/", requirePermission("note:create"), async (c) => {
  const input = await parseJson(c, createNoteSchema);
  const row = await svc(c).create(actor(c), input);
  await audit(c, "note.create", "note", row.id, { marketId: row.marketId, killzone: row.killzone, noteDate: row.noteDate, status: row.status });
  return c.json(await svc(c).detail(row.id), 201);
});

notes.put("/:id", requirePermission("note:edit"), async (c) => {
  const id = c.req.param("id");
  const patch = await parseJson(c, updateNoteSchema);
  const { before, after, revised } = await svc(c).update(actor(c), id, patch);
  const diff = changedFields(before as unknown as Record<string, unknown>, after.note as unknown as Record<string, unknown>);
  if (Object.keys(diff).length > 0) await audit(c, revised ? "note.edit_published" : "note.update", "note", id, diff);
  return c.json(after);
});

notes.post("/:id/publish", requirePermission("note:publish"), async (c) => {
  const id = c.req.param("id");
  const { before } = await svc(c).publish(actor(c), id);
  await audit(c, "note.publish", "note", id, { from: before.publishStatus, to: "published" });
  return c.json(await svc(c).detail(id));
});

notes.post("/:id/schedule", requirePermission("note:publish"), async (c) => {
  const id = c.req.param("id");
  const { publishAt } = await parseJson(c, scheduleSchema);
  const { before } = await svc(c).schedule(actor(c), id, publishAt);
  await audit(c, "note.schedule", "note", id, { from: before.publishStatus, publishAt });
  return c.json(await svc(c).detail(id));
});

notes.post("/:id/unschedule", requirePermission("note:publish"), async (c) => {
  const id = c.req.param("id");
  await svc(c).unschedule(actor(c), id);
  await audit(c, "note.unschedule", "note", id);
  return c.json(await svc(c).detail(id));
});

notes.delete("/:id", requirePermission("note:edit"), async (c) => {
  const id = c.req.param("id");
  const before = await svc(c).delete(actor(c), id);
  await audit(c, "note.delete", "note", id, { marketId: before.marketId, killzone: before.killzone, noteDate: before.noteDate, title: before.title });
  return c.json({ ok: true });
});

export default notes;
