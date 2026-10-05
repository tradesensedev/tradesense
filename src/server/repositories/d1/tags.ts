import { newId } from "../../lib/ids";
import type { TagRepository, TagRow, TagWithUses } from "../types";

interface DbTag {
  id: string;
  name: string;
  slug: string;
}

const map = (r: DbTag): TagRow => ({ id: r.id, name: r.name, slug: r.slug });

export class D1TagRepository implements TagRepository {
  constructor(private db: D1Database) {}

  async list() {
    const res = await this.db
      .prepare(
        "SELECT t.id, t.name, t.slug, " +
          "((SELECT COUNT(*) FROM post_tags WHERE tag_id = t.id) + (SELECT COUNT(*) FROM note_tags WHERE tag_id = t.id)) AS uses " +
          "FROM tags t ORDER BY t.name",
      )
      .all<DbTag & { uses: number }>();
    return res.results.map((r): TagWithUses => ({ ...map(r), uses: r.uses }));
  }

  async findById(id: string) {
    const r = await this.db.prepare("SELECT * FROM tags WHERE id = ?").bind(id).first<DbTag>();
    return r ? map(r) : null;
  }

  async findBySlug(slug: string) {
    const r = await this.db.prepare("SELECT * FROM tags WHERE slug = ?").bind(slug).first<DbTag>();
    return r ? map(r) : null;
  }

  async create(input: Omit<TagRow, "id">) {
    const id = newId();
    await this.db.prepare("INSERT INTO tags (id, name, slug) VALUES (?, ?, ?)").bind(id, input.name, input.slug).run();
    return { ...input, id };
  }

  async update(id: string, patch: { name: string }) {
    await this.db.prepare("UPDATE tags SET name = ? WHERE id = ?").bind(patch.name, id).run();
  }

  async delete(id: string) {
    await this.db.prepare("DELETE FROM tags WHERE id = ?").bind(id).run();
  }
}
