import type { Outcome } from "@shared/constants";
import type {
  CorrectionDto,
  CreateCorrectionInput,
  CreateResultInput,
  QueueItemDto,
  QueueResponse,
  ResultDetail,
  ResultDto,
  ResultListItemDto,
} from "@shared/results";
import { conflict, notFound } from "../lib/errors";
import { toAttachmentDto } from "../lib/dto";
import { newId } from "../lib/ids";
import { nowIso } from "../lib/time";
import type { CorrectionRow, PostBrief, Repositories, ResultFilter, ResultRow, QueueFilter } from "../repositories/types";
import { EvaluationService } from "./evaluation";
import type { Actor } from "./posts";

// Database triggers are the last line of defence. Turn their messages into clean 409s.
function mapDbError(e: unknown): never {
  const msg = e instanceof Error ? e.message : String(e);
  const m = /(?:rule|immutable): ([^:]+)/.exec(msg);
  if (m) throw conflict(m[1]!.trim());
  if (msg.includes("UNIQUE")) throw conflict("This post already has a result");
  throw e;
}

export const effectiveOutcome = (result: Pick<ResultRow, "outcome">, corrections: Pick<CorrectionRow, "newOutcome">[]): Outcome =>
  corrections.length > 0 ? corrections[corrections.length - 1]!.newOutcome : result.outcome; // corrections are ordered oldest first

export class ResultService {
  constructor(private repos: Repositories) {}

  private async names(ids: (string | null)[]): Promise<Map<string, string>> {
    const users = await this.repos.users.findManyByIds(ids.filter((i): i is string => !!i));
    return new Map(users.map((u) => [u.id, u.name]));
  }

  private toResultDto(r: ResultRow, names: Map<string, string>): ResultDto {
    return { ...r, evaluatedByName: names.get(r.evaluatedBy) ?? null };
  }

  private toCorrectionDto(c: CorrectionRow, names: Map<string, string>): CorrectionDto {
    return { ...c, createdByName: names.get(c.createdBy) ?? null };
  }

  // ---------- queue: published posts past valid_until with no result yet ----------
  async queue(f: QueueFilter): Promise<QueueResponse> {
    const now = nowIso();
    const [{ items, total }, rule] = await Promise.all([this.repos.results.queue(f, now), new EvaluationService(this.repos).activeRule()]);
    const nowMs = Date.parse(now);
    const out: QueueItemDto[] = items.map((p) => ({
      ...p,
      hoursOverdue: p.validUntil ? Math.max(0, Math.floor((nowMs - Date.parse(p.validUntil)) / 3_600_000)) : 0,
    }));
    return { items: out, total, activeRuleVersion: rule.version, activeRuleText: rule.textMd };
  }

  // ---------- list ----------
  async list(f: ResultFilter): Promise<{ items: ResultListItemDto[]; total: number }> {
    const { items, total } = await this.repos.results.list(f);
    const names = await this.names(items.map((i) => i.result.evaluatedBy));
    return {
      total,
      items: items.map((i) => ({
        result: this.toResultDto(i.result, names),
        post: i.post,
        effectiveOutcome: i.effectiveOutcome,
        correctionCount: i.correctionCount,
      })),
    };
  }

  // ---------- detail ----------
  async detail(id: string): Promise<ResultDetail> {
    const result = await this.repos.results.findById(id);
    if (!result) throw notFound("Result not found");
    return this.buildDetail(result);
  }

  async detailByPost(postId: string): Promise<ResultDetail | null> {
    const result = await this.repos.results.findByPostId(postId);
    return result ? this.buildDetail(result) : null;
  }

  private async buildDetail(result: ResultRow): Promise<ResultDetail> {
    const [corrections, attachments, post] = await Promise.all([
      this.repos.results.listCorrections(result.id),
      this.repos.attachments.listByOwner("result", result.id),
      this.repos.posts.findById(result.postId),
    ]);
    if (!post) throw notFound("Post not found");
    const names = await this.names([result.evaluatedBy, ...corrections.map((c) => c.createdBy)]);
    const brief: PostBrief = {
      id: post.id,
      type: post.type,
      marketId: post.marketId,
      postDate: post.postDate,
      weekStartDate: post.weekStartDate,
      bias: post.bias,
      confidence: post.confidence,
      title: post.title,
      validUntil: post.validUntil,
      analystId: post.analystId,
      access: post.access,
    };
    return {
      result: this.toResultDto(result, names),
      post: brief,
      corrections: corrections.map((c) => this.toCorrectionDto(c, names)),
      effectiveOutcome: effectiveOutcome(result, corrections),
      attachments: attachments.map(toAttachmentDto),
    };
  }

  // ---------- create (one result per post, never edited afterwards) ----------
  async create(actor: Actor, input: CreateResultInput): Promise<ResultDetail> {
    const post = await this.repos.posts.findById(input.postId);
    if (!post) throw notFound("Post not found");
    if (post.status !== "published") throw conflict("Only a published post can be evaluated");
    if (!post.validUntil || Date.parse(post.validUntil) > Date.now()) {
      throw conflict("This post is still valid. A result can be added after its valid-until time.");
    }
    if (await this.repos.results.findByPostId(post.id)) throw conflict("This post already has a result");

    const rule = await new EvaluationService(this.repos).activeRule();
    let row: ResultRow;
    try {
      row = await this.repos.results.create({
        id: newId(),
        postId: post.id,
        outcome: input.outcome,
        noteMd: input.noteMd,
        evaluatedBy: actor.id,
        evaluationRuleVersion: rule.version, // set by the server, never the client
      });
    } catch (e) {
      mapDbError(e);
    }
    return this.buildDetail(row);
  }

  // ---------- correction (append-only; shown publicly beside the original result) ----------
  async addCorrection(actor: Actor, resultId: string, input: CreateCorrectionInput) {
    const result = await this.repos.results.findById(resultId);
    if (!result) throw notFound("Result not found");
    const existing = await this.repos.results.listCorrections(resultId);
    const current = effectiveOutcome(result, existing);
    if (input.newOutcome === current) throw conflict(`The current outcome is already "${current}"`);
    try {
      await this.repos.results.addCorrection({
        id: newId(),
        resultId,
        newOutcome: input.newOutcome,
        reasonMd: input.reasonMd,
        createdBy: actor.id,
      });
    } catch (e) {
      mapDbError(e);
    }
    return { before: current, detail: await this.buildDetail(result) };
  }
}
