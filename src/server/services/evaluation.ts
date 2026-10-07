import type { CreateRuleInput, RuleDto } from "@shared/results";
import { conflict, notFound } from "../lib/errors";
import { nowIso } from "../lib/time";
import type { EvaluationRuleRow, Repositories } from "../repositories/types";
import { SettingsService } from "./settings";
import type { Actor } from "./posts";

const SETTING_KEY = "active_evaluation_rule_version";

export const toRuleDto = (r: EvaluationRuleRow, activeVersion: number): RuleDto => ({
  id: r.id,
  version: r.version,
  textMd: r.textMd,
  activeFrom: r.activeFrom,
  active: r.version === activeVersion,
});

// Evaluation rules are append-only. Changing a rule = a new version. Results remember the version they used.
export class EvaluationService {
  constructor(private repos: Repositories) {}

  async activeVersion(): Promise<number> {
    return (await new SettingsService(this.repos).getAll()).active_evaluation_rule_version;
  }

  // The rule results are evaluated under now. Falls back to the newest version if the setting points nowhere.
  async activeRule(): Promise<EvaluationRuleRow> {
    const version = await this.activeVersion();
    const rule = (await this.repos.evaluationRules.findByVersion(version)) ?? (await this.repos.evaluationRules.latest());
    if (!rule) throw conflict("No evaluation rule exists yet. Add one under Evaluation rules first.");
    return rule;
  }

  async list(): Promise<RuleDto[]> {
    const [rules, active] = await Promise.all([this.repos.evaluationRules.list(), this.activeVersion()]);
    return rules.map((r) => toRuleDto(r, active));
  }

  async create(actor: Actor, input: CreateRuleInput) {
    const previous = await this.activeVersion();
    const rule = await this.repos.evaluationRules.create({ textMd: input.textMd, activeFrom: nowIso() });
    if (input.activate) await this.repos.settings.set(SETTING_KEY, JSON.stringify(rule.version), actor.id);
    return { rule: toRuleDto(rule, input.activate ? rule.version : previous), previousVersion: previous, activated: input.activate };
  }

  async activate(actor: Actor, version: number) {
    const rule = await this.repos.evaluationRules.findByVersion(version);
    if (!rule) throw notFound("Rule version not found");
    const previous = await this.activeVersion();
    if (previous === version) return { rule: toRuleDto(rule, version), previousVersion: previous, changed: false };
    await this.repos.settings.set(SETTING_KEY, JSON.stringify(version), actor.id);
    return { rule: toRuleDto(rule, version), previousVersion: previous, changed: true };
  }
}
