import type { Context } from "hono";
import type { z } from "zod";
import { badRequest } from "./errors";

// Every endpoint parses its JSON body through a Zod schema via this helper.
export async function parseJson<S extends z.ZodTypeAny>(c: Context<any>, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    throw badRequest("Invalid JSON body");
  }
  const result = schema.safeParse(raw);
  if (!result.success) throw badRequest("Validation failed", result.error.flatten());
  return result.data;
}

// Query-string equivalent for GET endpoints.
export function parseQuery<S extends z.ZodTypeAny>(c: Context<any>, schema: S): z.infer<S> {
  const result = schema.safeParse(c.req.query());
  if (!result.success) throw badRequest("Invalid query", result.error.flatten());
  return result.data;
}
