import type { Role } from "@shared/constants";
import type { BatchResult, CreatePostInput, PostDetail, UpdatePostInput } from "@shared/content";
import { can } from "@shared/permissions";
import { AppError, badRequest, conflict, forbidden, notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { addDaysDate, addMinutesIso, nowIso, weekStartOf } from "../lib/time";
import { toAttachmentDto } from "../lib/dto";
import type { PostPatch, PostRow, Repositories } from "../repositories/types";
import { SettingsService } from "./settings";

export interface Actor {
  id: string;
  role: Role;
}

// Fields that can never change once a post is published (mirrors trigger trg_posts_lock_core, plus publishAt).
export const LOCKED_POST_FIELDS = ["type", "marketId", "postDate", "bias", "confidence", "validFrom", "validUntil", "publishAt"] as const;
// Text-level fields that may still be edited after publish. Every such edit is saved to post_revisions.
export const EDITABLE_AFTER_PUBLISH = [
  "title", "summary", "bodyMd", "keyDriversMd", "riskEventsMd", "invalidationMd", "sentiment", "access", "analystId",
] as const;

const TEXT_FIELDS = ["title", "summary", "bodyMd", "keyDriversMd", "riskEventsMd", "invalidationMd"] as const;
const PLACEHOLDER = "[TODO]";

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const lockedError = (fields: string[]) =>
  new AppError(409, "locked", `Locked after publish: ${fields.join(", ")} cannot be changed`, { fields });

export class PostService {
  constructor(private repos: Repositories) {}

  // ---------- reads ----------
  async detail(id: string): Promise<PostDetail> {
    const post = await this.repos.posts.findById(id);
    if (!post) throw notFound("Post not found");
    const [tagIds, attachments, revisionCount] = await Promise.all([
      this.repos.posts.getTagIds(id),
      this.repos.attachments.listByOwner("post", id),
      this.repos.revisions.countByEntity("post", id),
    ]);
    return { post, tagIds, attachments: attachments.map(toAttachmentDto), revisionCount };
  }

  // ---------- create ----------
  async create(actor: Actor, input: CreatePostInput): Promise<PostRow> {
    await this.assertRefs(input.marketId, input.analystId, input.tagIds, true);
    const weekStart = weekStartOf(input.postDate);
    const postDate = input.type === "weekly" ? weekStart : input.postDate; // weekly posts are dated by their Monday
    await this.assertFree(input.type, input.marketId, input.type === "daily" ? postDate : weekStart);

    const settings = await new SettingsService(this.repos).getAll();
    const defaults = this.defaultWindow(input.type, postDate, weekStart);
    const validFrom = input.validFrom === undefined ? defaults.validFrom : input.validFrom;
    const validUntil = input.validUntil === undefined ? defaults.validUntil : input.validUntil;
    this.assertWindow(validFrom, validUntil);

    const row = await this.repos.posts.create({
      id: newId(),
      type: input.type,
      marketId: input.marketId,
      postDate,
      weekStartDate: weekStart,
      bias: input.bias,
      confidence: input.confidence,
      sentiment: input.sentiment ?? null,
      title: input.title ?? "",
      summary: input.summary ?? "",
      bodyMd: input.bodyMd ?? "",
      keyDriversMd: input.keyDriversMd ?? "",
      riskEventsMd: input.riskEventsMd ?? "",
      invalidationMd: input.invalidationMd ?? "",
      access: input.access ?? (input.type === "daily" ? settings.default_access_daily : settings.default_access_weekly),
      status: "draft", // always starts as a draft
      publishAt: input.publishAt ?? null,
      validFrom,
      validUntil,
      analystId: input.analystId ?? null,
      createdBy: actor.id,
      publishedAt: null,
    });
    if (input.tagIds?.length) await this.repos.posts.setTags(row.id, input.tagIds);
    return row;
  }

  // ---------- update ----------
  async update(actor: Actor, id: string, patch: UpdatePostInput) {
    const before = await this.repos.posts.findById(id);
    if (!before) throw notFound("Post not found");
    this.assertCanEdit(actor, before);
    await this.assertRefs(patch.marketId, patch.analystId, patch.tagIds, false);

    const { tagIds, ...fields } = patch;
    const type = fields.type ?? before.type;
    const marketId = fields.marketId ?? before.marketId;
    const rawDate = fields.postDate ?? before.postDate;
    const weekStart = weekStartOf(rawDate);
    const postDate = type === "weekly" ? weekStart : rawDate;
    const normalized: Record<string, unknown> = { ...fields };
    if (fields.postDate !== undefined || fields.type !== undefined) normalized.postDate = postDate;
    const oldTags = await this.repos.posts.getTagIds(id);

    // ---- published: only text-level edits, each saved as a revision ----
    if (before.status === "published") {
      const lockedHit = LOCKED_POST_FIELDS.filter(
        (k) => k in normalized && normalized[k] !== undefined && !sameJson(normalized[k], before[k]),
      );
      if (lockedHit.length) throw lockedError(lockedHit);
      const changed: Record<string, unknown> = {};
      const oldVals: Record<string, unknown> = {};
      for (const k of EDITABLE_AFTER_PUBLISH) {
        if (normalized[k] === undefined || sameJson(normalized[k], before[k])) continue;
        changed[k] = normalized[k];
        oldVals[k] = before[k];
      }
      const tagsChanged = tagIds !== undefined && !sameJson([...tagIds].sort(), [...oldTags].sort());
      if (tagsChanged) {
        changed.tagIds = tagIds;
        oldVals.tagIds = oldTags;
      }
      if (Object.keys(changed).length === 0) return { before, after: await this.detail(id), revised: false };
      const { tagIds: _t, ...rowChanges } = changed;
      const after = await this.repos.posts.update(id, rowChanges as PostPatch, {
        entityType: "post",
        entityId: id,
        oldJson: JSON.stringify(oldVals),
        newJson: JSON.stringify(changed),
        editedBy: actor.id,
      });
      if (tagsChanged) await this.repos.posts.setTags(id, tagIds!);
      return { before, after: await this.detail(after.id), revised: true };
    }

    // ---- draft / scheduled: everything editable ----
    if (type !== before.type || marketId !== before.marketId || postDate !== before.postDate) {
      const key = type === "daily" ? postDate : weekStart;
      const clash = await this.repos.posts.findUnique(type, marketId, key);
      if (clash && clash.id !== id) throw conflict(`A ${type} post already exists for this market and date`);
    }
    const rowPatch: PostPatch = { ...(normalized as PostPatch), weekStartDate: weekStart };
    if (fields.type !== undefined || fields.postDate !== undefined) {
      // keep the default validity window in step when the date changes and the window was not edited explicitly
      const oldDefaults = this.defaultWindow(before.type, before.postDate, before.weekStartDate);
      const onDefault = before.validFrom === oldDefaults.validFrom && before.validUntil === oldDefaults.validUntil;
      if (onDefault && fields.validFrom === undefined && fields.validUntil === undefined) {
        const nd = this.defaultWindow(type, postDate, weekStart);
        rowPatch.validFrom = nd.validFrom;
        rowPatch.validUntil = nd.validUntil;
      }
    }
    this.assertWindow(rowPatch.validFrom === undefined ? before.validFrom : rowPatch.validFrom, rowPatch.validUntil === undefined ? before.validUntil : rowPatch.validUntil);
    const after = await this.repos.posts.update(id, rowPatch);
    if (tagIds !== undefined) await this.repos.posts.setTags(id, tagIds);
    return { before, after: await this.detail(after.id), revised: false };
  }

  // ---------- status changes ----------
  async publish(actor: Actor, id: string) {
    this.assertCanPublish(actor);
    const before = await this.mustFind(id);
    if (before.status === "published") throw conflict("Post is already published");
    this.assertComplete(before);
    const now = nowIso();
    const after = await this.repos.posts.update(id, { status: "published", publishedAt: now });
    return { before, after };
  }

  async schedule(actor: Actor, id: string, publishAt: string) {
    this.assertCanPublish(actor);
    const before = await this.mustFind(id);
    if (before.status === "published") throw conflict("Post is already published");
    if (publishAt < addMinutesIso(nowIso(), 1)) throw badRequest("Schedule time must be in the future");
    this.assertComplete(before);
    const after = await this.repos.posts.update(id, { status: "scheduled", publishAt });
    return { before, after };
  }

  async unschedule(actor: Actor, id: string) {
    this.assertCanPublish(actor);
    const before = await this.mustFind(id);
    if (before.status !== "scheduled") throw conflict("Post is not scheduled");
    const after = await this.repos.posts.update(id, { status: "draft", publishAt: null });
    return { before, after };
  }

  async delete(actor: Actor, id: string) {
    const before = await this.mustFind(id);
    this.assertCanEdit(actor, before);
    if (before.status === "published") throw new AppError(409, "locked", "Published posts cannot be deleted");
    const notes = await this.repos.notes.list({ linkedPostId: id, limit: 1, offset: 0 });
    if (notes.total > 0) throw conflict("Notes are linked to this post. Move or delete them first.");
    const files = await this.repos.attachments.listByOwner("post", id);
    if (files.length > 0) throw conflict("Remove the screenshots from this post before deleting it.");
    await this.repos.posts.setTags(id, []);
    await this.repos.posts.delete(id);
    return before;
  }

  // ---------- speed tools ----------
  // Copies posts from one day (or week) to another as drafts. Skips markets that already have one.
  async duplicate(actor: Actor, input: { type: "daily" | "weekly"; fromDate: string; toDate: string; marketIds?: string[] }): Promise<BatchResult> {
    const markets = await this.targetMarkets(input.marketIds);
    const result: BatchResult = { created: [], skipped: [] };
    const fromKey = input.type === "daily" ? input.fromDate : weekStartOf(input.fromDate);
    const toKey = input.type === "daily" ? input.toDate : weekStartOf(input.toDate);
    for (const m of markets) {
      const src = await this.repos.posts.findUnique(input.type, m.id, fromKey);
      if (!src) {
        if (input.marketIds) result.skipped.push({ marketId: m.id, reason: "No source post" });
        continue;
      }
      if (await this.repos.posts.findUnique(input.type, m.id, toKey)) {
        result.skipped.push({ marketId: m.id, reason: "Already exists" });
        continue;
      }
      const tagIds = await this.repos.posts.getTagIds(src.id);
      const created = await this.create(actor, {
        type: src.type,
        marketId: src.marketId,
        postDate: input.toDate,
        bias: src.bias,
        confidence: src.confidence,
        sentiment: src.sentiment,
        title: src.title,
        summary: src.summary,
        bodyMd: src.bodyMd,
        keyDriversMd: src.keyDriversMd,
        riskEventsMd: src.riskEventsMd,
        invalidationMd: src.invalidationMd,
        access: src.access,
        analystId: src.analystId,
        tagIds,
      });
      result.created.push(created);
    }
    return result;
  }

  // "Create full day template": one draft shell per selected market. Shells carry [TODO] markers so they cannot be published untouched.
  async template(actor: Actor, input: { type: "daily" | "weekly"; date: string; marketIds: string[] }): Promise<BatchResult> {
    const markets = await this.targetMarkets(input.marketIds);
    const result: BatchResult = { created: [], skipped: [] };
    const key = input.type === "daily" ? input.date : weekStartOf(input.date);
    for (const m of markets) {
      if (await this.repos.posts.findUnique(input.type, m.id, key)) {
        result.skipped.push({ marketId: m.id, reason: "Already exists" });
        continue;
      }
      const created = await this.create(actor, {
        type: input.type,
        marketId: m.id,
        postDate: input.date,
        bias: "neutral",
        confidence: "low",
        title: `${m.symbol} ${input.type} bias - ${key}`,
        bodyMd: `## Context\n${PLACEHOLDER}\n\n## Technical view\n${PLACEHOLDER}\n`,
        keyDriversMd: `- ${PLACEHOLDER}`,
        riskEventsMd: `- ${PLACEHOLDER}`,
        invalidationMd: `${PLACEHOLDER} (describe in words, no price levels)`,
      });
      result.created.push(created);
    }
    return result;
  }

  // Each item succeeds or fails on its own.
  async bulk(actor: Actor, items: CreatePostInput[]) {
    const out: ({ ok: true; post: PostRow } | { ok: false; index: number; error: { code: string; message: string } })[] = [];
    for (const [index, item] of items.entries()) {
      try {
        out.push({ ok: true, post: await this.create(actor, item) });
      } catch (e) {
        if (e instanceof AppError) out.push({ ok: false, index, error: { code: e.code, message: e.message } });
        else throw e;
      }
    }
    return out;
  }

  // ---------- rules ----------
  private async mustFind(id: string) {
    const p = await this.repos.posts.findById(id);
    if (!p) throw notFound("Post not found");
    return p;
  }

  // analyst = drafts only: own drafts, never published or scheduled posts.
  private assertCanEdit(actor: Actor, post: PostRow) {
    if (actor.role === "analyst" && (post.createdBy !== actor.id || post.status !== "draft")) {
      throw forbidden("Analysts can only edit their own drafts");
    }
  }

  private assertCanPublish(actor: Actor) {
    if (!can(actor.role, "post:publish")) throw forbidden("Your role cannot publish. Ask an editor.");
  }

  private assertComplete(p: PostRow) {
    const problems: string[] = [];
    if (!p.title.trim()) problems.push("Title is required");
    if (!p.bodyMd.trim() && !p.summary.trim()) problems.push("Add a summary or body text");
    for (const f of TEXT_FIELDS) if (p[f].includes(PLACEHOLDER)) problems.push(`${f} still contains ${PLACEHOLDER}`);
    if (!p.validFrom || !p.validUntil) problems.push("Validity window (valid from/until) is required");
    if (problems.length) throw badRequest("Post is not ready to publish", { problems });
  }

  private assertWindow(from: string | null, until: string | null) {
    if (from && until && until <= from) throw badRequest("valid_until must be after valid_from");
  }

  private defaultWindow(type: "daily" | "weekly", postDate: string, weekStart: string) {
    if (type === "daily") return { validFrom: `${postDate}T00:00:00.000Z`, validUntil: `${postDate}T23:59:59.000Z` };
    return { validFrom: `${weekStart}T00:00:00.000Z`, validUntil: `${addDaysDate(weekStart, 4)}T23:59:59.000Z` };
  }

  private async assertFree(type: "daily" | "weekly", marketId: string, key: string) {
    const clash = await this.repos.posts.findUnique(type, marketId, key);
    if (clash) throw new AppError(409, "conflict", `A ${type} post already exists for this market and date`, { existingId: clash.id });
  }

  private async assertRefs(marketId: string | undefined, analystId: string | null | undefined, tagIds: string[] | undefined, requireActiveMarket: boolean) {
    if (marketId) {
      const m = await this.repos.markets.findById(marketId);
      if (!m) throw badRequest("Unknown market");
      if (requireActiveMarket && !m.active) throw badRequest(`Market ${m.symbol} is inactive`);
    }
    if (analystId) {
      const a = await this.repos.analysts.findById(analystId);
      if (!a) throw badRequest("Unknown analyst");
    }
    if (tagIds?.length) {
      for (const t of new Set(tagIds)) if (!(await this.repos.tags.findById(t))) throw badRequest("Unknown tag");
    }
  }

  private async targetMarkets(ids?: string[]) {
    const active = await this.repos.markets.list({ activeOnly: true });
    if (!ids) return active;
    const set = new Set(ids);
    const picked = active.filter((m) => set.has(m.id));
    if (picked.length !== set.size) throw badRequest("One or more markets are unknown or inactive");
    return picked;
  }
}
