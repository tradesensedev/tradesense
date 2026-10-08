import type { PublicEntityType } from "@shared/constants";
import type { PublicEventDto, PublicEventsQuery } from "@shared/publicDetail";
import {
  type PublicAttachmentItem,
  type PublicLinkedPost,
  type PublicNoteDetail,
  type PublicPostDetail,
  type PublicResultDetail,
  type PublicRulesDto,
  type WatermarkDto,
} from "@shared/publicDetail";
import { OPEN_ACCESS } from "@shared/public";
import { notFound } from "../lib/errors";
import { addDaysDate, nowIso, todayDate } from "../lib/time";
import { footerToken, injectWatermark, watermarkCode } from "../lib/watermark";
import type { Repositories, UserRow } from "../repositories/types";
import { AccessService, contentEndDate, evaluateAccess, visibilityFor, type AccessItem } from "./access";
import { EvaluationService } from "./evaluation";
import { EventService } from "./events";
import { PublicService } from "./public";
import { ResultService } from "./results";

type Ctx = Parameters<PublicService["postItem"]>[1];

// Detail pages and the small public endpoints. Same rule as PublicService: nothing but metadata leaves for a locked item.
export class PublicDetailService {
  private access: AccessService;
  private pub: PublicService;
  constructor(
    private repos: Repositories,
    private salt: string,
  ) {
    this.access = new AccessService(repos);
    this.pub = new PublicService(repos);
  }

  private async ctx(user: UserRow | null): Promise<Ctx> {
    const now = nowIso();
    const viewer = await this.access.viewerFor(user, now);
    const policy = await this.access.policy();
    return { viewer, policy, vis: visibilityFor(viewer, policy, now), now };
  }

  // Same rule as AttachmentService.canView (which guards /files/:id): public = always, inherit = the item's access,
  // free/paid = AccessService. The url is only handed out when the file would actually open.
  private attachmentItem(a: { id: string; kind: PublicAttachmentItem["kind"]; caption: string; mime: string; access: string }, owner: AccessItem, c: Ctx): PublicAttachmentItem {
    const eff = a.access === "inherit" ? owner.access : a.access;
    const lock = eff === "public" ? OPEN_ACCESS : evaluateAccess(c.viewer, c.policy, { ...owner, access: eff === "paid" ? "paid" : "free" }, c.now);
    return { id: a.id, kind: a.kind, caption: a.caption, mime: a.mime, lock, url: lock.state === "open" ? `/files/${a.id}` : null };
  }

  private async watermark(user: UserRow | null, entityId: string): Promise<{ code: string; dto: WatermarkDto } | null> {
    if (!user) return null;
    return { code: watermarkCode(user.id), dto: { footer: await footerToken(user.id, entityId, this.salt) } };
  }

  // ---------- post detail ----------
  async postDetail(user: UserRow | null, id: string): Promise<PublicPostDetail> {
    const post = await this.repos.posts.findById(id);
    if (!post || post.status !== "published") throw notFound("Post not found");
    const c = await this.ctx(user);
    const key = post.type === "daily" ? post.postDate : post.weekStartDate;
    const rows = await this.repos.publicLists.posts({
      visibility: c.vis,
      bookmarkedBy: c.viewer.userId ?? undefined,
      type: post.type,
      marketIds: [post.marketId],
      dateFrom: key,
      dateTo: key,
      sort: "date",
      dir: "asc",
      limit: 5,
      offset: 0,
    });
    const row = rows.items.find((r) => r.id === id);
    if (!row) throw notFound("Post not found");
    const item = this.pub.postItem(row, c);
    if (item.lock.state !== "open" || !item.content) return { item, detail: null };

    const wm = await this.watermark(user, id);
    const mark = (s: string, max: number) => (wm ? injectWatermark(s, wm.code, max) : s);
    const owner: AccessItem = { access: row.access, publishedAt: row.publishedAt, contentDate: row.contentDate };
    const [atts, resultDetail, notes] = await Promise.all([
      this.repos.attachments.listByOwner("post", id),
      new ResultService(this.repos).detailByPost(id),
      this.repos.publicLists.notes({ visibility: c.vis, bookmarkedBy: c.viewer.userId ?? undefined, linkedPostId: id, sort: "killzone", dir: "asc", limit: 50, offset: 0 }),
    ]);
    const result: PublicResultDetail | null = resultDetail
      ? {
          outcome: resultDetail.result.outcome,
          noteMd: mark(resultDetail.result.noteMd, 2),
          evaluatedAt: resultDetail.result.evaluatedAt,
          ruleVersion: resultDetail.result.evaluationRuleVersion,
          corrections: resultDetail.corrections.map((x) => ({ newOutcome: x.newOutcome, reasonMd: x.reasonMd, createdAt: x.createdAt })),
          effectiveOutcome: resultDetail.effectiveOutcome,
          attachments: resultDetail.attachments.map((a) => this.attachmentItem(a, owner, c)),
        }
      : null;
    return {
      item: { ...item, content: { ...item.content, summary: mark(item.content.summary, 1) } },
      detail: {
        bodyMd: mark(post.bodyMd, 12),
        keyDriversMd: mark(post.keyDriversMd, 2),
        riskEventsMd: mark(post.riskEventsMd, 2),
        invalidationMd: mark(post.invalidationMd, 2),
        validFrom: post.validFrom,
        attachments: atts.map((a) => this.attachmentItem(a, owner, c)),
        result,
        notes: notes.items.map((r) => this.pub.noteItem(r, c)),
        watermark: wm?.dto ?? null,
      },
    };
  }

