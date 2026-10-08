import type { PublicEntityType } from "@shared/constants";

// Phase 4 repositories (events, bookmarks, view log, subscriptions read side).
// Added to Repositories by declaration merging, same trick as listAugment.ts.
// TODO (when types.ts is next edited): fold types.base.ts, listAugment.ts and this file into types.ts.

// ---------- events (economic calendar, manual entries) ----------
export type EventImpact = "low" | "medium" | "high";
export type EventSource = "calendar" | "manual";

export interface EventRow {
  id: string;
  title: string;
  startsAt: string; // ISO-8601 UTC
  impact: EventImpact;
  currency: string | null;
  source: EventSource;
  descriptionMd: string;
  createdBy: string | null;
  createdAt: string;
}

export interface EventFilter {
  from?: string; // startsAt >= (ISO)
  to?: string; // startsAt < (ISO)
  impacts?: EventImpact[];
  currency?: string;
  q?: string;
  order?: "asc" | "desc";
  limit: number;
  offset: number;
}

export interface EventRepository {
  list(f: EventFilter): Promise<{ items: EventRow[]; total: number }>;
  findById(id: string): Promise<EventRow | null>;
  create(row: Omit<EventRow, "createdAt">): Promise<EventRow>;
  update(id: string, patch: Partial<Pick<EventRow, "title" | "startsAt" | "impact" | "currency" | "descriptionMd">>): Promise<void>;
  delete(id: string): Promise<void>;
}

// ---------- bookmarks ----------
export interface BookmarkRow {
  userId: string;
  entityType: "post" | "note";
  entityId: string;
  createdAt: string;
}

export interface BookmarkRepository {
  add(userId: string, entityType: "post" | "note", entityId: string): Promise<void>; // idempotent
  remove(userId: string, entityType: "post" | "note", entityId: string): Promise<void>;
  listByUser(userId: string, entityType: "post" | "note", limit: number, offset: number): Promise<{ items: BookmarkRow[]; total: number }>;
  // Which of these ids does the user have bookmarked? (at most 90 ids per call: D1 allows 100 bound values)
  filterBookmarked(userId: string, entityType: "post" | "note", ids: string[]): Promise<string[]>;
  // Admin lists: bookmark count per id (at most 90 ids per call).
  countByEntities(entityType: "post" | "note", ids: string[]): Promise<Record<string, number>>;
}

// ---------- view log (privacy: ip_hash only, never the raw IP) ----------
export interface ViewLogRow {
  id: string;
  userId: string | null; // null = logged-out visitor
  entityType: PublicEntityType;
  entityId: string;
  viewedAt: string;
  ipHash: string | null;
}

export interface ViewerRow {
  userId: string;
  name: string;
  email: string;
  views: number;
  lastViewedAt: string;
}

export interface ViewLogRepository {
  add(row: { userId: string | null; entityType: PublicEntityType; entityId: string; ipHash: string | null }): Promise<void>;
  // True when the same viewer (user id, or ip hash for visitors) already logged this entity since `sinceIso`.
  existsSince(
    who: { userId: string | null; ipHash: string | null },
    entityType: PublicEntityType,
    entityId: string,
    sinceIso: string,
  ): Promise<boolean>;
  // Admin lists: total views and distinct signed-in viewers per id (at most 90 ids per call).
  countByEntities(entityType: PublicEntityType, ids: string[]): Promise<Record<string, { views: number; viewers: number }>>;
  // Admin "who viewed": signed-in viewers of one entity, most recent first.
  viewersOf(entityType: PublicEntityType, entityId: string, limit: number): Promise<ViewerRow[]>;
}

// ---------- subscriptions (read side only; payments write them in Phase 5) ----------
export interface SubscriptionRow {
  id: string;
  userId: string;
  planId: string | null;
  status: "active" | "expired" | "cancelled";
  startsAt: string;
  expiresAt: string;
  grantedManually: boolean;
  grantedBy: string | null;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionRepository {
  findByUser(userId: string): Promise<SubscriptionRow | null>;
  countActive(nowIso: string): Promise<number>;
}

declare module "./types" {
  interface Repositories {
    events: EventRepository;
    bookmarks: BookmarkRepository;
    viewLog: ViewLogRepository;
    subscriptions: SubscriptionRepository;
  }
}
