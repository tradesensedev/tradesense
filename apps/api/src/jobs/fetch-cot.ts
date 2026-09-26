import { createDb } from "../../../../packages/db/client";
import { cotReports } from "../../../../packages/db/schema";
import { loadCOTData } from "../lib/data-source";
import type { Env } from "../types";

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
  }

  return { inserted: data.length };
}
