import type { Access, PostType, Role } from "@shared/constants";
import { isStaff } from "@shared/permissions";
import type { AccessInfo } from "@shared/public";
import { OPEN_ACCESS } from "@shared/public";
import { addDaysDate, nowIso } from "../lib/time";
import type { Repositories, UserRow } from "../repositories/types";
import { SettingsService } from "./settings";

// ONE place that decides who may see what. Everything else (public lists, detail, files) asks this service.
//
// Rules (all numbers come from settings, nothing is hard-coded):
//  - Entitled viewers (staff, or a user with an active, unexpired subscription) see everything that is published.
//  - Everyone else:
//      * an item whose content date is at least `open_archive_days` days old is open (open archive; 0 = archive switched off)
//      * otherwise a FREE item opens `free_delay_hours` after it was published (0 = at once)
//      * otherwise a PAID item stays locked
export interface Viewer {
  userId: string | null;
  role: Role | null;
  entitled: boolean;
}

export const ANONYMOUS: Viewer = { userId: null, role: null, entitled: false };

export interface AccessPolicy {
  freeDelayHours: number;
  openArchiveDays: number;
}

// The same numbers drive the SQL filters of the public list (Part 3) and the per-item check below,
// so the two can never disagree.
export interface Visibility {
  all: boolean; // entitled viewer: no restriction
  freeBefore: string; // FREE items published at or before this instant are open
  archiveBefore: string | null; // items whose content date is <= this YYYY-MM-DD are open (null = archive off)
}

export interface AccessItem {
  access: Access;
  publishedAt: string | null;
  contentDate: string; // YYYY-MM-DD, see contentEndDate()
}

// Weekly posts count as old only once the whole week is over (Monday + 6 days).
export function contentEndDate(type: PostType, postDate: string, weekStartDate: string): string {
  return type === "weekly" ? addDaysDate(weekStartDate, 6) : postDate;
}

export function visibilityFor(viewer: Viewer, policy: AccessPolicy, now: string): Visibility {
  return {
    all: viewer.entitled,
    freeBefore: new Date(new Date(now).getTime() - policy.freeDelayHours * 3_600_000).toISOString(),
    archiveBefore: policy.openArchiveDays > 0 ? addDaysDate(now.slice(0, 10), -policy.openArchiveDays) : null,
  };
}

export function isOpen(v: Visibility, item: AccessItem): boolean {
  if (v.all) return true;
  if (v.archiveBefore !== null && item.contentDate <= v.archiveBefore) return true;
  return item.access === "free" && item.publishedAt !== null && item.publishedAt <= v.freeBefore;
}

export function evaluateAccess(viewer: Viewer, policy: AccessPolicy, item: AccessItem, now: string): AccessInfo {
  const v = visibilityFor(viewer, policy, now);
  if (isOpen(v, item)) return OPEN_ACCESS;
  const archiveOpens =
    policy.openArchiveDays > 0 ? `${addDaysDate(item.contentDate, policy.openArchiveDays)}T00:00:00.000Z` : null;
  if (item.access === "free" && item.publishedAt) {
    const delayEnds = new Date(new Date(item.publishedAt).getTime() + policy.freeDelayHours * 3_600_000).toISOString();
    const unlocksAt = archiveOpens && archiveOpens < delayEnds ? archiveOpens : delayEnds;
    return { state: "delayed", unlocksAt };
  }
  return { state: "locked", unlocksAt: archiveOpens };
}

export class AccessService {
  constructor(private repos: Repositories) {}

  async policy(): Promise<AccessPolicy> {
    const s = await new SettingsService(this.repos).getAll();
    return { freeDelayHours: s.free_delay_hours, openArchiveDays: s.open_archive_days };
  }

  async viewerFor(user: UserRow | null, now: string = nowIso()): Promise<Viewer> {
    if (!user) return ANONYMOUS;
    if (isStaff(user.role)) return { userId: user.id, role: user.role, entitled: true };
    const sub = await this.repos.subscriptions.findByUser(user.id);
    const entitled = !!sub && sub.status === "active" && sub.startsAt <= now && sub.expiresAt > now;
    return { userId: user.id, role: user.role, entitled };
  }

  // Convenience for one-off checks (files, detail pages).
  async check(user: UserRow | null, item: AccessItem): Promise<AccessInfo> {
    const now = nowIso();
    return evaluateAccess(await this.viewerFor(user, now), await this.policy(), item, now);
  }
}
