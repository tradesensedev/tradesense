import type { CreateEventInput, UpdateEventInput } from "@shared/events";
import { notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { addDaysDate } from "../lib/time";
import type { EventRow } from "../repositories/publicTypes";
import type { Repositories } from "../repositories/types";
import type { Actor } from "./posts";

export interface EventQuery {
  from?: string; // YYYY-MM-DD inclusive
  to?: string; // YYYY-MM-DD inclusive
  impact?: ("low" | "medium" | "high")[];
  currency?: string;
  q?: string;
  order: "asc" | "desc";
  limit: number;
  offset: number;
}

// Day range -> ISO range (end is exclusive: midnight of the day after `to`).
export function dayRange(from?: string, to?: string): { from?: string; to?: string } {
  return {
    from: from ? `${from}T00:00:00.000Z` : undefined,
    to: to ? `${addDaysDate(to, 1)}T00:00:00.000Z` : undefined,
  };
}

export class EventService {
  constructor(private repos: Repositories) {}

  async list(q: EventQuery) {
    const r = dayRange(q.from, q.to);
    return this.repos.events.list({
      from: r.from,
      to: r.to,
      impacts: q.impact,
      currency: q.currency,
      q: q.q,
      order: q.order,
      limit: q.limit,
      offset: q.offset,
    });
  }

  private async mustFind(id: string): Promise<EventRow> {
    const e = await this.repos.events.findById(id);
    if (!e) throw notFound("Event not found");
    return e;
  }

  // Hand-entered events are always source "manual" ("calendar" is reserved for a future import).
  async create(actor: Actor, input: CreateEventInput) {
    return this.repos.events.create({
      id: newId(),
      title: input.title,
      startsAt: input.startsAt,
      impact: input.impact,
      currency: input.currency,
      source: "manual",
      descriptionMd: input.descriptionMd,
      createdBy: actor.id,
    });
  }

  async update(id: string, patch: UpdateEventInput) {
    const before = await this.mustFind(id);
    await this.repos.events.update(id, patch);
    return { before, after: await this.mustFind(id) };
  }

  async delete(id: string) {
    const before = await this.mustFind(id);
    await this.repos.events.delete(id);
    return before;
  }
}
