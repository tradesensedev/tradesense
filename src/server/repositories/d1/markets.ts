import { newId } from "../../lib/ids";
import type { MarketRepository, MarketRow } from "../types";
import { fromBool, toBool } from "./util";

interface DbMarket {
  id: string;
  symbol: string;
  name: string;
  category: string;
  active: number;
  sort_order: number;
}

const map = (r: DbMarket): MarketRow => ({
  id: r.id,
  symbol: r.symbol,
  name: r.name,
  category: r.category,
  active: toBool(r.active),
  sortOrder: r.sort_order,
});

export class D1MarketRepository implements MarketRepository {
  constructor(private db: D1Database) {}

  async list(opts?: { activeOnly?: boolean }) {
    const sql = opts?.activeOnly
      ? "SELECT * FROM markets WHERE active = 1 ORDER BY sort_order, symbol"
      : "SELECT * FROM markets ORDER BY sort_order, symbol";
    const res = await this.db.prepare(sql).all<DbMarket>();
    return res.results.map(map);
  }

  async findById(id: string) {
    const r = await this.db.prepare("SELECT * FROM markets WHERE id = ?").bind(id).first<DbMarket>();
    return r ? map(r) : null;
  }

  async findBySymbol(symbol: string) {
    const r = await this.db.prepare("SELECT * FROM markets WHERE symbol = ?").bind(symbol).first<DbMarket>();
    return r ? map(r) : null;
  }

  async create(input: Omit<MarketRow, "id">) {
    const id = newId();
    await this.db
      .prepare("INSERT INTO markets (id, symbol, name, category, active, sort_order) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, input.symbol, input.name, input.category, fromBool(input.active), input.sortOrder)
      .run();
    return { ...input, id };
  }

  async update(id: string, patch: Partial<Omit<MarketRow, "id" | "symbol">>) {
    const cols: string[] = [];
    const vals: unknown[] = [];
    if (patch.name !== undefined) (cols.push("name = ?"), vals.push(patch.name));
    if (patch.category !== undefined) (cols.push("category = ?"), vals.push(patch.category));
    if (patch.active !== undefined) (cols.push("active = ?"), vals.push(fromBool(patch.active)));
    if (patch.sortOrder !== undefined) (cols.push("sort_order = ?"), vals.push(patch.sortOrder));
    if (cols.length === 0) return;
    await this.db
      .prepare(`UPDATE markets SET ${cols.join(", ")} WHERE id = ?`)
      .bind(...vals, id)
      .run();
  }
}
