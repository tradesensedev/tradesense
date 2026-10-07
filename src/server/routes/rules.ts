import { Hono, type Context } from "hono";
import { createRuleSchema } from "@shared/results";
import type { AppEnv } from "../env";
import { audit } from "../lib/audit";
import { badRequest } from "../lib/errors";
import { parseJson } from "../lib/validate";
import { requirePermission } from "../middleware";
import { EvaluationService } from "../services/evaluation";
import type { Actor } from "../services/posts";

const rules = new Hono<AppEnv>();
const svc = (c: Context<AppEnv>) => new EvaluationService(c.var.repos);
const actor = (c: Context<AppEnv>): Actor => ({ id: c.var.user!.id, role: c.var.user!.role });

// Any staff can read the rules (the results screen shows the active one). Only admins change them.
rules.get("/", async (c) => c.json({ items: await svc(c).list() }));

rules.post("/", requirePermission("rules:manage"), async (c) => {
  const input = await parseJson(c, createRuleSchema);
  const { rule, previousVersion, activated } = await svc(c).create(actor(c), input);
  await audit(c, "rules.create", "evaluation_rule", rule.id, { version: rule.version, activated, previousActive: previousVersion });
  return c.json(rule, 201);
});

rules.post("/:version/activate", requirePermission("rules:manage"), async (c) => {
  const version = Number(c.req.param("version"));
  if (!Number.isInteger(version) || version < 1) throw badRequest("Invalid version");
  const { rule, previousVersion, changed } = await svc(c).activate(actor(c), version);
  if (changed) await audit(c, "rules.activate", "evaluation_rule", rule.id, { from: previousVersion, to: version });
  return c.json({ items: await svc(c).list() });
});

export default rules;
