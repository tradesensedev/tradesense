import { createDb } from "../../../../packages/db/client";
import { indicators } from "../../../../packages/db/schema";
import { loadIndicatorData } from "../lib/data-source";
import type { Env } from "../types";

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
  }

  return { inserted: data.length };
}
