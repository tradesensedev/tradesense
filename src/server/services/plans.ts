import type { CreatePlanInput, PlanDto, RegionPricesInput, UpdatePlanInput } from "@shared/admin";
import { conflict, notFound } from "../lib/errors";
import type { PlanRow, Repositories } from "../repositories/types";

// Plans are never deleted (payments and subscriptions point at them). Switch them off with active = false.
export class PlanService {
  constructor(private repos: Repositories) {}

  private async toDto(p: PlanRow): Promise<PlanDto> {
    const regions = await this.repos.plans.listRegionPrices(p.id);
    return { ...p, regionPrices: regions.map((r) => ({ countryCode: r.countryCode, priceUsd: r.priceUsd })) };
  }

  private async mustFind(id: string) {
    const p = await this.repos.plans.findById(id);
    if (!p) throw notFound("Plan not found");
    return p;
  }

  async list() {
    return Promise.all((await this.repos.plans.list()).map((p) => this.toDto(p)));
  }

  async get(id: string) {
    return this.toDto(await this.mustFind(id));
  }

  async create(input: CreatePlanInput) {
    if (await this.repos.plans.findByCode(input.code)) throw conflict("A plan with this code already exists");
    return this.toDto(await this.repos.plans.create(input));
  }

  async update(id: string, patch: UpdatePlanInput) {
    const before = await this.get(id);
    await this.repos.plans.update(id, patch);
    return { before, after: await this.get(id) };
  }

  async setRegionPrices(id: string, input: RegionPricesInput) {
    const before = await this.get(id);
    await this.repos.plans.replaceRegionPrices(id, input.prices);
    return { before: before.regionPrices, after: (await this.get(id)).regionPrices };
  }
}
