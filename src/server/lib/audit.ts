import type { Context } from "hono";
import type { AppEnv } from "../env";

// Every admin action calls this once, after the change succeeded.
export async function audit(
  c: Context<AppEnv>,
  action: string,
  entity: string,
  entityId: string | null,
  diff?: unknown,
): Promise<void> {
  await c.var.repos.audit.add({ userId: c.var.user?.id ?? null, action, entity, entityId, diff });
}
