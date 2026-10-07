import { z } from "zod";
import { OUTCOMES, POST_TYPES, type Access, type Bias, type Confidence, type Outcome, type PostType } from "./constants";
import { dateString, type AttachmentDto } from "./content";

const idString = z.string().min(1).max(40);

// ---------------- input schemas ----------------
// A result needs an outcome and a written note. The rule version is set by the server (never by the client).
export const createResultSchema = z
  .object({
    postId: idString,
    outcome: z.enum(OUTCOMES),
    noteMd: z.string().trim().min(1, "A note is required").max(5000),
  })
  .strict();
export type CreateResultInput = z.infer<typeof createResultSchema>;

// Results never change. A correction is appended and shown publicly on the post.
export const createCorrectionSchema = z
  .object({
    newOutcome: z.enum(OUTCOMES),
    reasonMd: z.string().trim().min(1, "A reason is required").max(5000),
  })
  .strict();
export type CreateCorrectionInput = z.infer<typeof createCorrectionSchema>;

export const queueQuery = z.object({
  marketId: idString.optional(),
  type: z.enum(POST_TYPES).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const resultListQuery = z.object({
  outcome: z.enum(OUTCOMES).optional(),
  marketId: idString.optional(),
  type: z.enum(POST_TYPES).optional(),
  dateFrom: dateString.optional(),
  dateTo: dateString.optional(),
  evaluatedBy: idString.optional(),
  ruleVersion: z.coerce.number().int().min(1).optional(),
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// ---------------- DTOs ----------------
export interface ResultDto {
  id: string;
  postId: string;
  outcome: Outcome;
  noteMd: string;
  evaluatedBy: string;
  evaluatedByName: string | null;
  evaluatedAt: string;
  evaluationRuleVersion: number;
}

export interface CorrectionDto {
  id: string;
  resultId: string;
  newOutcome: Outcome;
  reasonMd: string;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
}

export interface PostBriefDto {
  id: string;
  type: PostType;
  marketId: string;
  postDate: string;
  weekStartDate: string;
  bias: Bias;
  confidence: Confidence;
  title: string;
  validUntil: string | null;
  analystId: string | null;
  access: Access;
}

export interface QueueItemDto extends PostBriefDto {
  hoursOverdue: number; // hours since valid_until
}

export interface QueueResponse {
  items: QueueItemDto[];
  total: number;
  activeRuleVersion: number;
  activeRuleText: string;
}

export interface ResultListItemDto {
  result: ResultDto;
  post: PostBriefDto;
  effectiveOutcome: Outcome; // latest correction wins, otherwise the original outcome
  correctionCount: number;
}

export interface ResultDetail {
  result: ResultDto;
  post: PostBriefDto;
  corrections: CorrectionDto[];
  effectiveOutcome: Outcome;
  attachments: AttachmentDto[];
}

// ---------------- evaluation rules ----------------
export const createRuleSchema = z
  .object({
    textMd: z.string().trim().min(1, "Rule text is required").max(20000),
    activate: z.boolean().default(true),
  })
  .strict();
export type CreateRuleInput = z.infer<typeof createRuleSchema>;

export interface RuleDto {
  id: string;
  version: number;
  textMd: string;
  activeFrom: string;
  active: boolean; // true for the version stored in settings.active_evaluation_rule_version
}
