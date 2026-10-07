import { Hono, type Context } from "hono";
import { bulkSchema, columnsQuery, noteListQueryV2, postListQueryV2 } from "@shared/lists";
import { can, type Permission } from "@shared/permissions";
import { resultListQuery } from "@shared/results";
import type { AppEnv } from "../env";
import { audit } from "../lib/audit";
import { forbidden } from "../lib/errors";
import { parseJson, parseQuery } from "../lib/validate";
import { requirePermission } from "../middleware";
import { BulkService } from "../services/bulk";
import { ListService, type ExportResult } from "../services/lists";
import type { Actor } from "../services/posts";

// Admin lists: filters, sorting, bulk actions, CSV export. Mounted at /api/admin/lists.
const lists = new Hono<AppEnv>();
const svc = (c: Context<AppEnv>) => new ListService(c.var.repos);
const actor = (c: Context<AppEnv>): Actor => ({ id: c.var.user!.id, role: c.var.user!.role });

const exportQuery = {
  posts: postListQueryV2.merge(columnsQuery),
  notes: noteListQueryV2.merge(columnsQuery),
  results: resultListQuery.merge(columnsQuery),
};

async function sendCsv(c: Context<AppEnv>, kind: "posts" | "notes" | "results", res: ExportResult, filters: Record<string, string>) {
  await audit(c, "list.export", kind, null, { rows: res.count, truncated: res.truncated, filters });
  const day = new Date().toISOString().slice(0, 10);
  return new Response(res.csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tradesense-${kind}-${day}.csv"`,
      "Cache-Control": "no-store",
      "X-Export-Rows": String(res.count),
      "X-Export-Truncated": res.truncated ? "1" : "0",
    },
  });
}

// Bulk actions: the action decides which permission is needed. The service checks each item again.
function bulkPermission(kind: "post" | "note", action: string): Permission {
  const publish = action === "publish" || action === "unschedule";
  return kind === "post" ? (publish ? "post:publish" : "post:edit") : publish ? "note:publish" : "note:edit";
}

// ---------------- posts ----------------
lists.get("/posts", async (c) => c.json(await svc(c).posts(parseQuery(c, postListQueryV2), c.var.user!.id)));

lists.get("/posts/export.csv", requirePermission("list:export"), async (c) => {
  const q = parseQuery(c, exportQuery.posts);
  return sendCsv(c, "posts", await svc(c).exportPosts(q, c.var.user!.id, q.columns), c.req.query());
});

lists.post("/posts/bulk", async (c) => {
  const input = await parseJson(c, bulkSchema);
  if (!can(c.var.user!.role, bulkPermission("post", input.action))) throw forbidden();
  const { response, audits } = await new BulkService(c.var.repos).run(actor(c), "post", input);
  for (const a of audits) await audit(c, a.action, a.entity, a.entityId, a.diff);
  return c.json(response);
});

// ---------------- notes ----------------
lists.get("/notes", async (c) => c.json(await svc(c).notes(parseQuery(c, noteListQueryV2), c.var.user!.id)));

lists.get("/notes/export.csv", requirePermission("list:export"), async (c) => {
  const q = parseQuery(c, exportQuery.notes);
  return sendCsv(c, "notes", await svc(c).exportNotes(q, c.var.user!.id, q.columns), c.req.query());
});

lists.post("/notes/bulk", async (c) => {
  const input = await parseJson(c, bulkSchema);
  if (!can(c.var.user!.role, bulkPermission("note", input.action))) throw forbidden();
  const { response, audits } = await new BulkService(c.var.repos).run(actor(c), "note", input);
  for (const a of audits) await audit(c, a.action, a.entity, a.entityId, a.diff);
  return c.json(response);
});

// ---------------- results (immutable, so export only; the list itself is /api/admin/results) ----------------
lists.get("/results/export.csv", requirePermission("list:export"), async (c) => {
  const q = parseQuery(c, exportQuery.results);
  return sendCsv(c, "results", await svc(c).exportResults(q, q.columns), c.req.query());
});

export default lists;
