import type { Role } from "./constants";

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
