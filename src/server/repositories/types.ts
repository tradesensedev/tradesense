// Phase 3 additions on top of the Phase 2 file (types.base.ts, unchanged).
// Names declared here win over the re-exported ones (same name = extended interface).
import type { AttachmentAccess, AttachmentKind, AttachmentOwnerType, Outcome, PostType, Role } from "@shared/constants";
import type {
  AttachmentRepository as BaseAttachmentRepository,
  AttachmentRow,
  AuditRepository as BaseAuditRepository,
  AuditRow,
  PostRow,
  Repositories as BaseRepositories,
  RevisionRepository as BaseRevisionRepository,
  RevisionRow,
  UserRepository as BaseUserRepository,
  UserRow,
} from "./types.base";

export * from "./types.base";

// ---------- results ----------
export interface ResultRow {
  id: string;
  postId: string;
  outcome: Outcome;
  noteMd: string;
  evaluatedBy: string;
  evaluatedAt: string;
  evaluationRuleVersion: number;
}

export interface CorrectionRow {
  id: string;
  resultId: string;
  newOutcome: Outcome;
  reasonMd: string;
  createdBy: string;
  createdAt: string;
}

export type PostBrief = Pick<
  PostRow,
  "id" | "type" | "marketId" | "postDate" | "weekStartDate" | "bias" | "confidence" | "title" | "validUntil" | "analystId" | "access"
>;

export interface QueueFilter {
  marketId?: string;
  type?: PostType;
  limit: number;
  offset: number;
}

export interface ResultFilter {
  outcome?: Outcome; // matches the EFFECTIVE outcome (latest correction wins)
  marketId?: string;
  type?: PostType;
  dateFrom?: string;
  dateTo?: string;
  evaluatedBy?: string;
  ruleVersion?: number;
  q?: string;
  limit: number;
  offset: number;
}

export interface ResultListRow {
  result: ResultRow;
  post: PostBrief;
  effectiveOutcome: Outcome;
  correctionCount: number;
}

export interface ResultRepository {
  findById(id: string): Promise<ResultRow | null>;
  findByPostId(postId: string): Promise<ResultRow | null>;
  // Triggers enforce: published post, past valid_until, no UPDATE/DELETE ever.
  create(row: Omit<ResultRow, "evaluatedAt">): Promise<ResultRow>;
  listCorrections(resultId: string): Promise<CorrectionRow[]>;
  addCorrection(row: Omit<CorrectionRow, "createdAt">): Promise<CorrectionRow>;
  // Published posts past valid_until that still have no result (oldest first).
  queue(f: QueueFilter, nowIso: string): Promise<{ items: PostBrief[]; total: number }>;
  countQueue(nowIso: string): Promise<number>;
  list(f: ResultFilter): Promise<{ items: ResultListRow[]; total: number }>;
}

// ---------- evaluation rules (append-only: a change = a new version) ----------
export interface EvaluationRuleRow {
  id: string;
  version: number;
  textMd: string;
  activeFrom: string;
}

export interface EvaluationRuleRepository {
  list(): Promise<EvaluationRuleRow[]>; // newest version first
  findByVersion(version: number): Promise<EvaluationRuleRow | null>;
  latest(): Promise<EvaluationRuleRow | null>;
  create(row: Omit<EvaluationRuleRow, "id" | "version">): Promise<EvaluationRuleRow>; // version = max + 1
}

// ---------- plans ----------
export interface PlanRow {
  id: string;
  code: string;
  name: string;
  durationDays: number;
  priceUsd: number;
  active: boolean;
  sortOrder: number;
}

export interface RegionPriceRow {
  planId: string;
  countryCode: string;
  priceUsd: number;
}

export interface PlanRepository {
  list(opts?: { activeOnly?: boolean }): Promise<PlanRow[]>;
  findById(id: string): Promise<PlanRow | null>;
  findByCode(code: string): Promise<PlanRow | null>;
  create(input: Omit<PlanRow, "id">): Promise<PlanRow>;
  update(id: string, patch: Partial<Omit<PlanRow, "id" | "code">>): Promise<void>;
  listRegionPrices(planId: string): Promise<RegionPriceRow[]>;
  replaceRegionPrices(planId: string, rows: { countryCode: string; priceUsd: number }[]): Promise<void>; // atomic
}

// ---------- saved views ----------
export interface SavedViewRow {
  id: string;
  userId: string;
  scope: string;
  name: string;
  filtersJson: string;
  columnsJson: string;
  shared: boolean;
  createdAt: string;
}

export interface SavedViewRepository {
  // The user's own views plus views shared by others, for one scope.
  listVisible(scope: string, userId: string): Promise<SavedViewRow[]>;
  findById(id: string): Promise<SavedViewRow | null>;
  create(row: Omit<SavedViewRow, "createdAt">): Promise<SavedViewRow>;
  update(id: string, patch: Partial<Pick<SavedViewRow, "name" | "filtersJson" | "columnsJson" | "shared">>): Promise<void>;
  delete(id: string): Promise<void>;
}

// ---------- extended Phase 2 repositories ----------
export interface UserFilter {
  role?: Role;
  q?: string;
  limit: number;
  offset: number;
}

export interface UserRepository extends BaseUserRepository {
  search(f: UserFilter): Promise<{ items: UserRow[]; total: number }>;
  findManyByIds(ids: string[]): Promise<UserRow[]>; // resolves names for audit/revision/media screens
}

export interface AuditFilter {
  userId?: string;
  action?: string; // exact, or a prefix when it ends with "."
  entity?: string;
  entityId?: string;
  dateFrom?: string; // YYYY-MM-DD (UTC day, inclusive)
  dateTo?: string;
  limit: number;
  offset: number;
}

export interface AuditRepository extends Omit<BaseAuditRepository, "list"> {
  list(f: AuditFilter): Promise<{ items: AuditRow[]; total: number }>;
}

export interface RevisionFilter {
  entityType?: "post" | "note";
  entityId?: string;
  editedBy?: string;
  dateFrom?: string;
  dateTo?: string;
  limit: number;
  offset: number;
}

export interface RevisionRepository extends BaseRevisionRepository {
  list(f: RevisionFilter): Promise<{ items: RevisionRow[]; total: number }>; // across all entities
}

export interface AttachmentFilter {
  ownerType?: AttachmentOwnerType;
  kind?: AttachmentKind;
  access?: AttachmentAccess;
  uploadedBy?: string;
  locked?: boolean;
  q?: string; // caption substring or sha256 prefix
  dateFrom?: string;
  dateTo?: string;
  limit: number;
  offset: number;
}

export interface AttachmentRepository extends BaseAttachmentRepository {
  list(f: AttachmentFilter): Promise<{ items: AttachmentRow[]; total: number }>; // global, for the media screen
}

// One factory returns all repositories. Postgres later = new factory, same interfaces.
export interface Repositories
  extends Omit<BaseRepositories, "users" | "audit" | "revisions" | "attachments"> {
  users: UserRepository;
  audit: AuditRepository;
  revisions: RevisionRepository;
  attachments: AttachmentRepository;
  results: ResultRepository;
  evaluationRules: EvaluationRuleRepository;
  plans: PlanRepository;
  savedViews: SavedViewRepository;
}
