import type { Repositories } from "../types";
import { D1AnalystRepository } from "./analysts";
import { D1AttachmentRepository } from "./attachments";
import { D1AuditRepository } from "./audit";
import { D1MagicLinkRepository } from "./magicLinks";
import { D1MarketRepository } from "./markets";
import { D1NoteRepository } from "./notes";
import { D1PostRepository } from "./posts";
import { D1RevisionRepository } from "./revisions";
import { D1SessionRepository } from "./sessions";
import { D1SettingsRepository } from "./settings";
import { D1TagRepository } from "./tags";
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
    analysts: new D1AnalystRepository(db),
    tags: new D1TagRepository(db),
    posts: new D1PostRepository(db),
    notes: new D1NoteRepository(db),
    revisions: new D1RevisionRepository(db),
    attachments: new D1AttachmentRepository(db),
  };
}
