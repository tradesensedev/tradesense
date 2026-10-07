import { Hono, type Context } from "hono";
import { createCorrectionSchema, createResultSchema, queueQuery, resultListQuery } from "@shared/results";
import type { AppEnv } from "../env";
import { audit } from "../lib/audit";
import { parseJson, parseQuery } from "../lib/validate";
import { requirePermission } from "../middleware";
import type { Actor } from "../services/posts";
import { ResultService } from "../services/results";

const results = new Hono<AppEnv>();
const svc = (c: Context<AppEnv>) => new ResultService(c.var.repos);
const actor = (c: Context<AppEnv>): Actor => ({ id: c.var.user!.id, role: c.var.user!.role });

// Reads: any staff (the /api/admin guard). Writes: result:create (editor, admin).
// Static paths come before /:id.
results.get("/queue", async (c) => c.json(await svc(c).queue(parseQuery(c, queueQuery))));

results.get("/", async (c) => c.json(await svc(c).list(parseQuery(c, resultListQuery))));

// The post editor uses this to show "evaluate" or the existing result. null = no result yet.
results.get("/by-post/:postId", async (c) => c.json({ detail: await svc(c).detailByPost(c.req.param("postId")) }));

results.get("/:id", async (c) => c.json(await svc(c).detail(c.req.param("id"))));

results.post("/", requirePermission("result:create"), async (c) => {
  const input = await parseJson(c, createResultSchema);
  const detail = await svc(c).create(actor(c), input);
  await audit(c, "result.create", "result", detail.result.id, {
    postId: input.postId,
    outcome: input.outcome,
    ruleVersion: detail.result.evaluationRuleVersion,
  });
  return c.json(detail, 201);
});

results.post("/:id/corrections", requirePermission("result:create"), async (c) => {
  const id = c.req.param("id");
  const input = await parseJson(c, createCorrectionSchema);
  const { before, detail } = await svc(c).addCorrection(actor(c), id, input);
  await audit(c, "result.correct", "result", id, { from: before, to: input.newOutcome, reasonMd: input.reasonMd });
  return c.json(detail, 201);
});

export default results;
