import { z } from "zod";
import type { AttachmentKind, Access, Outcome, PostType } from "./constants";
import { dateString } from "./content";
import { EVENT_IMPACTS, type EventImpactValue } from "./events";
import type { AccessInfo, PublicNoteItem, PublicPostItem } from "./public";

// Detail pages, bookmarks, events and rules of the public site (Phase 4).

// A screenshot as the public sees it. `url` is set only when this viewer may open it (served by the authorized /files/:id route).
export interface PublicAttachmentItem {
  id: string;
  kind: AttachmentKind;
  caption: string;
  mime: string;
  lock: AccessInfo;
  url: string | null;
}

// Original result stays visible; corrections are listed beside it (latest correction = effective outcome).
export interface PublicCorrectionDto {
  newOutcome: Outcome;
  reasonMd: string;
  createdAt: string;
}

export interface PublicResultDetail {
  outcome: Outcome; // the ORIGINAL outcome
  noteMd: string;
  evaluatedAt: string;
  ruleVersion: number;
  corrections: PublicCorrectionDto[];
  effectiveOutcome: Outcome;
  attachments: PublicAttachmentItem[];
}

// Per-user fingerprint shown small under the content. The invisible part is inside the text itself.
export interface WatermarkDto {
  footer: string;
}

export interface PublicPostDetail {
  item: PublicPostItem;
  // null while locked: no body, no result, no screenshots
  detail: {
    bodyMd: string;
    keyDriversMd: string;
    riskEventsMd: string;
    invalidationMd: string;
    validFrom: string | null;
    attachments: PublicAttachmentItem[];
    result: PublicResultDetail | null;
    notes: PublicNoteItem[]; // killzone notes linked to this post
    watermark: WatermarkDto | null; // null for logged-out visitors
  } | null;
}

export interface PublicLinkedPost {
  id: string;
  type: PostType;
  marketId: string;
  postDate: string;
  weekStartDate: string;
  access: Access;
  lock: AccessInfo;
  title: string | null; // only when the linked post is open for this viewer
}

export interface PublicNoteDetail {
  item: PublicNoteItem;
  detail: {
    noteMd: string;
    attachments: PublicAttachmentItem[];
    linkedPost: PublicLinkedPost | null;
    watermark: WatermarkDto | null;
  } | null;
}

export interface PublicEventDto {
  id: string;
  title: string;
  startsAt: string;
  impact: EventImpactValue;
  currency: string | null;
  descriptionMd: string;
}

export interface PublicRulesDto {
  activeVersion: number;
  items: { version: number; textMd: string; activeFrom: string; active: boolean }[]; // newest first
}

const csv = <T extends z.ZodTypeAny>(item: T) =>
  z
    .string()
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(item).max(10))
    .optional();

// No from/to = the next 30 days. from/to are UTC calendar days, both inclusive.
export const publicEventsQuery = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
  impact: csv(z.enum(EVENT_IMPACTS)),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});
export type PublicEventsQuery = z.infer<typeof publicEventsQuery>;

export const bookmarkParams = z.object({ type: z.enum(["post", "note"]), id: z.string().min(1).max(40) });
