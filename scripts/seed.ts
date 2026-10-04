// Generates .seed/seed.sql (markets, settings, plans, rule, tags, sample posts/results/notes).
// Run via: npm run seed   (run ONCE per fresh local DB)
import { mkdirSync, writeFileSync } from "node:fs";
import { ulid } from "ulidx";
import { addDaysIso, weekStartOf } from "../src/server/lib/time";

type V = string | number | null;
const out: string[] = [];
const q = (v: V): string =>
  v === null ? "NULL" : typeof v === "number" ? String(v) : `'${v.replace(/'/g, "''")}'`;
function insert(table: string, row: Record<string, V>) {
  const cols = Object.keys(row);
  out.push(`INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map((c) => q(row[c])).join(", ")});`);
}

const nowIso = new Date().toISOString();
const today = nowIso.slice(0, 10);
const minIso = (a: string, b: string) => (a < b ? a : b);

// ---- system user + analyst ----
const systemId = ulid();
insert("users", {
  id: systemId, email: "system@tradesense.local", name: "System (seed)", role: "editor",
  password_hash: null, totp_secret: null, timezone: "UTC", created_at: nowIso,
});
const analystId = ulid();
insert("analysts", { id: analystId, name: "TradeSense Research Desk", bio: "Sample analyst profile.", avatar_attachment_id: null, active: 1 });

// ---- markets ----
const MARKETS: Array<[string, string, string]> = [
  ["XAUUSD", "Gold / US Dollar", "gold"], ["EURUSD", "Euro / US Dollar", "forex"],
  ["GBPUSD", "British Pound / US Dollar", "forex"], ["USDJPY", "US Dollar / Japanese Yen", "forex"],
  ["DXY", "US Dollar Index", "dxy"], ["NAS100", "Nasdaq 100", "index"], ["US30", "Dow Jones 30", "index"],
  ["BTCUSD", "Bitcoin / US Dollar", "crypto"], ["ETHUSD", "Ethereum / US Dollar", "crypto"],
  ["USOIL", "US Crude Oil", "oil"],
];
const marketId: Record<string, string> = {};
MARKETS.forEach(([symbol, name, category], i) => {
  marketId[symbol] = ulid();
  insert("markets", { id: marketId[symbol], symbol, name, category, active: 1, sort_order: (i + 1) * 10 });
});

// ---- settings ----
const settings: Record<string, unknown> = {
  default_access_daily: "free",
  default_access_weekly: "paid",
  default_access_killzone_note: "paid",
  default_access_screenshot: "inherit",
  free_delay_hours: 0,
  open_archive_days: 7,
  announcement_banner: "",
  disclaimer_text: "TradeSense provides market research and education only. This is not financial advice. Past performance is not indicative of future results.",
  active_evaluation_rule_version: 1,
  regional_pricing_enabled: false,
  reminder_days: [7, 3, 1],
  refund_policy_text: "Payments are made in cryptocurrency and are generally non-refundable. Edit this text in Admin > Settings.",
};
for (const [key, v] of Object.entries(settings)) {
  insert("settings", { key, value_json: JSON.stringify(v), updated_by: null, updated_at: nowIso });
}

// ---- evaluation rule v1 (placeholder text, editable later) ----
insert("evaluation_rules", {
  id: ulid(), version: 1, active_from: nowIso,
  text_md:
    "## Evaluation rules (v1)\n\nEvery Daily and Weekly bias is evaluated after its validity window ends, using the price direction over that window.\n\n- **Correct**: price moved in the stated direction.\n- **Wrong**: price moved against the stated direction.\n- **Partial**: mixed or inconclusive movement.\n\nResults are entered manually, cannot be edited afterwards, and any fix is published as a visible correction.",
});

// ---- plans (placeholder prices) ----
insert("plans", { id: ulid(), code: "monthly", name: "Monthly", duration_days: 30, price_usd: 29, active: 1, sort_order: 10 });
insert("plans", { id: ulid(), code: "annual", name: "Annual", duration_days: 365, price_usd: 249, active: 1, sort_order: 20 });

// ---- tags ----
const TAGS: Array<[string, string]> = [
  ["USD strength", "usd-strength"], ["Fed policy", "fed-policy"], ["Inflation data", "inflation-data"],
  ["Risk sentiment", "risk-sentiment"], ["Geopolitics", "geopolitics"],
];
const tagIds = TAGS.map(([name, slug]) => {
  const id = ulid();
  insert("tags", { id, name, slug });
  return id;
});

