import type { SubscriptionRepository, SubscriptionRow } from "../publicTypes";
import { toBool } from "./util";

interface DbSub {
  id: string;
  user_id: string;
  plan_id: string | null;
  status: string;
  starts_at: string;
  expires_at: string;
  granted_manually: number;
  granted_by: string | null;
  note: string;
  created_at: string;
  updated_at: string;
}

const map = (r: DbSub): SubscriptionRow => ({
  id: r.id,
  userId: r.user_id,
  planId: r.plan_id,
  status: r.status as SubscriptionRow["status"],
  startsAt: r.starts_at,
  expiresAt: r.expires_at,
  grantedManually: toBool(r.granted_manually),
  grantedBy: r.granted_by,
  note: r.note,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

// Read side only. Payments and manual grants write subscriptions in Phase 5.
export class D1SubscriptionRepository implements SubscriptionRepository {
  constructor(private db: D1Database) {}

  async findByUser(userId: string) {
    const r = await this.db.prepare("SELECT * FROM subscriptions WHERE user_id = ?").bind(userId).first<DbSub>();
    return r ? map(r) : null;
  }

  async countActive(nowIso: string) {
    const r = await this.db
      .prepare("SELECT COUNT(*) AS n FROM subscriptions WHERE status = 'active' AND starts_at <= ? AND expires_at > ?")
      .bind(nowIso, nowIso)
      .first<{ n: number }>();
    return r?.n ?? 0;
  }
}
