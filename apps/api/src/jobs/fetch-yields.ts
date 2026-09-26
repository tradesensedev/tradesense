import { createDb } from "../../../../packages/db/client";
import { yields } from "../../../../packages/db/schema";
import { loadYieldData } from "../lib/data-source";
import type { Env } from "../types";

export async function fetchYields(env: Env) {
  const db = createDb(env.DB);
  const data = (await loadYieldData(env)) as any[];

  for (const row of data) {
    await db
      .insert(yields)
      .values({
        id: row.id,
        country: row.country,
        tenor: row.tenor,
        value: row.value,
        date: new Date(row.date),
      })
      .onConflictDoUpdate({
        target: yields.id,
        set: {
          value: row.value,
          date: new Date(row.date),
        },
      });
  }

  return { inserted: data.length };
}