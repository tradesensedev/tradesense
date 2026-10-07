import type { SavedViewDto, SavedViewInput, SavedViewScope, SavedViewUpdate } from "@shared/admin";
import type { Permission } from "@shared/permissions";
import { can } from "@shared/permissions";
import { conflict, forbidden, notFound } from "../lib/errors";
import { newId } from "../lib/ids";
import { safeJson } from "../lib/labels";
import type { Repositories, SavedViewRow } from "../repositories/types";
import type { Actor } from "./posts";

const MAX_OWN_VIEWS_PER_SCOPE = 30;

// A view for a list is only for people who may open that list.
const SCOPE_PERMISSION: Record<SavedViewScope, Permission> = {
  posts: "admin:access",
  notes: "admin:access",
  results: "admin:access",
  users: "user:manage",
  payments: "payment:manage",
};

export class SavedViewService {
  constructor(private repos: Repositories) {}

  private assertScope(actor: Actor, scope: string) {
    const permission = SCOPE_PERMISSION[scope as SavedViewScope];
    if (!permission || !can(actor.role, permission)) throw forbidden();
  }

  private toDto(v: SavedViewRow, actorId: string, owners: Map<string, string>): SavedViewDto {
    return {
      id: v.id,
      scope: v.scope as SavedViewScope,
      name: v.name,
      filters: safeJson<Record<string, string>>(v.filtersJson, {}),
      columns: safeJson<string[]>(v.columnsJson, []),
      shared: v.shared,
      mine: v.userId === actorId,
      ownerName: owners.get(v.userId) ?? null,
      createdAt: v.createdAt,
    };
  }

  private async dtos(rows: SavedViewRow[], actorId: string) {
    const users = await this.repos.users.findManyByIds(rows.map((r) => r.userId));
    const owners = new Map(users.map((u) => [u.id, u.name]));
    return rows.map((r) => this.toDto(r, actorId, owners));
  }

  async list(actor: Actor, scope: SavedViewScope) {
    this.assertScope(actor, scope);
    return this.dtos(await this.repos.savedViews.listVisible(scope, actor.id), actor.id);
  }

  async create(actor: Actor, input: SavedViewInput) {
    this.assertScope(actor, input.scope);
    const visible = await this.repos.savedViews.listVisible(input.scope, actor.id);
    const own = visible.filter((v) => v.userId === actor.id);
    if (own.length >= MAX_OWN_VIEWS_PER_SCOPE) throw conflict(`You can keep at most ${MAX_OWN_VIEWS_PER_SCOPE} saved views per list`);
    if (own.some((v) => v.name.toLowerCase() === input.name.toLowerCase())) throw conflict("You already have a view with this name");
    const row = await this.repos.savedViews.create({
      id: newId(),
      userId: actor.id,
      scope: input.scope,
      name: input.name,
      filtersJson: JSON.stringify(input.filters),
      columnsJson: JSON.stringify(input.columns),
      shared: input.shared,
    });
    return (await this.dtos([row], actor.id))[0]!;
  }

  private async mustFindOwn(actor: Actor, id: string) {
    const v = await this.repos.savedViews.findById(id);
    // someone else's private view looks like "missing"
    if (!v || (v.userId !== actor.id && !v.shared)) throw notFound("Saved view not found");
    return v;
  }

  // Only the owner edits a view. Teammates can use a shared view and copy it by saving their own.
  async update(actor: Actor, id: string, patch: SavedViewUpdate) {
    const v = await this.mustFindOwn(actor, id);
    if (v.userId !== actor.id) throw forbidden("Only the owner can change this view");
    await this.repos.savedViews.update(id, {
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.filters !== undefined && { filtersJson: JSON.stringify(patch.filters) }),
      ...(patch.columns !== undefined && { columnsJson: JSON.stringify(patch.columns) }),
      ...(patch.shared !== undefined && { shared: patch.shared }),
    });
    return (await this.dtos([(await this.repos.savedViews.findById(id))!], actor.id))[0]!;
  }

  // Owner deletes their own. An admin may also remove a shared view that is no longer wanted.
  async delete(actor: Actor, id: string) {
    const v = await this.mustFindOwn(actor, id);
    if (v.userId !== actor.id && actor.role !== "admin") throw forbidden("Only the owner can delete this view");
    await this.repos.savedViews.delete(id);
    return v;
  }
}
