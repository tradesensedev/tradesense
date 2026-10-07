import type { Outcome } from "@shared/constants";
import { newId } from "../../lib/ids";
import { nowIso } from "../../lib/time";
import type {
  CorrectionRow,
  PostBrief,
  QueueFilter,
  ResultFilter,
  ResultListRow,
  ResultRepository,
  ResultRow,
} from "../types";
import { clampPage } from "./util";

interface DbResult {
  id: string;
  post_id: string;
  outcome: string;
  note_md: string;
  evaluated_by: string;
  evaluated_at: string;
  evaluation_rule_version: number;
}

interface DbCorrection {
  id: string;
  result_id: string;
  new_outcome: string;
  reason_md: string;
  created_by: string;
  created_at: string;
}

interface DbBrief {
  id: string;
  type: string;
  market_id: string;
  post_date: string;
  week_start_date: string;
  bias: string;
  confidence: string;
  title: string;
  valid_until: string | null;
  analyst_id: string | null;
  access: string;
}

interface DbListRow extends DbResult {
  p_id: string;
  p_type: string;
  p_market_id: string;
  p_post_date: string;
  p_week_start_date: string;
  p_bias: string;
  p_confidence: string;
  p_title: string;
  p_valid_until: string | null;
  p_analyst_id: string | null;
  p_access: string;
  effective_outcome: string;
  correction_count: number;
}

const mapResult = (r: DbResult): ResultRow => ({
  id: r.id,
  postId: r.post_id,
  outcome: r.outcome as Outcome,
  noteMd: r.note_md,
  evaluatedBy: r.evaluated_by,
  evaluatedAt: r.evaluated_at,
  evaluationRuleVersion: r.evaluation_rule_version,
});

const mapCorrection = (r: DbCorrection): CorrectionRow => ({
  id: r.id,
  resultId: r.result_id,
  newOutcome: r.new_outcome as Outcome,
  reasonMd: r.reason_md,
  createdBy: r.created_by,
  createdAt: r.created_at,
});

const mapBrief = (r: DbBrief): PostBrief => ({
  id: r.id,
  type: r.type as PostBrief["type"],
  marketId: r.market_id,
  postDate: r.post_date,
  weekStartDate: r.week_start_date,
  bias: r.bias as PostBrief["bias"],
  confidence: r.confidence as PostBrief["confidence"],
  title: r.title,
  validUntil: r.valid_until,
  analystId: r.analyst_id,
  access: r.access as PostBrief["access"],
});

// Latest correction wins; otherwise the original outcome.
const EFFECTIVE =
  "COALESCE((SELECT c.new_outcome FROM result_corrections c WHERE c.result_id = r.id ORDER BY c.created_at DESC, c.id DESC LIMIT 1), r.outcome)";
const POST_DATE = "(CASE p.type WHEN 'daily' THEN p.post_date ELSE p.week_start_date END)";

const like = (q: string) => `%${q.replace(/[%_]/g, " ")}%`;

export class D1ResultRepository implements ResultRepository {
  constructor(private db: D1Database) {}

  async findById(id: string) {
    const r = await this.db.prepare("SELECT * FROM results WHERE id = ?").bind(id).first<DbResult>();
    return r ? mapResult(r) : null;
  }

  async findByPostId(postId: string) {
    const r = await this.db.prepare("SELECT * FROM results WHERE post_id = ?").bind(postId).first<DbResult>();
    return r ? mapResult(r) : null;
  }

