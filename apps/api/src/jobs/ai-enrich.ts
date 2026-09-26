import { eq } from "drizzle-orm";
import { createDb } from "../../../../packages/db/client";
import { centralBanks, calendarEvents, indicators, cotReports, newsItems } from "../../../../packages/db/schema";
import { enrichContent } from "../lib/ai/client";
import type { Env } from "../types";

/**
 * Shape of every message pushed onto AI_QUEUE by the fetch-*.ts jobs.
 * `recordId` is the primary key of the row to update once enrichment
 * finishes; `variables` are exactly what enrichContent() needs to fill
 * the prompt template for `taskType`.
 */
export interface EnrichmentMessage {
  taskType: string;
  recordId: string;
  variables: Record<string, unknown>;
}

const ALLOWED_SENTIMENTS = ["bullish", "bearish", "neutral"] as const;

/**
 * Cloudflare Queues consumer for AI_QUEUE.
 * For each message: calls enrichContent() to get AI-generated text, then
 * writes it into the right table/column for that taskType. Messages that
 * fail are retried (Cloudflare redelivers); messages that succeed are
 * acknowledged so they aren't redelivered.
 */
export async function handleQueue(
  batch: MessageBatch<EnrichmentMessage>,
  env: Env
): Promise<void> {
  const db = createDb(env.DB);

  for (const message of batch.messages) {
    const { taskType, recordId, variables } = message.body;

    try {
      const text = await enrichContent(env, taskType, variables);

      switch (taskType) {
        case "central_bank":
          await db
            .update(centralBanks)
            .set({ aiSummary: text })
            .where(eq(centralBanks.id, recordId));
          break;

        case "calendar":
          await db
            .update(calendarEvents)
            .set({
              aiContext: {
                summary: text,
                surpriseTag: (variables.surpriseTag as string | null) ?? null,
                generatedAt: new Date().toISOString(),
              },
            })
            .where(eq(calendarEvents.id, recordId));
          break;

        case "indicator":
          await db
            .update(indicators)
            .set({
              aiContext: {
                summary: text,
                surpriseTag: (variables.surpriseTag as string | null) ?? null,
                generatedAt: new Date().toISOString(),
              },
            })
            .where(eq(indicators.id, recordId));
          break;

        case "cot":
          await db
            .update(cotReports)
            .set({
              aiContext: {
                summary: text,
                positioningTag: (variables.positioningTag as string | null) ?? null,
                generatedAt: new Date().toISOString(),
              },
            })
            .where(eq(cotReports.id, recordId));
          break;

        case "news": {
          // Model is prompted to reply with exactly one word, but we still
          // defensively strip punctuation/whitespace/casing and fall back
          // to "neutral" if it ever says something outside the 3 allowed
          // values.
          const cleaned = text.trim().toLowerCase().replace(/[^a-z]/g, "");
          const sentiment = (ALLOWED_SENTIMENTS as readonly string[]).includes(cleaned)
            ? cleaned
            : "neutral";

          await db
            .update(newsItems)
            .set({ sentiment })
            .where(eq(newsItems.id, recordId));
          break;
        }

        default:
          throw new Error(`No DB write handler for taskType "${taskType}" yet`);
      }

      message.ack();
    } catch (err: any) {
      console.error(`AI enrichment failed for ${taskType}/${recordId}: ${err.message}`);
      message.retry();
    }
  }
}
