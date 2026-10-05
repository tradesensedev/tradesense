import { Hono } from "hono";
import {
  createAnalystSchema,
  createMarketSchema,
  tagInputSchema,
  updateAnalystSchema,
  updateMarketSchema,
} from "@shared/schemas";
import type { LookupsResponse } from "@shared/types";
import type { AppEnv } from "../env";
import { audit } from "../lib/audit";
import { parseJson } from "../lib/validate";
import { requirePermission } from "../middleware";
import { CatalogService } from "../services/catalog";
import { SettingsService } from "../services/settings";

const catalog = new Hono<AppEnv>();
const svc = (c: { var: { repos: AppEnv["Variables"]["repos"] } }) => new CatalogService(c.var.repos);

// One call that bootstraps every admin form (dropdowns + defaults).
catalog.get("/lookups", async (c) => {
  const r = c.var.repos;
  const body: LookupsResponse = {
    markets: await r.markets.list(),
    analysts: await r.analysts.list(),
    tags: await r.tags.list(),
    settings: await new SettingsService(r).getAll(),
  };
  return c.json(body);
});

// ---- markets ----
catalog.get("/markets", async (c) => c.json({ items: await c.var.repos.markets.list() }));

catalog.post("/markets", requirePermission("market:manage"), async (c) => {
  const input = await parseJson(c, createMarketSchema);
  const row = await svc(c).createMarket(input);
  await audit(c, "market.create", "market", row.id, row);
  return c.json(row, 201);
});

catalog.put("/markets/:id", requirePermission("market:manage"), async (c) => {
  const patch = await parseJson(c, updateMarketSchema);
  const id = c.req.param("id");
  const { before, after } = await svc(c).updateMarket(id, patch);
  await audit(c, "market.update", "market", id, { before, after });
  return c.json(after);
});

// ---- analysts ----
catalog.get("/analysts", async (c) => c.json({ items: await c.var.repos.analysts.list() }));

catalog.post("/analysts", requirePermission("analyst:manage"), async (c) => {
  const input = await parseJson(c, createAnalystSchema);
  const row = await svc(c).createAnalyst(input);
  await audit(c, "analyst.create", "analyst", row.id, row);
  return c.json(row, 201);
});

catalog.put("/analysts/:id", requirePermission("analyst:manage"), async (c) => {
  const patch = await parseJson(c, updateAnalystSchema);
  const id = c.req.param("id");
  const { before, after } = await svc(c).updateAnalyst(id, patch);
  await audit(c, "analyst.update", "analyst", id, { before, after });
  return c.json(after);
});

// ---- tags ----
catalog.get("/tags", async (c) => c.json({ items: await c.var.repos.tags.list() }));

catalog.post("/tags", requirePermission("tag:manage"), async (c) => {
  const { name } = await parseJson(c, tagInputSchema);
  const row = await svc(c).createTag(name);
  await audit(c, "tag.create", "tag", row.id, row);
  return c.json(row, 201);
});

catalog.put("/tags/:id", requirePermission("tag:manage"), async (c) => {
  const { name } = await parseJson(c, tagInputSchema);
  const id = c.req.param("id");
  const { before, after } = await svc(c).renameTag(id, name);
  await audit(c, "tag.rename", "tag", id, { before, after });
  return c.json(after);
});

catalog.delete("/tags/:id", requirePermission("tag:manage"), async (c) => {
  const id = c.req.param("id");
  const before = await svc(c).deleteTag(id);
  await audit(c, "tag.delete", "tag", id, before);
  return c.json({ ok: true });
});

export default catalog;
