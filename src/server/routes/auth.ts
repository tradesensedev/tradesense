import { Hono, type Context } from "hono";
import { deleteCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import { SESSION_COOKIE } from "@shared/constants";
import { loginSchema, magicRequestSchema, magicVerifySchema } from "@shared/schemas";
import type { MeResponse } from "@shared/types";
import type { AppEnv } from "../env";
import { badRequest, forbidden } from "../lib/errors";
import { verifyPassword } from "../lib/crypto";
import { generateTotpSecret, totpUri, verifyTotp } from "../lib/totp";
import { parseJson } from "../lib/validate";
import { requireAuth } from "../middleware";
import { AuthService, toPublicUser, type NewSession } from "../services/auth";

const auth = new Hono<AppEnv>();

function setSessionCookie(c: Context<AppEnv>, s: NewSession) {
  setCookie(c, SESSION_COOKIE, s.token, {
    httpOnly: true,
    secure: c.env.APP_URL.startsWith("https://"), // Secure in production, plain http works on local dev
    sameSite: "Lax",
    path: "/",
    expires: new Date(s.expiresAt),
  });
}

const svc = (c: Context<AppEnv>) => new AuthService(c.var.repos, c.env);

auth.get("/me", (c) => {
  const user = c.var.user;
  const body: MeResponse = {
    user: user ? toPublicUser(user) : null,
    csrfToken: c.var.session?.csrfToken ?? null,
  };
  return c.json(body);
});

auth.post("/login", async (c) => {
  const input = await parseJson(c, loginSchema);
  const { user, session } = await svc(c).loginStaff(input, c.var.ip, c.req.header("user-agent") ?? null);
  setSessionCookie(c, session);
  const body: MeResponse = { user: toPublicUser(user), csrfToken: session.csrfToken };
  return c.json(body);
});

auth.post("/logout", async (c) => {
  const session = c.var.session;
  if (session) {
    await c.var.repos.sessions.delete(session.id);
    await c.var.repos.audit.add({ userId: session.userId, action: "auth.logout", entity: "user", entityId: session.userId });
  }
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.json({ ok: true });
});

auth.post("/magic/request", async (c) => {
  const { email } = await parseJson(c, magicRequestSchema);
  await svc(c).requestMagicLink(email, c.var.ip);
  return c.json({ ok: true }); // same response whether or not the email exists
});

auth.post("/magic/verify", async (c) => {
  const { token } = await parseJson(c, magicVerifySchema);
  const { user, session } = await svc(c).verifyMagicLink(token, c.var.ip, c.req.header("user-agent") ?? null);
  setSessionCookie(c, session);
  const body: MeResponse = { user: toPublicUser(user), csrfToken: session.csrfToken };
  return c.json(body);
});

// ---- Optional TOTP for admins ----
const requireAdmin = async (c: Context<AppEnv>) => {
  const user = c.var.user;
  if (!user || user.role !== "admin") throw forbidden("Admins only");
  return user;
};

// Step 1: get a fresh secret + otpauth URI (not saved yet).
auth.post("/totp/setup", requireAuth, async (c) => {
  const user = await requireAdmin(c);
  const secret = generateTotpSecret();
  return c.json({ secret, uri: totpUri(secret, user.email, c.env.APP_NAME) });
});

// Step 2: confirm with a code from the authenticator app, then it is saved.
auth.post("/totp/enable", requireAuth, async (c) => {
  const user = await requireAdmin(c);
  const { secret, code } = await parseJson(c, z.object({ secret: z.string().min(16).max(64), code: z.string().regex(/^\d{6}$/) }));
  if (!(await verifyTotp(secret, code))) throw badRequest("Code did not match");
  await c.var.repos.users.update(user.id, { totpSecret: secret });
  await c.var.repos.audit.add({ userId: user.id, action: "auth.totp_enabled", entity: "user", entityId: user.id });
  return c.json({ ok: true });
});

// Disable needs password + current code.
auth.post("/totp/disable", requireAuth, async (c) => {
  const user = await requireAdmin(c);
  const { password, code } = await parseJson(c, z.object({ password: z.string().min(1).max(200), code: z.string().regex(/^\d{6}$/) }));
  if (!user.totpSecret) throw badRequest("TOTP is not enabled");
  const okPw = user.passwordHash ? await verifyPassword(password, user.passwordHash) : false;
  if (!okPw || !(await verifyTotp(user.totpSecret, code))) throw badRequest("Password or code incorrect");
  await c.var.repos.users.update(user.id, { totpSecret: null });
  await c.var.repos.audit.add({ userId: user.id, action: "auth.totp_disabled", entity: "user", entityId: user.id });
  return c.json({ ok: true });
});

export default auth;
