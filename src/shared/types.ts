import type { Role } from "./constants";
import type { Settings } from "./settings";

// Safe user shape sent to the browser (never includes hashes or secrets).
export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  timezone: string;
  totpEnabled: boolean;
}

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export interface MeResponse {
  user: PublicUser | null;
  csrfToken: string | null;
}

// ---- admin DTOs (same shapes as repository rows) ----
export interface MarketDto {
  id: string;
  symbol: string;
  name: string;
  category: string;
  active: boolean;
  sortOrder: number;
}

export interface AnalystDto {
  id: string;
  name: string;
  bio: string;
  avatarAttachmentId: string | null;
  active: boolean;
}

export interface TagDto {
  id: string;
  name: string;
  slug: string;
  uses: number;
}

export interface LookupsResponse {
  markets: MarketDto[];
  analysts: AnalystDto[];
  tags: TagDto[];
  settings: Settings;
}
