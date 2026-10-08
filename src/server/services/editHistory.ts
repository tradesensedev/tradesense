import { editFieldLabel, type PublicEditEntry } from "@shared/editHistory";
import { safeJson } from "../lib/labels";
import type { Repositories } from "../repositories/types";

// Public "edit history" of a published post or note. Built from revisions, but only the NAMES of the changed fields
// and the time are returned: never the old or new text, never who edited. Newest first.
export class EditHistoryService {
  constructor(private repos: Repositories) {}

  async forEntity(entityType: "post" | "note", entityId: string): Promise<PublicEditEntry[]> {
    const revisions = await this.repos.revisions.listByEntity(entityType, entityId);
    return revisions.map((r) => ({
      editedAt: r.editedAt,
      fields: Object.keys(safeJson<Record<string, unknown>>(r.newJson, {})).map(editFieldLabel),
    }));
  }
}
