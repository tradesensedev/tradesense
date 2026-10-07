import {
  MAX_BULK_ITEMS,
  noteFilterOnly,
  postFilterOnly,
  type BulkInput,
  type BulkItemResult,
  type BulkResponse,
} from "@shared/lists";
import { AppError, badRequest } from "../lib/errors";
import { changedFields } from "../lib/diff";
import type { Repositories } from "../repositories/types";
import { noteFilterFromQuery, postFilterFromQuery } from "./lists";
import { NoteService } from "./notes";
import { PostService, type Actor } from "./posts";

// Each Worker request has a cap on database calls, and one bulk item costs several. Run at most this many per request.
export const BULK_RUN_LIMIT = 100;

export interface BulkAuditEntry {
  action: string;
  entity: "post" | "note";
  entityId: string;
  diff?: unknown;
}

// Bulk actions call the SAME service methods as the single-item screens, once per item.
// So lock rules, role rules and publish checks are identical, and one bad item never blocks the others.
export class BulkService {
  constructor(private repos: Repositories) {}

  private async resolveIds(actor: Actor, kind: "post" | "note", input: BulkInput): Promise<{ ids: string[]; truncated: boolean }> {
    if ("ids" in input.selection) {
      const ids = [...new Set(input.selection.ids)];
      return { ids: ids.slice(0, BULK_RUN_LIMIT), truncated: ids.length > BULK_RUN_LIMIT };
    }
    // Deleting "everything that matches" is too easy to get wrong. Delete needs explicit rows.
    if (input.action === "delete") throw badRequest("Select the rows to delete. Delete cannot run on a whole filter.");
    if (kind === "post") {
      const parsed = postFilterOnly.safeParse(input.selection.filter);
      if (!parsed.success) throw badRequest("Invalid filter", parsed.error.flatten());
      const { ids, total } = await this.repos.lists.postIds(postFilterFromQuery(parsed.data, actor.id), MAX_BULK_ITEMS);
      return { ids: ids.slice(0, BULK_RUN_LIMIT), truncated: total > Math.min(ids.length, BULK_RUN_LIMIT) };
    }
    const parsed = noteFilterOnly.safeParse(input.selection.filter);
    if (!parsed.success) throw badRequest("Invalid filter", parsed.error.flatten());
    const { ids, total } = await this.repos.lists.noteIds(noteFilterFromQuery(parsed.data, actor.id), MAX_BULK_ITEMS);
    return { ids: ids.slice(0, BULK_RUN_LIMIT), truncated: total > Math.min(ids.length, BULK_RUN_LIMIT) };
  }

  async run(actor: Actor, kind: "post" | "note", input: BulkInput): Promise<{ response: BulkResponse; audits: BulkAuditEntry[] }> {
    const { ids, truncated } = await this.resolveIds(actor, kind, input);
    const posts = new PostService(this.repos);
    const notes = new NoteService(this.repos);
    const results: BulkItemResult[] = [];
    const audits: BulkAuditEntry[] = [];
    const push = (a: BulkAuditEntry) => audits.push({ ...a, diff: { ...(a.diff as object | undefined), via: "bulk" } });

    for (const id of ids) {
      try {
        const name = kind; // "post" | "note"
        switch (input.action) {
          case "publish": {
            const { before } = kind === "post" ? await posts.publish(actor, id) : await notes.publish(actor, id);
            const status = kind === "post" ? (before as { status: string }).status : (before as { publishStatus: string }).publishStatus;
            push({ action: `${name}.publish`, entity: name, entityId: id, diff: { from: status, to: "published" } });
            break;
          }
          case "unschedule": {
            if (kind === "post") await posts.unschedule(actor, id);
            else await notes.unschedule(actor, id);
            push({ action: `${name}.unschedule`, entity: name, entityId: id });
            break;
          }
          case "delete": {
            const before = kind === "post" ? await posts.delete(actor, id) : await notes.delete(actor, id);
            push({ action: `${name}.delete`, entity: name, entityId: id, diff: { title: (before as { title: string }).title } });
            break;
          }
          case "set_access":
          case "add_tag":
          case "remove_tag": {
            await this.update(actor, kind, id, input, posts, notes, push);
            break;
          }
        }
        results.push({ id, ok: true });
      } catch (e) {
        if (!(e instanceof AppError)) console.error("bulk item failed", id, e);
        results.push({ id, ok: false, error: e instanceof AppError ? e.message : "Unexpected error" });
      }
    }
    const okCount = results.filter((r) => r.ok).length;
    return { response: { action: input.action, results, okCount, failCount: results.length - okCount, truncated }, audits };
  }

  // set_access / add_tag / remove_tag all go through the normal update, so published items follow the "edit after publish" rules
  // (access and tags stay editable and each change is saved as a revision).
  private async update(
    actor: Actor,
    kind: "post" | "note",
    id: string,
    input: BulkInput,
    posts: PostService,
    notes: NoteService,
    push: (a: BulkAuditEntry) => void,
  ) {
    const current = kind === "post" ? await this.repos.posts.getTagIds(id) : await this.repos.notes.getTagIds(id);
    let patch: { access?: BulkInput["access"]; tagIds?: string[] };
    if (input.action === "set_access") {
      patch = { access: input.access };
    } else {
      const tagId = input.tagId!;
      const next = input.action === "add_tag" ? [...new Set([...current, tagId])] : current.filter((t) => t !== tagId);
      if (next.length === current.length && next.every((t) => current.includes(t))) return; // nothing to change
      patch = { tagIds: next };
    }
    if (kind === "post") {
      const { before, after, revised } = await posts.update(actor, id, patch as never);
      const diff = changedFields(before as unknown as Record<string, unknown>, after.post as unknown as Record<string, unknown>);
      if (input.action !== "set_access") (diff as Record<string, unknown>).tagIds = { from: current, to: after.tagIds };
      push({ action: revised ? "post.edit_published" : "post.update", entity: "post", entityId: id, diff });
    } else {
      const { before, after, revised } = await notes.update(actor, id, patch as never);
      const diff = changedFields(before as unknown as Record<string, unknown>, after.note as unknown as Record<string, unknown>);
      if (input.action !== "set_access") (diff as Record<string, unknown>).tagIds = { from: current, to: after.tagIds };
      push({ action: revised ? "note.edit_published" : "note.update", entity: "note", entityId: id, diff });
    }
  }
}
