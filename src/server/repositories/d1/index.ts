import type { Repositories } from "../types";
import "../listAugment"; // attaches `lists` to the Repositories type
import { D1AnalystRepository } from "./analysts";
import { D1AttachmentRepository } from "./attachments";
import { D1AuditRepository } from "./audit";
import { D1EvaluationRuleRepository } from "./evaluationRules";
import { D1ListRepository } from "./lists";
import { D1MagicLinkRepository } from "./magicLinks";
import { D1MarketRepository } from "./markets";
import { D1NoteRepository } from "./notes";
import { D1PlanRepository } from "./plans";
import { D1PostRepository } from "./posts";
import { D1ResultRepository } from "./results";
import { D1RevisionRepository } from "./revisions";
import { D1SavedViewRepository } from "./savedViews";
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
    results: new D1ResultRepository(db),
    evaluationRules: new D1EvaluationRuleRepository(db),
    plans: new D1PlanRepository(db),
    savedViews: new D1SavedViewRepository(db),
    lists: new D1ListRepository(db),
  };
}
