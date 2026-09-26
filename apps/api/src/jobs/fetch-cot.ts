import { createDb } from "../../../../packages/db/client";
import { cotReports } from "../../../../packages/db/schema";
import { loadCOTData } from "../lib/data-source";
import type { Env } from "../types";
import type { EnrichmentMessage } from "./ai-enrich";

export async function fetchCOT(env: Env) {
  const db = createDb(env.DB);
  const data = (await loadCOTData(env)) as any[];

  for (const row of data) {
    await db
      .insert(cotReports)
      .values({
        id: row.id,
        pair: row.pair,
        commercialNet: row.commercialNet,
        noncommercialNet: row.noncommercialNet,
        retailNet: row.retailNet,
        weekOf: new Date(row.weekOf),
      })
      .onConflictDoUpdate({
        target: cotReports.id,
        set: {
          commercialNet: row.commercialNet,
          noncommercialNet: row.noncommercialNet,
          retailNet: row.retailNet,
          weekOf: new Date(row.weekOf),
        },
      });

    // historical net positions এখনো D1-এ জমা রাখা হচ্ছে না (প্রতি pair-এর
    // জন্য একটাই row upsert হয়), তাই tagCOTPositioning()-এর জন্য দরকারি
    // ৫+ সপ্তাহের ডেটা নেই — positioningTag আপাতত null। historical
    // storage আলাদা ফেজে যোগ হবে।
    const message: EnrichmentMessage = {
      taskType: "cot",
      recordId: row.id,
      variables: {
        pair: row.pair,
        commercialNet: row.commercialNet,
        noncommercialNet: row.noncommercialNet,
        retailNet: row.retailNet,
        positioningTag: null,
      },
    };
    await env.AI_QUEUE.send(message);
  }

  return { inserted: data.length, queued: data.length };
}
