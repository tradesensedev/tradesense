import calendarData from "../../../../packages/db/mock-data/calendar.json";
import centralBanksData from "../../../../packages/db/mock-data/central-banks.json";
import indicatorsData from "../../../../packages/db/mock-data/indicators.json";
import yieldsData from "../../../../packages/db/mock-data/yields.json";
import cotData from "../../../../packages/db/mock-data/cot.json";
import newsData from "../../../../packages/db/mock-data/news.json";

export interface Env {
  USE_MOCK_DATA: string;
  TRADINGECONOMICS_API_KEY?: string;
  FRED_API_KEY?: string;
  NEWSAPI_KEY?: string;
}

function isMockMode(env: Env): boolean {
  return env.USE_MOCK_DATA === "true";
}

// --- Calendar (TradingEconomics-backed at Phase 15) ---
export async function loadCalendarData(env: Env) {
  if (isMockMode(env)) return calendarData;
  // TODO Phase 15: fetch from TradingEconomics using env.TRADINGECONOMICS_API_KEY
  throw new Error("Real calendar data source not wired yet (Phase 15)");
}

// --- Central Banks / Rates (TradingEconomics-backed at Phase 15) ---
export async function loadCentralBankData(env: Env) {
  if (isMockMode(env)) return centralBanksData;
  throw new Error("Real central bank data source not wired yet (Phase 15)");
}

// --- Indicators (TradingEconomics-backed at Phase 15) ---
export async function loadIndicatorData(env: Env) {
  if (isMockMode(env)) return indicatorsData;
  throw new Error("Real indicator data source not wired yet (Phase 15)");
}

// --- Yields (FRED — already free, can go live any time) ---
export async function loadYieldData(env: Env) {
  if (isMockMode(env)) return yieldsData;
  // TODO: fetch from FRED using env.FRED_API_KEY
  // api.stlouisfed.org/fred/series/observations?series_id=DGS2/DGS10
  throw new Error("Real yield data fetch not implemented yet");
}

// --- COT (CFTC.gov — free, no key needed, can go live any time) ---
export async function loadCOTData(env: Env) {
  if (isMockMode(env)) return cotData;
  // TODO: fetch from cftc.gov/dea/newcot/deacot.txt
  throw new Error("Real COT data fetch not implemented yet");
}

// --- News (NewsAPI — free tier, can go live any time) ---
export async function loadNewsData(env: Env) {
  if (isMockMode(env)) return newsData;
  // TODO: fetch from newsapi.org using env.NEWSAPI_KEY
  throw new Error("Real news data fetch not implemented yet");
}
