import { Hono, type Context } from "hono";
import { savedViewInputSchema, savedViewListQuery, savedViewUpdateSchema } from "@shared/admin";
import type { AppEnv } from "../env";
import { parseJson, parseQuery } from "../lib/validate";
import { SavedViewService } from "../services/savedViews";
import type { Actor } from "../services/posts";

// Saved list views. Personal preferences, so they are not audited. The service checks who may use each list.
const views = new Hono<AppEnv>();
const svc = (c: Context<AppEnv>) => new SavedViewService(c.var.repos);
const actor = (c: Context<AppEnv>): Actor => ({ id: c.var.user!.id, role: c.var.user!.role });

views.get("/", async (c) => c.json({ items: await svc(c).list(actor(c), parseQuery(c, savedViewListQuery).scope) }));

views.post("/", async (c) => c.json(await svc(c).create(actor(c), await parseJson(c, savedViewInputSchema)), 201));

views.patch("/:id", async (c) =>
  c.json(await svc(c).update(actor(c), c.req.param("id"), await parseJson(c, savedViewUpdateSchema))),
);

views.delete("/:id", async (c) => {
  await svc(c).delete(actor(c), c.req.param("id"));
  return c.json({ ok: true });
});

export default views;
