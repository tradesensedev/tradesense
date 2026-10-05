import { Hono, type Context } from "hono";
import {
  bulkPostsSchema,
  createPostSchema,
  duplicatePostsSchema,
  postListQuery,
  scheduleSchema,
  templatePostsSchema,
  updatePostSchema,
} from "@shared/content";
import type { AppEnv } from "../env";
import { audit } from "../lib/audit";
import { changedFields } from "../lib/diff";
import { notFound } from "../lib/errors";
import { parseJson, parseQuery } from "../lib/validate";
import { requirePermission } from "../middleware";
import { PostService, type Actor } from "../services/posts";

const posts = new Hono<AppEnv>();
const svc = (c: Context<AppEnv>) => new PostService(c.var.repos);
const actor = (c: Context<AppEnv>): Actor => ({ id: c.var.user!.id, role: c.var.user!.role });

posts.get("/", async (c) => {
  const q = parseQuery(c, postListQuery);
  const res = await c.var.repos.posts.list({
    status: q.status,
    type: q.type,
    marketId: q.marketId,
    analystId: q.analystId,
    createdBy: q.mine === "1" ? c.var.user!.id : undefined,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
    q: q.q,
    limit: q.limit,
    offset: q.offset,
  });
  return c.json(res);
});

// ---- speed tools (static paths first, before /:id) ----
posts.post("/duplicate", requirePermission("post:create"), async (c) => {
  const input = await parseJson(c, duplicatePostsSchema);
  const res = await svc(c).duplicate(actor(c), input);
  for (const p of res.created) await audit(c, "post.create", "post", p.id, { via: "duplicate", fromDate: input.fromDate, toDate: input.toDate });
  return c.json(res);
});

posts.post("/template", requirePermission("post:create"), async (c) => {
  const input = await parseJson(c, templatePostsSchema);
  const res = await svc(c).template(actor(c), input);
  for (const p of res.created) await audit(c, "post.create", "post", p.id, { via: "template", date: input.date });
  return c.json(res);
});

posts.post("/bulk", requirePermission("post:create"), async (c) => {
  const { items } = await parseJson(c, bulkPostsSchema);
  const results = await svc(c).bulk(actor(c), items);
  for (const r of results) if (r.ok) await audit(c, "post.create", "post", r.post.id, { via: "bulk" });
  return c.json({ results });
});

// ---- single post ----
posts.get("/:id", async (c) => c.json(await svc(c).detail(c.req.param("id"))));

posts.get("/:id/revisions", async (c) => {
  const id = c.req.param("id");
  if (!(await c.var.repos.posts.findById(id))) throw notFound("Post not found");
  return c.json({ items: await c.var.repos.revisions.listByEntity("post", id) });
});

posts.post("/", requirePermission("post:create"), async (c) => {
  const input = await parseJson(c, createPostSchema);
  const row = await svc(c).create(actor(c), input);
  await audit(c, "post.create", "post", row.id, { type: row.type, marketId: row.marketId, postDate: row.postDate });
  return c.json(await svc(c).detail(row.id), 201);
});

posts.put("/:id", requirePermission("post:edit"), async (c) => {
  const id = c.req.param("id");
  const patch = await parseJson(c, updatePostSchema);
  const { before, after, revised } = await svc(c).update(actor(c), id, patch);
  const diff = changedFields(before as unknown as Record<string, unknown>, after.post as unknown as Record<string, unknown>);
  if (Object.keys(diff).length > 0) await audit(c, revised ? "post.edit_published" : "post.update", "post", id, diff);
  return c.json(after);
});

posts.post("/:id/publish", requirePermission("post:publish"), async (c) => {
  const id = c.req.param("id");
  const { before } = await svc(c).publish(actor(c), id);
  await audit(c, "post.publish", "post", id, { from: before.status, to: "published" });
  return c.json(await svc(c).detail(id));
});

posts.post("/:id/schedule", requirePermission("post:publish"), async (c) => {
  const id = c.req.param("id");
  const { publishAt } = await parseJson(c, scheduleSchema);
  const { before } = await svc(c).schedule(actor(c), id, publishAt);
  await audit(c, "post.schedule", "post", id, { from: before.status, publishAt });
  return c.json(await svc(c).detail(id));
});

posts.post("/:id/unschedule", requirePermission("post:publish"), async (c) => {
  const id = c.req.param("id");
  await svc(c).unschedule(actor(c), id);
  await audit(c, "post.unschedule", "post", id);
  return c.json(await svc(c).detail(id));
});

posts.delete("/:id", requirePermission("post:edit"), async (c) => {
  const id = c.req.param("id");
  const before = await svc(c).delete(actor(c), id);
  await audit(c, "post.delete", "post", id, { type: before.type, marketId: before.marketId, postDate: before.postDate, title: before.title });
  return c.json({ ok: true });
});

export default posts;
