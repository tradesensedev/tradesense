import { Hono, type Context } from "hono";
import { createPlanSchema, regionPricesSchema, updatePlanSchema } from "@shared/admin";
import type { AppEnv } from "../env";
import { audit } from "../lib/audit";
import { parseJson } from "../lib/validate";
import { requirePermission } from "../middleware";
import { PlanService } from "../services/plans";

const plans = new Hono<AppEnv>();
const svc = (c: Context<AppEnv>) => new PlanService(c.var.repos);

// Admin only. Plans are never deleted; set active = false instead.
plans.use("*", requirePermission("plan:manage"));

plans.get("/", async (c) => c.json({ items: await svc(c).list() }));

plans.get("/:id", async (c) => c.json(await svc(c).get(c.req.param("id"))));

plans.post("/", async (c) => {
  const plan = await svc(c).create(await parseJson(c, createPlanSchema));
  await audit(c, "plan.create", "plan", plan.id, { code: plan.code, priceUsd: plan.priceUsd, durationDays: plan.durationDays });
  return c.json(plan, 201);
});

plans.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const { before, after } = await svc(c).update(id, await parseJson(c, updatePlanSchema));
  await audit(c, "plan.update", "plan", id, {
    name: [before.name, after.name],
    priceUsd: [before.priceUsd, after.priceUsd],
    durationDays: [before.durationDays, after.durationDays],
    active: [before.active, after.active],
    sortOrder: [before.sortOrder, after.sortOrder],
  });
  return c.json(after);
});

// Replaces the whole list. Used only while settings.regional_pricing_enabled is on.
plans.put("/:id/region-prices", async (c) => {
  const id = c.req.param("id");
  const { before, after } = await svc(c).setRegionPrices(id, await parseJson(c, regionPricesSchema));
  await audit(c, "plan.region_prices", "plan", id, { before, after });
  return c.json(await svc(c).get(id));
});

export default plans;
