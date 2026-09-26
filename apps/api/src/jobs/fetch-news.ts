import { createDb } from "../../../../packages/db/client";
import { newsItems } from "../../../../packages/db/schema";
import { loadNewsData } from "../lib/data-source";
import type { Env } from "../types";

export async function fetchNews(env: Env) {
  const db = createDb(env.DB);
  const data = (await loadNewsData(env)) as any[];

  for (const row of data) {
    await db
      .insert(newsItems)
      .values({
        id: row.id,
        title: row.title,
        source: row.source,
        url: row.url,
        publishedAt: new Date(row.publishedAt),
        sentiment: row.sentiment,
        accessLevel: row.accessLevel ?? "public",
      })
      .onConflictDoUpdate({
        target: newsItems.id,
        set: {
          title: row.title,
          sentiment: row.sentiment,
          publishedAt: new Date(row.publishedAt),
        },
      });
  }

  return { inserted: data.length };
}
