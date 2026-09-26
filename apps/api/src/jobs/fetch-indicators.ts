import { createDb } from "../../../../packages/db/client";
import { indicators } from "../../../../packages/db/schema";
import { loadIndicatorData } from "../lib/data-source";
import type { Env } from "../types";
import type { EnrichmentMessage } from "./ai-enrich";

export async function fetchIndicators(env: Env) {
  const db = createDb(env.DB);
  const data = (await loadIndicatorData(env)) as any[];

  for (const row of data) {
    await db
      .insert(indicators)
      .values({
        id: row.id,
        type: row.type,
        country: row.country,
        value: row.value,
        date: new Date(row.date),
      })
      .onConflictDoUpdate({
        target: indicators.id,
        set: {
          value: row.value,
          date: new Date(row.date),
        },
      });

    // indicators-এ কোনো forecast ফিল্ড নেই (schema.ts / ROADMAP দুটোতেই),
    // তাই surpriseTag এখানে প্রযোজ্য না — null পাঠাচ্ছি, prompt-এ এটা
    // স্বয়ংক্রিয়ভাবে "N/A" হয়ে যাবে।
    const message: EnrichmentMessage = {
      taskType: "indicator",
      recordId: row.id,
      variables: {
        type: row.type,
        country: row.country,
        value: row.value,
        surpriseTag: null,
      },
    };
    await env.AI_QUEUE.send(message);
  }

  return { inserted: data.length, queued: data.length };
}
