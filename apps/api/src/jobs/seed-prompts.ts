import { createDb } from "../../../../packages/db/client";
import { promptTemplates } from "../../../../packages/db/schema";
import { promptTemplateSeeds } from "../lib/ai/prompts";
import type { Env } from "../types";

export async function seedPrompts(env: Env) {
  const db = createDb(env.DB);

  for (const seed of promptTemplateSeeds) {
    await db
      .insert(promptTemplates)
      .values({
        id: seed.id,
        taskType: seed.taskType,
        systemPrompt: seed.systemPrompt,
        userPromptTemplate: seed.userPromptTemplate,
        variables: seed.variables,
        active: true,
      })
      .onConflictDoUpdate({
        target: promptTemplates.id,
        set: {
          systemPrompt: seed.systemPrompt,
          userPromptTemplate: seed.userPromptTemplate,
          variables: seed.variables,
          active: true,
        },
      });
  }

  return { seeded: promptTemplateSeeds.length };
}
