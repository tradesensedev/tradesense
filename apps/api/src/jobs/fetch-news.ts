import { createDb } from "../../../../packages/db/client";
import { newsItems } from "../../../../packages/db/schema";
import { loadNewsData } from "../lib/data-source";
import type { Env } from "../types";
import type { EnrichmentMessage } from "./ai-enrich";

export async function fetchNews(env: Env) {
  const db = createDb(env.DB);
  const data = (await loadNewsData(env)) as any[];

  for (const row of data) {
    await db
      .insert(newsItems)
      .values({
        id: row.id,
        title: row.title,
        body: row.body,
        source: row.source,
        affectedPairs: row.affectedPairs,
        publishedAt: new Date(row.publishedAt),
      })
      .onConflictDoUpdate({
        target: newsItems.id,
        set: {
          title: row.title,
          body: row.body,
          affectedPairs: row.affectedPairs,
          publishedAt: new Date(row.publishedAt),
        },
      });

    // sentiment ইচ্ছাকৃতভাবে এখানে সেট করছি না — mock data-তে যে
    // sentiment আছে সেটা placeholder, আসল sentiment AI enrichment
    // (ai-enrich.ts-এর "news" case) থেকে বসবে।
    const message: EnrichmentMessage = {
      taskType: "news",
      recordId: row.id,
      variables: {
        title: row.title,
        body: row.body,
        source: row.source,
      },
    };
    await env.AI_QUEUE.send(message);
  }

  return { inserted: data.length, queued: data.length };
}
