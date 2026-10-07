import type { Role } from "@shared/constants";
import type { CreateUserInput } from "@shared/schemas";
import type { UpdateUserInput, UserAdminDto } from "@shared/admin";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors";
import { hashPassword } from "../lib/crypto";
import type { Repositories, UserFilter, UserRow } from "../repositories/types";
import type { Actor } from "./posts";

const SYSTEM_EMAIL = "system@tradesense.local";

export const toUserAdminDto = (u: UserRow): UserAdminDto => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  timezone: u.timezone,
  createdAt: u.createdAt,
  hasPassword: !!u.passwordHash,
  totpEnabled: !!u.totpSecret,
});

// Admin-only user management. Hashes, TOTP secrets and tokens never leave the server.
export class UserService {
  constructor(private repos: Repositories) {}

  private async mustFind(id: string): Promise<UserRow> {
    const u = await this.repos.users.findById(id);
    if (!u) throw notFound("User not found");
    return u;
  }

  // The seed system user owns system-generated records. It must stay password-less and keep its role.
  private assertNotSystem(u: UserRow) {
    if (u.email === SYSTEM_EMAIL) throw forbidden("The system user cannot be changed");
  }

  async list(f: UserFilter) {
    const { items, total } = await this.repos.users.search(f);
    return { items: items.map(toUserAdminDto), total };
  }

  async get(id: string) {
    return toUserAdminDto(await this.mustFind(id));
  }

  async create(input: CreateUserInput) {
    if (await this.repos.users.findByEmail(input.email)) throw conflict("A user with this email already exists");
    if (input.role !== "member" && !input.password) throw badRequest("Staff accounts need a password (min 10 characters)");
    const created = await this.repos.users.create({
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash: input.password ? await hashPassword(input.password) : null,
      totpSecret: null,
      timezone: input.timezone,
    });
    return toUserAdminDto(created);
  }

  async updateProfile(id: string, patch: UpdateUserInput) {
    const before = await this.mustFind(id);
    this.assertNotSystem(before);
    await this.repos.users.update(id, patch);
    return { before: toUserAdminDto(before), after: await this.get(id) };
  }

  // You cannot change your own role. This also guarantees the actor stays an admin, so the last admin can never be removed.
  async changeRole(actor: Actor, id: string, role: Role) {
    if (actor.id === id) throw forbidden("You cannot change your own role");
    const before = await this.mustFind(id);
    this.assertNotSystem(before);
    if (before.role === role) throw conflict(`This user is already ${role}`);
    if (role !== "member" && !before.passwordHash) throw conflict("Set a password for this user before making them staff");
    await this.repos.users.update(id, { role });
    await this.repos.sessions.deleteByUser(id); // permissions change: force a fresh sign-in
    return { from: before.role, to: role, user: await this.get(id) };
  }

  async resetPassword(id: string, password: string) {
    const u = await this.mustFind(id);
    this.assertNotSystem(u);
    await this.repos.users.update(id, { passwordHash: await hashPassword(password) });
    await this.repos.sessions.deleteByUser(id); // sign out everywhere
    return toUserAdminDto(await this.mustFind(id));
  }

  // For a staff member who lost their authenticator. They enrol again at next sign-in.
  async disableTotp(id: string) {
    const u = await this.mustFind(id);
    this.assertNotSystem(u);
    if (!u.totpSecret) throw conflict("Two-step sign-in is not enabled for this user");
    await this.repos.users.update(id, { totpSecret: null });
    await this.repos.sessions.deleteByUser(id);
    return toUserAdminDto(await this.mustFind(id));
  }
}
