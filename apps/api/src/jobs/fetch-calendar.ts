import { createDb } from "../../../../packages/db/client";
import { calendarEvents } from "../../../../packages/db/schema";
import { loadCalendarData } from "../lib/data-source";
import { tagEconomicSurprise } from "../lib/rules";
import type { Env } from "../types";
import type { EnrichmentMessage } from "./ai-enrich";

export async function fetchCalendar(env: Env) {
  const db = createDb(env.DB);
  const data = (await loadCalendarData(env)) as any[];

  for (const row of data) {
    await db
      .insert(calendarEvents)
      .values({
        id: row.id,
        name: row.name,
        currency: row.currency,
        impact: row.impact,
        scheduledAt: new Date(row.scheduledAt),
        forecast: row.forecast,
        previous: row.previous,
        actual: row.actual,
      })
      .onConflictDoUpdate({
        target: calendarEvents.id,
        set: {
          forecast: row.forecast,
          previous: row.previous,
          actual: row.actual,
          scheduledAt: new Date(row.scheduledAt),
        },
      });

    const surpriseTag = tagEconomicSurprise(row.actual, row.forecast);

    const message: EnrichmentMessage = {
      taskType: "calendar",
      recordId: row.id,
      variables: {
        name: row.name,
        currency: row.currency,
        forecast: row.forecast,
        previous: row.previous,
        actual: row.actual,
        surpriseTag,
      },
    };
    await env.AI_QUEUE.send(message);
  }

  return { inserted: data.length, queued: data.length };
}
