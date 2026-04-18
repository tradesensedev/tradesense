# TradeSense - Make Sense of The Market

**AI-Powered Financial Intelligence for the Modern Retail Trader**
Built for 10M+ users. Structured for rapid development, infinite scalability, and maximum growth.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Core Philosophy](#2-core-philosophy)
3. [Feature Breakdown](#3-feature-breakdown)
4. [Growth Systems](#4-growth-systems)
5. [AI Pipeline Architecture](#5-ai-pipeline-architecture)
6. [Admin Panel System](#6-admin-panel-system)
7. [Content Delivery System](#7-content-delivery-system)
8. [Access Control System](#8-access-control-system)
9. [Multi-Language System](#9-multi-language-system)
10. [Payment System](#10-payment-system)
11. [UI/UX System](#11-uiux-system)
12. [Tech Stack](#12-tech-stack)
13. [Folder Structure](#13-folder-structure)
14. [Scalability Strategy](#14-scalability-strategy)
15. [Cost Optimization Strategy](#15-cost-optimization-strategy)

---

## 1. Product Overview

**TradeSense** is a global AI-powered trading intelligence platform designed for both beginner and advanced traders. It combines fundamental analysis, market education, and decision-support into a single, progressive SaaS product.

### What It Is

| Dimension | Description |
|-----------|-------------|
| **AI Engine** | Multi-model pipeline (OpenAI, Claude, Gemini, Perplexity, Grok) for insight generation |
| **Education Layer** | Every data point explained: what it is, why it matters, what happens next |
| **Decision Support** | Context-aware analysis, not raw data dumps |
| **Growth Machine** | Referral + task-based unlock drives viral acquisition |
| **Global SaaS** | Multi-language, multi-currency, local payment methods |
| **Admin-Controlled** | Every system behavior configurable without code deployments |

### Target Audience

- **Beginners**: Guided daily workflow, plain-language explanations, "Start Here" mode
- **Intermediate/Advanced**: Deep COT analysis, AI speech decoding, Smart Money positioning
- **Global**: English, Bengali, Hindi, Portuguese, Arabic — with local payment rails

---

## 2. Core Philosophy

### Three-Layer Product Value

```
LAYER 1 — ANALYSIS     → What is happening in the market
LAYER 2 — EDUCATION    → Why it matters and historical context
LAYER 3 — DECISION     → What could happen next, risk level, session timing
```

Every single feature must deliver all three layers. A news item without "why it matters" is incomplete. A COT report without historical context is useless for a beginner. This philosophy is non-negotiable in product development.

### Design Principles

- **Progressive Friction**: Users get value first, then encounter login/payment walls
- **Trust Before Monetization**: Accuracy tracking and transparency build conversion
- **Admin Supremacy**: No feature is hardcoded; all logic is configurable in the admin panel
- **AI as Infrastructure**: AI is not a feature — it is the underlying engine of every content system
- **Cost-Aware Routing**: AI model selection is driven by cost, speed, and task complexity

---

## 3. Feature Breakdown

### 3.1 Daily Fundamental Insight

**What it does**: Generates daily market insight reports combining macro fundamentals, currency pair analysis, and forward-looking context.

**Architecture**:
```
Admin defines prompt template (with variables)
     ↓
Scheduler triggers pipeline at configured time (e.g., 06:00 UTC)
     ↓
AI Pipeline fetches live data (economic events, COT, news sentiment)
     ↓
Multi-model chain generates structured draft
     ↓
Draft enters review queue → Admin edits → Publishes
     ↓
Content stored in DB with language variants queued for translation
```

**Key Logic**:
- Admin sets: model selection, prompt template, output structure, publish time
- Draft system prevents unreviewed AI content from going live
- Each insight tagged with: currency pairs, market condition, risk level, best session

---

### 3.2 Smart Economic Calendar

**What it does**: A Forex Factory-inspired calendar with AI-enriched context for each event.

**Architecture**:
```
Raw calendar data fetched from: Investing.com API / ForexFactory scraper / custom source
     ↓
Each event enriched by AI:
  - What is this event?
  - Why does it matter?
  - Historical impact on specific pairs
  - Expected market reaction scenarios
     ↓
Stored in DB with language variants
     ↓
Frontend renders with filter: currency, impact level, date range
```

**Data Model per Event**:
```json
{
  "event_id": "uuid",
  "name": "US Non-Farm Payrolls",
  "currency": "USD",
  "impact": "high",
  "scheduled_at": "2025-07-04T12:30:00Z",
  "forecast": "180K",
  "previous": "175K",
  "actual": null,
  "ai_context": {
    "what_it_is": "...",
    "why_it_matters": "...",
    "historical_impact": "...",
    "possible_scenarios": "..."
  },
  "translations": { "bn": {...}, "hi": {...} }
}
```

---

### 3.3 Smart COT Report

**What it does**: Simplifies CFTC Commitment of Traders data for retail traders, with historical filtering and visual positioning display.

**Architecture**:
```
COT data ingested weekly (CFTC release: every Friday)
     ↓
Parser extracts: Commercial, Non-Commercial, Retail net positions
     ↓
AI generates plain-language interpretation
     ↓
Historical data stored for trend visualization
     ↓
Frontend: toggle between raw data / simplified view / historical chart
```

**Feature Logic**:
- "Smart Money vs Retail" view shows net position divergence
- AI explains what extreme positioning historically means
- Admin controls which pairs to display and analysis depth

---

### 3.4 Speech Decoder (Flagship Feature)

**What it does**: Real-time AI interpretation of central bank speeches, press conferences, FOMC statements.

**Architecture**:
```
Event scheduled in admin (e.g., Fed Chair speech, 14:30 UTC)
     ↓
PRE-EVENT: Countdown timer activates, historical context generated
     ↓
DURING EVENT: Live transcript feed (via whisper/manual input/API)
     ↓
AI pipeline processes in segments:
  - Hawkish/Dovish sentiment score
  - Key phrase extraction
  - Real-time market implication per currency pair
     ↓
POST-EVENT: Full summary generated, insight published to feed
```

**Event Hype System**:
- Countdown shown 24 hours before event
- Push notification / email alert available for premium users
- Live "reaction feed" during event (AI + user reactions)
- Post-event summary card with accuracy score vs market move

---

### 3.5 AI News Intelligence

**What it does**: Converts raw financial news into structured, trader-relevant intelligence.

**Pipeline**:
```
News ingested from: RSS feeds, NewsAPI, Perplexity live search
     ↓
Deduplication + relevance scoring
     ↓
AI enrichment: sentiment, impacted pairs, urgency level
     ↓
Tagged and stored; pushed to relevant user feeds based on watchlist
```

---

## 4. Growth Systems

### 4.1 Bias Accuracy Engine

**Purpose**: Build institutional-grade trust with retail users.

**Logic**:
```
Every AI insight that makes a directional prediction is tagged:
  - Direction: Bullish / Bearish / Neutral
  - Confidence: Low / Medium / High
  - Pair: e.g., EURUSD
  - Time horizon: intraday / daily / weekly

After horizon expires:
  - System fetches actual market close
  - Compares prediction vs outcome
  - Updates accuracy % for: pair, model used, insight type

Public Accuracy Dashboard shows:
  - Overall accuracy %
  - Per-pair accuracy
  - 7-day / 30-day / all-time
  - Comparison: AI models used
```

**Why It Matters**: No other retail platform shows this. It becomes a core trust and marketing differentiator.

---

### 4.2 Market Status Layer

**Logic**: Each day, a single system-wide status is computed and displayed prominently.

```
TRENDING     → Strong directional bias detected (COT + fundamentals + AI agree)
RANGING      → No clear bias; low-volatility, consolidation phase
HIGH RISK    → Major event upcoming or conflicting signals detected
```

Computed by a lightweight AI call each morning using: COT data, upcoming economic events, and prior-day volatility score. Admin can override manually.

---

### 4.3 Trade Context Layer

Attached to every insight card:

| Field | Example |
|-------|---------|
| **Best Session** | London / New York overlap |
| **Key Events** | NFP in 3 hours |
| **Risk Level** | Medium — awaiting US CPI |
| **Correlated Pairs** | GBPUSD, USDJPY |

This transforms analysis into actionable decision context.

---

### 4.4 Event Hype System

- Visible countdown on homepage and calendar for high-impact events
- Push notification opt-in (web push / email)
- Live "signal feed" during event with AI updates every 60-120 seconds
- Post-event "What happened" card auto-generated
- Social share prompt after event ends ("Share the summary")

---

### 4.5 Smart Money vs Retail Comparison

Displayed on COT insight cards:

```
EURUSD Positioning — This Week

Smart Money (Non-Commercial):  ████████░░  +68% NET LONG
Retail (Small Speculator):     ░░░░░░████  +74% NET SHORT

AI Context: "When Smart Money and Retail are on opposite sides
             at this extreme, historically price has moved in
             Smart Money's direction 71% of the time."
```

This triggers psychological engagement — retail traders want to know what the "other side" is doing.

---

### 4.6 Beginner "Start Here" Mode

Activated on first visit (or via profile toggle). Replaces normal UI with:

```
Step 1: Check Market Status (Trending / Ranging / High Risk)
Step 2: Read Today's Main Insight
Step 3: Check today's high-impact events
Step 4: Review key positioning (Smart Money vs Retail)
Step 5: Make your decision
```

Each step links to the relevant platform section. Plain language everywhere. Advanced terminology hidden by default.

---

### 4.7 Insight Feedback System

Each published insight includes:

- 👍 Useful / 👎 Not Useful buttons
- After vote: "X% of traders found this useful"
- Optional: free-text feedback (sent to admin review queue)
- Data fed back into: AI model evaluation, admin review prioritization

---

### 4.8 Referral System

**Logic**:
```
User gets unique referral link
     ↓
Referred user signs up → tracked via cookie + UTM
     ↓
When referred user converts (premium OR completes tasks):
  → Referrer earns: premium days / unlock credits / cash (admin-configurable)
     ↓
Admin panel controls:
  - Reward type (days / credits / money)
  - Reward trigger (signup / first payment / task completion)
  - Fraud detection threshold
```

---

### 4.9 Task-Based Unlock System

Users can earn premium access by completing tasks:

| Task | Reward |
|------|--------|
| Share a daily insight on social media | +3 days premium |
| Refer 1 user who signs up | +7 days premium |
| Complete onboarding quiz | Unlock 1 premium feature |
| Leave verified review | +5 days premium |
| Watch tutorial video | Unlock educational section |

Task completion verified via: OAuth share confirmation, referral tracking, quiz system, review platform webhook.

---

## 5. AI Pipeline Architecture

### 5.1 Multi-Model Strategy

| Model | Best Use Case | Cost Tier |
|-------|--------------|-----------|
| **GPT-4o** | Deep analysis, structured output | High |
| **Claude Sonnet** | Long-form writing, educational content | Medium |
| **Gemini Flash** | Fast enrichment, translation | Low |
| **Perplexity** | Live news + web search | Per-query |
| **Grok** | Real-time X/social sentiment | Medium |

### 5.2 Model Selection Logic

```
Admin defines per-task routing:

TASK: "daily_insight_generation"
  → PRIMARY: GPT-4o
  → FALLBACK_1: Claude Sonnet
  → FALLBACK_2: Gemini Pro
  → TIMEOUT: 15s per model before fallback triggers

TASK: "news_enrichment"
  → PRIMARY: Gemini Flash (lowest cost)
  → FALLBACK: GPT-4o-mini

TASK: "translation"
  → PRIMARY: Gemini Flash
  → FALLBACK: GPT-4o-mini

TASK: "speech_decoding_live"
  → PRIMARY: GPT-4o (speed + quality)
  → FALLBACK: Claude Sonnet
```

### 5.3 Prompt Architecture

Every prompt is stored in the database. No hardcoded prompts in application code.

**Prompt Schema**:
```json
{
  "prompt_id": "uuid",
  "task_type": "daily_insight",
  "model_target": "gpt-4o",
  "system_prompt": "You are a world-class FX market analyst...",
  "user_prompt_template": "Analyze {currency_pair} for {date}. Current bias from COT: {cot_bias}. Upcoming events: {events}. Generate insight in format: ...",
  "variables": ["currency_pair", "date", "cot_bias", "events"],
  "output_format": "json",
  "output_schema": { "headline": "string", "analysis": "string", "direction": "string" },
  "active": true,
  "version": 3
}
```

### 5.4 Prompt Chaining System

```
CHAIN: daily_insight_full

Step 1 → FETCH_CONTEXT
  Input: date, currency_pairs
  Output: { cot_data, economic_events, yesterday_summary }

Step 2 → GENERATE_DRAFT
  Input: Step 1 output + prompt template
  Model: GPT-4o
  Output: raw JSON draft

Step 3 → QUALITY_CHECK
  Input: Step 2 output
  Model: Claude Sonnet (evaluator role)
  Prompt: "Review this insight. Flag any: factual errors, missing context, unclear language. Return: { pass: bool, issues: [] }"

Step 4 → ENRICH_EDUCATION
  Input: Step 2 output
  Model: Gemini Flash
  Prompt: "Add beginner-friendly explanation for each technical term"

Step 5 → TRANSLATE_QUEUE
  Input: Final approved content
  Trigger: On admin publish
  Jobs: One per language enabled by admin
```

### 5.5 Cost Optimization Routing

```
IF task.urgency == "realtime":
  → use fastest model regardless of cost (speech decoder)

IF task.urgency == "scheduled":
  → use cheapest model that meets quality threshold

IF task.type == "translation":
  → always use Gemini Flash (highest ROI)

IF primary_model_cost_this_hour > admin_set_budget_cap:
  → auto-downgrade to next tier model
  → alert admin via dashboard notification
```

### 5.6 Fallback System

```
try:
  response = call_model(primary, prompt, timeout=15s)
except TimeoutError:
  log_event("primary_timeout", primary_model)
  response = call_model(fallback_1, prompt, timeout=20s)
except RateLimitError:
  wait_and_retry(max=2)
  OR route_to_fallback()
except ModelError:
  response = call_model(fallback_2, prompt)
  alert_admin("primary_model_failure")

if response.quality_score < threshold:
  flag_for_human_review()
```

---

## 6. Admin Panel System

The Admin Panel is the command center of the entire platform. Every system behavior is configurable here.

### 6.1 Admin Modules

| Module | Controls |
|--------|----------|
| **AI Pipeline** | Prompts, model routing, fallback order, cost caps |
| **Content** | Draft review, publish, schedule, archive |
| **Access Control** | Free vs premium content, lock thresholds, blur rules |
| **Users** | User list, subscription status, manual grants, bans |
| **Referral System** | Reward types, triggers, fraud rules |
| **Task System** | Task definitions, reward mapping, verification method |
| **Payments** | Plans, pricing, active payment methods per region |
| **Translations** | Review translation drafts, approve/reject, publish |
| **Ads** | Ad placements, targeting rules, enable/disable per page |
| **Feature Flags** | Enable/disable any feature for any user segment |
| **Accuracy Engine** | Review flagged predictions, adjust evaluation rules |
| **Notifications** | Configure push/email triggers, templates |
| **Prompt Builder** | Visual prompt editor with variable management |

### 6.2 Prompt Builder (Admin UI)

```
[Select Task Type]          → daily_insight / news_enrichment / translation / ...
[Select Model]              → GPT-4o / Claude / Gemini / ...
[System Prompt Editor]      → Rich textarea with syntax highlight
[User Prompt Editor]        → With {variable} highlighting
[Variable Manager]          → Define variables + data source for each
[Output Format]             → JSON / Markdown / Plain Text
[Output Schema Builder]     → Define expected JSON keys
[Test with Live Data]       → Run prompt against real data in staging
[Version History]           → Compare versions, rollback
[Set Active]                → Toggle which version is live
```

### 6.3 Admin Auth

- Separate auth system from user auth
- Role-based: Super Admin / Content Editor / Moderator / Finance
- 2FA enforced for all admin roles
- All admin actions logged with timestamp + actor
- Audit log viewable in admin panel

---

## 7. Content Delivery System

### 7.1 Content Lifecycle

```
AI GENERATES DRAFT
     ↓
STORED as status: "draft"
     ↓
ADMIN NOTIFIED (dashboard + email)
     ↓
ADMIN REVIEWS → edits if needed
     ↓
ADMIN APPROVES → status: "approved"
     ↓
SCHEDULE or PUBLISH IMMEDIATELY
     ↓
STATUS: "published"
     ↓
TRANSLATION JOBS QUEUED for all active languages
     ↓
EACH TRANSLATION: draft → admin review → published
```

### 7.2 Content Types and Storage

| Content Type | Storage | Cache Layer |
|-------------|---------|-------------|
| Daily Insights | PostgreSQL | Redis (24h TTL) |
| Economic Calendar Events | PostgreSQL | Redis (update on actual release) |
| COT Reports | PostgreSQL + S3 (raw files) | Redis (weekly) |
| News Cards | PostgreSQL | Redis (1h TTL) |
| Speech Decoder Live | Redis pub/sub + PostgreSQL post-event | No cache |
| Translations | PostgreSQL (per locale column) | Redis per locale |

### 7.3 SEO Content Strategy

Every published insight generates:
- A canonical URL: `/en/insights/eurusd-daily-2025-07-04`
- Locale variants: `/bn/insights/...`, `/hi/insights/...`
- Structured JSON-LD schema for financial content
- Meta title + description auto-generated by AI on publish
- Sitemap updated automatically on publish

---

## 8. Access Control System

### 8.1 Progressive Unlock Architecture

The platform uses **Progressive Friction** — not hard walls. Users receive value before they encounter any gate.

```
VISIT 1 (No Account):
  → Full access to: Market Status, Event titles, Today's summary (first 30%)
  → Blurred: Full insight, COT detail, Speech Decoder
  → No login prompt yet

VISIT 2-3 (Same device/cookie):
  → Soft prompt appears after 60% scroll: "Sign up free to read more"
  → Still no forced gate
  → "Start Here" beginner flow shown

AFTER FREE SIGNUP:
  → Unlock: Full daily insight, basic calendar detail, news feed
  → Locked: COT full report, Speech Decoder, Smart Money positioning
  → Premium upgrade CTA shown contextually (not aggressively)

PREMIUM:
  → Full platform access
  → OR earned via referral / task completion
```

### 8.2 Content Locking Logic

```
Each content block in DB has:
  - access_level: "public" | "free" | "premium"
  - preview_percentage: 0-100 (how much to show without access)

Frontend rendering logic:
  IF user.access >= content.access_level:
    → render full
  ELSE:
    → render preview_percentage of content
    → blur remainder
    → overlay: unlock CTA (contextual: pay / refer / task)
```

### 8.3 Soft Login Triggers

| Trigger | Condition |
|---------|-----------|
| Scroll depth | User scrolls past 70% of any insight |
| Content click | User clicks any premium-tagged element |
| Return visit | 2nd visit within 24 hours |
| Feature attempt | User clicks Speech Decoder or COT |
| Time on page | 3+ minutes on any single page |

All triggers are configurable in Admin Panel. Admin can set thresholds per trigger type.

### 8.4 Unlock CTA Logic

When a locked element is clicked, modal appears with three options:

```
┌─────────────────────────────────────┐
│  Unlock Full Access                 │
│                                     │
│  💳 Go Premium — $9/mo              │
│  👥 Refer 2 friends (free)          │
│  ✅ Complete 3 tasks (free)          │
│                                     │
│  Already premium? [Login]           │
└─────────────────────────────────────┘
```

---

## 9. Multi-Language System

### 9.1 URL Structure

```
/en/       → English (default)
/bn/       → Bengali
/hi/       → Hindi
/pt/       → Portuguese
/ar/       → Arabic
/es/       → Spanish
```

Each locale is a first-class SEO route — not a query parameter. This is critical for search indexing.

### 9.2 Translation Pipeline

```
Content published in English (primary language)
     ↓
Admin triggers translation for selected locales
     ↓
Per locale: AI translation job queued (Gemini Flash)
  Prompt: "Translate the following financial content to {locale}.
           Maintain technical accuracy. Use common trading terminology
           in {locale}. Do not translate: currency pair names, platform names."
     ↓
Translation stored as status: "translated_draft"
     ↓
Admin reviews translation (native speaker editor if available)
     ↓
Approved → status: "translated_published"
     ↓
Available at /{locale}/... URL
```

### 9.3 Translation Data Model

```json
{
  "content_id": "uuid",
  "original_locale": "en",
  "translations": {
    "bn": { "title": "...", "body": "...", "status": "published", "reviewed_by": "admin_id" },
    "hi": { "title": "...", "body": "...", "status": "draft", "reviewed_by": null }
  }
}
```

### 9.4 Admin Translation Controls

- Enable/disable specific locales globally
- Set locale-specific publish rules (auto-publish vs always review)
- View all pending translation drafts in queue
- Bulk approve translations
- Override AI translation with manual edit

---

## 10. Payment System

### 10.1 Architecture Philosophy

Payment logic is **fully modular**. Each payment provider is a plugin. Adding or removing a provider requires no changes to core business logic.

```
Core Payment Service (abstract interface)
     ↓
Provider Adapters (one per payment method):
  - StripeAdapter
  - PayPalAdapter
  - bKashAdapter
  - UPIAdapter
  - PizAdapter
  - CryptoAdapter (via Coinbase Commerce or NOWPayments)
     ↓
Admin Panel:
  - Enable/disable providers per country
  - Set pricing per currency
  - Configure webhook endpoints
```

### 10.2 Supported Payment Methods

| Category | Provider | Region |
|----------|----------|--------|
| **Card / Global** | Stripe | Global |
| **Wallet** | PayPal, Apple Pay, Google Pay | Global |
| **Crypto** | Coinbase Commerce / NOWPayments | Global |
| **Mobile Money** | bKash | Bangladesh |
| **UPI** | Razorpay | India |
| **PIX** | Stripe BR / Gerencianet | Brazil |
| **Regional** | Configurable via admin | Any |

### 10.3 Subscription Plans

Defined entirely in Admin Panel:

```json
{
  "plan_id": "premium_monthly",
  "name": "Premium Monthly",
  "prices": {
    "USD": 9.00,
    "BDT": 990,
    "INR": 749
  },
  "features": ["full_insights", "cot_report", "speech_decoder", "smart_money"],
  "billing_cycle": "monthly",
  "trial_days": 7,
  "active": true
}
```

### 10.4 Payment Flow

```
User clicks upgrade
     ↓
Frontend detects user's country (via IP geolocation)
     ↓
Available payment methods for that country shown
     ↓
User selects method → Provider Adapter initiates session
     ↓
Redirect / embedded checkout
     ↓
Webhook received from provider
     ↓
Core Payment Service validates + processes
     ↓
User subscription record updated in DB
     ↓
Access control cache invalidated
     ↓
Confirmation email sent
```

---

## 11. UI/UX System

### 11.1 Layout Strategy

**Mobile** (< 768px):
```
┌──────────────────────┐
│  Header (logo + CTA) │
│──────────────────────│
│                      │
│    Main Content      │
│                      │
│──────────────────────│
│  Bottom Navbar       │
│  [Home][Cal][COT][Me]│
└──────────────────────┘
```

**Desktop** (≥ 1024px):
```
┌────────┬─────────────────────┐
│        │  Top Bar            │
│ Side   │─────────────────────│
│ Bar    │                     │
│        │   Main Content      │
│[nav    │                     │
│ items] │                     │
│        │                     │
└────────┴─────────────────────┘
```

### 11.2 Logged-Out vs Logged-In UI

**Without Login**:
- No personalization elements
- Market Status banner visible
- Insight preview with blur overlay
- Single prominent CTA: "Get Free Access"
- Beginner mode prompt

**With Free Account**:
- Saved watchlist available
- Full daily insight visible
- Premium lock indicators shown contextually

**With Premium**:
- All locks removed
- COT, Speech Decoder, Smart Money fully visible
- Notification preferences available
- Accuracy tracker dashboard

### 11.3 Design Tokens

```css
--color-primary: #0A84FF;
--color-success: #30D158;
--color-danger: #FF3B30;
--color-warning: #FFD60A;
--color-bg-primary: #0D1117;
--color-bg-secondary: #161B22;
--color-text-primary: #E6EDF3;
--color-text-secondary: #8B949E;
--color-border: #30363D;
--font-primary: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
--radius-card: 12px;
--shadow-card: 0 4px 24px rgba(0,0,0,0.3);
```

### 11.4 Key UI Components

| Component | Purpose |
|-----------|---------|
| InsightCard | Daily insight with Trade Context Layer |
| EventRow | Calendar row with AI context expandable |
| COTBar | Visual positioning bar (Smart Money vs Retail) |
| SpeechDecoderFeed | Real-time scrolling feed with sentiment color |
| MarketStatusBadge | Trending / Ranging / High Risk pill |
| AccuracyMeter | Circular gauge showing prediction accuracy % |
| UnlockModal | Three-option unlock CTA |
| ProgressiveBlur | Blur overlay with gradient fade-in on locked content |
| FeedbackBar | 👍/👎 with % agreement display |

---

## 12. Tech Stack

### 12.1 Frontend

| Context | Technology | Justification |
|---------|-----------|---------------|
| **Development** | Next.js 14 (App Router) + Tailwind CSS | Free, fast DX, built-in SSR/SSG for SEO |
| **Production** | Same — deploy to Vercel or self-hosted on Coolify | Next.js scales horizontally; Vercel zero-config global CDN |
| **State Management** | Zustand | Lightweight, no boilerplate, scales well |
| **Data Fetching** | TanStack Query (React Query) | Cache, refetch, pagination out of box |
| **Real-time** | Socket.io (Speech Decoder) | Event-driven bidirectional; well-supported |
| **Charts** | Recharts + lightweight-charts (TradingView) | Recharts for general data; TW for price charts |
| **i18n** | next-intl | File-based translation, locale routing, SEO-safe |

### 12.2 Backend

| Context | Technology | Justification |
|---------|-----------|---------------|
| **Development** | Node.js + Express or Fastify | Minimal setup, full JS stack |
| **Production** | Node.js + Fastify (or migrate to NestJS for scale) | Fastify is 2x faster than Express; NestJS for structure at scale |
| **API Style** | REST + limited tRPC for admin panel | REST for public API; tRPC for type-safe admin ↔ frontend |
| **Auth** | NextAuth.js (user) + custom JWT (admin) | NextAuth handles OAuth complexity; custom for granular admin roles |
| **Job Queue** | BullMQ (Redis-backed) | Handles AI pipeline jobs, translation queues, scheduled tasks |
| **Scheduler** | BullMQ Cron | Replaces cron jobs; retryable, monitorable |
| **WebSocket** | Socket.io server | Speech Decoder live feed |

### 12.3 Database

| Context | Technology | Justification |
|---------|-----------|---------------|
| **Development** | PostgreSQL (local / Supabase free tier) | Full-featured relational DB; JSONB for flexible content |
| **Production** | PostgreSQL on Supabase or RDS | Managed, replicated, backup automated |
| **Cache** | Redis (Upstash for dev, self-hosted for prod) | Session cache, content cache, BullMQ backbone |
| **File Storage** | S3-compatible (Cloudflare R2 preferred) | R2 = zero egress cost vs AWS S3 |
| **Search** | Meilisearch (dev) → Typesense (prod) | Fast, typo-tolerant full-text search for insights/news |

### 12.4 Infrastructure

| Context | Technology | Justification |
|---------|-----------|---------------|
| **Development** | Docker Compose (all services local) | Reproducible environment, no cloud cost |
| **Production** | Railway / Render (early) → AWS ECS + Fargate (scale) | Railway/Render: zero DevOps; ECS when traffic demands it |
| **CDN** | Cloudflare (free tier covers most cases) | Global edge, DDoS protection, image optimization |
| **Monitoring** | Sentry (errors) + PostHog (analytics) | Both have generous free tiers; open-source self-host option |
| **Logging** | Pino (structured logs) + Logtail or Axiom | Cheap, fast log ingestion |
| **Email** | Resend (dev) + AWS SES (prod) | Resend: best DX; SES: cheapest at scale |

---

## 13. Folder Structure

```
TradeSense/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/                  # App Router pages
│   │   │   │   ├── [locale]/         # i18n route wrapper
│   │   │   │   │   ├── page.tsx      # Homepage
│   │   │   │   │   ├── insights/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   └── [slug]/page.tsx
│   │   │   │   │   ├── calendar/page.tsx
│   │   │   │   │   ├── cot/page.tsx
│   │   │   │   │   ├── speech-decoder/page.tsx
│   │   │   │   │   └── news/page.tsx
│   │   │   │   ├── api/              # Next.js API routes (BFF layer)
│   │   │   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   │   │   └── webhooks/
│   │   │   │   └── admin/            # Admin panel (separate layout)
│   │   │   │       ├── layout.tsx
│   │   │   │       ├── page.tsx
│   │   │   │       ├── insights/
│   │   │   │       ├── prompts/
│   │   │   │       ├── users/
│   │   │   │       ├── payments/
│   │   │   │       ├── translations/
│   │   │   │       ├── referrals/
│   │   │   │       └── settings/
│   │   │   ├── components/
│   │   │   │   ├── ui/               # Base design system components
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Card.tsx
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   ├── ProgressiveBlur.tsx
│   │   │   │   │   └── UnlockModal.tsx
│   │   │   │   ├── insights/
│   │   │   │   │   ├── InsightCard.tsx
│   │   │   │   │   ├── TradeContextLayer.tsx
│   │   │   │   │   └── FeedbackBar.tsx
│   │   │   │   ├── calendar/
│   │   │   │   │   ├── EventRow.tsx
│   │   │   │   │   └── EventContextPanel.tsx
│   │   │   │   ├── cot/
│   │   │   │   │   ├── COTBar.tsx
│   │   │   │   │   └── SmartMoneyComparison.tsx
│   │   │   │   ├── speech-decoder/
│   │   │   │   │   ├── SpeechDecoderFeed.tsx
│   │   │   │   │   ├── EventCountdown.tsx
│   │   │   │   │   └── SentimentIndicator.tsx
│   │   │   │   ├── market/
│   │   │   │   │   ├── MarketStatusBadge.tsx
│   │   │   │   │   └── AccuracyMeter.tsx
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── BottomNav.tsx
│   │   │   │   │   └── BeginnerMode.tsx
│   │   │   │   └── growth/
│   │   │   │       ├── ReferralWidget.tsx
│   │   │   │       └── TaskCard.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useAccessLevel.ts
│   │   │   │   ├── useMarketStatus.ts
│   │   │   │   ├── useSpeechDecoder.ts   # WebSocket hook
│   │   │   │   └── useProgressiveUnlock.ts
│   │   │   ├── lib/
│   │   │   │   ├── api.ts            # API client (typed)
│   │   │   │   ├── auth.ts           # NextAuth config
│   │   │   │   └── analytics.ts      # PostHog wrapper
│   │   │   ├── stores/               # Zustand stores
│   │   │   │   ├── userStore.ts
│   │   │   │   └── uiStore.ts
│   │   │   ├── i18n/
│   │   │   │   ├── en.json
│   │   │   │   ├── bn.json
│   │   │   │   └── hi.json
│   │   │   └── styles/
│   │   │       └── globals.css
│   │   ├── public/
│   │   └── next.config.ts
│   │
│   └── api/                          # Backend API (Fastify / NestJS)
│       └── src/
│           ├── main.ts               # Entry point
│           ├── app.module.ts
│           ├── modules/
│           │   ├── auth/             # User auth (JWT + OAuth)
│           │   │   ├── auth.module.ts
│           │   │   ├── auth.service.ts
│           │   │   ├── auth.controller.ts
│           │   │   └── strategies/
│           │   ├── admin-auth/       # Admin auth (separate system)
│           │   │   ├── admin-auth.service.ts
│           │   │   └── roles.guard.ts
│           │   ├── insights/
│           │   │   ├── insights.module.ts
│           │   │   ├── insights.service.ts
│           │   │   └── insights.controller.ts
│           │   ├── calendar/
│           │   ├── cot/
│           │   ├── speech-decoder/
│           │   │   └── speech.gateway.ts   # WebSocket gateway
│           │   ├── news/
│           │   ├── ai-pipeline/
│           │   │   ├── pipeline.service.ts
│           │   │   ├── prompt.service.ts
│           │   │   ├── model-router.service.ts
│           │   │   ├── fallback.service.ts
│           │   │   └── adapters/
│           │   │       ├── openai.adapter.ts
│           │   │       ├── claude.adapter.ts
│           │   │       ├── gemini.adapter.ts
│           │   │       ├── perplexity.adapter.ts
│           │   │       └── grok.adapter.ts
│           │   ├── payments/
│           │   │   ├── payments.module.ts
│           │   │   ├── payments.service.ts
│           │   │   └── adapters/
│           │   │       ├── stripe.adapter.ts
│           │   │       ├── paypal.adapter.ts
│           │   │       ├── bkash.adapter.ts
│           │   │       ├── upi.adapter.ts
│           │   │       └── crypto.adapter.ts
│           │   ├── translations/
│           │   │   ├── translation.service.ts
│           │   │   └── translation.queue.ts
│           │   ├── referrals/
│           │   ├── tasks/
│           │   ├── accuracy/
│           │   ├── access-control/
│           │   │   └── access.service.ts   # Central access logic
│           │   ├── notifications/
│           │   └── admin/
│           │       └── (mirrors all modules with admin endpoints)
│           ├── common/
│           │   ├── guards/
│           │   ├── interceptors/
│           │   ├── decorators/
│           │   └── dto/
│           ├── database/
│           │   ├── schema/           # Drizzle ORM or Prisma schema
│           │   └── migrations/
│           ├── queue/
│           │   ├── queue.module.ts
│           │   └── processors/       # BullMQ job processors
│           │       ├── insight-generation.processor.ts
│           │       ├── translation.processor.ts
│           │       ├── accuracy-evaluation.processor.ts
│           │       └── notification.processor.ts
│           └── config/
│               ├── app.config.ts
│               └── ai.config.ts
│
├── packages/                         # Shared packages (monorepo)
│   ├── types/                        # Shared TypeScript types
│   ├── utils/                        # Shared utility functions
│   └── config/                       # Shared ESLint, TS config
│
├── infrastructure/
│   ├── docker/
│   │   ├── docker-compose.yml        # Dev environment (all services)
│   │   └── docker-compose.prod.yml
│   └── scripts/
│       ├── seed.ts                   # DB seed for development
│       └── deploy.sh
│
├── .env.example
├── package.json                      # Monorepo root (pnpm workspaces)
├── pnpm-workspace.yaml
├── turbo.json                        # Turborepo for monorepo build
└── README.md
```

### 13.1 File Creation Sequence (Development Order)

```
PHASE 1 — FOUNDATION
  1. Monorepo setup (pnpm + Turborepo)
  2. Database schema + migrations
  3. Auth system (user + admin)
  4. Basic Next.js layout (with locale routing)

PHASE 2 — AI CORE
  5. AI adapter layer (one model first: OpenAI)
  6. Prompt service (DB-driven)
  7. Pipeline service (chain runner)
  8. BullMQ queue setup

PHASE 3 — CONTENT SYSTEMS
  9. Insights module (generate → draft → publish)
  10. Calendar module
  11. COT module
  12. News module

PHASE 4 — ACCESS + PAYMENTS
  13. Access control service
  14. Progressive unlock frontend components
  15. Payment adapters (Stripe first)
  16. Subscription management

PHASE 5 — GROWTH
  17. Referral system
  18. Task system
  19. Accuracy engine
  20. Feedback system

PHASE 6 — SCALE FEATURES
  21. Speech Decoder (WebSocket)
  22. Multi-language pipeline
  23. Remaining payment adapters
  24. Additional AI adapters (Claude, Gemini, Grok)

PHASE 7 — ADMIN PANEL
  25. Admin panel UI (all modules)
  26. Prompt builder UI
  27. Analytics dashboard
```

---

## 14. Scalability Strategy

### 14.1 Architecture Scaling Path

```
STAGE 1 (0–10K users):
  → Monolith API + Vercel frontend
  → Supabase PostgreSQL
  → Upstash Redis
  → Single server (Railway or Render)
  → Cost: ~$50–100/month

STAGE 2 (10K–200K users):
  → Split: API server + WebSocket server (separate deployments)
  → Add read replicas to PostgreSQL
  → Redis cluster for queue + cache
  → Cloudflare for CDN + DDoS
  → Cost: ~$300–800/month

STAGE 3 (200K–2M users):
  → Containerize with Docker → deploy on AWS ECS Fargate
  → RDS PostgreSQL with Multi-AZ
  → ElastiCache Redis cluster
  → Horizontal scaling: auto-scaling groups
  → Separate microservices: AI Pipeline, Payments, Notifications
  → Cost: ~$2K–8K/month

STAGE 4 (2M–10M+ users):
  → Full microservices or modular monolith
  → Global PostgreSQL (CockroachDB or Aurora Global)
  → Global Redis (Redis Enterprise)
  → Multi-region Cloudflare Workers for edge logic
  → Dedicated Kafka for event streaming (speech decoder, news feed)
  → Cost: $15K+/month (offset by revenue)
```

### 14.2 Database Scalability

- All tables have indexed: `user_id`, `created_at`, `locale`, `status`
- Insight content stored as JSONB with structured fields — avoids schema migrations for content changes
- Read replicas added at Stage 2 for all SELECT-heavy operations (insights, calendar, COT)
- Archival: Insights older than 90 days moved to cold storage (S3 + DynamoDB index)

### 14.3 AI Pipeline Scalability

- All AI jobs are async via BullMQ — no synchronous AI calls in request path
- Jobs horizontally scaled via multiple worker processes
- Rate limit per AI provider tracked in Redis — auto-throttle before hitting provider limits
- Cost cap enforced at job level — jobs rejected if daily budget exceeded

---

## 15. Cost Optimization Strategy

### 15.1 AI Cost Strategy

| Strategy | Implementation |
|----------|---------------|
| **Cheapest model first** | Route to Gemini Flash for translation, enrichment, basic summarization |
| **Cache AI outputs** | Store generated content; never re-run AI for the same input |
| **Batch processing** | Group low-urgency jobs (e.g., 50 translation jobs → 1 batch API call) |
| **Prompt compression** | Keep system prompts concise; measure token usage per prompt version |
| **Output length control** | Set max_tokens per task type; verbose output only when needed |
| **Daily budget caps** | Per-model daily spend cap in admin panel; auto-downgrade on breach |

### 15.2 Infrastructure Cost Strategy

| Area | Strategy |
|------|---------|
| **Storage** | Cloudflare R2 (zero egress vs S3's $0.09/GB egress) |
| **CDN** | Cloudflare free tier handles 99% of static asset delivery |
| **Database** | Start on Supabase free → pro ($25/mo) before self-hosting |
| **Email** | Resend free (3K/mo) → SES ($0.10/1000) at scale |
| **Monitoring** | PostHog + Sentry free tiers cover early stage entirely |
| **Redis** | Upstash pay-per-request (dev) → self-hosted Valkey (prod) |

### 15.3 Revenue-to-Cost Targets

```
Target metric: AI cost per active user < $0.05/month

With $9/month premium plan:
  → 20% conversion = $1.80 average revenue per user
  → AI cost at $0.05 = 2.8% of revenue
  → Infrastructure at Stage 1: ~$0.01/user/month

Break-even: ~500 premium users covers all infrastructure costs
Profitability begins: ~2,000 premium users
```

---

## Appendix: Environment Variables Reference

```env
# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
ADMIN_JWT_SECRET=...

# AI Providers
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_GEMINI_API_KEY=...
PERPLEXITY_API_KEY=...
GROK_API_KEY=...

# Payments
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
BKASH_APP_KEY=...
BKASH_APP_SECRET=...

# Storage
R2_ACCOUNT_ID=...
R2_ACCESS_KEY=...
R2_SECRET_KEY=...
R2_BUCKET_NAME=...

# Email
RESEND_API_KEY=...

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=...
SENTRY_DSN=...
```

---

*Document version: 1.0 | Architecture owner: CTO*
*Last updated: 2025 | Target: 10M+ global users*
