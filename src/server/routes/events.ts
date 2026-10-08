import { Hono, type Context } from "hono";
import { createEventSchema, eventListQuery, updateEventSchema } from "@shared/events";
import type { AppEnv } from "../env";
import { audit } from "../lib/audit";
import { parseJson, parseQuery } from "../lib/validate";
import { requirePermission } from "../middleware";
import { EventService } from "../services/events";
import type { Actor } from "../services/posts";

const events = new Hono<AppEnv>();
const svc = (c: Context<AppEnv>) => new EventService(c.var.repos);
const actor = (c: Context<AppEnv>): Actor => ({ id: c.var.user!.id, role: c.var.user!.role });

// Editors and admins (event:manage). The public calendar reads the same table through /api/public/events.
events.use("*", requirePermission("event:manage"));

events.get("/", async (c) => c.json(await svc(c).list(parseQuery(c, eventListQuery))));

events.post("/", async (c) => {
  const e = await svc(c).create(actor(c), await parseJson(c, createEventSchema));
  await audit(c, "event.create", "event", e.id, { title: e.title, startsAt: e.startsAt, impact: e.impact, currency: e.currency });
  return c.json(e, 201);
});

events.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const { before, after } = await svc(c).update(id, await parseJson(c, updateEventSchema));
  await audit(c, "event.update", "event", id, {
    title: [before.title, after.title],
    startsAt: [before.startsAt, after.startsAt],
    impact: [before.impact, after.impact],
    currency: [before.currency, after.currency],
    descriptionChanged: before.descriptionMd !== after.descriptionMd,
  });
  return c.json(after);
});

events.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const before = await svc(c).delete(id);
  await audit(c, "event.delete", "event", id, { title: before.title, startsAt: before.startsAt });
  return c.json({ ok: true });
});

export default events;
