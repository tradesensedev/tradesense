import { Hono } from "hono";
import type { Env } from "./types";
import { fetchYields } from "./jobs/fetch-yields";
import { fetchCOT } from "./jobs/fetch-cot";
import { fetchNews } from "./jobs/fetch-news";
import { fetchCalendar } from "./jobs/fetch-calendar";
import { fetchRates } from "./jobs/fetch-rates";
import { fetchIndicators } from "./jobs/fetch-indicators";
import { seedPrompts } from "./jobs/seed-prompts";
import { handleQueue } from "./jobs/ai-enrich";
import { tagEconomicSurprise, tagCOTPositioning } from "./lib/rules";
import { enrichContent } from "./lib/ai/client";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => c.json({ status: "ok", service: "tradesense-api" }));

app.get("/debug/fetch-yields", async (c) => {
  try {
    const result = await fetchYields(c.env);
    return c.json({ ok: true, result });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 500);
  }
});

app.get("/debug/fetch-cot", async (c) => {
  try {
    const result = await fetchCOT(c.env);
    return c.json({ ok: true, result });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 500);
  }
});

app.get("/debug/fetch-news", async (c) => {
  try {
    const result = await fetchNews(c.env);
    return c.json({ ok: true, result });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 500);
  }
});

app.get("/debug/fetch-calendar", async (c) => {
  try {
    const result = await fetchCalendar(c.env);
    return c.json({ ok: true, result });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 500);
  }
});

app.get("/debug/fetch-rates", async (c) => {
  try {
    const result = await fetchRates(c.env);
    return c.json({ ok: true, result });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 500);
  }
});

app.get("/debug/fetch-indicators", async (c) => {
  try {
    const result = await fetchIndicators(c.env);
    return c.json({ ok: true, result });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 500);
  }
});

app.get("/debug/test-rules", (c) => {
  return c.json({
    surprise_beat: tagEconomicSurprise("0.4%", "0.3%"),
    surprise_miss: tagEconomicSurprise("0.1%", "0.3%"),
    surprise_meet: tagEconomicSurprise("0.3%", "0.3%"),
    surprise_null: tagEconomicSurprise(null, "0.3%"),
    cot_extreme_high: tagCOTPositioning(52000, [10000, 15000, 20000, 25000, 30000, 35000, 40000]),
    cot_normal: tagCOTPositioning(22000, [10000, 15000, 20000, 25000, 30000, 35000, 40000]),
  });
});

app.get("/debug/seed-prompts", async (c) => {
  try {
    const result = await seedPrompts(c.env);
    return c.json({ ok: true, result });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 500);
  }
});

app.get("/debug/test-ai", async (c) => {
  try {
    const text = await enrichContent(c.env, "central_bank", {
      name: "Federal Reserve",
      currency: "USD",
      currentRate: "4.75%",
      stance: "hawkish",
    });
    return c.json({ ok: true, text });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 500);
  }
});

export default {
  fetch: app.fetch,
  queue: handleQueue,
};
