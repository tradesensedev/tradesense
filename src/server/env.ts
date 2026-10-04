import type { Repositories, SessionRow, UserRow } from "./repositories/types";

export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
  KV: KVNamespace;
  ASSETS: Fetcher;
  APP_NAME: string;
  APP_URL: string;
  SESSION_SECRET: string;
  IP_HASH_SALT: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  NOWPAYMENTS_API_KEY?: string;
  NOWPAYMENTS_IPN_SECRET?: string;
};

export type Variables = {
  repos: Repositories;
  user: UserRow | null;
  session: SessionRow | null;
  ip: string;
};

export type AppEnv = { Bindings: Bindings; Variables: Variables };
