import type { z } from "zod";
import type {
  auditListQuery,
  AuditEntryDto,
  mediaListQuery,
  MediaItemDto,
  revisionListQuery,
  RevisionDto,
} from "@shared/admin";
import { toAttachmentDto } from "../lib/dto";
import { EntityLabels, safeJson } from "../lib/labels";
import type { Repositories } from "../repositories/types";

async function nameMap(repos: Repositories, ids: (string | null)[]) {
  const users = await repos.users.findManyByIds(ids.filter((i): i is string => !!i));
  return new Map(users.map((u) => [u.id, u.name]));
}

// Read-only lists for the Audit, Revisions and Media screens.
export class HistoryService {
  constructor(private repos: Repositories) {}

  async audit(q: z.infer<typeof auditListQuery>): Promise<{ items: AuditEntryDto[]; total: number }> {
    const { items, total } = await this.repos.audit.list(q);
    const names = await nameMap(this.repos, items.map((i) => i.userId));
    return {
      total,
      items: items.map((a) => ({
        id: a.id,
        userId: a.userId,
        userName: a.userId ? (names.get(a.userId) ?? null) : null,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
        diff: safeJson<unknown>(a.diffJson, null),
        createdAt: a.createdAt,
      })),
    };
  }

  async revisions(q: z.infer<typeof revisionListQuery>): Promise<{ items: RevisionDto[]; total: number }> {
    const { items, total } = await this.repos.revisions.list(q);
    const names = await nameMap(this.repos, items.map((i) => i.editedBy));
    const labels = new EntityLabels(this.repos);
    const out: RevisionDto[] = [];
    for (const r of items) {
      out.push({
        id: r.id,
        entityType: r.entityType,
        entityId: r.entityId,
        entityLabel: await labels.label(r.entityType, r.entityId),
        oldValues: safeJson<Record<string, unknown>>(r.oldJson, {}),
        newValues: safeJson<Record<string, unknown>>(r.newJson, {}),
        editedBy: r.editedBy,
        editedByName: names.get(r.editedBy) ?? null,
        editedAt: r.editedAt,
      });
    }
    return { items: out, total };
  }

  async media(q: z.infer<typeof mediaListQuery>): Promise<{ items: MediaItemDto[]; total: number }> {
    const { locked, ...rest } = q;
    const { items, total } = await this.repos.attachments.list({ ...rest, locked: locked === undefined ? undefined : locked === "1" });
    const names = await nameMap(this.repos, items.map((i) => i.uploadedBy));
    const labels = new EntityLabels(this.repos);
    const out: MediaItemDto[] = [];
    for (const a of items) {
      out.push({
        ...toAttachmentDto(a),
        uploadedByName: names.get(a.uploadedBy) ?? null,
        ownerLabel: await labels.label(a.ownerType, a.ownerId),
      });
    }
    return { items: out, total };
  }
}
