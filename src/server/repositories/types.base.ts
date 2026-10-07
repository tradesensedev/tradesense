import type {
  Access,
  AttachmentAccess,
  AttachmentKind,
  AttachmentOwnerType,
  Bias,
  Confidence,
  Killzone,
  NoteStatus,
  PostType,
  PublishStatus,
  Role,
  Sentiment,
} from "@shared/constants";

// ---------- Row shapes (DB-neutral, camelCase) ----------
export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: Role;
  passwordHash: string | null; // null for magic-link-only members
  totpSecret: string | null; // null = TOTP disabled
  timezone: string;
  createdAt: string;
}

export interface SessionRow {
  id: string; // sha256 hex of the cookie token (raw token never stored)
  userId: string;
  csrfToken: string;
  ipHash: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface MagicLinkRow {
  id: string; // sha256 hex of the emailed token
  email: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
}

export interface SettingRow {
  key: string;
  valueJson: string;
  updatedBy: string | null;
  updatedAt: string;
}

export interface AuditRow {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  diffJson: string | null;
  createdAt: string;
}

export interface MarketRow {
  id: string;
  symbol: string;
  name: string;
  category: string;
  active: boolean;
  sortOrder: number;
}

export interface AnalystRow {
  id: string;
  name: string;
  bio: string;
  avatarAttachmentId: string | null;
  active: boolean;
}

export interface TagRow {
  id: string;
  name: string;
  slug: string;
}

export interface TagWithUses extends TagRow {
  uses: number;
}

export interface PostRow {
  id: string;
  type: PostType;
  marketId: string;
  postDate: string; // YYYY-MM-DD
  weekStartDate: string; // YYYY-MM-DD (Monday)
  bias: Bias;
  confidence: Confidence;
  sentiment: Sentiment | null;
  title: string;
  summary: string;
  bodyMd: string;
  keyDriversMd: string;
  riskEventsMd: string;
  invalidationMd: string;
  access: Access;
  status: PublishStatus;
  publishAt: string | null;
  validFrom: string | null;
  validUntil: string | null;
  analystId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export type PostPatch = Partial<Omit<PostRow, "id" | "createdBy" | "createdAt" | "updatedAt">>;

export interface PostFilter {
  status?: PublishStatus;
  type?: PostType;
  marketId?: string;
  analystId?: string;
  createdBy?: string;
  dateFrom?: string; // post_date >= (daily) / week_start_date >= (weekly)
  dateTo?: string;
  q?: string;
  limit: number;
  offset: number;
}

export interface NoteRow {
  id: string;
  marketId: string;
  killzone: Killzone;
  noteDate: string;
  linkedPostId: string;
  status: NoteStatus;
  confidence: Confidence | null;
  title: string;
  noteMd: string;
  access: Access;
  publishStatus: PublishStatus;
  publishAt: string | null;
  analystId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

export type NotePatch = Partial<Omit<NoteRow, "id" | "createdBy" | "createdAt" | "updatedAt">>;

export interface NoteFilter {
  publishStatus?: PublishStatus;
  status?: NoteStatus;
  killzone?: Killzone;
  marketId?: string;
  analystId?: string;
  createdBy?: string;
  linkedPostId?: string;
  dateFrom?: string;
  dateTo?: string;
  q?: string;
  limit: number;
  offset: number;
}

export interface RevisionRow {
  id: string;
  entityType: "post" | "note";
  entityId: string;
  oldJson: string;
  newJson: string;
  editedBy: string;
  editedAt: string;
}

export interface NewRevision {
  entityType: "post" | "note";
  entityId: string;
  oldJson: string;
  newJson: string;
  editedBy: string;
}

export interface AttachmentRow {
  id: string;
  ownerType: AttachmentOwnerType;
  ownerId: string;
  kind: AttachmentKind;
  r2Key: string;
  mime: string;
  size: number;
  sha256: string;
  caption: string;
  access: AttachmentAccess;
  uploadedBy: string;
  uploadedAt: string;
  locked: boolean;
}

export type NewAttachment = Omit<AttachmentRow, "uploadedAt" | "locked">;

// ---------- Repository interfaces (no SQL, no D1 types here) ----------
export interface UserRepository {
  findById(id: string): Promise<UserRow | null>;
  findByEmail(email: string): Promise<UserRow | null>;
  create(input: Omit<UserRow, "id" | "createdAt">): Promise<UserRow>;
  update(id: string, patch: Partial<Pick<UserRow, "name" | "role" | "passwordHash" | "totpSecret" | "timezone">>): Promise<void>;
  list(opts: { limit: number; offset: number }): Promise<UserRow[]>;
  count(): Promise<number>;
}

export interface SessionRepository {
  create(row: SessionRow): Promise<void>;
  findById(id: string): Promise<SessionRow | null>;
  delete(id: string): Promise<void>;
  deleteByUser(userId: string): Promise<void>;
  deleteExpired(nowIso: string): Promise<void>;
}

export interface MagicLinkRepository {
  create(row: Omit<MagicLinkRow, "usedAt">): Promise<void>;
  // Atomically marks as used; returns the row only if it was valid and unused.
  consume(id: string, nowIso: string): Promise<MagicLinkRow | null>;
}

export interface SettingsRepository {
  get(key: string): Promise<SettingRow | null>;
  getAll(): Promise<SettingRow[]>;
  set(key: string, valueJson: string, updatedBy: string | null): Promise<void>;
}

export interface AuditRepository {
  add(entry: { userId: string | null; action: string; entity: string; entityId?: string | null; diff?: unknown }): Promise<void>;
  list(opts: { limit: number; offset: number }): Promise<AuditRow[]>;
}

export interface MarketRepository {
  list(opts?: { activeOnly?: boolean }): Promise<MarketRow[]>;
  findById(id: string): Promise<MarketRow | null>;
  findBySymbol(symbol: string): Promise<MarketRow | null>;
  create(input: Omit<MarketRow, "id">): Promise<MarketRow>;
  update(id: string, patch: Partial<Omit<MarketRow, "id" | "symbol">>): Promise<void>;
}

export interface AnalystRepository {
  list(opts?: { activeOnly?: boolean }): Promise<AnalystRow[]>;
  findById(id: string): Promise<AnalystRow | null>;
  create(input: Omit<AnalystRow, "id" | "avatarAttachmentId">): Promise<AnalystRow>;
  update(id: string, patch: Partial<Pick<AnalystRow, "name" | "bio" | "active">>): Promise<void>;
}

export interface TagRepository {
  list(): Promise<TagWithUses[]>;
  findById(id: string): Promise<TagRow | null>;
  findBySlug(slug: string): Promise<TagRow | null>;
  create(input: Omit<TagRow, "id">): Promise<TagRow>;
  update(id: string, patch: { name: string }): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface PostRepository {
  findById(id: string): Promise<PostRow | null>;
  // daily: dateKey = post_date; weekly: dateKey = week_start_date. At most one row exists (unique index).
  findUnique(type: PostType, marketId: string, dateKey: string): Promise<PostRow | null>;
  // Daily post of that day + weekly post of that week, for note linking.
  suggestForNote(marketId: string, noteDate: string, weekStartDate: string): Promise<PostRow[]>;
  list(filter: PostFilter): Promise<{ items: PostRow[]; total: number }>;
  create(row: Omit<PostRow, "createdAt" | "updatedAt">): Promise<PostRow>;
  // With `revision`, the update and the revision row are written in one atomic batch.
  update(id: string, patch: PostPatch, revision?: NewRevision): Promise<PostRow>;
  delete(id: string): Promise<void>;
  getTagIds(id: string): Promise<string[]>;
  setTags(id: string, tagIds: string[]): Promise<void>;
}

export interface NoteRepository {
  findById(id: string): Promise<NoteRow | null>;
  list(filter: NoteFilter): Promise<{ items: NoteRow[]; total: number }>;
  create(row: Omit<NoteRow, "createdAt" | "updatedAt">): Promise<NoteRow>;
  update(id: string, patch: NotePatch, revision?: NewRevision): Promise<NoteRow>;
  delete(id: string): Promise<void>;
  getTagIds(id: string): Promise<string[]>;
  setTags(id: string, tagIds: string[]): Promise<void>;
}

export interface RevisionRepository {
  listByEntity(entityType: "post" | "note", entityId: string): Promise<RevisionRow[]>;
  countByEntity(entityType: "post" | "note", entityId: string): Promise<number>;
}

export interface AttachmentRepository {
  findById(id: string): Promise<AttachmentRow | null>;
  listByOwner(ownerType: AttachmentOwnerType, ownerId: string): Promise<AttachmentRow[]>;
  // DB triggers may lock the row at insert; the returned row reflects that.
  create(row: NewAttachment): Promise<AttachmentRow>;
  update(id: string, patch: Partial<Pick<AttachmentRow, "caption" | "access">>): Promise<void>;
  delete(id: string): Promise<void>;
}

// One factory returns all repositories. Postgres later = new factory, same interfaces.
export interface Repositories {
  users: UserRepository;
  sessions: SessionRepository;
  magicLinks: MagicLinkRepository;
  settings: SettingsRepository;
  audit: AuditRepository;
  markets: MarketRepository;
  analysts: AnalystRepository;
  tags: TagRepository;
  posts: PostRepository;
  notes: NoteRepository;
  revisions: RevisionRepository;
  attachments: AttachmentRepository;
}
