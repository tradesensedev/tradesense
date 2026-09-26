import { Hono } from "hono";
import type { Env } from "./types";
import { fetchYields } from "./jobs/fetch-yields";
import { fetchCOT } from "./jobs/fetch-cot";
import { fetchNews } from "./jobs/fetch-news";
import { fetchCalendar } from "./jobs/fetch-calendar";
import { fetchRates } from "./jobs/fetch-rates";
import { fetchIndicators } from "./jobs/fetch-indicators";

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

export default app;