// ---- sample posts, results, notes ----
function weekdaysBack(n: number): string[] {
  const res: string[] = [];
  const d = new Date(`${today}T00:00:00.000Z`);
  while (res.length < n) {
    const dow = d.getUTCDay();
    if (dow !== 0 && dow !== 6) res.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return res.reverse();
}
const days = weekdaysBack(5);
const thisWeek = weekStartOf(today);
const lastWeek = addDaysIso(`${thisWeek}T00:00:00.000Z`, -7).slice(0, 10);

const BIAS = ["bullish", "bearish", "neutral", "bullish", "bearish"];
const CONF = ["high", "medium", "low", "medium", "high"];
const SENT = ["risk_on", "risk_off", "mixed"];
const OUTCOME = ["correct", "correct", "wrong", "partial", "correct"];
const KZ = ["asia", "london", "ny_am", "ny_pm"];
const NOTE_STATUS = ["followed", "non_followed", "invalidation", "neutral"];
const NOTE_TEXT: Record<string, string> = {
  followed: "Sample note: price action during this window was consistent with the linked bias.",
  non_followed: "Sample note: price action during this window did not follow the linked bias.",
  invalidation: "Sample note: a condition described in the linked post's invalidation text was met.",
  neutral: "Sample note: no clear technical observation during this window.",
};

let resultCounter = 0;
function addPost(p: {
  symbol: string; type: "daily" | "weekly"; date: string; bias: string; conf: string; sent: string;
  validFrom: string; validUntil: string; tag: string | null; status: "published" | "draft";
}): string {
  const id = ulid();
  const weekStart = p.type === "weekly" ? p.date : weekStartOf(p.date);
  const published = p.status === "published" ? minIso(`${p.date}T06:00:00.000Z`, nowIso) : null;
  const label = p.type === "daily" ? "Daily" : "Weekly";
  insert("posts", {
    id, type: p.type, market_id: marketId[p.symbol], post_date: p.date, week_start_date: weekStart,
    bias: p.bias, confidence: p.conf, sentiment: p.sent,
    title: `${p.symbol} ${label} bias: ${p.bias}`,
    summary: "Sample demo post. Research and education only, not financial advice.",
    body_md: `## ${p.symbol} ${label} outlook\n\nSample demo content for development. Not financial advice.`,
    key_drivers_md: "- Sample driver: economic data releases\n- Sample driver: risk sentiment",
    risk_events_md: "- Sample risk event: scheduled central bank commentary",
    invalidation_md: "The bias is reconsidered if the key data release materially shifts the narrative.",
    access: p.type === "daily" ? "free" : "paid",
    status: p.status, publish_at: null, valid_from: p.validFrom, valid_until: p.validUntil,
    analyst_id: analystId, created_by: systemId, created_at: nowIso, updated_at: nowIso, published_at: published,
  });
  if (p.tag) insert("post_tags", { post_id: id, tag_id: p.tag });

  const expired = p.validUntil < nowIso;
  if (p.status === "published" && expired) {
    if (resultCounter % 4 !== 3) {
      insert("results", {
        id: ulid(), post_id: id, outcome: OUTCOME[resultCounter % OUTCOME.length],
        note_md: "Sample evaluation note (demo data).", evaluated_by: systemId,
        evaluated_at: nowIso, evaluation_rule_version: 1,
      });
    } // else: left pending so the Results queue has items
    resultCounter++;
  }
  return id;
}

const SAMPLE = ["XAUUSD", "EURUSD", "NAS100", "BTCUSD"];
const dailyIds: Record<string, Record<string, string>> = {};
SAMPLE.forEach((symbol, mi) => {
  dailyIds[symbol] = {};
  days.forEach((date, di) => {
    dailyIds[symbol][date] = addPost({
      symbol, type: "daily", date,
      bias: BIAS[(mi + di) % 5], conf: CONF[(mi + 2 * di) % 5], sent: SENT[(mi + di) % 3],
      validFrom: `${date}T00:00:00.000Z`, validUntil: `${date}T23:59:59.000Z`,
      tag: tagIds[(mi + di) % tagIds.length], status: "published",
    });
  });
  [lastWeek, thisWeek].forEach((ws, wi) => {
    const friday = addDaysIso(`${ws}T00:00:00.000Z`, 4).slice(0, 10);
    addPost({
      symbol, type: "weekly", date: ws,
      bias: BIAS[(mi + wi + 1) % 5], conf: CONF[(mi + wi) % 5], sent: SENT[(mi + wi) % 3],
      validFrom: `${ws}T00:00:00.000Z`, validUntil: `${friday}T23:59:59.000Z`,
      tag: tagIds[(mi + wi + 2) % tagIds.length], status: "published",
    });
  });
});

// One draft so the admin has something in "drafts" later.
const lastDay = days[days.length - 1];
addPost({
  symbol: "GBPUSD", type: "daily", date: lastDay, bias: "neutral", conf: "low", sent: "mixed",
  validFrom: `${lastDay}T00:00:00.000Z`, validUntil: `${lastDay}T23:59:59.000Z`, tag: null, status: "draft",
});

// Notes: past days only, all four statuses appear on XAUUSD.
const pastDays = days.filter((d) => d < today).slice(-3);
let noteCount = 0;
function addNote(symbol: string, date: string, kz: string, status: string, di: number) {
  const published = minIso(`${date}T20:00:00.000Z`, nowIso);
  insert("killzone_notes", {
    id: ulid(), market_id: marketId[symbol], killzone: kz, note_date: date,
    linked_post_id: dailyIds[symbol][date], status, confidence: CONF[di % 5],
    title: `${symbol} ${kz.replace("_", " ").toUpperCase()} note`,
    note_md: NOTE_TEXT[status], access: "paid", publish_status: "published", publish_at: null,
    analyst_id: analystId, created_by: systemId, created_at: nowIso, updated_at: nowIso, published_at: published,
  });
  noteCount++;
}
pastDays.forEach((date, di) => {
  KZ.forEach((kz, ki) => addNote("XAUUSD", date, kz, NOTE_STATUS[(ki + di) % 4], di));
  ["london", "ny_am"].forEach((kz, ki) => addNote("EURUSD", date, kz, NOTE_STATUS[(ki + di + 1) % 4], di));
});

mkdirSync(".seed", { recursive: true });
writeFileSync(".seed/seed.sql", out.join("\n") + "\n");
console.log(`seed.sql written: ${out.length} statements, ${resultCounter} expired posts, ${noteCount} notes`);
