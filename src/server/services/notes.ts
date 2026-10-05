import type { CreateNoteInput, NoteDetail, QuickNoteInput, SuggestLinksResponse, UpdateNoteInput } from "@shared/content";
import { can } from "@shared/permissions";
import { AppError, badRequest, conflict, forbidden, notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { toAttachmentDto } from "../lib/dto";
import { addMinutesIso, nowIso, todayDate, weekStartOf } from "../lib/time";
import type { NotePatch, NoteRow, PostRow, Repositories } from "../repositories/types";
import { SettingsService } from "./settings";
import type { Actor } from "./posts";

// Locked once published (mirrors trigger trg_notes_lock_core). noteDate and publishAt are locked by the service as well.
export const LOCKED_NOTE_FIELDS = ["marketId", "killzone", "status", "linkedPostId", "noteDate", "publishAt"] as const;
export const NOTE_EDITABLE_AFTER_PUBLISH = ["title", "noteMd", "confidence", "access", "analystId"] as const;
const PLACEHOLDER = "[TODO]";

const sameJson = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export class NoteService {
  constructor(private repos: Repositories) {}

  async detail(id: string): Promise<NoteDetail> {
    const note = await this.repos.notes.findById(id);
    if (!note) throw notFound("Note not found");
    const [tagIds, attachments, revisionCount] = await Promise.all([
      this.repos.notes.getTagIds(id),
      this.repos.attachments.listByOwner("note", id),
      this.repos.revisions.countByEntity("note", id),
    ]);
    return { note, tagIds, attachments: attachments.map(toAttachmentDto), revisionCount };
  }

  // Daily post of that day + weekly post of that week come first, then the market's latest posts.
  async suggestLinks(marketId: string, date: string): Promise<SuggestLinksResponse> {
    const suggested = await this.repos.posts.suggestForNote(marketId, date, weekStartOf(date));
    const recent = (await this.repos.posts.list({ marketId, limit: 6, offset: 0 })).items.filter(
      (p) => !suggested.some((s) => s.id === p.id),
    );
    return { suggested, recent };
  }

  async create(actor: Actor, input: CreateNoteInput): Promise<NoteRow> {
    await this.assertRefs(input.marketId, input.linkedPostId, input.analystId, input.tagIds, true);
    return this.insert(actor, input, false);
  }

  private async insert(actor: Actor, input: CreateNoteInput, publishNow: boolean): Promise<NoteRow> {
    const settings = await new SettingsService(this.repos).getAll();
    const row = await this.repos.notes.create({
      id: newId(),
      marketId: input.marketId,
      killzone: input.killzone,
      noteDate: input.noteDate,
      linkedPostId: input.linkedPostId,
      status: input.status,
      confidence: input.confidence ?? null,
      title: input.title ?? "",
      noteMd: input.noteMd ?? "",
      access: input.access ?? settings.default_access_killzone_note,
      publishStatus: publishNow ? "published" : "draft",
      publishAt: input.publishAt ?? null,
      analystId: input.analystId ?? null,
      createdBy: actor.id,
      publishedAt: publishNow ? nowIso() : null,
    });
    if (input.tagIds?.length) await this.repos.notes.setTags(row.id, input.tagIds);
    return row;
  }

  // market -> killzone -> status -> short note -> publish, in one call.
  async quick(actor: Actor, input: QuickNoteInput): Promise<NoteRow> {
    const market = await this.repos.markets.findById(input.marketId);
    if (!market) throw badRequest("Unknown market");
    const noteDate = input.noteDate ?? todayDate();

    let linkedPostId = input.linkedPostId;
    let linked: PostRow | null = null;
    if (linkedPostId) {
      linked = await this.repos.posts.findById(linkedPostId);
    } else {
      const options = await this.repos.posts.suggestForNote(input.marketId, noteDate, weekStartOf(noteDate));
      linked = options.find((p) => p.status === "published") ?? options[0] ?? null;
      linkedPostId = linked?.id;
    }
    if (!linked || !linkedPostId) {
      throw badRequest(`No Daily or Weekly post found for ${market.symbol} on ${noteDate}. Create the bias post first.`);
    }
    if (input.publish) {
      this.assertCanPublish(actor);
      if (linked.status !== "published") throw badRequest("The linked post is not published yet. Publish it first, or save this note as a draft.");
      this.assertNoPlaceholder(input.noteMd, input.title ?? "");
    }
    const create: CreateNoteInput = {
      marketId: input.marketId,
      killzone: input.killzone,
      noteDate,
      linkedPostId,
      status: input.status,
      confidence: input.confidence ?? null,
      title: input.title ?? `${market.symbol} ${input.killzone.replace("_", " ").toUpperCase()} note`,
      noteMd: input.noteMd,
    };
    await this.assertRefs(create.marketId, linkedPostId, undefined, undefined, true);
    return this.insert(actor, create, input.publish);
  }

  async update(actor: Actor, id: string, patch: UpdateNoteInput) {
    const before = await this.repos.notes.findById(id);
    if (!before) throw notFound("Note not found");
    this.assertCanEdit(actor, before);
    await this.assertRefs(patch.marketId, undefined, patch.analystId, patch.tagIds, false);

    const { tagIds, ...fields } = patch;
    const normalized: Record<string, unknown> = { ...fields };
    const oldTags = await this.repos.notes.getTagIds(id);

    if (before.publishStatus === "published") {
      const lockedHit = LOCKED_NOTE_FIELDS.filter(
        (k) => normalized[k] !== undefined && !sameJson(normalized[k], before[k]),
      );
      if (lockedHit.length) {
        throw new AppError(409, "locked", `Locked after publish: ${lockedHit.join(", ")} cannot be changed`, { fields: lockedHit });
      }
      const changed: Record<string, unknown> = {};
      const oldVals: Record<string, unknown> = {};
      for (const k of NOTE_EDITABLE_AFTER_PUBLISH) {
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
      await this.repos.notes.update(id, rowChanges as NotePatch, {
        entityType: "note",
        entityId: id,
        oldJson: JSON.stringify(oldVals),
        newJson: JSON.stringify(changed),
        editedBy: actor.id,
      });
      if (tagsChanged) await this.repos.notes.setTags(id, tagIds!);
      return { before, after: await this.detail(id), revised: true };
    }

    // draft / scheduled: everything editable, but the link must stay valid
    const marketId = fields.marketId ?? before.marketId;
    const linkedPostId = fields.linkedPostId ?? before.linkedPostId;
    if (fields.marketId !== undefined || fields.linkedPostId !== undefined) {
      await this.assertLink(marketId, linkedPostId);
    }
    await this.repos.notes.update(id, normalized as NotePatch);
    if (tagIds !== undefined) await this.repos.notes.setTags(id, tagIds);
    return { before, after: await this.detail(id), revised: false };
  }

  async publish(actor: Actor, id: string) {
    this.assertCanPublish(actor);
    const before = await this.mustFind(id);
    if (before.publishStatus === "published") throw conflict("Note is already published");
    await this.assertPublishable(before);
    const after = await this.repos.notes.update(id, { publishStatus: "published", publishedAt: nowIso() });
    return { before, after };
  }

  async schedule(actor: Actor, id: string, publishAt: string) {
    this.assertCanPublish(actor);
    const before = await this.mustFind(id);
    if (before.publishStatus === "published") throw conflict("Note is already published");
    if (publishAt < addMinutesIso(nowIso(), 1)) throw badRequest("Schedule time must be in the future");
    await this.assertPublishable(before, false);
    const after = await this.repos.notes.update(id, { publishStatus: "scheduled", publishAt });
    return { before, after };
  }

  async unschedule(actor: Actor, id: string) {
    this.assertCanPublish(actor);
    const before = await this.mustFind(id);
    if (before.publishStatus !== "scheduled") throw conflict("Note is not scheduled");
    const after = await this.repos.notes.update(id, { publishStatus: "draft", publishAt: null });
    return { before, after };
  }

  async delete(actor: Actor, id: string) {
    const before = await this.mustFind(id);
    this.assertCanEdit(actor, before);
    if (before.publishStatus === "published") throw new AppError(409, "locked", "Published notes cannot be deleted");
    const files = await this.repos.attachments.listByOwner("note", id);
    if (files.length > 0) throw conflict("Remove the screenshots from this note before deleting it.");
    await this.repos.notes.setTags(id, []);
    await this.repos.notes.delete(id);
    return before;
  }

  // ---------- rules ----------
  private async mustFind(id: string) {
    const n = await this.repos.notes.findById(id);
    if (!n) throw notFound("Note not found");
    return n;
  }

  private assertCanEdit(actor: Actor, note: NoteRow) {
    if (actor.role === "analyst" && (note.createdBy !== actor.id || note.publishStatus !== "draft")) {
      throw forbidden("Analysts can only edit their own drafts");
    }
  }

  private assertCanPublish(actor: Actor) {
    if (!can(actor.role, "note:publish")) throw forbidden("Your role cannot publish. Ask an editor.");
  }

  private assertNoPlaceholder(...texts: string[]) {
    if (texts.some((t) => t.includes(PLACEHOLDER))) throw badRequest(`Remove the ${PLACEHOLDER} markers before publishing`);
  }

  // A note may only go live when its linked bias post is live (scheduling only needs the note itself to be complete).
  private async assertPublishable(note: NoteRow, requireLinkedPublished = true) {
    const problems: string[] = [];
    if (!note.noteMd.trim()) problems.push("Note text is required");
    if (note.noteMd.includes(PLACEHOLDER) || note.title.includes(PLACEHOLDER)) problems.push(`Remove the ${PLACEHOLDER} markers`);
    if (requireLinkedPublished) {
      const linked = await this.repos.posts.findById(note.linkedPostId);
      if (!linked || linked.status !== "published") problems.push("The linked post must be published first");
    }
    if (problems.length) throw badRequest("Note is not ready to publish", { problems });
  }

  private async assertLink(marketId: string, linkedPostId: string) {
    const post = await this.repos.posts.findById(linkedPostId);
    if (!post) throw badRequest("Linked post not found");
    if (post.marketId !== marketId) throw badRequest("Linked post must belong to the same market as the note");
  }

  private async assertRefs(
    marketId: string | undefined,
    linkedPostId: string | undefined,
    analystId: string | null | undefined,
    tagIds: string[] | undefined,
    requireActiveMarket: boolean | undefined,
  ) {
    if (marketId) {
      const m = await this.repos.markets.findById(marketId);
      if (!m) throw badRequest("Unknown market");
      if (requireActiveMarket && !m.active) throw badRequest(`Market ${m.symbol} is inactive`);
      if (linkedPostId) await this.assertLink(marketId, linkedPostId);
    }
    if (analystId && !(await this.repos.analysts.findById(analystId))) throw badRequest("Unknown analyst");
    if (tagIds?.length) {
      for (const t of new Set(tagIds)) if (!(await this.repos.tags.findById(t))) throw badRequest("Unknown tag");
    }
  }
}
