import { Hono } from "hono";
import { ZodError } from "zod";
import type { AppEnv } from "./env";
import { AppError } from "./lib/errors";
import { context, csrfGuard, requirePermission, securityHeaders } from "./middleware";
import attachmentRoutes from "./routes/attachments";
import authRoutes from "./routes/auth";
import catalogRoutes from "./routes/catalog";
import engagementRoutes from "./routes/engagement";
import eventRoutes from "./routes/events";
import fileRoutes from "./routes/files";
import historyRoutes from "./routes/history";
import listRoutes from "./routes/lists";
import noteRoutes from "./routes/notes";
import planRoutes from "./routes/plans";
import postRoutes from "./routes/posts";
import publicRoutes from "./routes/public";
import resultRoutes from "./routes/results";
import ruleRoutes from "./routes/rules";
import settingsRoutes from "./routes/settings";
import userRoutes from "./routes/users";
import viewRoutes from "./routes/views";

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
app.route("/api/public", publicRoutes); // no login needed; locked items come back as placeholders
app.route("/api/admin/settings", settingsRoutes);
app.route("/api/admin/posts", postRoutes);
app.route("/api/admin/notes", noteRoutes);
app.route("/api/admin/attachments", attachmentRoutes);
app.route("/api/admin/results", resultRoutes);
app.route("/api/admin/rules", ruleRoutes);
app.route("/api/admin/users", userRoutes);
app.route("/api/admin/plans", planRoutes);
app.route("/api/admin/events", eventRoutes);
app.route("/api/admin/engagement", engagementRoutes);
app.route("/api/admin/views", viewRoutes);
app.route("/api/admin/lists", listRoutes); // filters, sorting, bulk actions, CSV export
app.route("/api/admin", historyRoutes); // /audit, /revisions, /media
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
