import { Hono } from "hono";
import { ZodError } from "zod";
import type { AppEnv } from "./env";
import { AppError } from "./lib/errors";
import { context, csrfGuard, securityHeaders } from "./middleware";
import authRoutes from "./routes/auth";

export type { Bindings } from "./env";

const app = new Hono<AppEnv>();

app.use("/api/*", securityHeaders);
app.use("/api/*", context);
app.use("/api/*", csrfGuard);

app.get("/api/health", (c) =>
  c.json({ ok: true, app: c.env.APP_NAME ?? "TradeSense", time: new Date().toISOString() }),
);

app.route("/api/auth", authRoutes);

app.notFound((c) => c.json({ error: { code: "not_found", message: "Not found" } }, 404));

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json({ error: { code: err.code, message: err.message, details: err.details } }, err.status);
  }
  if (err instanceof ZodError) {
    return c.json({ error: { code: "bad_request", message: "Validation failed", details: err.flatten() } }, 400);
  }
  console.error(err);
  return c.json({ error: { code: "internal_error", message: "Internal error" } }, 500);
});

export default app;
