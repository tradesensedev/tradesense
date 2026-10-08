import { Hono, type Context } from "hono";
import { publicFeedQuery, publicHeatmapQuery, publicMatrixQuery, publicTodayQuery } from "@shared/public";
import { bookmarkParams, publicEventsQuery } from "@shared/publicDetail";
import type { AppEnv } from "../env";
import { badRequest } from "../lib/errors";
import { parseQuery } from "../lib/validate";
import { requireAuth } from "../middleware";
import { EditHistoryService } from "../services/editHistory";
import { PublicDetailService } from "../services/publicDetail";
import { PublicService } from "../services/public";
import { ViewLogService } from "../services/viewLog";

// Public read API. No login needed; the session (if any) only decides what is unlocked.
// Locked items are returned as placeholders (content = null). Never add a field here without checking PublicService.
const pub = new Hono<AppEnv>();
const svc = (c: Context<AppEnv>) => new PublicService(c.var.repos);
const detail = (c: Context<AppEnv>) => new PublicDetailService(c.var.repos, c.env.IP_HASH_SALT);
const views = (c: Context<AppEnv>) => new ViewLogService(c.var.repos, c.env.IP_HASH_SALT);
const history = (c: Context<AppEnv>) => new EditHistoryService(c.var.repos);

pub.get("/meta", async (c) => c.json(await svc(c).meta(c.var.user)));

pub.get("/today", async (c) => c.json(await svc(c).today(c.var.user, parseQuery(c, publicTodayQuery).date)));

pub.get("/matrix", async (c) => {
  const q = parseQuery(c, publicMatrixQuery);
  return c.json(await svc(c).matrix(c.var.user, q.week, q.marketId));
});

pub.get("/heatmap", async (c) => {
  const q = parseQuery(c, publicHeatmapQuery);
  return c.json(await svc(c).heatmap(c.var.user, q.month, q.marketId));
});

pub.get("/feed", async (c) => c.json(await svc(c).feed(c.var.user, parseQuery(c, publicFeedQuery))));

// Detail pages: a locked item answers 200 with detail = null (the page shows the placeholder). Only OPEN views are logged.
// editHistory is empty while locked (it would reveal that, and when, the hidden text changed).
pub.get("/posts/:id", async (c) => {
  const id = c.req.param("id");
  const d = await detail(c).postDetail(c.var.user, id);
  if (d.detail) await views(c).record(c.var.user, c.var.ip, "post", id);
  return c.json({ ...d, editHistory: d.detail ? await history(c).forEntity("post", id) : [] });
});

pub.get("/notes/:id", async (c) => {
  const id = c.req.param("id");
  const d = await detail(c).noteDetail(c.var.user, id);
  if (d.detail) await views(c).record(c.var.user, c.var.ip, "note", id);
  return c.json({ ...d, editHistory: d.detail ? await history(c).forEntity("note", id) : [] });
});

// Bookmarks need a login (members and staff). The list itself is GET /feed?bookmarked=1.
pub.put("/bookmarks/:type/:id", requireAuth, async (c) => {
  const p = bookmarkParams.safeParse(c.req.param());
  if (!p.success) throw badRequest("Invalid bookmark");
  await detail(c).setBookmark(c.var.user!, p.data.type, p.data.id, true);
  return c.json({ bookmarked: true });
});

pub.delete("/bookmarks/:type/:id", requireAuth, async (c) => {
  const p = bookmarkParams.safeParse(c.req.param());
  if (!p.success) throw badRequest("Invalid bookmark");
  await detail(c).setBookmark(c.var.user!, p.data.type, p.data.id, false);
  return c.json({ bookmarked: false });
});

pub.get("/events", async (c) => c.json(await detail(c).events(parseQuery(c, publicEventsQuery))));

pub.get("/rules", async (c) => c.json(await detail(c).rules()));

export default pub;