  // ---------- note detail ----------
  async noteDetail(user: UserRow | null, id: string): Promise<PublicNoteDetail> {
    const note = await this.repos.notes.findById(id);
    if (!note || note.publishStatus !== "published") throw notFound("Note not found");
    const c = await this.ctx(user);
    const rows = await this.repos.publicLists.notes({
      visibility: c.vis,
      bookmarkedBy: c.viewer.userId ?? undefined,
      marketIds: [note.marketId],
      killzones: [note.killzone],
      dateFrom: note.noteDate,
      dateTo: note.noteDate,
      sort: "killzone",
      dir: "asc",
      limit: 20,
      offset: 0,
    });
    const row = rows.items.find((r) => r.id === id);
    if (!row) throw notFound("Note not found");
    const item = this.pub.noteItem(row, c);
    if (item.lock.state !== "open" || !item.content) return { item, detail: null };

    const wm = await this.watermark(user, id);
    const owner: AccessItem = { access: row.access, publishedAt: row.publishedAt, contentDate: row.contentDate };
    const [atts, post] = await Promise.all([this.repos.attachments.listByOwner("note", id), this.repos.posts.findById(note.linkedPostId)]);
    let linkedPost: PublicLinkedPost | null = null;
    if (post && post.status === "published") {
      const lock = evaluateAccess(c.viewer, c.policy, { access: post.access, publishedAt: post.publishedAt ?? post.updatedAt, contentDate: contentEndDate(post.type, post.postDate, post.weekStartDate) }, c.now);
      linkedPost = {
        id: post.id,
        type: post.type,
        marketId: post.marketId,
        postDate: post.postDate,
        weekStartDate: post.weekStartDate,
        access: post.access,
        lock,
        title: lock.state === "open" ? post.title : null,
      };
    }
    return {
      item,
      detail: {
        noteMd: wm ? injectWatermark(note.noteMd, wm.code, 12) : note.noteMd,
        attachments: atts.map((a) => this.attachmentItem(a, owner, c)),
        linkedPost,
        watermark: wm?.dto ?? null,
      },
    };
  }

  // ---------- bookmarks (own list = GET /feed?bookmarked=1) ----------
  async setBookmark(user: UserRow, type: Extract<PublicEntityType, "post" | "note">, id: string, on: boolean): Promise<void> {
    if (!on) return this.repos.bookmarks.remove(user.id, type, id);
    const published = type === "post" ? (await this.repos.posts.findById(id))?.status === "published" : (await this.repos.notes.findById(id))?.publishStatus === "published";
    if (!published) throw notFound(type === "post" ? "Post not found" : "Note not found");
    await this.repos.bookmarks.add(user.id, type, id);
  }

  // ---------- events + rules (open to everyone) ----------
  async events(q: PublicEventsQuery): Promise<{ items: PublicEventDto[]; total: number }> {
    const today = todayDate();
    const from = q.from ?? (q.to ? undefined : today);
    const to = q.to ?? (q.from ? undefined : addDaysDate(today, 30));
    const r = await new EventService(this.repos).list({ from, to, impact: q.impact, currency: q.currency, order: "asc", limit: q.limit, offset: q.offset });
    return {
      items: r.items.map((e) => ({ id: e.id, title: e.title, startsAt: e.startsAt, impact: e.impact, currency: e.currency, descriptionMd: e.descriptionMd })),
      total: r.total,
    };
  }

  async rules(): Promise<PublicRulesDto> {
    const items = (await new EvaluationService(this.repos).list()).map((r) => ({ version: r.version, textMd: r.textMd, activeFrom: r.activeFrom, active: r.active }));
    return { activeVersion: items.find((r) => r.active)?.version ?? 0, items };
  }
}
