import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  tier: text("tier", { enum: ["public", "free", "premium"] }).notNull().default("free"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const admins = sqliteTable("admins", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["super", "editor"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const contentBlocks = sqliteTable("content_blocks", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  data: text("data", { mode: "json" }).notNull(),
  accessLevel: text("access_level", { enum: ["public", "free", "premium"] }).notNull(),
  previewPercentage: integer("preview_percentage").notNull().default(100),
  aiGeneratedText: text("ai_generated_text"),
  publishedAt: integer("published_at", { mode: "timestamp" }),
});

export const calendarEvents = sqliteTable("calendar_events", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  currency: text("currency").notNull(),
  impact: text("impact"),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }).notNull(),
  forecast: text("forecast"),
  previous: text("previous"),
  actual: text("actual"),
  aiContext: text("ai_context", { mode: "json" }),
});

export const centralBanks = sqliteTable("central_banks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  currency: text("currency").notNull(),
  currentRate: text("current_rate"),
  stance: text("stance"),
  nextMeetingAt: integer("next_meeting_at", { mode: "timestamp" }),
  aiSummary: text("ai_summary"),
});

export const indicators = sqliteTable("indicators", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["cpi", "gdp", "nfp", "unemployment", "pmi", "retail_sales", "ppi"] }).notNull(),
  country: text("country").notNull(),
  value: text("value"),
  date: integer("date", { mode: "timestamp" }).notNull(),
  aiContext: text("ai_context", { mode: "json" }),
});

export const yields = sqliteTable("yields", {
  id: text("id").primaryKey(),
  country: text("country").notNull(),
  tenor: text("tenor", { enum: ["2y", "10y"] }).notNull(),
  value: text("value").notNull(),
  date: integer("date", { mode: "timestamp" }).notNull(),
});

export const cotReports = sqliteTable("cot_reports", {
  id: text("id").primaryKey(),
  pair: text("pair").notNull(),
  commercialNet: integer("commercial_net"),
  noncommercialNet: integer("noncommercial_net"),
  retailNet: integer("retail_net"),
  weekOf: integer("week_of", { mode: "timestamp" }).notNull(),
  aiContext: text("ai_context", { mode: "json" }),
});

export const newsItems = sqliteTable("news_items", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body"),
  source: text("source"),
  sentiment: text("sentiment"),
  affectedPairs: text("affected_pairs", { mode: "json" }),
  publishedAt: integer("published_at", { mode: "timestamp" }).notNull(),
});

export const blogPosts = sqliteTable("blog_posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  body: text("body").notNull(),
  category: text("category"),
  tags: text("tags", { mode: "json" }),
  seoMeta: text("seo_meta", { mode: "json" }),
  publishedAt: integer("published_at", { mode: "timestamp" }),
});

export const affiliatePartners = sqliteTable("affiliate_partners", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", { enum: ["broker", "prop_firm"] }).notNull(),
  link: text("link").notNull(),
  commissionType: text("commission_type"),
  placement: text("placement"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});

export const subscriptions = sqliteTable("subscriptions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  plan: text("plan").notNull(),
  status: text("status", { enum: ["active", "inactive", "pending"] }).notNull(),
  nowpaymentsInvoiceId: text("nowpayments_invoice_id"),
  startedAt: integer("started_at", { mode: "timestamp" }),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
});

export const referrals = sqliteTable("referrals", {
  id: text("id").primaryKey(),
  referrerId: text("referrer_id").notNull().references(() => users.id),
  referredId: text("referred_id").notNull().references(() => users.id),
  rewardType: text("reward_type"),
  status: text("status", { enum: ["pending", "granted"] }).notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  taskType: text("task_type").notNull(),
  status: text("status", { enum: ["pending", "completed"] }).notNull().default("pending"),
  rewardGranted: integer("reward_granted", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const promptTemplates = sqliteTable("prompt_templates", {
  id: text("id").primaryKey(),
  taskType: text("task_type").notNull(),
  systemPrompt: text("system_prompt").notNull(),
  userPromptTemplate: text("user_prompt_template").notNull(),
  variables: text("variables", { mode: "json" }),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
});
