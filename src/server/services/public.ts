import type { Role } from "@shared/constants";
import { isStaff } from "@shared/permissions";
import {
  type PublicFeedDto,
  type PublicFeedItem,
  type PublicFeedQuery,
  type PublicHeatmapDto,
  type PublicMatrixDto,
  type PublicMetaDto,
  type PublicNoteItem,
  type PublicPostItem,
  type PublicTodayDto,
  type ViewerState,
} from "@shared/public";
import { addDaysDate, nowIso, todayDate, weekStartOf } from "../lib/time";
import type { PublicNoteRow, PublicPostRow, PublicVisibility } from "../repositories/publicListTypes";
import type { Repositories, UserRow } from "../repositories/types";
import { AccessService, evaluateAccess, visibilityFor, type AccessPolicy, type Viewer } from "./access";
import { SettingsService } from "./settings";

interface Ctx {
  viewer: Viewer;
  policy: AccessPolicy;
  vis: PublicVisibility;
  now: string;
}

const flag = (v: "1" | "0" | undefined): boolean | undefined => (v === undefined ? undefined : v === "1");

export function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate(); // day 0 of next month = last day of this one
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, "0")}` };
}

// period / date / month / range -> dateFrom + dateTo. Weekly posts are dated by their Monday, so
// "today" shows daily posts and notes of today; "week" also shows the weekly post.
export function resolvePeriod(q: PublicFeedQuery, today: string): { dateFrom?: string; dateTo?: string } {
  switch (q.period) {
    case "today":
      return { dateFrom: today, dateTo: today };
    case "week": {
      const ws = weekStartOf(q.date ?? today);
      return { dateFrom: ws, dateTo: addDaysDate(ws, 6) };
    }
    case "month": {
      const r = monthRange(q.month ?? today.slice(0, 7));
      return { dateFrom: r.from, dateTo: r.to };
    }
    case "date":
      return q.date ? { dateFrom: q.date, dateTo: q.date } : {};
    case "range":
    default:
      return { dateFrom: q.dateFrom, dateTo: q.dateTo };
  }
}

// Turns repository rows into what the browser may see. THE rule: `content` is null unless the item is open for this viewer.
export class PublicService {
  private access: AccessService;
  constructor(private repos: Repositories) {
    this.access = new AccessService(repos);
  }

  private async ctx(user: UserRow | null): Promise<Ctx> {
    const now = nowIso();
    const viewer = await this.access.viewerFor(user, now);
    const policy = await this.access.policy();
    return { viewer, policy, vis: visibilityFor(viewer, policy, now), now };
  }

  postItem(r: PublicPostRow, c: Ctx): PublicPostItem {
    const lock = evaluateAccess(c.viewer, c.policy, { access: r.access, publishedAt: r.publishedAt, contentDate: r.contentDate }, c.now);
    return {
      id: r.id,
      type: r.type,
      marketId: r.marketId,
      marketSymbol: r.marketSymbol,
      postDate: r.postDate,
      weekStartDate: r.weekStartDate,
      access: r.access,
      publishedAt: r.publishedAt,
      lock,
      bookmarked: r.bookmarked,
      content:
        lock.state === "open"
          ? {
              bias: r.bias,
              confidence: r.confidence,
              sentiment: r.sentiment,
              title: r.title,
              summary: r.summary,
              validUntil: r.validUntil,
              analystName: r.analystName,
              tagNames: r.tagNames,
              screenshotCount: r.screenshotCount,
              result: r.resultOutcome ? { outcome: r.resultOutcome, corrected: r.correctionCount > 0 } : null,
            }
          : null,
    };
  }

  noteItem(r: PublicNoteRow, c: Ctx): PublicNoteItem {
    const lock = evaluateAccess(c.viewer, c.policy, { access: r.access, publishedAt: r.publishedAt, contentDate: r.contentDate }, c.now);
    return {
      id: r.id,
      marketId: r.marketId,
      marketSymbol: r.marketSymbol,
      killzone: r.killzone,
      noteDate: r.noteDate,
      linkedPostId: r.linkedPostId,
      access: r.access,
      publishedAt: r.publishedAt,
      lock,
      bookmarked: r.bookmarked,
      content:
        lock.state === "open"
          ? { status: r.status, confidence: r.confidence, title: r.title, analystName: r.analystName, tagNames: r.tagNames, screenshotCount: r.screenshotCount }
          : null,
    };
  }

  // ---------- meta (markets, tags, banner, viewer state) ----------
  async meta(user: UserRow | null): Promise<PublicMetaDto> {
    const c = await this.ctx(user);
    const s = await new SettingsService(this.repos).getAll();
    const state: ViewerState = !user ? "visitor" : isStaff(user.role as Role) ? "staff" : c.viewer.entitled ? "subscriber" : "member";
    return {
      today: todayDate(),
      viewer: { state, entitled: c.viewer.entitled },
      markets: (await this.repos.markets.list({ activeOnly: true })).map((m) => ({ id: m.id, symbol: m.symbol, name: m.name, category: m.category })),
      tags: (await this.repos.tags.list()).map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
      analysts: (await this.repos.analysts.list({ activeOnly: true })).map((a) => ({ id: a.id, name: a.name })),
      settings: {
        announcementBanner: s.announcement_banner,
        disclaimerText: s.disclaimer_text,
        freeDelayHours: s.free_delay_hours,
        openArchiveDays: s.open_archive_days,
        activeRuleVersion: s.active_evaluation_rule_version,
      },
    };
  }

  // ---------- today ----------
  async today(user: UserRow | null, date?: string): Promise<PublicTodayDto> {
    const c = await this.ctx(user);
    const day = date ?? todayDate();
    const weekStartDate = weekStartOf(day);
    const base = { visibility: c.vis, bookmarkedBy: c.viewer.userId ?? undefined, dir: "asc" as const, offset: 0, limit: 200 };
    const daily = await this.repos.publicLists.posts({ ...base, type: "daily", dateFrom: day, dateTo: day, sort: "market" });
    const weekly = await this.repos.publicLists.posts({ ...base, type: "weekly", dateFrom: weekStartDate, dateTo: weekStartDate, sort: "market" });
    const notes = await this.repos.publicLists.notes({ ...base, dateFrom: day, dateTo: day, sort: "killzone" });
    return {
      date: day,
      weekStartDate,
      posts: [...daily.items, ...weekly.items].map((r) => this.postItem(r, c)),
      notes: notes.items.map((r) => this.noteItem(r, c)),
    };
  }

  private async pickMarket(marketId?: string): Promise<string | null> {
    const markets = await this.repos.markets.list({ activeOnly: true });
    if (marketId && markets.some((m) => m.id === marketId)) return marketId;
    return markets[0]?.id ?? null;
  }

  // ---------- matrix: one market, one week (Mon-Fri + weekly) ----------
  async matrix(user: UserRow | null, week?: string, marketId?: string): Promise<PublicMatrixDto> {
    const c = await this.ctx(user);
    const weekStartDate = weekStartOf(week ?? todayDate());
    const market = await this.pickMarket(marketId);
    if (!market) return { weekStartDate, marketId: null, posts: [], notes: [] };
    const base = { visibility: c.vis, bookmarkedBy: c.viewer.userId ?? undefined, marketIds: [market], dir: "asc" as const, offset: 0, limit: 100, sort: "date" as const };
    const posts = await this.repos.publicLists.posts({ ...base, dateFrom: weekStartDate, dateTo: addDaysDate(weekStartDate, 6) });
    const notes = await this.repos.publicLists.notes({ ...base, dateFrom: weekStartDate, dateTo: addDaysDate(weekStartDate, 4) });
    return {
      weekStartDate,
      marketId: market,
      posts: posts.items.map((r) => this.postItem(r, c)),
      notes: notes.items.map((r) => this.noteItem(r, c)),
    };
  }

  // ---------- month heatmap: daily posts of one market ----------
  async heatmap(user: UserRow | null, month?: string, marketId?: string): Promise<PublicHeatmapDto> {
    const c = await this.ctx(user);
    const m = month ?? todayDate().slice(0, 7);
    const { from, to } = monthRange(m);
    const market = await this.pickMarket(marketId);
    if (!market) return { month: m, from, to, marketId: null, posts: [] };
    const posts = await this.repos.publicLists.posts({
      visibility: c.vis,
      bookmarkedBy: c.viewer.userId ?? undefined,
      type: "daily",
      marketIds: [market],
      dateFrom: from,
      dateTo: to,
      sort: "date",
      dir: "asc",
      offset: 0,
      limit: 62,
    });
    return { month: m, from, to, marketId: market, posts: posts.items.map((r) => this.postItem(r, c)) };
  }

  // ---------- feed: posts and notes through one filter language ----------
  // Without a type both kinds are merged: each list is fetched up to offset+limit rows, merged by the chosen sort, then sliced.
  // Post-only filters (bias, sentiment, result) hide notes; note-only filters (killzone, noteStatus) hide posts.
  async feed(user: UserRow | null, q: PublicFeedQuery): Promise<PublicFeedDto> {
    const c = await this.ctx(user);
    const userId = c.viewer.userId ?? undefined;
    if (q.bookmarked === "1" && !userId) return { items: [], total: 0 };

    const { dateFrom, dateTo } = resolvePeriod(q, todayDate());
    const postOnly = !!(q.bias?.length || q.sentiment?.length || q.result?.length);
    const noteOnly = !!(q.killzone?.length || q.noteStatus?.length);
    const wantPosts = q.type !== "note" && !noteOnly;
    const wantNotes = (q.type === undefined || q.type === "note") && !postOnly;

    const fetchLimit = Math.min(q.offset + q.limit, 500);
    const common = {
      visibility: c.vis,
      marketIds: q.marketId,
      confidences: q.confidence,
      accesses: q.access,
      tagId: q.tagId,
      analystId: q.analystId,
      hasScreenshot: flag(q.hasScreenshot),
      q: q.q,
      dateFrom,
      dateTo,
      bookmarkedBy: userId,
      bookmarkedOnly: q.bookmarked === "1",
      sort: q.sort,
      dir: q.dir,
      limit: fetchLimit,
      offset: 0,
    };

    const posts = wantPosts
      ? await this.repos.publicLists.posts({ ...common, type: q.type === "daily" || q.type === "weekly" ? q.type : undefined, biases: q.bias, sentiments: q.sentiment, results: q.result })
      : { items: [] as PublicPostRow[], total: 0 };
    const notes = wantNotes
      ? await this.repos.publicLists.notes({ ...common, killzones: q.killzone, statuses: q.noteStatus })
      : { items: [] as PublicNoteRow[], total: 0 };

    type Row = { kind: "post"; r: PublicPostRow } | { kind: "note"; r: PublicNoteRow };
    const rows: Row[] = [...posts.items.map((r): Row => ({ kind: "post", r })), ...notes.items.map((r): Row => ({ kind: "note", r }))];
    const key = (x: Row): string =>
      q.sort === "market" ? x.r.marketSymbol.toLowerCase() : q.sort === "published" ? x.r.publishedAt : x.kind === "post" ? x.r.contentDate : x.r.noteDate;
    const sign = q.dir === "asc" ? 1 : -1;
    rows.sort((a, b) => sign * (key(a).localeCompare(key(b)) || a.r.publishedAt.localeCompare(b.r.publishedAt) || a.r.id.localeCompare(b.r.id)));

    const items: PublicFeedItem[] = rows.slice(q.offset, q.offset + q.limit).map((x) =>
      x.kind === "post" ? { kind: "post", post: this.postItem(x.r, c) } : { kind: "note", note: this.noteItem(x.r, c) },
    );
    return { items, total: posts.total + notes.total };
  }
}
