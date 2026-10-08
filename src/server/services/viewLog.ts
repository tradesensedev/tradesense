import { isStaff } from "@shared/permissions";
import type { PublicEntityType } from "@shared/constants";
import { sha256Hex } from "../lib/ids";
import { addMinutesIso, nowIso } from "../lib/time";
import type { Repositories, UserRow } from "../repositories/types";

// Privacy: only a salted hash of the IP is stored, never the IP itself.
export async function hashIp(ip: string, salt: string): Promise<string> {
  return (await sha256Hex(`${salt}:${ip}`)).slice(0, 32);
}

const DEDUPE_MINUTES = 10; // reloading a page does not count as a new view

export class ViewLogService {
  constructor(
    private repos: Repositories,
    private salt: string,
  ) {}

  // Never throws: a logging problem must not break the page. Staff views (previews) are not logged.
  async record(user: UserRow | null, ip: string, entityType: PublicEntityType, entityId: string): Promise<void> {
    try {
      if (user && isStaff(user.role)) return;
      const who = { userId: user?.id ?? null, ipHash: await hashIp(ip, this.salt) };
      if (await this.repos.viewLog.existsSince(who, entityType, entityId, addMinutesIso(nowIso(), -DEDUPE_MINUTES))) return;
      await this.repos.viewLog.add({ ...who, entityType, entityId });
    } catch (e) {
      console.error("view log failed", e);
    }
  }
}