  async create(row: Omit<ResultRow, "evaluatedAt">) {
    const at = nowIso();
    await this.db
      .prepare(
        "INSERT INTO results (id, post_id, outcome, note_md, evaluated_by, evaluated_at, evaluation_rule_version) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(row.id, row.postId, row.outcome, row.noteMd, row.evaluatedBy, at, row.evaluationRuleVersion)
      .run();
    return { ...row, evaluatedAt: at };
  }

  async listCorrections(resultId: string) {
    const res = await this.db
      .prepare("SELECT * FROM result_corrections WHERE result_id = ? ORDER BY created_at, id")
      .bind(resultId)
      .all<DbCorrection>();
    return res.results.map(mapCorrection);
  }

  async addCorrection(row: Omit<CorrectionRow, "createdAt">) {
    const at = nowIso();
    await this.db
      .prepare("INSERT INTO result_corrections (id, result_id, new_outcome, reason_md, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(row.id, row.resultId, row.newOutcome, row.reasonMd, row.createdBy, at)
      .run();
    return { ...row, createdAt: at };
  }

  private queueWhere(f: Pick<QueueFilter, "marketId" | "type">, nowIsoValue: string) {
    const where = [
      "p.status = 'published'",
      "p.valid_until IS NOT NULL",
      "p.valid_until <= ?",
      "NOT EXISTS (SELECT 1 FROM results r WHERE r.post_id = p.id)",
    ];
    const vals: unknown[] = [nowIsoValue];
    if (f.marketId) (where.push("p.market_id = ?"), vals.push(f.marketId));
    if (f.type) (where.push("p.type = ?"), vals.push(f.type));
    return { w: `WHERE ${where.join(" AND ")}`, vals };
  }

  async queue(f: QueueFilter, nowIsoValue: string) {
    const { w, vals } = this.queueWhere(f, nowIsoValue);
    const { limit, offset } = clampPage(f.limit, f.offset);
    const total = await this.db.prepare(`SELECT COUNT(*) AS n FROM posts p ${w}`).bind(...vals).first<{ n: number }>();
    const res = await this.db
      .prepare(
        `SELECT p.id, p.type, p.market_id, p.post_date, p.week_start_date, p.bias, p.confidence, p.title, p.valid_until, p.analyst_id, p.access ` +
          `FROM posts p ${w} ORDER BY p.valid_until ASC, p.id ASC LIMIT ? OFFSET ?`,
      )
      .bind(...vals, limit, offset)
      .all<DbBrief>();
    return { items: res.results.map(mapBrief), total: total?.n ?? 0 };
  }

  async countQueue(nowIsoValue: string) {
    const { w, vals } = this.queueWhere({}, nowIsoValue);
    const r = await this.db.prepare(`SELECT COUNT(*) AS n FROM posts p ${w}`).bind(...vals).first<{ n: number }>();
    return r?.n ?? 0;
  }

  async list(f: ResultFilter) {
    const where: string[] = [];
    const vals: unknown[] = [];
    if (f.outcome) (where.push(`${EFFECTIVE} = ?`), vals.push(f.outcome));
    if (f.marketId) (where.push("p.market_id = ?"), vals.push(f.marketId));
    if (f.type) (where.push("p.type = ?"), vals.push(f.type));
    if (f.dateFrom) (where.push(`${POST_DATE} >= ?`), vals.push(f.dateFrom));
    if (f.dateTo) (where.push(`${POST_DATE} <= ?`), vals.push(f.dateTo));
    if (f.evaluatedBy) (where.push("r.evaluated_by = ?"), vals.push(f.evaluatedBy));
    if (f.ruleVersion) (where.push("r.evaluation_rule_version = ?"), vals.push(f.ruleVersion));
    if (f.q) {
      where.push("(p.title LIKE ? OR r.note_md LIKE ?)");
      vals.push(like(f.q), like(f.q));
    }
    const w = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { limit, offset } = clampPage(f.limit, f.offset);
    const total = await this.db
      .prepare(`SELECT COUNT(*) AS n FROM results r JOIN posts p ON p.id = r.post_id ${w}`)
      .bind(...vals)
      .first<{ n: number }>();
    const res = await this.db
      .prepare(
        `SELECT r.*, p.id AS p_id, p.type AS p_type, p.market_id AS p_market_id, p.post_date AS p_post_date, ` +
          `p.week_start_date AS p_week_start_date, p.bias AS p_bias, p.confidence AS p_confidence, p.title AS p_title, ` +
          `p.valid_until AS p_valid_until, p.analyst_id AS p_analyst_id, p.access AS p_access, ` +
          `${EFFECTIVE} AS effective_outcome, ` +
          `(SELECT COUNT(*) FROM result_corrections c2 WHERE c2.result_id = r.id) AS correction_count ` +
          `FROM results r JOIN posts p ON p.id = r.post_id ${w} ` +
          `ORDER BY ${POST_DATE} DESC, r.evaluated_at DESC, r.id DESC LIMIT ? OFFSET ?`,
      )
      .bind(...vals, limit, offset)
      .all<DbListRow>();
    const items = res.results.map(
      (r): ResultListRow => ({
        result: mapResult(r),
        post: mapBrief({
          id: r.p_id,
          type: r.p_type,
          market_id: r.p_market_id,
          post_date: r.p_post_date,
          week_start_date: r.p_week_start_date,
          bias: r.p_bias,
          confidence: r.p_confidence,
          title: r.p_title,
          valid_until: r.p_valid_until,
          analyst_id: r.p_analyst_id,
          access: r.p_access,
        }),
        effectiveOutcome: r.effective_outcome as Outcome,
        correctionCount: r.correction_count,
      }),
    );
    return { items, total: total?.n ?? 0 };
  }
}

export const newResultId = newId;
