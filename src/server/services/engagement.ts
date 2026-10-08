import type { EngagementDto, ViewerDto } from "@shared/engagement";
import type { Repositories } from "../repositories/types";

export class EngagementService {
  constructor(private repos: Repositories) {}

  // Every requested id gets an entry (zeros when nobody viewed or bookmarked it yet).
  async counts(type: "post" | "note", ids: string[]): Promise<Record<string, EngagementDto>> {
    const [views, bookmarks] = await Promise.all([this.repos.viewLog.countByEntities(type, ids), this.repos.bookmarks.countByEntities(type, ids)]);
    const out: Record<string, EngagementDto> = {};
    for (const id of ids) out[id] = { views: views[id]?.views ?? 0, viewers: views[id]?.viewers ?? 0, bookmarks: bookmarks[id] ?? 0 };
    return out;
  }

  // Personal data (names and emails of members): the route is admin-only and audited.
  async viewers(type: "post" | "note", id: string, limit: number): Promise<ViewerDto[]> {
    return this.repos.viewLog.viewersOf(type, id, limit);
  }
}
