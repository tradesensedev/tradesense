import type { Repositories } from "../types";
import { D1AuditRepository } from "./audit";
import { D1MagicLinkRepository } from "./magicLinks";
import { D1MarketRepository } from "./markets";
import { D1SessionRepository } from "./sessions";
import { D1SettingsRepository } from "./settings";
import { D1UserRepository } from "./users";

// THE factory. Routes/services get Repositories only, never the D1 binding.
// Postgres later: add repositories/pg/index.ts exporting createRepositories(pool) with the same shape.
export function createRepositories(db: D1Database): Repositories {
  return {
    users: new D1UserRepository(db),
    sessions: new D1SessionRepository(db),
    magicLinks: new D1MagicLinkRepository(db),
    settings: new D1SettingsRepository(db),
    audit: new D1AuditRepository(db),
    markets: new D1MarketRepository(db),
  };
}
