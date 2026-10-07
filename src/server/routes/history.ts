import { Hono, type Context } from "hono";
import { auditListQuery, mediaListQuery, revisionListQuery } from "@shared/admin";
import type { AppEnv } from "../env";
import { parseQuery } from "../lib/validate";
import { requirePermission } from "../middleware";
import { HistoryService } from "../services/history";

// Read-only screens. Mounted at /api/admin.
const history = new Hono<AppEnv>();
const svc = (c: Context<AppEnv>) => new HistoryService(c.var.repos);

// Audit log: admin only (audit:view). Revisions and media: editors and admins (post:publish).
history.get("/audit", requirePermission("audit:view"), async (c) => c.json(await svc(c).audit(parseQuery(c, auditListQuery))));

history.get("/revisions", requirePermission("post:publish"), async (c) =>
  c.json(await svc(c).revisions(parseQuery(c, revisionListQuery))),
);

history.get("/media", requirePermission("post:publish"), async (c) => c.json(await svc(c).media(parseQuery(c, mediaListQuery))));

export default history;
