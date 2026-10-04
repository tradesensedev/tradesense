import { MAGIC_LINK_TTL_MINUTES, SESSION_TTL_DAYS } from "@shared/constants";
import { isStaff } from "@shared/permissions";
import type { LoginInput } from "@shared/schemas";
import type { PublicUser } from "@shared/types";
import type { Bindings } from "../env";
import { DUMMY_HASH, verifyPassword } from "../lib/crypto";
import { sendEmail } from "../lib/email";
import { AppError, forbidden, tooMany, unauthorized } from "../lib/errors";
import { newId, randomToken, sha256Hex } from "../lib/ids";
import { hit, isLimited, resetLimit } from "../lib/ratelimit";
import { addDaysIso, addMinutesIso, nowIso } from "../lib/time";
import { verifyTotp } from "../lib/totp";
import type { Repositories, UserRow } from "../repositories/types";

export function toPublicUser(u: UserRow): PublicUser {
  return { id: u.id, email: u.email, name: u.name, role: u.role, timezone: u.timezone, totpEnabled: !!u.totpSecret };
}

export interface NewSession {
  token: string; // raw cookie value (only ever sent to the browser)
  csrfToken: string;
  expiresAt: string;
}

export class AuthService {
  constructor(
    private repos: Repositories,
    private env: Bindings,
  ) {}

  async createSession(user: UserRow, ip: string, userAgent: string | null): Promise<NewSession> {
    const token = randomToken(32);
    const csrfToken = randomToken(24);
    const createdAt = nowIso();
    const expiresAt = addDaysIso(createdAt, SESSION_TTL_DAYS);
    await this.repos.sessions.create({
      id: await sha256Hex(token),
      userId: user.id,
      csrfToken,
      ipHash: await sha256Hex(ip + this.env.IP_HASH_SALT),
      userAgent: userAgent ? userAgent.slice(0, 300) : null,
      createdAt,
      expiresAt,
    });
    return { token, csrfToken, expiresAt };
  }

  async loginStaff(input: LoginInput, ip: string, userAgent: string | null) {
    const kv = this.env.KV;
    const ipKey = `rl:login:ip:${ip}`;
    const emKey = `rl:login:em:${input.email}`;
    if ((await isLimited(kv, ipKey, 20)) || (await isLimited(kv, emKey, 5))) throw tooMany();

    const fail = async (reason: string): Promise<never> => {
      await hit(kv, ipKey, 900);
      await hit(kv, emKey, 900);
      await this.repos.audit.add({ userId: null, action: "auth.login_failed", entity: "user", diff: { email: input.email, reason } });
      throw unauthorized("Invalid email or password");
    };

    const user = await this.repos.users.findByEmail(input.email);
    // Always run one PBKDF2 so response time does not reveal whether the email exists.
    const passwordOk = await verifyPassword(input.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !passwordOk || !isStaff(user.role)) return fail("credentials");

    if (user.totpSecret) {
      if (!input.totp) throw new AppError(401, "totp_required", "Authentication code required");
      if (!(await verifyTotp(user.totpSecret, input.totp))) {
        await hit(kv, ipKey, 900);
        await hit(kv, emKey, 900);
        throw unauthorized("Invalid authentication code");
      }
    }

    await resetLimit(kv, emKey);
    const session = await this.createSession(user, ip, userAgent);
    await this.repos.audit.add({ userId: user.id, action: "auth.login", entity: "user", entityId: user.id });
    return { user, session };
  }

  // Always resolves quietly so the response never reveals whether an email is registered.
  async requestMagicLink(email: string, ip: string): Promise<void> {
    const kv = this.env.KV;
    if ((await hit(kv, `rl:magic:ip:${ip}`, 3600)) > 10) throw tooMany();
    if ((await hit(kv, `rl:magic:em:${email}`, 900)) > 3) throw tooMany();

    const existing = await this.repos.users.findByEmail(email);
    if (existing && existing.role !== "member") return; // staff use passwords

    const token = randomToken(32);
    const createdAt = nowIso();
    await this.repos.magicLinks.create({
      id: await sha256Hex(token),
      email,
      createdAt,
      expiresAt: addMinutesIso(createdAt, MAGIC_LINK_TTL_MINUTES),
    });
    const link = `${this.env.APP_URL}/login/verify?token=${token}`;
    const app = this.env.APP_NAME;
    try {
      await sendEmail(this.env, {
        to: email,
        subject: `Your ${app} sign-in link`,
        text: `Use this link to sign in to ${app}. It works once and expires in ${MAGIC_LINK_TTL_MINUTES} minutes:\n\n${link}\n\nIf you did not request it, ignore this email.`,
        html: `<p>Use this link to sign in to ${app}. It works once and expires in ${MAGIC_LINK_TTL_MINUTES} minutes:</p><p><a href="${link}">Sign in to ${app}</a></p><p>If you did not request it, ignore this email.</p>`,
      });
    } catch (err) {
      console.error("magic link email failed", err);
    }
  }

  async verifyMagicLink(token: string, ip: string, userAgent: string | null) {
    const row = await this.repos.magicLinks.consume(await sha256Hex(token), nowIso());
    if (!row) throw unauthorized("This link is invalid or has expired");

    let user = await this.repos.users.findByEmail(row.email);
    if (!user) {
      user = await this.repos.users.create({
        email: row.email,
        name: row.email.split("@")[0],
        role: "member",
        passwordHash: null,
        totpSecret: null,
        timezone: "UTC",
      });
    }
    if (user.role !== "member") throw forbidden("Staff accounts must sign in with a password");

    const session = await this.createSession(user, ip, userAgent);
    await this.repos.audit.add({ userId: user.id, action: "auth.magic_login", entity: "user", entityId: user.id });
    return { user, session };
  }

  // Referenced for completeness: unique id helper keeps session rows traceable in audit diffs.
  static auditId(): string {
    return newId();
  }
}
