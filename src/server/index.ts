import { Hono } from "hono";
import { ZodError } from "zod";
import type { AppEnv } from "./env";
import { AppError } from "./lib/errors";
import { context, csrfGuard, requirePermission, securityHeaders } from "./middleware";
import attachmentRoutes from "./routes/attachments";
import authRoutes from "./routes/auth";
import catalogRoutes from "./routes/catalog";
import fileRoutes from "./routes/files";
import noteRoutes from "./routes/notes";
import postRoutes from "./routes/posts";
import settingsRoutes from "./routes/settings";

export type { Bindings } from "./env";

const app = new Hono<AppEnv>();

app.use("/api/*", securityHeaders);
app.use("/api/*", context);
app.use("/api/*", csrfGuard);
app.use("/files/*", context); // /files/:id needs the session to authorize

// Every /api/admin/* route needs a staff session. Finer permissions are set per route.
app.use("/api/admin/*", requirePermission("admin:access"));

app.get("/api/health", (c) =>
  c.json({ ok: true, app: c.env.APP_NAME ?? "TradeSense", time: new Date().toISOString() }),
);

app.route("/api/auth", authRoutes);
app.route("/api/admin/settings", settingsRoutes);
app.route("/api/admin/posts", postRoutes);
app.route("/api/admin/notes", noteRoutes);
app.route("/api/admin/attachments", attachmentRoutes);
app.route("/api/admin", catalogRoutes);
app.route("/files", fileRoutes);

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
