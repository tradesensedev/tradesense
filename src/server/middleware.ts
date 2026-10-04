import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { CSRF_HEADER, SESSION_COOKIE } from "@shared/constants";
import { can, type Permission } from "@shared/permissions";
import type { AppEnv } from "./env";
import { timingSafeEqual } from "./lib/crypto";
import { forbidden, unauthorized } from "./lib/errors";
import { sha256Hex } from "./lib/ids";
import { nowIso } from "./lib/time";
import { createRepositories } from "./repositories/d1";

// Builds repositories (the only place the D1 binding is used) and loads the session user.
export const context = createMiddleware<AppEnv>(async (c, next) => {
  const repos = createRepositories(c.env.DB);
  c.set("repos", repos);
  c.set("ip", c.req.header("cf-connecting-ip") ?? "local");
  c.set("user", null);
  c.set("session", null);

  const token = getCookie(c, SESSION_COOKIE);
  if (token) {
    const session = await repos.sessions.findById(await sha256Hex(token));
    if (session && session.expiresAt > nowIso()) {
      const user = await repos.users.findById(session.userId);
      if (user) {
        c.set("session", session);
        c.set("user", user);
      }
    }
  }
  await next();
});

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CSRF_TOKEN_EXEMPT = new Set(["/api/auth/login", "/api/auth/magic/request", "/api/auth/magic/verify"]);

// 1) If an Origin header is present it must be this site. 2) With a session, the CSRF header must match.
export const csrfGuard = createMiddleware<AppEnv>(async (c, next) => {
  if (!UNSAFE.has(c.req.method)) return next();
  const url = new URL(c.req.url);
  if (url.pathname.startsWith("/api/webhooks/")) return next(); // signed by provider, no cookies

  const origin = c.req.header("origin");
  if (origin) {
    const allowed = new Set([url.origin, new URL(c.env.APP_URL).origin]);
    if (!allowed.has(origin)) throw forbidden("Bad origin");
  }
  if (CSRF_TOKEN_EXEMPT.has(url.pathname)) return next();

  const session = c.var.session;
  if (session) {
    const header = c.req.header(CSRF_HEADER);
    if (!header || !timingSafeEqual(header, session.csrfToken)) throw forbidden("Invalid CSRF token");
  }
  return next();
});

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  if (!c.var.user) throw unauthorized();
  await next();
});

export const requirePermission = (permission: Permission) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const user = c.var.user;
    if (!user) throw unauthorized();
    if (!can(user.role, permission)) throw forbidden();
    await next();
  });

export const securityHeaders = createMiddleware<AppEnv>(async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
  c.header("Cache-Control", "no-store");
});
