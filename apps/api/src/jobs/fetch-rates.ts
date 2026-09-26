import { createDb } from "../../../../packages/db/client";
import { centralBanks } from "../../../../packages/db/schema";
import { loadCentralBankData } from "../lib/data-source";
import type { Env } from "../types";
import type { EnrichmentMessage } from "./ai-enrich";

export async function fetchRates(env: Env) {
  const db = createDb(env.DB);
  const data = (await loadCentralBankData(env)) as any[];

  for (const row of data) {
    await db
      .insert(centralBanks)
      .values({
        id: row.id,
        name: row.name,
        currency: row.currency,
        currentRate: row.currentRate,
        stance: row.stance,
        nextMeetingAt: row.nextMeetingAt ? new Date(row.nextMeetingAt) : null,
      })
      .onConflictDoUpdate({
        target: centralBanks.id,
        set: {
          currentRate: row.currentRate,
          stance: row.stance,
          nextMeetingAt: row.nextMeetingAt ? new Date(row.nextMeetingAt) : null,
        },
      });

    const message: EnrichmentMessage = {
      taskType: "central_bank",
      recordId: row.id,
      variables: {
        name: row.name,
        currency: row.currency,
        currentRate: row.currentRate,
        stance: row.stance,
      },
    };
    await env.AI_QUEUE.send(message);
  }

  return { inserted: data.length, queued: data.length };
}
