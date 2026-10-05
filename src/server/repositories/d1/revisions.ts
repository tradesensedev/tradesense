import { newId } from "../../lib/ids";
import { nowIso } from "../../lib/time";
import type { NewRevision, RevisionRepository, RevisionRow } from "../types";

interface DbRevision {
  id: string;
  entity_type: string;
  entity_id: string;
  old_json: string;
  new_json: string;
  edited_by: string;
  edited_at: string;
}

const map = (r: DbRevision): RevisionRow => ({
  id: r.id,
  entityType: r.entity_type as "post" | "note",
  entityId: r.entity_id,
  oldJson: r.old_json,
  newJson: r.new_json,
  editedBy: r.edited_by,
  editedAt: r.edited_at,
});

// Used by the post/note repositories to write a revision inside the same batch as the update.
export function revisionStatement(db: D1Database, rev: NewRevision): D1PreparedStatement {
  return db
    .prepare(
      "INSERT INTO post_revisions (id, entity_type, entity_id, old_json, new_json, edited_by, edited_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(newId(), rev.entityType, rev.entityId, rev.oldJson, rev.newJson, rev.editedBy, nowIso());
}

export class D1RevisionRepository implements RevisionRepository {
  constructor(private db: D1Database) {}

  async listByEntity(entityType: "post" | "note", entityId: string) {
    const res = await this.db
      .prepare("SELECT * FROM post_revisions WHERE entity_type = ? AND entity_id = ? ORDER BY edited_at DESC, id DESC")
      .bind(entityType, entityId)
      .all<DbRevision>();
    return res.results.map(map);
  }

  async countByEntity(entityType: "post" | "note", entityId: string) {
    const r = await this.db
      .prepare("SELECT COUNT(*) AS n FROM post_revisions WHERE entity_type = ? AND entity_id = ?")
      .bind(entityType, entityId)
      .first<{ n: number }>();
    return r?.n ?? 0;
  }
}
