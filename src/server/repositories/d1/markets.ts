import type { MarketRepository, MarketRow } from "../types";
import { toBool } from "./util";

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
}
