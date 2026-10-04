import type { Role } from "@shared/constants";

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
}

// One factory returns all repositories. Postgres later = new factory, same interfaces.
export interface Repositories {
  users: UserRepository;
  sessions: SessionRepository;
  magicLinks: MagicLinkRepository;
  settings: SettingsRepository;
  audit: AuditRepository;
  markets: MarketRepository;
}
