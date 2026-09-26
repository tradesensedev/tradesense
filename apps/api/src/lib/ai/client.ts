import { eq, and } from "drizzle-orm";
import { createDb } from "../../../../../packages/db/client";
import { promptTemplates } from "../../../../../packages/db/schema";
import type { Env } from "../../types";

// Strongest free-tier text model first, with one smaller fallback in case
// the primary model is ever unavailable on this account.
const MODELS_IN_ORDER = [
  "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  "@cf/meta/llama-3.1-8b-instruct",
] as const;

function fillTemplate(template: string, variables: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = variables[key];
    if (value === null || value === undefined) return "N/A";
    return String(value);
  });
}

interface WorkersAIChatResponse {
  response?: string;
}

/**
 * 1. Loads the active prompt_template row for `taskType` from D1.
 * 2. Fills {variables} into its user_prompt_template.
 * 3. Calls Cloudflare Workers AI (via the AI binding — no API key needed)
 *    using the strongest available free-tier model, falling back to a
 *    smaller model if the first one errors out.
 * 4. Returns the generated text.
 */
export async function enrichContent(
  env: Env,
  taskType: string,
  variables: Record<string, unknown>
): Promise<string> {
  const db = createDb(env.DB);

  const rows = await db
    .select()
    .from(promptTemplates)
    .where(and(eq(promptTemplates.taskType, taskType), eq(promptTemplates.active, true)))
    .limit(1);

  const template = rows[0];
  if (!template) {
    throw new Error(`No active prompt_template found for taskType "${taskType}"`);
  }

  const userPrompt = fillTemplate(template.userPromptTemplate, variables);

  const errors: string[] = [];

  for (const model of MODELS_IN_ORDER) {
    try {
      const result = (await env.AI.run(model as any, {
        messages: [
          { role: "system", content: template.systemPrompt },
          { role: "user", content: userPrompt },
        ],
      })) as WorkersAIChatResponse;

      const text = result.response?.trim();
      if (text) return text;

      errors.push(`[${model}] returned empty response`);
    } catch (err: any) {
      errors.push(`[${model}] ${err.message ?? String(err)}`);
    }
  }

  throw new Error(`All Workers AI models failed:\n${errors.join("\n")}`);
}
