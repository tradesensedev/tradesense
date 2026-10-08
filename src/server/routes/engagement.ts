import { Hono, type Context } from "hono";
import { engagementQuery, viewersQuery } from "@shared/engagement";
import type { AppEnv } from "../env";
import { audit } from "../lib/audit";
import { parseQuery } from "../lib/validate";
import { requirePermission } from "../middleware";
import { EngagementService } from "../services/engagement";

const engagement = new Hono<AppEnv>();
const svc = (c: Context<AppEnv>) => new EngagementService(c.var.repos);

// Counts: editors and admins (the people who publish). Names and emails of viewers: admins only (user:manage).
engagement.get("/", requirePermission("post:publish"), async (c) => {
  const q = parseQuery(c, engagementQuery);
  return c.json(await svc(c).counts(q.type, q.ids));
});

engagement.get("/viewers", requirePermission("user:manage"), async (c) => {
  const q = parseQuery(c, viewersQuery);
  const items = await svc(c).viewers(q.type, q.id, q.limit);
  await audit(c, "engagement.viewers", q.type, q.id, { shown: items.length });
  return c.json({ items });
});

export default engagement;
