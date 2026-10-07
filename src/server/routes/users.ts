import { Hono, type Context } from "hono";
import { changeRoleSchema, disableTotpSchema, resetPasswordSchema, updateUserSchema, userListQuery } from "@shared/admin";
import { createUserSchema } from "@shared/schemas";
import type { AppEnv } from "../env";
import { audit } from "../lib/audit";
import { parseJson, parseQuery } from "../lib/validate";
import { requirePermission } from "../middleware";
import type { Actor } from "../services/posts";
import { UserService } from "../services/users";

const users = new Hono<AppEnv>();
const svc = (c: Context<AppEnv>) => new UserService(c.var.repos);
const actor = (c: Context<AppEnv>): Actor => ({ id: c.var.user!.id, role: c.var.user!.role });

// Admin only, for every route in this file.
users.use("*", requirePermission("user:manage"));

users.get("/", async (c) => c.json(await svc(c).list(parseQuery(c, userListQuery))));

users.get("/:id", async (c) => c.json(await svc(c).get(c.req.param("id"))));

users.post("/", async (c) => {
  const input = await parseJson(c, createUserSchema);
  const user = await svc(c).create(input);
  await audit(c, "user.create", "user", user.id, { email: user.email, role: user.role }); // never the password
  return c.json(user, 201);
});

users.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const { before, after } = await svc(c).updateProfile(id, await parseJson(c, updateUserSchema));
  await audit(c, "user.update", "user", id, { name: [before.name, after.name], timezone: [before.timezone, after.timezone] });
  return c.json(after);
});

users.post("/:id/role", async (c) => {
  const id = c.req.param("id");
  const { role } = await parseJson(c, changeRoleSchema);
  const { from, to, user } = await svc(c).changeRole(actor(c), id, role);
  await audit(c, "user.role", "user", id, { from, to });
  return c.json(user);
});

users.post("/:id/password", async (c) => {
  const id = c.req.param("id");
  const { password } = await parseJson(c, resetPasswordSchema);
  const user = await svc(c).resetPassword(id, password);
  await audit(c, "user.password_reset", "user", id); // no secret in the log
  return c.json(user);
});

users.post("/:id/totp/disable", async (c) => {
  const id = c.req.param("id");
  await parseJson(c, disableTotpSchema);
  const user = await svc(c).disableTotp(id);
  await audit(c, "user.totp_disable", "user", id);
  return c.json(user);
});

export default users;
