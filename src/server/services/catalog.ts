import type { CreateAnalystInput, CreateMarketInput, UpdateAnalystInput, UpdateMarketInput } from "@shared/schemas";
import { badRequest, conflict, notFound } from "../lib/errors";
import type { Repositories } from "../repositories/types";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Business rules for markets, analysts and tags.
export class CatalogService {
  constructor(private repos: Repositories) {}

  // ---- markets (never deleted: posts reference them; deactivate instead) ----
  async createMarket(input: CreateMarketInput) {
    if (await this.repos.markets.findBySymbol(input.symbol)) throw conflict(`Market ${input.symbol} already exists`);
    return this.repos.markets.create(input);
  }

  async updateMarket(id: string, patch: UpdateMarketInput) {
    const before = await this.repos.markets.findById(id);
    if (!before) throw notFound("Market not found");
    await this.repos.markets.update(id, patch);
    return { before, after: (await this.repos.markets.findById(id))! };
  }

  // ---- analysts (never deleted; deactivate instead) ----
  async createAnalyst(input: CreateAnalystInput) {
    return this.repos.analysts.create(input);
  }

  async updateAnalyst(id: string, patch: UpdateAnalystInput) {
    const before = await this.repos.analysts.findById(id);
    if (!before) throw notFound("Analyst not found");
    await this.repos.analysts.update(id, patch);
    return { before, after: (await this.repos.analysts.findById(id))! };
  }

  // ---- tags ----
  async createTag(name: string) {
    const slug = slugify(name);
    if (!slug) throw badRequest("Tag name must contain letters or digits");
    if (await this.repos.tags.findBySlug(slug)) throw conflict(`Tag "${name}" already exists`);
    return this.repos.tags.create({ name, slug });
  }

  async renameTag(id: string, name: string) {
    const before = await this.repos.tags.findById(id);
    if (!before) throw notFound("Tag not found");
    const slug = slugify(name);
    if (!slug) throw badRequest("Tag name must contain letters or digits");
    const clash = await this.repos.tags.findBySlug(slug);
    if (clash && clash.id !== id) throw conflict(`Tag "${name}" already exists`);
    await this.repos.tags.update(id, { name }); // slug stays stable
    return { before, after: { ...before, name } };
  }

  // A tag in use is never deleted: removing it would silently change published posts and notes.
  async deleteTag(id: string) {
    const tag = (await this.repos.tags.list()).find((t) => t.id === id);
    if (!tag) throw notFound("Tag not found");
    if (tag.uses > 0) {
      throw conflict(`Tag is used by ${tag.uses} item(s). Rename it, or remove it from those items first.`);
    }
    await this.repos.tags.delete(id);
    return { id: tag.id, name: tag.name, slug: tag.slug };
  }
}
