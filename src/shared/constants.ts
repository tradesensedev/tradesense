export const ROLES = ["admin", "editor", "analyst", "member"] as const;
export type Role = (typeof ROLES)[number];

export const POST_TYPES = ["daily", "weekly"] as const;
export type PostType = (typeof POST_TYPES)[number];

export const BIASES = ["bullish", "bearish", "neutral"] as const;
export type Bias = (typeof BIASES)[number];

export const CONFIDENCES = ["high", "medium", "low"] as const;
export type Confidence = (typeof CONFIDENCES)[number];

export const SENTIMENTS = ["risk_on", "risk_off", "mixed"] as const;
export type Sentiment = (typeof SENTIMENTS)[number];

export const ACCESS_LEVELS = ["free", "paid"] as const;
export type Access = (typeof ACCESS_LEVELS)[number];

export const PUBLISH_STATUSES = ["draft", "scheduled", "published"] as const;
export type PublishStatus = (typeof PUBLISH_STATUSES)[number];

export const KILLZONES = ["asia", "london", "ny_am", "ny_pm"] as const;
export type Killzone = (typeof KILLZONES)[number];

export const NOTE_STATUSES = ["followed", "non_followed", "invalidation", "neutral"] as const;
export type NoteStatus = (typeof NOTE_STATUSES)[number];

export const OUTCOMES = ["correct", "wrong", "partial"] as const;
export type Outcome = (typeof OUTCOMES)[number];

export const MARKET_CATEGORIES = ["gold", "forex", "index", "crypto", "oil", "dxy"] as const;
export type MarketCategory = (typeof MARKET_CATEGORIES)[number];

export const ATTACHMENT_OWNER_TYPES = ["post", "note", "result"] as const;
export type AttachmentOwnerType = (typeof ATTACHMENT_OWNER_TYPES)[number];

export const ATTACHMENT_KINDS = ["bias_chart", "result_chart", "note_chart", "other"] as const;
export type AttachmentKind = (typeof ATTACHMENT_KINDS)[number];

export const ATTACHMENT_ACCESS = ["inherit", "free", "paid", "public"] as const;
export type AttachmentAccess = (typeof ATTACHMENT_ACCESS)[number];

export const ALLOWED_UPLOAD_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB per file

export const SESSION_COOKIE = "ts_session";
export const CSRF_HEADER = "x-csrf-token";
export const SESSION_TTL_DAYS = 14;
export const MAGIC_LINK_TTL_MINUTES = 15;

// Things the public site logs views for (view_log.entity_type). Bookmarks cover post | note only.
export const PUBLIC_ENTITY_TYPES = ["post", "note", "attachment"] as const;
export type PublicEntityType = (typeof PUBLIC_ENTITY_TYPES)[number];
