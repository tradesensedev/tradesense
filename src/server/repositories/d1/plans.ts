import { newId } from "../../lib/ids";
import type { PlanRepository, PlanRow, RegionPriceRow } from "../types";
import { buildSet, fromBool, toBool } from "./util";

interface DbPlan {
  id: string;
  code: string;
  name: string;
  duration_days: number;
  price_usd: number;
  active: number;
  sort_order: number;
}

interface DbRegion {
  plan_id: string;
  country_code: string;
  price_usd: number;
}

const map = (r: DbPlan): PlanRow => ({
  id: r.id,
  code: r.code,
  name: r.name,
  durationDays: r.duration_days,
  priceUsd: r.price_usd,
  active: toBool(r.active),
  sortOrder: r.sort_order,
});

const COLS: Record<string, string> = {
  name: "name",
  durationDays: "duration_days",
  priceUsd: "price_usd",
  active: "active",
  sortOrder: "sort_order",
};

export class D1PlanRepository implements PlanRepository {
  constructor(private db: D1Database) {}

  async list(opts?: { activeOnly?: boolean }) {
    const sql = opts?.activeOnly
      ? "SELECT * FROM plans WHERE active = 1 ORDER BY sort_order, duration_days"
      : "SELECT * FROM plans ORDER BY sort_order, duration_days";
    const res = await this.db.prepare(sql).all<DbPlan>();
    return res.results.map(map);
  }

  async findById(id: string) {
    const r = await this.db.prepare("SELECT * FROM plans WHERE id = ?").bind(id).first<DbPlan>();
    return r ? map(r) : null;
  }

  async findByCode(code: string) {
    const r = await this.db.prepare("SELECT * FROM plans WHERE code = ?").bind(code).first<DbPlan>();
    return r ? map(r) : null;
  }

  async create(input: Omit<PlanRow, "id">) {
    const id = newId();
    await this.db
      .prepare("INSERT INTO plans (id, code, name, duration_days, price_usd, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .bind(id, input.code, input.name, input.durationDays, input.priceUsd, fromBool(input.active), input.sortOrder)
      .run();
    return { ...input, id };
  }

  async update(id: string, patch: Partial<Omit<PlanRow, "id" | "code">>) {
    const { sql, vals } = buildSet(patch as Record<string, unknown>, COLS, ["active"]);
    if (!sql) return;
    await this.db.prepare(`UPDATE plans SET ${sql} WHERE id = ?`).bind(...vals, id).run();
  }

  async listRegionPrices(planId: string) {
    const res = await this.db
      .prepare("SELECT * FROM region_prices WHERE plan_id = ? ORDER BY country_code")
      .bind(planId)
      .all<DbRegion>();
    return res.results.map((r): RegionPriceRow => ({ planId: r.plan_id, countryCode: r.country_code, priceUsd: r.price_usd }));
  }

  async replaceRegionPrices(planId: string, rows: { countryCode: string; priceUsd: number }[]) {
    const stmts = [this.db.prepare("DELETE FROM region_prices WHERE plan_id = ?").bind(planId)];
    const seen = new Set<string>();
    for (const r of rows) {
      if (seen.has(r.countryCode)) continue; // last duplicate ignored, first wins
      seen.add(r.countryCode);
      stmts.push(
        this.db
          .prepare("INSERT INTO region_prices (plan_id, country_code, price_usd) VALUES (?, ?, ?)")
          .bind(planId, r.countryCode, r.priceUsd),
      );
    }
    await this.db.batch(stmts); // atomic
  }
}
