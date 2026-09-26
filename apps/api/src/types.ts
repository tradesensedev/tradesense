export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  AI_QUEUE: Queue;
  AI: Ai;
  USE_MOCK_DATA: string;
  FRED_API_KEY?: string;
  NEWSAPI_KEY?: string;
  NOWPAYMENTS_API_KEY?: string;
  NOWPAYMENTS_IPN_SECRET?: string;
  AI_PROVIDER_API_KEY?: string;
  JWT_SECRET: string;
  ADMIN_JWT_SECRET: string;
  TRADINGECONOMICS_API_KEY?: string;
}
