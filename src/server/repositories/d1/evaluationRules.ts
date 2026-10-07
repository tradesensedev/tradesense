import { newId } from "../../lib/ids";
import type { EvaluationRuleRepository, EvaluationRuleRow } from "../types";

interface DbRule {
  id: string;
  version: number;
  text_md: string;
  active_from: string;
}

const map = (r: DbRule): EvaluationRuleRow => ({
  id: r.id,
  version: r.version,
  textMd: r.text_md,
  activeFrom: r.active_from,
});

// Rules are append-only: there is no update or delete. Results keep the version they were evaluated under.
export class D1EvaluationRuleRepository implements EvaluationRuleRepository {
  constructor(private db: D1Database) {}

  async list() {
    const res = await this.db.prepare("SELECT * FROM evaluation_rules ORDER BY version DESC").all<DbRule>();
    return res.results.map(map);
  }

  async findByVersion(version: number) {
    const r = await this.db.prepare("SELECT * FROM evaluation_rules WHERE version = ?").bind(version).first<DbRule>();
    return r ? map(r) : null;
  }

  async latest() {
    const r = await this.db.prepare("SELECT * FROM evaluation_rules ORDER BY version DESC LIMIT 1").first<DbRule>();
    return r ? map(r) : null;
  }

  async create(row: Omit<EvaluationRuleRow, "id" | "version">) {
    const id = newId();
    // version = max + 1 in one statement; the UNIQUE(version) constraint protects against a race.
    await this.db
      .prepare(
        "INSERT INTO evaluation_rules (id, version, text_md, active_from) " +
          "SELECT ?, COALESCE(MAX(version), 0) + 1, ?, ? FROM evaluation_rules",
      )
      .bind(id, row.textMd, row.activeFrom)
      .run();
    const created = await this.db.prepare("SELECT * FROM evaluation_rules WHERE id = ?").bind(id).first<DbRule>();
    return map(created!);
  }
}
