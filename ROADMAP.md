# TradeSense — Micro-Level Development Roadmap

> **Document Type**: Sequential Build Roadmap (Checklist Format)
> **Architecture Reference**: TradeSense CTO System Architecture Document v1.0
> **Target**: All 7 Development Phases — Ground Zero to Production-Ready Admin Panel
> **Rule**: Follow phases in strict order. Never skip ahead. Each step is a prerequisite for the next.

---

## Table of Contents

- [Pre-Phase: Ground Zero Setup](#pre-phase-ground-zero-setup)
- [Phase 1 — Foundation](#phase-1--foundation)
- [Phase 2 — AI Core](#phase-2--ai-core)
- [Phase 3 — Content Systems](#phase-3--content-systems)
- [Phase 4 — Access Control + Payments](#phase-4--access-control--payments)
- [Phase 5 — Growth Systems](#phase-5--growth-systems)
- [Phase 6 — Scale Features](#phase-6--scale-features)
- [Phase 7 — Admin Panel](#phase-7--admin-panel)

---

## Pre-Phase: Ground Zero Setup

> This is the absolute starting point. Run every command below before touching any application code.

### Step 0.1 — System Prerequisites Check

- [ ] Verify Node.js version is ≥ 20 LTS: run `node --version` in terminal
- [ ] Verify pnpm is installed: run `pnpm --version` (install via `npm install -g pnpm` if missing)
- [ ] Verify Git is installed: run `git --version`
- [ ] Verify Docker Desktop is installed and running: run `docker --version`
- [ ] Verify VS Code is installed: run `code --version`

### Step 0.2 — Create Project Root & Initialize Git

- [ ] Run: `mkdir TradeSense && cd TradeSense`
- [ ] Run: `git init`
- [ ] Run: `git branch -M main`
- [ ] Create root `.gitignore`: `touch .gitignore`
- [ ] Populate `.gitignore` with: `node_modules/`, `.env`, `.env.local`, `dist/`, `.turbo/`, `.next/`, `*.log`
- [ ] Run initial commit: `git add .gitignore && git commit -m "chore: init repo"`

### Step 0.3 — Initialize pnpm Monorepo

- [ ] Create root `package.json`: run `pnpm init`
- [ ] Edit root `package.json` — add `"private": true` and define `workspaces`
- [ ] Create `pnpm-workspace.yaml` at root: `touch pnpm-workspace.yaml`
- [ ] Populate `pnpm-workspace.yaml` with workspace globs: `apps/*` and `packages/*`

### Step 0.4 — Install and Configure Turborepo

- [ ] Run: `pnpm add -D turbo -w` (install Turborepo at root level)
- [ ] Create `turbo.json` at root: `touch turbo.json`
- [ ] Define Turborepo pipeline in `turbo.json` with tasks: `build`, `dev`, `lint`, `test`
- [ ] Set `build` task with `dependsOn: ["^build"]` (upstream-first builds)
- [ ] Set `dev` task with `cache: false` and `persistent: true`

### Step 0.5 — Create Monorepo Directory Skeleton

- [ ] Run: `mkdir -p apps/web apps/api packages/types packages/utils packages/config infrastructure/docker infrastructure/scripts`
- [ ] Create placeholder `README.md` inside each `packages/` subdirectory
- [ ] Create `.env.example` at project root: `touch .env.example`
- [ ] Populate `.env.example` with all environment variable keys from the Architecture Document (App, Database, Auth, AI Providers, Payments, Storage, Email, Analytics sections) — values left blank

### Step 0.6 — Configure Shared TypeScript & ESLint

- [ ] Navigate to `packages/config/`: `cd packages/config`
- [ ] Create `packages/config/package.json` with package name `@tradesense/config`
- [ ] Create `packages/config/tsconfig.base.json` — define strict TypeScript base config (target: ES2022, moduleResolution: bundler, strict: true)
- [ ] Create `packages/config/tsconfig.nextjs.json` — extends base, adds Next.js-specific settings
- [ ] Create `packages/config/tsconfig.node.json` — extends base, adds Node.js-specific settings
- [ ] Create `packages/config/eslint-base.js` — define shared ESLint rules
- [ ] Create `packages/config/eslint-nextjs.js` — extends base with `next/core-web-vitals` rules
- [ ] Run `pnpm install` from root to link workspace packages

### Step 0.7 — Configure Shared Types Package

- [ ] Navigate to `packages/types/`
- [ ] Create `packages/types/package.json` with name `@tradesense/types`
- [ ] Create `packages/types/tsconfig.json` extending `@tradesense/config/tsconfig.base.json`
- [ ] Create `packages/types/src/index.ts` as the barrel export file
- [ ] Create `packages/types/src/user.types.ts` — define placeholder `User`, `AdminUser` interfaces
- [ ] Create `packages/types/src/content.types.ts` — define placeholder `Insight`, `CalendarEvent`, `COTReport`, `NewsCard` interfaces
- [ ] Create `packages/types/src/ai.types.ts` — define placeholder `AIModel`, `Prompt`, `PipelineJob` interfaces
- [ ] Create `packages/types/src/payment.types.ts` — define placeholder `Plan`, `Subscription`, `PaymentMethod` interfaces
- [ ] Create `packages/types/src/access.types.ts` — define `AccessLevel` enum: `public | free | premium`

### Step 0.8 — Configure Shared Utilities Package

- [ ] Navigate to `packages/utils/`
- [ ] Create `packages/utils/package.json` with name `@tradesense/utils`
- [ ] Create `packages/utils/tsconfig.json`
- [ ] Create `packages/utils/src/index.ts` barrel export
- [ ] Create `packages/utils/src/date.utils.ts` — placeholder date formatting helpers
- [ ] Create `packages/utils/src/string.utils.ts` — placeholder slug/truncation helpers
- [ ] Create `packages/utils/src/locale.utils.ts` — supported locale list: `en, bn, hi, pt, ar, es`

### Step 0.9 — Open Workspace in VS Code

- [ ] Navigate back to root: `cd ../..` (from `packages/utils`)
- [ ] Run: `code .` to open the full monorepo in VS Code
- [ ] Install recommended VS Code extensions: ESLint, Prettier, Tailwind CSS IntelliSense, Prisma (or Drizzle), Docker, GitLens
- [ ] Create `.vscode/extensions.json` and `.vscode/settings.json` at root for team-wide editor settings
- [ ] Commit all scaffolding: `git add . && git commit -m "chore: monorepo scaffold with pnpm + turborepo"`

---

## Phase 1 — Foundation

> Goal: A running monorepo with database schema, migrations, auth system, and a locale-routed Next.js skeleton that displays a placeholder homepage.

---

### 1.1 — Docker Development Environment

- [ ] Create `infrastructure/docker/docker-compose.yml` — define services: `postgres` (port 5432), `redis` (port 6379), `meilisearch` (port 7700)
- [ ] Set PostgreSQL image to `postgres:16-alpine`, database name `tradesense_dev`, user/password from `.env`
- [ ] Set Redis image to `redis:7-alpine`
- [ ] Set Meilisearch image to `getmeili/meilisearch:latest`
- [ ] Define named volumes: `postgres_data`, `redis_data`, `meili_data` for data persistence
- [ ] Create `infrastructure/docker/.env.docker` for Docker Compose variable substitution
- [ ] Run `docker compose -f infrastructure/docker/docker-compose.yml up -d` to verify all services start cleanly
- [ ] Confirm PostgreSQL is reachable: run `docker exec -it <pg_container> psql -U tradesense_user -d tradesense_dev`

### 1.2 — Backend App Initialization (NestJS / Fastify)

- [ ] Navigate to `apps/api/`
- [ ] Run: `pnpm dlx @nestjs/cli new . --package-manager pnpm --skip-git` to scaffold NestJS inside `apps/api/`
- [ ] Delete NestJS-generated `.gitignore` (root-level one takes precedence)
- [ ] Create `apps/api/package.json` — confirm name is `@tradesense/api`
- [ ] Create `apps/api/tsconfig.json` extending `@tradesense/config/tsconfig.node.json`
- [ ] Create `apps/api/.eslintrc.js` extending `@tradesense/config/eslint-base.js`
- [ ] Verify `apps/api/src/main.ts` exists (NestJS entry point)
- [ ] Verify `apps/api/src/app.module.ts` exists (root module)
- [ ] Update `apps/api/src/main.ts` — set Fastify adapter, set CORS origins from env, set global API prefix `/api/v1`, set port from env (default 4000)
- [ ] Run `pnpm --filter @tradesense/api dev` to verify the API boots on port 4000

### 1.3 — Database Schema (Drizzle ORM)

> All schema files live in `apps/api/src/database/schema/`. Use Drizzle ORM with PostgreSQL dialect.

- [ ] Install Drizzle dependencies: `pnpm --filter @tradesense/api add drizzle-orm pg` and `pnpm --filter @tradesense/api add -D drizzle-kit @types/pg`
- [ ] Create `apps/api/src/database/schema/index.ts` — barrel export for all schema tables
- [ ] Create `apps/api/src/database/schema/users.schema.ts` — define `users` table with columns: `id` (uuid, PK), `email` (unique), `name`, `avatar_url`, `locale` (default `en`), `is_beginner_mode` (boolean), `referral_code` (unique), `referred_by_id` (FK self-reference), `created_at`, `updated_at`
- [ ] Create `apps/api/src/database/schema/admin-users.schema.ts` — define `admin_users` table with columns: `id` (uuid, PK), `email` (unique), `password_hash`, `role` (enum: `super_admin | content_editor | moderator | finance`), `two_fa_secret`, `two_fa_enabled` (boolean), `created_at`
- [ ] Create `apps/api/src/database/schema/admin-audit-log.schema.ts` — define `admin_audit_log` table with columns: `id`, `admin_id` (FK), `action`, `target_table`, `target_id`, `payload` (jsonb), `performed_at`
- [ ] Create `apps/api/src/database/schema/sessions.schema.ts` — define `sessions` table for NextAuth adapter: `id`, `session_token` (unique), `user_id` (FK), `expires`
- [ ] Create `apps/api/src/database/schema/accounts.schema.ts` — define `accounts` table for NextAuth OAuth: `id`, `user_id` (FK), `provider`, `provider_account_id`, `access_token`, `refresh_token`, `expires_at`
- [ ] Create `apps/api/src/database/schema/subscriptions.schema.ts` — define `subscriptions` table: `id`, `user_id` (FK), `plan_id`, `status` (enum: `active | canceled | past_due | trialing`), `provider` (enum: `stripe | paypal | bkash | upi | crypto`), `provider_subscription_id`, `current_period_start`, `current_period_end`, `trial_ends_at`, `created_at`
- [ ] Create `apps/api/src/database/schema/plans.schema.ts` — define `plans` table: `id`, `name`, `slug` (unique), `prices` (jsonb — e.g., `{USD: 9, BDT: 990, INR: 749}`), `features` (text array), `billing_cycle` (enum: `monthly | yearly`), `trial_days`, `is_active` (boolean), `created_at`
- [ ] Create `apps/api/src/database/schema/prompts.schema.ts` — define `prompts` table: `id` (uuid, PK), `task_type` (e.g., `daily_insight`), `model_target`, `system_prompt` (text), `user_prompt_template` (text), `variables` (text array), `output_format` (enum: `json | markdown | plain`), `output_schema` (jsonb), `is_active` (boolean), `version` (integer), `created_by` (FK admin_users), `created_at`
- [ ] Create `apps/api/src/database/schema/insights.schema.ts` — define `insights` table: `id`, `slug` (unique), `currency_pairs` (text array), `market_condition`, `risk_level` (enum: `low | medium | high`), `best_session`, `direction` (enum: `bullish | bearish | neutral`), `confidence` (enum: `low | medium | high`), `time_horizon` (enum: `intraday | daily | weekly`), `access_level` (enum: `public | free | premium`), `preview_percentage` (integer), `status` (enum: `draft | approved | published | archived`), `content` (jsonb), `model_used`, `published_at`, `created_at`, `updated_at`
- [ ] Create `apps/api/src/database/schema/insight-translations.schema.ts` — define `insight_translations` table: `id`, `insight_id` (FK), `locale`, `title`, `body` (text), `meta_title`, `meta_description`, `status` (enum: `draft | published`), `reviewed_by` (FK admin_users), `created_at`
- [ ] Create `apps/api/src/database/schema/calendar-events.schema.ts` — define `calendar_events` table matching the Architecture Document data model: `id` (uuid), `name`, `currency`, `impact` (enum: `low | medium | high`), `scheduled_at` (timestamp), `forecast`, `previous`, `actual`, `ai_context` (jsonb), `translations` (jsonb), `source`, `created_at`
- [ ] Create `apps/api/src/database/schema/cot-reports.schema.ts` — define `cot_reports` table: `id`, `currency_pair`, `report_date`, `commercial_net` (integer), `non_commercial_net` (integer), `retail_net` (integer), `ai_interpretation` (text), `access_level`, `created_at`
- [ ] Create `apps/api/src/database/schema/news-cards.schema.ts` — define `news_cards` table: `id`, `title`, `source_url`, `source_name`, `sentiment` (enum: `positive | negative | neutral`), `urgency` (enum: `low | medium | high`), `impacted_pairs` (text array), `ai_summary` (text), `original_content` (text), `published_at`, `created_at`
- [ ] Create `apps/api/src/database/schema/speech-events.schema.ts` — define `speech_events` table: `id`, `title`, `speaker`, `scheduled_at`, `status` (enum: `upcoming | live | completed`), `hawkish_score` (numeric), `dovish_score` (numeric), `key_phrases` (jsonb), `post_event_summary` (text), `access_level`, `created_at`
- [ ] Create `apps/api/src/database/schema/accuracy-records.schema.ts` — define `accuracy_records` table: `id`, `insight_id` (FK), `currency_pair`, `direction_predicted`, `confidence_predicted`, `time_horizon`, `actual_direction`, `is_correct` (boolean), `evaluated_at`, `model_used`
- [ ] Create `apps/api/src/database/schema/referrals.schema.ts` — define `referrals` table: `id`, `referrer_id` (FK users), `referred_id` (FK users), `status` (enum: `pending | converted | rewarded`), `reward_type` (enum: `days | credits | cash`), `reward_value` (numeric), `trigger_event`, `created_at`
- [ ] Create `apps/api/src/database/schema/tasks.schema.ts` — define `tasks` table: `id`, `slug`, `title`, `description`, `reward_type`, `reward_value` (numeric), `verification_method` (enum: `oauth | quiz | webhook | manual`), `is_active` (boolean), `created_at`
- [ ] Create `apps/api/src/database/schema/user-task-completions.schema.ts` — define `user_task_completions` table: `id`, `user_id` (FK), `task_id` (FK), `status` (enum: `pending | verified | rewarded`), `proof_data` (jsonb), `completed_at`
- [ ] Create `apps/api/src/database/schema/market-status.schema.ts` — define `market_status` table: `id`, `status` (enum: `trending | ranging | high_risk`), `computed_by` (enum: `ai | admin_override`), `reasoning` (text), `valid_for_date` (date), `created_at`
- [ ] Create `apps/api/src/database/schema/feature-flags.schema.ts` — define `feature_flags` table: `id`, `flag_key` (unique), `is_enabled` (boolean), `enabled_for` (jsonb — e.g., `{user_segment: "premium"}`), `description`, `updated_at`
- [ ] Create `apps/api/src/database/schema/notifications.schema.ts` — define `notifications` table: `id`, `user_id` (FK), `type` (enum: `push | email`), `title`, `body`, `is_read` (boolean), `sent_at`
- [ ] Create `apps/api/src/database/schema/insight-feedback.schema.ts` — define `insight_feedback` table: `id`, `insight_id` (FK), `user_id` (FK), `vote` (enum: `useful | not_useful`), `comment` (text, nullable), `created_at`
- [ ] Create `apps/api/drizzle.config.ts` — configure Drizzle Kit with: schema path `./src/database/schema/index.ts`, migrations output `./src/database/migrations/`, dialect `postgresql`

### 1.4 — Database Migrations

- [ ] Add Drizzle Kit scripts to `apps/api/package.json`: `"db:generate"`, `"db:migrate"`, `"db:studio"`
- [ ] Ensure `DATABASE_URL` is set in `apps/api/.env` pointing to the local Docker PostgreSQL
- [ ] Run: `pnpm --filter @tradesense/api db:generate` — confirm migration SQL files are created in `apps/api/src/database/migrations/`
- [ ] Run: `pnpm --filter @tradesense/api db:migrate` — confirm all tables are created in the Docker PostgreSQL
- [ ] Open Drizzle Studio: `pnpm --filter @tradesense/api db:studio` — visually verify table structure
- [ ] Create `apps/api/src/database/database.module.ts` — NestJS module that provides the Drizzle database connection as an injectable provider
- [ ] Create `apps/api/src/database/database.provider.ts` — instantiate Drizzle client using `pg` pool and `DATABASE_URL` from ConfigService

### 1.5 — Environment Configuration Module (Backend)

- [ ] Install `@nestjs/config`: `pnpm --filter @tradesense/api add @nestjs/config`
- [ ] Create `apps/api/src/config/app.config.ts` — define typed config factory for app-level vars (PORT, NODE_ENV, API_URL, CORS_ORIGIN)
- [ ] Create `apps/api/src/config/ai.config.ts` — define typed config factory for AI API keys (OPENAI, ANTHROPIC, GOOGLE_GEMINI, PERPLEXITY, GROK)
- [ ] Create `apps/api/src/config/payment.config.ts` — define typed config factory for payment keys (STRIPE, PAYPAL, BKASH)
- [ ] Create `apps/api/src/config/storage.config.ts` — define typed config factory for R2/S3 storage keys
- [ ] Register `ConfigModule.forRoot({ isGlobal: true })` in `apps/api/src/app.module.ts`
- [ ] Register all config factories with `ConfigModule.load([appConfig, aiConfig, paymentConfig, storageConfig])`

### 1.6 — User Authentication System (Backend)

- [ ] Install auth dependencies: `pnpm --filter @tradesense/api add @nestjs/jwt @nestjs/passport passport passport-jwt passport-google-oauth20 bcryptjs`
- [ ] Install types: `pnpm --filter @tradesense/api add -D @types/passport-jwt @types/passport-google-oauth20 @types/bcryptjs`
- [ ] Create `apps/api/src/modules/auth/auth.module.ts` — import JwtModule, PassportModule; declare providers and controllers
- [ ] Create `apps/api/src/modules/auth/auth.service.ts` — implement: `validateGoogleUser()`, `generateJwt()`, `refreshToken()`, `getUserById()`
- [ ] Create `apps/api/src/modules/auth/auth.controller.ts` — define routes: `GET /auth/google`, `GET /auth/google/callback`, `POST /auth/refresh`, `GET /auth/me`
- [ ] Create `apps/api/src/modules/auth/strategies/google.strategy.ts` — implement PassportStrategy for Google OAuth using `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] Create `apps/api/src/modules/auth/strategies/jwt.strategy.ts` — implement JwtStrategy that validates the JWT from Authorization header
- [ ] Create `apps/api/src/modules/auth/dto/auth-response.dto.ts` — define DTO for login response: `{ access_token, refresh_token, user }`

### 1.7 — Admin Authentication System (Backend)

- [ ] Create `apps/api/src/modules/admin-auth/admin-auth.module.ts`
- [ ] Create `apps/api/src/modules/admin-auth/admin-auth.service.ts` — implement: `loginWithCredentials()` (compares bcrypt hash), `generateAdminJwt()`, `validateTwoFa()` (TOTP via `speakeasy`), `setupTwoFa()`, `logAuditAction()`
- [ ] Create `apps/api/src/modules/admin-auth/admin-auth.controller.ts` — define routes: `POST /admin/auth/login`, `POST /admin/auth/2fa/verify`, `POST /admin/auth/2fa/setup`, `GET /admin/auth/me`
- [ ] Create `apps/api/src/modules/admin-auth/roles.guard.ts` — NestJS Guard that reads `role` from JWT payload and enforces role-based access
- [ ] Create `apps/api/src/modules/admin-auth/admin-jwt.strategy.ts` — separate JWT strategy for admin tokens using `ADMIN_JWT_SECRET`
- [ ] Create `apps/api/src/common/decorators/roles.decorator.ts` — `@Roles()` decorator for attaching required roles to admin controller methods
- [ ] Install `speakeasy` for 2FA TOTP: `pnpm --filter @tradesense/api add speakeasy` and `pnpm --filter @tradesense/api add -D @types/speakeasy`

### 1.8 — Common Backend Infrastructure

- [ ] Create `apps/api/src/common/guards/jwt-auth.guard.ts` — wraps Passport JWT guard, returns 401 if unauthenticated
- [ ] Create `apps/api/src/common/interceptors/logging.interceptor.ts` — logs request method, URL, response time using Pino logger
- [ ] Create `apps/api/src/common/interceptors/transform.interceptor.ts` — wraps all responses in `{ success: true, data: <payload> }` envelope
- [ ] Create `apps/api/src/common/filters/http-exception.filter.ts` — catches all NestJS HttpExceptions and returns consistent error format: `{ success: false, error: { code, message } }`
- [ ] Register interceptors and filters globally in `apps/api/src/main.ts`
- [ ] Install Pino logger: `pnpm --filter @tradesense/api add nestjs-pino pino-http` — configure in `app.module.ts`
- [ ] Create `apps/api/src/seed/seed.ts` (same path as `infrastructure/scripts/seed.ts` in folder structure) — placeholder seeder that creates one SuperAdmin user and two subscription plans

### 1.9 — Frontend App Initialization (Next.js)

- [ ] Navigate to `apps/web/`
- [ ] Run: `pnpm create next-app . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --skip-git` to scaffold Next.js 14 inside `apps/web/`
- [ ] Delete Next.js-generated boilerplate in `apps/web/src/app/`: remove `page.tsx` placeholder content, remove `globals.css` default content
- [ ] Create `apps/web/package.json` — confirm name is `@tradesense/web`
- [ ] Update `apps/web/tsconfig.json` to extend `@tradesense/config/tsconfig.nextjs.json`
- [ ] Update `apps/web/.eslintrc.js` to extend `@tradesense/config/eslint-nextjs.js`
- [ ] Install frontend dependencies: `pnpm --filter @tradesense/web add next-intl next-auth zustand @tanstack/react-query @tanstack/react-query-devtools`
- [ ] Install UI/charting deps: `pnpm --filter @tradesense/web add recharts lightweight-charts socket.io-client`
- [ ] Install dev deps: `pnpm --filter @tradesense/web add -D @types/node`

### 1.10 — Design Tokens & Global Styles

- [ ] Open `apps/web/src/styles/globals.css`
- [ ] Define CSS custom properties (design tokens) from Architecture Document section 11.3:
  - `--color-primary: #0A84FF`
  - `--color-success: #30D158`
  - `--color-danger: #FF3B30`
  - `--color-warning: #FFD60A`
  - `--color-bg-primary: #0D1117`
  - `--color-bg-secondary: #161B22`
  - `--color-text-primary: #E6EDF3`
  - `--color-text-secondary: #8B949E`
  - `--color-border: #30363D`
  - `--font-primary: 'Inter', sans-serif`
  - `--font-mono: 'JetBrains Mono', monospace`
  - `--radius-card: 12px`
  - `--shadow-card: 0 4px 24px rgba(0,0,0,0.3)`
- [ ] Add Google Fonts import for Inter and JetBrains Mono
- [ ] Set `body` background to `var(--color-bg-primary)` and color to `var(--color-text-primary)`
- [ ] Extend `apps/web/tailwind.config.ts` — map all CSS custom properties into Tailwind theme: colors, font-family, border-radius, box-shadow

### 1.11 — Locale Routing Setup (next-intl)

- [ ] Create `apps/web/src/i18n/en.json` — add placeholder translations: `{ "common": { "loading": "Loading...", "error": "Something went wrong" } }`
- [ ] Create `apps/web/src/i18n/bn.json` — same structure, Bengali placeholders
- [ ] Create `apps/web/src/i18n/hi.json` — same structure, Hindi placeholders
- [ ] Create `apps/web/src/i18n/pt.json` — Portuguese placeholders
- [ ] Create `apps/web/src/i18n/ar.json` — Arabic placeholders
- [ ] Create `apps/web/src/i18n/es.json` — Spanish placeholders
- [ ] Create `apps/web/src/i18n/request.ts` — next-intl server-side request configuration: reads locale from route params, loads the correct JSON file
- [ ] Create `apps/web/middleware.ts` — configure next-intl `createMiddleware` with supported locales (`en, bn, hi, pt, ar, es`) and default locale `en`; match all non-static, non-API paths
- [ ] Create `apps/web/src/app/[locale]/layout.tsx` — root locale layout: sets `<html lang={locale}>`, wraps children in `NextIntlClientProvider`, sets `dir="rtl"` when locale is `ar`
- [ ] Create `apps/web/src/app/[locale]/page.tsx` — minimal homepage placeholder that renders a `<h1>TradeSense</h1>` and market status placeholder

### 1.12 — NextAuth Configuration (Frontend)

- [ ] Create `apps/web/src/lib/auth.ts` — NextAuth config object: define Google provider using `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`, add `callbacks.jwt` to attach user role/id to token, add `callbacks.session` to expose token data on session
- [ ] Create `apps/web/src/app/api/auth/[...nextauth]/route.ts` — export `GET` and `POST` handlers from the NextAuth handler
- [ ] Create `apps/web/src/lib/api.ts` — typed API client using `fetch` with base URL from `NEXT_PUBLIC_API_URL`; auto-attach `Authorization: Bearer <token>` from NextAuth session
- [ ] Create `apps/web/src/lib/analytics.ts` — PostHog wrapper: initialize with `NEXT_PUBLIC_POSTHOG_KEY`, export `trackEvent()` helper

### 1.13 — Frontend State Stores (Zustand)

- [ ] Create `apps/web/src/stores/userStore.ts` — Zustand store with: `user`, `accessLevel`, `isBeginnerMode`, actions: `setUser()`, `setAccessLevel()`, `toggleBeginnerMode()`, `clearUser()`
- [ ] Create `apps/web/src/stores/uiStore.ts` — Zustand store with: `isUnlockModalOpen`, `unlockModalContext`, `isSidebarOpen`, actions: `openUnlockModal()`, `closeUnlockModal()`, `toggleSidebar()`

### 1.14 — Root Layout Components

- [ ] Create `apps/web/src/components/layout/Header.tsx` — top bar with logo, locale switcher dropdown, login/avatar CTA
- [ ] Create `apps/web/src/components/layout/Sidebar.tsx` — desktop sidebar with nav links to: Home, Insights, Calendar, COT, Speech Decoder, News; highlight active route
- [ ] Create `apps/web/src/components/layout/BottomNav.tsx` — mobile bottom nav with four icons: Home, Calendar, COT, Profile
- [ ] Create `apps/web/src/components/layout/BeginnerMode.tsx` — 5-step guided widget from Architecture Document section 4.6; conditionally rendered when `userStore.isBeginnerMode === true`
- [ ] Update `apps/web/src/app/[locale]/layout.tsx` — integrate `Header`, `Sidebar`, `BottomNav` in correct responsive positions (Sidebar hidden on mobile, BottomNav hidden on desktop)

### 1.15 — Base UI Component Library

- [ ] Create `apps/web/src/components/ui/Button.tsx` — variants: `primary`, `secondary`, `ghost`, `danger`; sizes: `sm`, `md`, `lg`
- [ ] Create `apps/web/src/components/ui/Card.tsx` — wrapper with `--radius-card` and `--shadow-card` design tokens
- [ ] Create `apps/web/src/components/ui/Modal.tsx` — accessible modal with backdrop, close-on-Escape, close-on-backdrop-click
- [ ] Create `apps/web/src/components/ui/Badge.tsx` — small pill component for status labels (access level, impact, direction)
- [ ] Create `apps/web/src/components/ui/Spinner.tsx` — loading spinner using CSS animation
- [ ] Create `apps/web/src/components/ui/Skeleton.tsx` — rectangular shimmer placeholder for loading states
- [ ] Create `apps/web/src/components/ui/Tabs.tsx` — accessible tab bar (used by COT, Insights, etc.)
- [ ] Create `apps/web/src/components/ui/ProgressiveBlur.tsx` — gradient blur overlay component; props: `percentage: number` (how much to reveal), `onUnlockClick: () => void`
- [ ] Create `apps/web/src/components/ui/UnlockModal.tsx` — three-option unlock modal (Premium / Refer / Tasks) that reads from `uiStore.unlockModalContext`

### 1.16 — TanStack Query Provider Setup

- [ ] Create `apps/web/src/components/providers/QueryProvider.tsx` — client component wrapping children in `QueryClientProvider` with a `QueryClient` instance; include `ReactQueryDevtools` in development
- [ ] Update `apps/web/src/app/[locale]/layout.tsx` — wrap layout body with `QueryProvider`

### 1.17 — Phase 1 Verification & Commit

- [ ] Run `pnpm dev` from root — verify both `apps/web` (port 3000) and `apps/api` (port 4000) start without errors
- [ ] Navigate to `http://localhost:3000/en` — confirm locale routing works and placeholder homepage renders
- [ ] Navigate to `http://localhost:3000/bn` — confirm Bengali locale route loads
- [ ] Hit `http://localhost:4000/api/v1` — confirm API is reachable (even if it returns 404 for unknown route)
- [ ] Hit `http://localhost:4000/api/v1/auth/google` — confirm Google OAuth redirect initiates
- [ ] Run DB Studio and confirm all 20+ tables are visible
- [ ] Commit: `git add . && git commit -m "feat(phase-1): foundation — monorepo, schema, auth, Next.js locale routing"`

---

## Phase 2 — AI Core

> Goal: A fully operational, database-driven AI pipeline capable of executing a prompt chain using OpenAI, routing through fallback models, and queuing async jobs via BullMQ.

---

### 2.1 — Redis Connection Module

- [ ] Install Redis client: `pnpm --filter @tradesense/api add ioredis`
- [ ] Install types: `pnpm --filter @tradesense/api add -D @types/ioredis`
- [ ] Create `apps/api/src/queue/redis.provider.ts` — creates and exports an `ioredis` client using `REDIS_URL` from ConfigService
- [ ] Create `apps/api/src/queue/queue.module.ts` — NestJS module that provides the Redis client globally and imports BullMQ module

### 2.2 — BullMQ Setup

- [ ] Install BullMQ: `pnpm --filter @tradesense/api add bullmq @nestjs/bullmq`
- [ ] Update `apps/api/src/queue/queue.module.ts` — register BullMQ module with Redis connection; define queues: `insight-generation`, `translation`, `accuracy-evaluation`, `notification`, `news-enrichment`
- [ ] Create `apps/api/src/queue/processors/insight-generation.processor.ts` — BullMQ Worker class; method `process(job)` logs the job data (full implementation in Phase 3)
- [ ] Create `apps/api/src/queue/processors/translation.processor.ts` — placeholder processor
- [ ] Create `apps/api/src/queue/processors/accuracy-evaluation.processor.ts` — placeholder processor
- [ ] Create `apps/api/src/queue/processors/notification.processor.ts` — placeholder processor
- [ ] Register all processors in `apps/api/src/queue/queue.module.ts`
- [ ] Create `apps/api/src/queue/queue.service.ts` — service that exposes `addJob(queueName, data, options?)` helper used by other modules to enqueue jobs

### 2.3 — AI Adapter Layer

- [ ] Create `apps/api/src/modules/ai-pipeline/` directory structure
- [ ] Install OpenAI SDK: `pnpm --filter @tradesense/api add openai`
- [ ] Create `apps/api/src/modules/ai-pipeline/adapters/openai.adapter.ts` — class `OpenAIAdapter` implementing an `AIAdapter` interface with method `complete(systemPrompt, userPrompt, options): Promise<AIResponse>`; uses `OPENAI_API_KEY` from ConfigService; sets `max_tokens`, `temperature`, `model` from options; handles `RateLimitError` and `APITimeoutError` — throws typed errors for the fallback service to catch
- [ ] Create `apps/api/src/modules/ai-pipeline/adapters/claude.adapter.ts` — placeholder implementing the same `AIAdapter` interface; constructor receives `ANTHROPIC_API_KEY`; method body throws `NotImplementedError` until Phase 6
- [ ] Create `apps/api/src/modules/ai-pipeline/adapters/gemini.adapter.ts` — placeholder implementing `AIAdapter`; constructor receives `GOOGLE_GEMINI_API_KEY`; throws `NotImplementedError` until Phase 6
- [ ] Create `apps/api/src/modules/ai-pipeline/adapters/perplexity.adapter.ts` — placeholder implementing `AIAdapter`; until Phase 6
- [ ] Create `apps/api/src/modules/ai-pipeline/adapters/grok.adapter.ts` — placeholder implementing `AIAdapter`; until Phase 6
- [ ] Define `AIAdapter` interface and `AIResponse` type in `packages/types/src/ai.types.ts`: `{ content: string; model: string; input_tokens: number; output_tokens: number; latency_ms: number }`

### 2.4 — Prompt Service (DB-Driven)

- [ ] Create `apps/api/src/modules/ai-pipeline/prompt.service.ts` — NestJS service with methods:
  - `getActivePrompt(taskType: string, modelTarget: string): Promise<Prompt>` — queries `prompts` table for `is_active: true` + matching task type
  - `interpolateTemplate(template: string, variables: Record<string, string>): string` — replaces `{variable_name}` placeholders with provided values
  - `getAllPromptVersions(taskType: string): Promise<Prompt[]>` — returns all versions for admin version history view
  - `createPromptVersion(dto: CreatePromptDto): Promise<Prompt>` — inserts new prompt record
  - `setActiveVersion(promptId: string): Promise<void>` — sets `is_active: true` for given ID, `is_active: false` for all others in same task type

### 2.5 — Model Router Service

- [ ] Create `apps/api/src/modules/ai-pipeline/model-router.service.ts` — NestJS service with:
  - `getRouteForTask(taskType: string): ModelRoute` — reads routing config from `feature_flags` table or in-memory config map; returns `{ primary: string, fallbacks: string[], timeout_ms: number }`
  - `getAdapterForModel(modelName: string): AIAdapter` — factory method returning the correct adapter instance
  - `checkBudgetCap(modelName: string): Promise<boolean>` — checks Redis key `budget:model:{name}:today` against admin-configured cap; returns `true` if under cap
  - `recordUsage(modelName: string, tokens: number, cost: number): Promise<void>` — increments Redis budget counter with 24h TTL

### 2.6 — Fallback Service

- [ ] Create `apps/api/src/modules/ai-pipeline/fallback.service.ts` — NestJS service with method `executeWithFallback(taskType, systemPrompt, userPrompt, options)`:
  - Reads `ModelRoute` from `ModelRouterService`
  - Attempts `primary` adapter with configured timeout
  - On `TimeoutError`: logs event, tries `fallback[0]`
  - On `RateLimitError`: waits with exponential backoff (max 2 retries), then falls to `fallback[0]`
  - On `ModelError`: tries `fallback[1]`, triggers admin alert notification job
  - Returns `AIResponse` from whichever model succeeded
  - Logs all fallback events to a structured Pino logger with fields: `task_type`, `primary`, `fallback_used`, `reason`

### 2.7 — Pipeline Service (Chain Runner)

- [ ] Create `apps/api/src/modules/ai-pipeline/pipeline.service.ts` — NestJS service that orchestrates prompt chains:
  - `runChain(chainName: string, inputContext: Record<string, any>): Promise<ChainResult>` — executes chain steps in sequence
  - Each step: fetches prompt via `PromptService`, interpolates variables, calls `FallbackService.executeWithFallback()`
  - Passes previous step output as available variable for the next step
  - Implements the 5-step `daily_insight_full` chain from Architecture Document section 5.4: `FETCH_CONTEXT → GENERATE_DRAFT → QUALITY_CHECK → ENRICH_EDUCATION → TRANSLATE_QUEUE`
  - Returns structured `ChainResult` with all step outputs and metadata

### 2.8 — AI Pipeline Module

- [ ] Create `apps/api/src/modules/ai-pipeline/ai-pipeline.module.ts` — NestJS module declaring providers: `OpenAIAdapter`, `ClaudeAdapter`, `GeminiAdapter`, `PerplexityAdapter`, `GrokAdapter`, `PromptService`, `ModelRouterService`, `FallbackService`, `PipelineService`; exports `PipelineService` and `PromptService` for use by other modules
- [ ] Register `AIPipelineModule` in `apps/api/src/app.module.ts`

### 2.9 — BullMQ Cron Scheduler

- [ ] Create `apps/api/src/queue/scheduler.service.ts` — NestJS service that registers repeatable BullMQ cron jobs on application bootstrap:
  - `daily_insight_generation` cron: `0 6 * * *` (06:00 UTC)
  - `market_status_computation` cron: `0 5 * * *` (05:00 UTC, before insights)
  - `cot_ingestion` cron: `0 14 * * 5` (Friday 14:00 UTC, after CFTC release)
  - `accuracy_evaluation` cron: runs every hour to check expired prediction horizons
  - `news_enrichment` cron: `*/30 * * * *` (every 30 minutes)
- [ ] Register `SchedulerService` in `apps/api/src/queue/queue.module.ts` and call its bootstrap method from `apps/api/src/main.ts` via `app.get(SchedulerService).bootstrap()`

### 2.10 — Phase 2 Verification & Commit

- [ ] Write a manual test route `GET /api/v1/ai/test` (admin-only, guarded) that:
  - Loads the first active prompt for `task_type: "test"`
  - Calls OpenAI adapter with a hardcoded test prompt
  - Returns the raw `AIResponse`
- [ ] Seed one test prompt via DB Studio or seed script
- [ ] Hit the test route and confirm OpenAI responds successfully
- [ ] Check Redis via `redis-cli` to confirm BullMQ queue keys are created
- [ ] Check BullMQ job counts in Redis for the cron jobs
- [ ] Remove the test route before committing
- [ ] Commit: `git add . && git commit -m "feat(phase-2): ai core — adapters, prompt service, pipeline, BullMQ scheduler"`

---

## Phase 3 — Content Systems

> Goal: Four fully operational content modules — Insights, Calendar, COT, and News — each with generation pipelines, draft review queues, and public API endpoints.

---

### 3.1 — Insights Module (Backend)

- [ ] Create `apps/api/src/modules/insights/insights.module.ts` — imports `DatabaseModule`, `AIPipelineModule`, `QueueModule`
- [ ] Create `apps/api/src/modules/insights/insights.service.ts` — implement:
  - `generateDraft(currencyPair: string, date: string): Promise<Insight>` — calls `PipelineService.runChain('daily_insight_full', ...)`, stores result with `status: "draft"`, enqueues admin notification job
  - `getAllInsights(filters: InsightFilterDto): Promise<PaginatedResult<Insight>>` — queries DB with filters: status, currency pair, access_level, date range; includes pagination
  - `getInsightBySlug(slug: string, locale: string): Promise<Insight>` — returns insight with its translation for the requested locale
  - `updateInsight(id: string, dto: UpdateInsightDto, adminId: string): Promise<Insight>` — admin edit; logs audit action
  - `publishInsight(id: string, adminId: string): Promise<Insight>` — sets `status: "published"`, sets `published_at`, enqueues translation jobs for all active locales
  - `archiveInsight(id: string, adminId: string): Promise<void>` — sets `status: "archived"`
  - `generateSlug(headline: string, date: string, pair: string): string` — produces canonical slug like `eurusd-daily-2025-07-04`
- [ ] Create `apps/api/src/modules/insights/insights.controller.ts` — define public routes:
  - `GET /insights` — list published insights with filters; respects `access_level` based on user JWT
  - `GET /insights/:slug` — single insight; enforces access level
  - `POST /insights/:id/feedback` — submit useful/not_useful vote (requires `free` access)
- [ ] Create `apps/api/src/modules/insights/dto/create-insight.dto.ts`
- [ ] Create `apps/api/src/modules/insights/dto/update-insight.dto.ts`
- [ ] Create `apps/api/src/modules/insights/dto/insight-filter.dto.ts`
- [ ] Update `apps/api/src/queue/processors/insight-generation.processor.ts` — implement `process(job)`: calls `InsightsService.generateDraft()` with job data; handles errors and marks job failed on exception
- [ ] Register `InsightsModule` in `apps/api/src/app.module.ts`

### 3.2 — Insight Translation Queue

- [ ] Create `apps/api/src/modules/translations/translation.service.ts` — implement:
  - `queueTranslationJobs(insightId: string, targetLocales: string[]): Promise<void>` — enqueues one `translation` BullMQ job per locale
  - `translateContent(insightId: string, locale: string): Promise<InsightTranslation>` — fetches insight content, calls `PipelineService` with translation prompt, stores result in `insight_translations` with `status: "draft"`
  - `approveTranslation(translationId: string, adminId: string): Promise<void>` — sets `status: "published"`, records `reviewed_by`
- [ ] Create `apps/api/src/modules/translations/translation.queue.ts` — exports queue name constants
- [ ] Update `apps/api/src/queue/processors/translation.processor.ts` — implement `process(job)`: calls `TranslationService.translateContent()` with job data
- [ ] Create `apps/api/src/modules/translations/translations.module.ts`

### 3.3 — Economic Calendar Module (Backend)

- [ ] Create `apps/api/src/modules/calendar/calendar.module.ts`
- [ ] Create `apps/api/src/modules/calendar/calendar.service.ts` — implement:
  - `ingestFromSource(source: string): Promise<void>` — fetches raw calendar data from configured source (RSS/scraper); deduplicates by `scheduled_at + currency`; stores raw events
  - `enrichEvent(eventId: string): Promise<CalendarEvent>` — calls AI pipeline with `news_enrichment` task type to populate `ai_context` JSONB field (what_it_is, why_it_matters, historical_impact, possible_scenarios)
  - `getEvents(filters: CalendarFilterDto): Promise<CalendarEvent[]>` — queries DB by: currency, impact, date range; respects access_level
  - `updateActualValue(eventId: string, actual: string): Promise<void>` — updates `actual` field when released; triggers accuracy evaluation job if the event was predicted
- [ ] Create `apps/api/src/modules/calendar/calendar.controller.ts` — define public routes:
  - `GET /calendar` — list events with filters; public access for event titles, `free` required for AI context
  - `GET /calendar/:id` — single event with full AI context
- [ ] Create `apps/api/src/modules/calendar/dto/calendar-filter.dto.ts`
- [ ] Register `CalendarModule` in `apps/api/src/app.module.ts`

### 3.4 — COT Report Module (Backend)

- [ ] Create `apps/api/src/modules/cot/cot.module.ts`
- [ ] Create `apps/api/src/modules/cot/cot.service.ts` — implement:
  - `ingestWeeklyData(): Promise<void>` — fetches CFTC CSV data, parses Commercial/Non-Commercial/Retail net positions for each configured currency pair
  - `generateInterpretation(reportId: string): Promise<string>` — calls AI pipeline to produce plain-language `ai_interpretation`; checks for extreme positioning divergence (Smart Money vs Retail)
  - `getLatestReport(currencyPair: string): Promise<COTReport>` — returns most recent report for a pair
  - `getHistoricalReports(currencyPair: string, weeks: number): Promise<COTReport[]>` — returns historical data for charting
- [ ] Create `apps/api/src/modules/cot/cot.controller.ts` — define routes:
  - `GET /cot` — list all available pairs; `public` for headers, `premium` for full data
  - `GET /cot/:pair` — single pair with simplified + historical data
  - `GET /cot/:pair/history` — historical chart data (premium)
- [ ] Register `COTModule` in `apps/api/src/app.module.ts`

### 3.5 — News Intelligence Module (Backend)

- [ ] Create `apps/api/src/modules/news/news.module.ts`
- [ ] Create `apps/api/src/modules/news/news.service.ts` — implement:
  - `ingestFromFeeds(): Promise<void>` — fetches from configured RSS feeds and NewsAPI; deduplicates by URL hash; stores raw items
  - `enrichNewsItem(newsId: string): Promise<NewsCard>` — calls AI pipeline with `news_enrichment` task: assigns sentiment, urgency, impacted pairs, generates `ai_summary`
  - `getNewsFeed(filters: NewsFeedFilterDto): Promise<PaginatedResult<NewsCard>>` — paginates news; optionally filtered by impacted pair, sentiment, urgency; `free` access required
- [ ] Create `apps/api/src/modules/news/news.controller.ts` — route: `GET /news`
- [ ] Register `NewsModule` in `apps/api/src/app.module.ts`

### 3.6 — Market Status Module (Backend)

- [ ] Create `apps/api/src/modules/market/market.module.ts`
- [ ] Create `apps/api/src/modules/market/market.service.ts` — implement:
  - `computeDailyStatus(): Promise<MarketStatus>` — fetches latest COT data, upcoming high-impact calendar events, prior-day volatility from cached data; calls lightweight AI model (Gemini Flash) with `market_status_computation` prompt; stores result; caches in Redis with `market_status:today` key (24h TTL)
  - `getCurrentStatus(): Promise<MarketStatus>` — checks Redis cache first, falls back to DB query
  - `adminOverrideStatus(status: string, adminId: string): Promise<MarketStatus>` — sets `computed_by: "admin_override"`, logs audit action
- [ ] Create `apps/api/src/modules/market/market.controller.ts` — route: `GET /market/status` (public access)
- [ ] Register `MarketModule` in `apps/api/src/app.module.ts`

### 3.7 — SEO & Sitemap Hooks

- [ ] Update `apps/api/src/modules/insights/insights.service.ts` `publishInsight()` method — after publishing, enqueue a `sitemap_update` notification job (placeholder for Phase 7)
- [ ] Create `apps/web/src/app/[locale]/insights/page.tsx` — server component: fetches published insights list from API; renders `InsightCard` list with pagination
- [ ] Create `apps/web/src/app/[locale]/insights/[slug]/page.tsx` — server component: generates `generateMetadata()` from insight `meta_title` and `meta_description`; renders full insight with SEO JSON-LD structured data (financialProduct schema)
- [ ] Create `apps/web/src/app/sitemap.ts` (Next.js Sitemap Route) — fetches all published insight slugs + locale variants from API; returns sitemap entries

### 3.8 — Frontend Content Components

- [ ] Create `apps/web/src/components/market/MarketStatusBadge.tsx` — pill component rendering `TRENDING`, `RANGING`, or `HIGH RISK` with appropriate color token; fetches from `GET /market/status`
- [ ] Create `apps/web/src/components/market/AccuracyMeter.tsx` — circular gauge SVG component; accepts `percentage` prop; renders 7-day, 30-day, all-time tabs
- [ ] Create `apps/web/src/components/insights/InsightCard.tsx` — card component: renders headline, direction badge, currency pairs, risk level, best session, `TradeContextLayer`, `FeedbackBar`; conditionally renders `ProgressiveBlur` based on `access_level` vs user's `accessLevel`
- [ ] Create `apps/web/src/components/insights/TradeContextLayer.tsx` — renders four data points: Best Session, Key Events, Risk Level, Correlated Pairs in a horizontal row
- [ ] Create `apps/web/src/components/insights/FeedbackBar.tsx` — renders 👍/👎 buttons; on vote, calls `POST /insights/:id/feedback`; shows percentage agreement after vote
- [ ] Create `apps/web/src/components/calendar/EventRow.tsx` — table row for a single calendar event: currency flag, event name, impact badge, forecast/previous/actual values, expandable AI context panel
- [ ] Create `apps/web/src/components/calendar/EventContextPanel.tsx` — expandable drawer showing `ai_context.what_it_is`, `why_it_matters`, `historical_impact`, `possible_scenarios` in tabs
- [ ] Create `apps/web/src/components/cot/COTBar.tsx` — horizontal bar showing Smart Money (Non-Commercial) vs Retail net position percentage with directional color coding
- [ ] Create `apps/web/src/components/cot/SmartMoneyComparison.tsx` — renders two `COTBar` components side by side with AI context: "When Smart Money and Retail are on opposite sides..."
- [ ] Update `apps/web/src/app/[locale]/page.tsx` — add `MarketStatusBadge`, top 3 `InsightCard` items, upcoming high-impact `EventRow` items, `AccuracyMeter` widget

### 3.9 — Frontend Content Pages

- [ ] Update `apps/web/src/app/[locale]/insights/page.tsx` — filter bar (currency pair, direction, date), paginated `InsightCard` list, skeleton loading states
- [ ] Create `apps/web/src/app/[locale]/calendar/page.tsx` — filter bar (currency, impact, date range), `EventRow` list sorted by `scheduled_at`, countdown timer for next high-impact event
- [ ] Create `apps/web/src/app/[locale]/cot/page.tsx` — currency pair selector tab bar, `SmartMoneyComparison` component, historical chart using Recharts (`LineChart` for net position over time), AI interpretation card
- [ ] Create `apps/web/src/app/[locale]/news/page.tsx` — news feed with sentiment filter, urgency badges, impacted pairs filter, paginated `NewsCard` components

### 3.10 — Custom Hooks for Data Fetching

- [ ] Create `apps/web/src/hooks/useInsights.ts` — TanStack Query hook: `useQuery` for `GET /insights` with filters; `useMutation` for feedback submission
- [ ] Create `apps/web/src/hooks/useCalendar.ts` — TanStack Query hook for `GET /calendar` with filter params
- [ ] Create `apps/web/src/hooks/useCOT.ts` — TanStack Query hook for `GET /cot/:pair` and `GET /cot/:pair/history`
- [ ] Create `apps/web/src/hooks/useMarketStatus.ts` — TanStack Query hook for `GET /market/status`; `staleTime: 60 * 60 * 1000` (1 hour)
- [ ] Create `apps/web/src/hooks/useNews.ts` — TanStack Query hook for `GET /news` with pagination

### 3.11 — Phase 3 Verification & Commit

- [ ] Run seed script to insert: 1 published insight, 5 calendar events, 2 COT reports, 3 news cards
- [ ] Hit `GET /api/v1/insights` — confirm list returns with pagination metadata
- [ ] Hit `GET /api/v1/insights/eurusd-daily-{today}` — confirm slug routing works
- [ ] Hit `GET /api/v1/calendar?impact=high` — confirm filtering works
- [ ] Hit `GET /api/v1/market/status` — confirm response includes status + reasoning
- [ ] Navigate to `http://localhost:3000/en` — confirm `MarketStatusBadge` and `InsightCard` render with seeded data
- [ ] Navigate to `http://localhost:3000/en/calendar` — confirm `EventRow` list renders
- [ ] Commit: `git add . && git commit -m "feat(phase-3): content systems — insights, calendar, COT, news modules"`

---

## Phase 4 — Access Control + Payments

> Goal: The full progressive unlock system enforced on frontend and backend, Stripe payment integration, and subscription management with webhook processing.

---

### 4.1 — Access Control Service (Backend)

- [ ] Create `apps/api/src/modules/access-control/access.service.ts` — NestJS service (the single source of truth for access logic):
  - `getUserAccessLevel(userId: string | null): Promise<AccessLevel>` — returns `public | free | premium`; checks: is premium subscription active, have tasks granted premium days, has referral reward applied; caches result in Redis with `access:{userId}` key (TTL: 10 minutes)
  - `invalidateAccessCache(userId: string): Promise<void>` — deletes `access:{userId}` from Redis; called after subscription change, task completion, referral reward
  - `canAccessContent(userId: string | null, contentAccessLevel: string): Promise<boolean>` — compares user access level vs content access level
  - `checkSoftLoginTrigger(userId: string | null, trigger: string, metadata: object): Promise<SoftLoginTriggerResult>` — evaluates trigger conditions (scroll depth, return visit, time on page) against admin-configured thresholds from `feature_flags` table; returns `{ shouldPrompt: boolean, promptType: "signup" | "upgrade" }`
- [ ] Create `apps/api/src/modules/access-control/access-control.module.ts`
- [ ] Register `AccessControlModule` as global in `apps/api/src/app.module.ts`

### 4.2 — Access Level Guard & Decorator

- [ ] Create `apps/api/src/common/guards/access-level.guard.ts` — NestJS Guard: reads `@RequiresAccess()` decorator from handler metadata; calls `AccessService.canAccessContent()`; throws `ForbiddenException` with `{ upgrade_required: true, options: ["premium", "referral", "tasks"] }` if access denied
- [ ] Create `apps/api/src/common/decorators/requires-access.decorator.ts` — `@RequiresAccess(level: AccessLevel)` decorator that sets metadata for the guard
- [ ] Apply `@RequiresAccess('premium')` to: `GET /cot/:pair/history`, `GET /cot/:pair`, Speech Decoder endpoints (Phase 6)
- [ ] Apply `@RequiresAccess('free')` to: `GET /insights/:slug` (full content), `GET /news`, feedback submission
- [ ] Update `apps/api/src/modules/insights/insights.controller.ts` — apply decorators appropriately

### 4.3 — Soft Login Trigger API

- [ ] Add route `POST /access/soft-trigger` in `apps/api/src/modules/access-control/` — accepts `{ trigger: string, metadata: object }` from unauthenticated or authenticated users; returns `{ shouldPrompt: boolean, promptType: string }`
- [ ] Create `apps/web/src/hooks/useAccessLevel.ts` — TanStack Query hook: fetches current user's access level from `GET /users/me/access`; updates `userStore.accessLevel` on success
- [ ] Create `apps/web/src/hooks/useProgressiveUnlock.ts` — hook that wraps the soft trigger API; tracks scroll depth via `IntersectionObserver`; tracks time-on-page via `useEffect` with `setInterval`; calls `POST /access/soft-trigger` on threshold breach; on positive response, dispatches `uiStore.openUnlockModal()`
- [ ] Integrate `useProgressiveUnlock` in `apps/web/src/app/[locale]/insights/[slug]/page.tsx`
- [ ] Integrate `useProgressiveUnlock` in `apps/web/src/app/[locale]/page.tsx`

### 4.4 — Plans Management (Backend)

- [ ] Create `apps/api/src/modules/payments/payments.module.ts` — imports `AccessControlModule`
- [ ] Create `apps/api/src/modules/payments/payments.service.ts` — implement:
  - `getActivePlans(): Promise<Plan[]>` — fetches plans with `is_active: true` from DB; caches in Redis
  - `getPlanBySlug(slug: string): Promise<Plan>` — fetches single plan
  - `getPlanForCountry(countryCode: string): Promise<{ plan: Plan, availableMethods: string[] }>` — uses country-to-payment-method mapping configured in `feature_flags` table
- [ ] Create `apps/api/src/modules/payments/payments.controller.ts` — route: `GET /plans` (public)

### 4.5 — Stripe Adapter

- [ ] Install Stripe SDK: `pnpm --filter @tradesense/api add stripe`
- [ ] Create `apps/api/src/modules/payments/adapters/stripe.adapter.ts` — class `StripeAdapter` implementing `PaymentAdapter` interface with methods:
  - `createCheckoutSession(userId, planId, successUrl, cancelUrl): Promise<{ sessionId, url }>` — creates Stripe Checkout Session for the plan's USD price
  - `createCustomerPortalSession(customerId): Promise<{ url }>` — returns Stripe customer portal URL for subscription management
  - `handleWebhookEvent(rawBody, signature): Promise<WebhookResult>` — validates Stripe webhook signature using `STRIPE_WEBHOOK_SECRET`; handles events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
  - `cancelSubscription(subscriptionId: string): Promise<void>`
- [ ] Define `PaymentAdapter` interface in `packages/types/src/payment.types.ts`
- [ ] Create `apps/api/src/modules/payments/adapters/paypal.adapter.ts` — placeholder implementing `PaymentAdapter`; all methods throw `NotImplementedError` until Phase 6
- [ ] Create `apps/api/src/modules/payments/adapters/bkash.adapter.ts` — placeholder; until Phase 6
- [ ] Create `apps/api/src/modules/payments/adapters/upi.adapter.ts` — placeholder; until Phase 6
- [ ] Create `apps/api/src/modules/payments/adapters/crypto.adapter.ts` — placeholder; until Phase 6

### 4.6 — Subscription Management (Backend)

- [ ] Add methods to `apps/api/src/modules/payments/payments.service.ts`:
  - `initiateCheckout(userId: string, planSlug: string, provider: string, countryCode: string): Promise<CheckoutResult>` — routes to correct adapter's `createCheckoutSession()`
  - `processWebhookEvent(provider: string, rawBody: Buffer, signature: string): Promise<void>` — routes to correct adapter's `handleWebhookEvent()`; on success, calls `upsertSubscription()`
  - `upsertSubscription(userId: string, subscriptionData: SubscriptionData): Promise<Subscription>` — creates or updates `subscriptions` record; calls `AccessService.invalidateAccessCache(userId)`; enqueues confirmation email notification job
  - `getUserSubscription(userId: string): Promise<Subscription | null>`
  - `cancelUserSubscription(userId: string): Promise<void>` — calls adapter `cancelSubscription()`; updates DB record
- [ ] Add routes to `apps/api/src/modules/payments/payments.controller.ts`:
  - `POST /payments/checkout` — initiates checkout (requires `free` auth)
  - `GET /payments/subscription` — gets current subscription (requires `free` auth)
  - `POST /payments/cancel` — cancels subscription (requires `free` auth)
  - `POST /payments/portal` — returns Stripe customer portal URL (requires `free` auth)
- [ ] Create `apps/web/src/app/api/webhooks/stripe/route.ts` — Next.js API route that forwards raw body + Stripe signature header to `POST /api/v1/webhooks/stripe`
- [ ] Add route `POST /webhooks/stripe` to `apps/api/src/modules/payments/payments.controller.ts` — calls `PaymentsService.processWebhookEvent('stripe', ...)`; must receive raw body (configure `rawBody: true` in NestJS middleware)

### 4.7 — Frontend Payment & Subscription UI

- [ ] Create `apps/web/src/app/[locale]/pricing/page.tsx` — fetches active plans; renders plan cards with localized pricing; "Get Started" button triggers checkout initiation
- [ ] Create `apps/web/src/hooks/useSubscription.ts` — TanStack Query hook for `GET /payments/subscription`; mutation hooks for checkout, cancel, portal
- [ ] Update `apps/web/src/components/ui/UnlockModal.tsx` — connect Premium CTA button to `useSubscription` mutation; display country-appropriate payment methods
- [ ] Create `apps/web/src/app/[locale]/subscription/success/page.tsx` — post-payment success page: calls `useSubscription` to refetch, shows confirmation, redirects to dashboard after 3 seconds
- [ ] Create `apps/web/src/app/[locale]/subscription/cancel/page.tsx` — payment cancelled page with retry prompt
- [ ] Create `apps/web/src/app/[locale]/account/page.tsx` — user account page showing: current plan, expiry date, "Manage Subscription" button (opens Stripe portal), referral code widget, task progress

### 4.8 — IP Geolocation Middleware

- [ ] Install `geoip-lite`: `pnpm --filter @tradesense/api add geoip-lite`
- [ ] Create `apps/api/src/common/middleware/geoip.middleware.ts` — reads `CF-Connecting-IP` or `X-Forwarded-For` header; attaches `req.countryCode` to request object
- [ ] Register geoip middleware in `apps/api/src/app.module.ts` as a global middleware
- [ ] Update `POST /payments/checkout` to read `req.countryCode` and pass to `PaymentsService.initiateCheckout()`

### 4.9 — Phase 4 Verification & Commit

- [ ] Test unauthenticated access to `GET /insights/:slug` — confirm 30% preview logic response
- [ ] Test free user access to `GET /cot/:pair` — confirm 403 with `upgrade_required` payload
- [ ] Test Stripe checkout flow locally using Stripe CLI and webhook forwarding: `stripe listen --forward-to localhost:4000/api/v1/webhooks/stripe`
- [ ] Complete test Stripe payment with card `4242 4242 4242 4242` — confirm subscription record is created and access cache is invalidated
- [ ] Navigate to `http://localhost:3000/en/pricing` — confirm plans render with correct USD pricing
- [ ] Verify `UnlockModal` opens on clicking a locked insight
- [ ] Commit: `git add . && git commit -m "feat(phase-4): access control + stripe payments + subscription management"`

---

## Phase 5 — Growth Systems

> Goal: All four growth systems operational — referral tracking, task-based unlocks, bias accuracy engine, and insight feedback — all configurable via admin flags.

---

### 5.1 — Referral System (Backend)

- [ ] Create `apps/api/src/modules/referrals/referrals.module.ts`
- [ ] Create `apps/api/src/modules/referrals/referrals.service.ts` — implement:
  - `generateReferralCode(userId: string): Promise<string>` — generates a unique 8-char alphanumeric code; stores in `users.referral_code`; called on user creation
  - `getReferralLink(userId: string): Promise<string>` — returns `{APP_URL}/ref/{code}`
  - `trackReferralSignup(referralCode: string, newUserId: string): Promise<void>` — looks up referrer by code; creates `referrals` record with `status: "pending"`; stores `referred_by_id` on new user
  - `processTrigger(trigger: string, userId: string): Promise<void>` — checks if `userId` was referred; if trigger matches admin-configured `reward_trigger`, calls `issueReward()`
  - `issueReward(referralId: string): Promise<void>` — reads reward config from `feature_flags`; grants reward (days/credits/cash); updates `referrals.status: "rewarded"`; calls `AccessService.invalidateAccessCache()`
  - `getFraudScore(referrerId: string): Promise<number>` — heuristic: checks referral velocity (>N in 24h), same-IP signups; returns score 0-100; blocks payout if above admin threshold
  - `getUserReferrals(userId: string): Promise<ReferralStats>` — returns referral count, pending, converted, total rewards earned
- [ ] Create `apps/api/src/modules/referrals/referrals.controller.ts` — routes:
  - `GET /referrals/me` — stats for authenticated user (requires `free`)
  - `GET /referrals/link` — referral link for authenticated user (requires `free`)
- [ ] Create `apps/web/src/components/growth/ReferralWidget.tsx` — displays referral link with copy button, share buttons (Twitter/X, WhatsApp, Facebook), referral count and status breakdown
- [ ] Create `apps/web/src/hooks/useReferral.ts` — TanStack Query hook for referral data
- [ ] Integrate `ReferralWidget` into `apps/web/src/app/[locale]/account/page.tsx`
- [ ] Update user registration flow in `apps/api/src/modules/auth/auth.service.ts` to: check for `ref` cookie or query param, call `ReferralService.trackReferralSignup()` after user creation, call `ReferralService.generateReferralCode()` for the new user

### 5.2 — Task System (Backend)

- [ ] Create `apps/api/src/modules/tasks/tasks.module.ts`
- [ ] Create `apps/api/src/modules/tasks/tasks.service.ts` — implement:
  - `getActiveTasks(): Promise<Task[]>` — fetches tasks with `is_active: true`
  - `getUserTaskProgress(userId: string): Promise<UserTaskProgress[]>` — returns tasks with completion status for user
  - `initiateTaskCompletion(userId: string, taskSlug: string): Promise<UserTaskCompletion>` — creates pending completion record; for `oauth` type: returns OAuth URL; for `quiz` type: returns quiz data; for `webhook` type: returns webhook listener URL
  - `verifyTaskCompletion(completionId: string, proofData: object): Promise<void>` — validates proof by `verification_method`; on success: updates status to `verified`, calls `issueTaskReward()`
  - `issueTaskReward(completionId: string): Promise<void>` — reads task reward; grants premium days extension or feature unlock; updates status to `rewarded`; calls `AccessService.invalidateAccessCache()`
- [ ] Create `apps/api/src/modules/tasks/tasks.controller.ts` — routes:
  - `GET /tasks` — list all active tasks with user's progress (requires `free`)
  - `POST /tasks/:slug/start` — initiate task completion
  - `POST /tasks/:completionId/verify` — submit proof data
- [ ] Create `apps/web/src/components/growth/TaskCard.tsx` — renders task title, description, reward badge, completion status; "Start" button triggers `initiateTaskCompletion`; completion checkmark if done
- [ ] Create `apps/web/src/app/[locale]/earn/page.tsx` — "Earn Premium" page listing all tasks and referral program; target for `UnlockModal` "Complete 3 Tasks" CTA
- [ ] Create `apps/web/src/hooks/useTasks.ts` — TanStack Query hook for task list and completion mutations
- [ ] Integrate task completion CTA into `UnlockModal` — "Complete 3 Tasks" option links to `/earn` page

### 5.3 — Accuracy Engine (Backend)

- [ ] Create `apps/api/src/modules/accuracy/accuracy.module.ts`
- [ ] Create `apps/api/src/modules/accuracy/accuracy.service.ts` — implement:
  - `scheduleEvaluation(insightId: string): Promise<void>` — after insight is published, calculates the evaluation deadline based on `time_horizon` (intraday: +8h, daily: +24h, weekly: +7d); enqueues `accuracy-evaluation` job scheduled for that time
  - `evaluateInsight(insightId: string): Promise<AccuracyRecord>` — fetches actual market close price for the insight's currency pair and time horizon; compares with `direction` prediction; stores `is_correct` boolean in `accuracy_records`
  - `getAccuracyStats(filters: AccuracyFilterDto): Promise<AccuracyStats>` — aggregates: overall %, per-pair %, per-model %, 7-day / 30-day / all-time windows
  - `getPublicDashboard(): Promise<PublicAccuracyDashboard>` — subset of stats for unauthenticated public view
- [ ] Create `apps/api/src/modules/accuracy/accuracy.controller.ts` — routes:
  - `GET /accuracy` — public dashboard stats (public access)
  - `GET /accuracy/details` — full stats (premium access)
- [ ] Update `apps/api/src/queue/processors/accuracy-evaluation.processor.ts` — implement `process(job)`: calls `AccuracyService.evaluateInsight()`
- [ ] Update `apps/api/src/modules/insights/insights.service.ts` `publishInsight()` — call `AccuracyService.scheduleEvaluation(insightId)` after publish (only for insights with a directional prediction)
- [ ] Create `apps/web/src/app/[locale]/accuracy/page.tsx` — public accuracy dashboard: overall gauge, per-pair table, historical trend chart (Recharts), model comparison breakdown
- [ ] Update `apps/web/src/components/market/AccuracyMeter.tsx` — fetch data from `GET /accuracy` via `useQuery`

### 5.4 — Feedback System (Backend)

- [ ] Update `apps/api/src/modules/insights/insights.service.ts` — implement:
  - `submitFeedback(insightId: string, userId: string, vote: string, comment?: string): Promise<void>` — prevents duplicate votes (unique constraint on `user_id + insight_id`); stores in `insight_feedback`; updates aggregated useful percentage (cached in Redis: `feedback:{insightId}:stats`)
  - `getFeedbackStats(insightId: string): Promise<FeedbackStats>` — returns `{ useful_count, total_count, useful_percentage }`
- [ ] Update `apps/api/src/modules/insights/insights.controller.ts` — add `POST /insights/:id/feedback` (free access)
- [ ] Update `apps/web/src/components/insights/FeedbackBar.tsx` — connect to `useMutation` for feedback submission; show percentage after vote; disable re-voting
- [ ] Add feedback aggregation to admin insight detail view (Phase 7)

### 5.5 — Notifications Module (Backend)

- [ ] Install email SDK: `pnpm --filter @tradesense/api add resend`
- [ ] Create `apps/api/src/modules/notifications/notifications.module.ts`
- [ ] Create `apps/api/src/modules/notifications/notifications.service.ts` — implement:
  - `sendEmail(to: string, templateId: string, variables: object): Promise<void>` — uses Resend SDK; reads email template from DB or config map
  - `sendAdminAlert(subject: string, body: string): Promise<void>` — sends to super admin email
  - `createInAppNotification(userId: string, type: string, title: string, body: string): Promise<void>` — inserts into `notifications` table
  - `getUserNotifications(userId: string): Promise<Notification[]>` — returns unread notifications
  - `markRead(notificationId: string, userId: string): Promise<void>`
- [ ] Update `apps/api/src/queue/processors/notification.processor.ts` — implement `process(job)`: routes to correct notification method based on `job.data.type`
- [ ] Create `apps/api/src/modules/notifications/notifications.controller.ts` — routes:
  - `GET /notifications` — user's notifications (requires `free`)
  - `PATCH /notifications/:id/read` — mark as read (requires `free`)

### 5.6 — Phase 5 Verification & Commit

- [ ] Sign up as a new user via Google OAuth — confirm referral code is auto-generated
- [ ] Sign up a second user via the first user's referral link — confirm `referrals` record is created with `status: "pending"`
- [ ] Manually trigger `processTrigger("signup", secondUserId)` in a test route — confirm reward is issued
- [ ] Hit `GET /api/v1/accuracy` — confirm empty stats response (no predictions evaluated yet)
- [ ] Hit `POST /api/v1/insights/:id/feedback` with a free user token — confirm vote is recorded
- [ ] Navigate to `http://localhost:3000/en/earn` — confirm task list renders
- [ ] Navigate to `http://localhost:3000/en/accuracy` — confirm accuracy dashboard page renders
- [ ] Commit: `git add . && git commit -m "feat(phase-5): growth — referrals, tasks, accuracy engine, feedback"`

---

## Phase 6 — Scale Features

> Goal: Live Speech Decoder via WebSocket, full multi-language translation pipeline, remaining payment adapters (bKash, UPI, PayPal, Crypto), and all remaining AI model adapters.

---

### 6.1 — Speech Decoder WebSocket Gateway (Backend)

- [ ] Install Socket.io for NestJS: `pnpm --filter @tradesense/api add @nestjs/websockets @nestjs/platform-socket.io socket.io`
- [ ] Create `apps/api/src/modules/speech-decoder/speech-decoder.module.ts`
- [ ] Create `apps/api/src/modules/speech-decoder/speech.gateway.ts` — NestJS `@WebSocketGateway` (CORS from env) with:
  - `handleConnection(client)` — validates JWT from socket handshake `auth.token`; checks `premium` access via `AccessService`; disconnects non-premium clients with `{ event: "error", data: { upgrade_required: true } }`
  - `handleDisconnect(client)` — cleans up client from room
  - `@SubscribeMessage('join_event')` handler — joins socket to `speech:{eventId}` room
  - `@SubscribeMessage('leave_event')` handler — leaves room
  - `broadcastSegment(eventId, segment)` — emits `new_segment` to `speech:{eventId}` room; called by `SpeechDecoderService`
- [ ] Create `apps/api/src/modules/speech-decoder/speech-decoder.service.ts` — implement:
  - `getUpcomingEvents(): Promise<SpeechEvent[]>` — fetches events with `status: "upcoming"` within next 48 hours
  - `activateLiveEvent(eventId: string): Promise<void>` — sets `status: "live"` in DB; emits `event_started` to all connected clients in `speech:{eventId}` room
  - `processTranscriptSegment(eventId: string, rawText: string): Promise<void>` — calls AI pipeline with `speech_decoding_live` task (GPT-4o primary, 15s timeout); extracts hawkish/dovish score, key phrases, market implications; calls `SpeechGateway.broadcastSegment()` with result
  - `processManualInput(eventId: string, adminId: string, text: string): Promise<void>` — admin submits raw transcript chunk via admin API; calls `processTranscriptSegment()`
  - `generatePostEventSummary(eventId: string): Promise<void>` — after event ends: compiles all segments; calls AI for final summary; updates `speech_events.post_event_summary`; publishes summary as a new Insight
  - `getEventHistory(eventId: string): Promise<SpeechSegment[]>` — returns all processed segments for replay
- [ ] Create `apps/api/src/modules/speech-decoder/speech-decoder.controller.ts` — admin routes:
  - `GET /speech-decoder/events` — list all events
  - `POST /speech-decoder/events` — create new event
  - `POST /speech-decoder/events/:id/activate` — set live (admin only)
  - `POST /speech-decoder/events/:id/segment` — submit raw transcript segment (admin only)
  - `POST /speech-decoder/events/:id/complete` — mark complete, trigger summary generation (admin only)
  - `GET /speech-decoder/events/:id` — public event details + pre-event context
- [ ] Register `SpeechDecoderModule` in `apps/api/src/app.module.ts`
- [ ] Configure NestJS to support both HTTP and WebSocket on the same server instance in `apps/api/src/main.ts`

### 6.2 — Speech Decoder Frontend Components

- [ ] Install `socket.io-client` (already installed in Phase 1)
- [ ] Create `apps/web/src/hooks/useSpeechDecoder.ts` — WebSocket hook:
  - Connects to `NEXT_PUBLIC_API_URL` with `auth: { token }` from NextAuth session
  - Emits `join_event` on mount with `eventId`
  - Listens to `new_segment` event — appends segment to state array
  - Listens to `event_started` / `event_ended` — updates event status in local state
  - Handles `error` event from server — triggers `UnlockModal` if `upgrade_required`
  - Cleans up socket on unmount
- [ ] Create `apps/web/src/components/speech-decoder/SpeechDecoderFeed.tsx` — scrolling real-time feed: auto-scrolls to bottom on new segment; each segment shows: timestamp, raw text excerpt, sentiment color bar, hawkish/dovish score, market implication pills
- [ ] Create `apps/web/src/components/speech-decoder/SentimentIndicator.tsx` — real-time gauge: hawkish (green, right) vs dovish (red, left) with numeric score; animates on update
- [ ] Create `apps/web/src/components/speech-decoder/EventCountdown.tsx` — countdown timer showing days/hours/minutes/seconds until `scheduled_at`; auto-refreshes via `setInterval`; switches to "LIVE" badge when event activates
- [ ] Create `apps/web/src/app/[locale]/speech-decoder/page.tsx` — landing page: lists upcoming events with `EventCountdown`; for past events shows archived summary card
- [ ] Create `apps/web/src/app/[locale]/speech-decoder/[eventId]/page.tsx` — live event page: `EventCountdown` (pre-event), `SpeechDecoderFeed` + `SentimentIndicator` (during live event), summary card (post-event); entire page requires premium access — shows `ProgressiveBlur` with `UnlockModal` for non-premium users

### 6.3 — Full Multi-Language Pipeline

- [ ] Implement `apps/api/src/modules/ai-pipeline/adapters/gemini.adapter.ts` fully — install `@google/generative-ai` SDK: `pnpm --filter @tradesense/api add @google/generative-ai`; implement `complete()` using Gemini Flash model (`gemini-1.5-flash`); handle `RESOURCE_EXHAUSTED` (rate limit) by throwing typed `RateLimitError`
- [ ] Update `apps/api/src/modules/translations/translation.service.ts` — replace `NotImplementedError` in `translateContent()` with real Gemini Flash call via `PipelineService`; add financial terminology preservation prompt: "Do not translate: {currency pairs}, {platform names}"
- [ ] Create `apps/api/src/modules/translations/translation.controller.ts` — admin routes:
  - `GET /admin/translations/queue` — pending translation drafts list
  - `PATCH /admin/translations/:id/approve` — approve translation
  - `PATCH /admin/translations/:id/reject` — reject with reason
  - `POST /admin/translations/bulk-approve` — bulk approval
- [ ] Update `apps/web/src/i18n/en.json`, `bn.json`, `hi.json`, `pt.json`, `ar.json`, `es.json` — fully populate all translation keys for: navigation, common UI, insight cards, calendar, COT page, account page, pricing page, error messages
- [ ] Test locale switching on `http://localhost:3000/bn/insights` — confirm Bengali translations render correctly
- [ ] Test RTL layout on `http://localhost:3000/ar` — confirm `dir="rtl"` is applied and layout mirrors correctly

### 6.4 — Additional AI Adapters

- [ ] Implement `apps/api/src/modules/ai-pipeline/adapters/claude.adapter.ts` fully — install `@anthropic-ai/sdk`: `pnpm --filter @tradesense/api add @anthropic-ai/sdk`; implement `complete()` using `claude-sonnet-4-5` model; map Anthropic response format to `AIResponse` interface
- [ ] Implement `apps/api/src/modules/ai-pipeline/adapters/perplexity.adapter.ts` fully — Perplexity uses OpenAI-compatible API endpoint (`https://api.perplexity.ai`); use `openai` SDK with custom base URL and `PERPLEXITY_API_KEY`; use `sonar-pro` model for live web search
- [ ] Implement `apps/api/src/modules/ai-pipeline/adapters/grok.adapter.ts` fully — Grok uses OpenAI-compatible endpoint; use `openai` SDK with `https://api.x.ai/v1` base URL and `GROK_API_KEY`; model: `grok-3`
- [ ] Update `apps/api/src/modules/ai-pipeline/model-router.service.ts` `getAdapterForModel()` — map `claude`, `gemini`, `perplexity`, `grok` to their now-implemented adapters
- [ ] Update `apps/api/src/modules/ai-pipeline/pipeline.service.ts` — all 5-step `daily_insight_full` chain now uses correct models: Step 2 (GPT-4o), Step 3 (Claude Sonnet), Step 4 (Gemini Flash)

### 6.5 — Remaining Payment Adapters

- [ ] Implement `apps/api/src/modules/payments/adapters/paypal.adapter.ts` — install `@paypal/paypal-server-sdk` or use raw REST; implement `createCheckoutSession()` using PayPal Orders API v2; implement `handleWebhookEvent()` for `PAYMENT.CAPTURE.COMPLETED`
- [ ] Implement `apps/api/src/modules/payments/adapters/bkash.adapter.ts` — implement bKash PGW integration: `createPayment()`, `executePayment()`, `queryPayment()`; bKash uses token-based auth with `BKASH_APP_KEY` and `BKASH_APP_SECRET`; implement webhook-equivalent polling for payment status
- [ ] Implement `apps/api/src/modules/payments/adapters/upi.adapter.ts` — install `razorpay`: `pnpm --filter @tradesense/api add razorpay`; implement Razorpay order creation and webhook signature verification using `RAZORPAY_KEY_SECRET`
- [ ] Implement `apps/api/src/modules/payments/adapters/crypto.adapter.ts` — integrate Coinbase Commerce API; create charge, return hosted URL; verify webhook `X-CC-Webhook-Signature`
- [ ] Add new webhook routes: `POST /webhooks/paypal`, `POST /webhooks/razorpay`, `POST /webhooks/crypto` in `payments.controller.ts`
- [ ] Add new Next.js API webhook routes: `apps/web/src/app/api/webhooks/paypal/route.ts`, `apps/web/src/app/api/webhooks/razorpay/route.ts`, `apps/web/src/app/api/webhooks/crypto/route.ts`
- [ ] Update frontend payment flow in `apps/web/src/app/[locale]/pricing/page.tsx` — show available payment methods based on `getPlanForCountry()` API response; render bKash button only for `BD` users, UPI only for `IN` users, etc.

### 6.6 — Phase 6 Verification & Commit

- [ ] Open two browser tabs: one admin view, one premium user view of Speech Decoder
- [ ] Admin tab: activate live event via `POST /admin/speech-decoder/events/:id/activate`
- [ ] Admin tab: submit a transcript segment via `POST /admin/speech-decoder/events/:id/segment`
- [ ] Premium user tab: confirm the segment appears in `SpeechDecoderFeed` in real time
- [ ] Test Bengali translation: publish an insight via admin, trigger translation job, confirm `insight_translations` record created with `locale: "bn"`, navigate to `/bn/insights/:slug`
- [ ] Test Gemini adapter: add a test prompt with `model_target: "gemini"`, call pipeline, confirm response
- [ ] Commit: `git add . && git commit -m "feat(phase-6): speech decoder, multi-language, remaining adapters"`

---

## Phase 7 — Admin Panel

> Goal: A fully functional admin panel at `/admin` with all module management UIs, prompt builder, content workflow, and analytics dashboard — protected by separate admin auth with 2FA.

---

### 7.1 — Admin Panel Layout & Auth Guard (Frontend)

- [ ] Create `apps/web/src/app/admin/layout.tsx` — completely separate layout (no locale routing, no public navigation); dark sidebar with admin-specific nav; wraps all admin pages
- [ ] Create `apps/web/src/app/admin/page.tsx` — admin dashboard homepage: metric cards (total users, active subscribers, insights published today, pending drafts, pending translations, AI cost today)
- [ ] Create `apps/web/src/lib/adminAuth.ts` — admin auth helper: `getAdminSession()` reads admin JWT from `httpOnly` cookie; `redirectIfNotAdmin()` server-side redirect
- [ ] Create `apps/web/src/middleware.ts` update — add admin path matching: `if (pathname.startsWith('/admin'))`, verify admin JWT; redirect to `/admin/login` if invalid
- [ ] Create `apps/web/src/app/admin/login/page.tsx` — admin login form: email + password fields, 2FA code field (shown after credentials verified), submit calls `POST /admin/auth/login` then `POST /admin/auth/2fa/verify`
- [ ] Create `apps/web/src/hooks/useAdminAuth.ts` — admin auth state hook; manages admin JWT cookie
- [ ] Create `apps/web/src/components/admin/AdminSidebar.tsx` — sidebar with links to all admin modules: Dashboard, Insights, Prompts, Calendar, COT, News, Speech Decoder, Users, Subscriptions, Referrals, Tasks, Translations, Payments, Feature Flags, Notifications, Accuracy, Audit Log, Settings
- [ ] Create `apps/web/src/components/admin/AdminHeader.tsx` — top bar showing logged-in admin name + role badge, logout button, system alert badge (AI cost cap warnings)

### 7.2 — Content Management (Admin)

- [ ] Create `apps/web/src/app/admin/insights/page.tsx` — tabbed view: Drafts | Approved | Published | Archived; data table with columns: headline, pair, direction, status, created_at, model_used; action buttons per row
- [ ] Create `apps/web/src/app/admin/insights/[id]/page.tsx` — insight detail/edit page: rich text editor for body, metadata form (access_level, preview_percentage, risk_level, best_session), "Approve", "Publish", "Archive" action buttons; feedback stats sidebar; accuracy record if evaluated
- [ ] Create `apps/web/src/app/admin/insights/[id]/generate/page.tsx` — manual trigger page: select currency pairs, date, click "Generate Draft" which calls `POST /admin/insights/generate`
- [ ] Add admin routes in `apps/api/src/modules/insights/insights.controller.ts` (or create dedicated admin controller):
  - `GET /admin/insights` — all insights with filters + pagination
  - `GET /admin/insights/:id` — single insight detail
  - `PATCH /admin/insights/:id` — edit insight
  - `POST /admin/insights/:id/approve` — approve draft
  - `POST /admin/insights/:id/publish` — publish insight
  - `POST /admin/insights/:id/archive` — archive
  - `POST /admin/insights/generate` — trigger AI generation manually
- [ ] Create `apps/web/src/app/admin/calendar/page.tsx` — calendar event list with "Enrich with AI" button per event
- [ ] Create `apps/web/src/app/admin/cot/page.tsx` — COT report list; "Ingest Weekly Data" button; "Generate Interpretation" per report
- [ ] Create `apps/web/src/app/admin/news/page.tsx` — news queue: pending enrichment, published; "Enrich All" bulk action
- [ ] Create `apps/web/src/app/admin/speech-decoder/page.tsx` — event list with status; create event form; activate/deactivate controls; transcript segment submission form for live events
- [ ] Create `apps/web/src/app/admin/translations/page.tsx` — translation queue: pending review items grouped by locale; approve/reject controls; manual edit textarea; bulk approve button

### 7.3 — Prompt Builder UI (Admin)

> This is the most complex admin UI — a full visual prompt editor with version management.

- [ ] Create `apps/web/src/app/admin/prompts/page.tsx` — list all prompt task types; click to open builder
- [ ] Create `apps/web/src/app/admin/prompts/[taskType]/page.tsx` — prompt builder for a specific task type:
  - Task type selector dropdown
  - Model selector (GPT-4o | Claude Sonnet | Gemini Flash | Perplexity | Grok)
  - System Prompt textarea (with syntax highlighting for `{variables}`)
  - User Prompt Template textarea
  - Variable Manager section: list of defined variables with data source label per variable
  - Output Format radio: JSON | Markdown | Plain Text
  - Output Schema Builder: add/remove key-value pairs when JSON is selected
  - "Test with Live Data" button — calls `POST /admin/prompts/test` with current prompt + live data; shows response in a result pane
  - Version History sidebar: list of all versions, with "Set Active" button per version
  - "Save New Version" button
  - "Set as Active" button for current draft
- [ ] Add admin routes in `apps/api/src/modules/ai-pipeline/` (or dedicated admin module):
  - `GET /admin/prompts` — all prompts grouped by task type
  - `GET /admin/prompts/:taskType/versions` — all versions for a task type
  - `POST /admin/prompts` — create new version
  - `PATCH /admin/prompts/:id/activate` — set as active version
  - `POST /admin/prompts/test` — run prompt against real data in dry-run mode; returns AI response without saving
- [ ] Create `apps/web/src/components/admin/PromptVariableHighlighter.tsx` — textarea component that highlights `{variable_name}` tokens in a distinct color using CSS `::highlight` API or custom overlay technique

### 7.4 — User Management (Admin)

- [ ] Create `apps/api/src/modules/admin/users/admin-users.controller.ts` — admin routes for user management (all protected by admin JWT + `super_admin` or `moderator` role):
  - `GET /admin/users` — paginated user list with search by email/name; filter by plan, locale, referral status
  - `GET /admin/users/:id` — user detail: subscription, referral stats, task completions, feedback history, access log
  - `POST /admin/users/:id/grant-premium` — manually grant premium for N days
  - `POST /admin/users/:id/ban` — ban user (sets `is_banned` flag, invalidates sessions)
  - `DELETE /admin/users/:id/ban` — unban user
- [ ] Create `apps/web/src/app/admin/users/page.tsx` — searchable, filterable data table with user rows
- [ ] Create `apps/web/src/app/admin/users/[id]/page.tsx` — user detail page with all user data panels

### 7.5 — Subscription & Payment Management (Admin)

- [ ] Add admin routes in `apps/api/src/modules/payments/`:
  - `GET /admin/subscriptions` — list all subscriptions with filter: status, plan, provider, date range
  - `GET /admin/plans` — list all plans
  - `POST /admin/plans` — create new plan
  - `PATCH /admin/plans/:id` — update plan pricing/features/status
  - `GET /admin/payments/revenue` — revenue stats: MRR, ARR, churn rate, trial conversion rate
  - `POST /admin/payments/providers/:name/enable` — enable/disable payment provider per country
- [ ] Create `apps/web/src/app/admin/payments/page.tsx` — tabbed: Plans | Subscriptions | Revenue; plan editor form; subscription list table
- [ ] Create `apps/web/src/app/admin/referrals/page.tsx` — referral system configuration: reward type selector, reward value, trigger event selector, fraud threshold input; live referral stats table

### 7.6 — Referral & Task System Configuration (Admin)

- [ ] Add admin routes for referral config:
  - `GET /admin/referrals/config` — current referral reward configuration
  - `PATCH /admin/referrals/config` — update reward type/value/trigger
  - `GET /admin/referrals` — list all referrals with fraud scores; filter by status
  - `POST /admin/referrals/:id/approve` — manually approve flagged referral
  - `POST /admin/referrals/:id/reject` — reject fraudulent referral
- [ ] Add admin routes for task config:
  - `GET /admin/tasks` — list all tasks
  - `POST /admin/tasks` — create new task
  - `PATCH /admin/tasks/:id` — update task definition/reward/verification method
  - `PATCH /admin/tasks/:id/toggle` — enable/disable task
  - `GET /admin/tasks/completions` — all pending completions requiring manual review; approve/reject controls
- [ ] Create `apps/web/src/app/admin/tasks/page.tsx` — task list with inline edit and toggle; pending completions queue

### 7.7 — Feature Flags & Access Control Configuration (Admin)

- [ ] Add admin routes:
  - `GET /admin/feature-flags` — all feature flags
  - `PATCH /admin/feature-flags/:key` — toggle flag or update `enabled_for` segment
  - `GET /admin/access/config` — current soft login trigger thresholds
  - `PATCH /admin/access/config` — update trigger thresholds (scroll depth %, return visit hours, time on page seconds)
  - `POST /admin/market/status/override` — manually set market status (Trending/Ranging/High Risk)
- [ ] Create `apps/web/src/app/admin/settings/page.tsx` — tabbed settings: Feature Flags | Access Control | Market Status Override | Locale Management; toggle switches for feature flags; number inputs for access thresholds

### 7.8 — AI Cost & Model Routing Configuration (Admin)

- [ ] Add admin routes for AI cost management:
  - `GET /admin/ai/usage` — today's and month-to-date AI usage and cost per model
  - `GET /admin/ai/routing` — current model routing config per task type
  - `PATCH /admin/ai/routing/:taskType` — update primary/fallback model order for a task
  - `POST /admin/ai/budget-cap` — set per-model daily budget cap in USD
  - `GET /admin/ai/budget-status` — current spend vs caps for all models
- [ ] Create `apps/web/src/app/admin/ai/page.tsx` — AI management panel: routing config table (task type → model chain), budget cap inputs per model, today's usage bar charts

### 7.9 — Audit Log (Admin)

- [ ] Add admin route: `GET /admin/audit-log` — paginated list of all admin actions; filter by: admin_id, target_table, date range; each row shows: timestamp, admin name+role, action, target, payload summary
- [ ] Create `apps/web/src/app/admin/audit-log/page.tsx` — read-only data table; click row to expand full payload JSON

### 7.10 — Accuracy Engine Admin Controls

- [ ] Add admin routes:
  - `GET /admin/accuracy/records` — all accuracy records; filter by: pair, model, is_correct, date range
  - `GET /admin/accuracy/flagged` — accuracy records flagged for human review (edge cases)
  - `PATCH /admin/accuracy/records/:id` — admin manually sets `is_correct` and reason (override)
  - `GET /admin/accuracy/rules` — current evaluation rules (how actual direction is determined)
  - `PATCH /admin/accuracy/rules` — update evaluation rules
- [ ] Create `apps/web/src/app/admin/accuracy/page.tsx` — accuracy records table; flagged queue; rule configuration form

### 7.11 — Notification Configuration (Admin)

- [ ] Add admin routes:
  - `GET /admin/notifications/templates` — email/push notification templates
  - `PATCH /admin/notifications/templates/:id` — update template content
  - `POST /admin/notifications/broadcast` — send push/email to user segment (all, premium, free)
  - `GET /admin/notifications/sent` — log of sent notifications with delivery status
- [ ] Create `apps/web/src/app/admin/notifications/page.tsx` — template editor; broadcast composer with segment selector; sent log

### 7.12 — Analytics Dashboard (Admin)

> Uses data already in PostgreSQL — no third-party analytics dependency for admin-specific metrics.

- [ ] Add admin route: `GET /admin/analytics/overview` — aggregated stats:
  - Total users, daily new signups (7-day trend)
  - Free vs premium breakdown
  - Daily active users (based on JWT activity logs)
  - Referral conversion funnel: clicked → signed up → converted
  - Top 5 most-read insights (by view count)
  - Task completion rate per task type
  - Churn rate (subscriptions canceled in last 30 days / total active 30 days ago)
  - Revenue: today, this week, this month, MRR
- [ ] Add user view count tracking: increment Redis key `views:insight:{id}` on each `GET /insights/:slug` call; periodically flush to DB via scheduled job
- [ ] Create `apps/web/src/app/admin/analytics/page.tsx` — admin analytics page with Recharts:
  - Line chart: daily new users (30-day window)
  - Stacked bar chart: free vs premium users over time
  - Funnel chart: referral conversion funnel
  - KPI cards: MRR, churn rate, AI cost/user, accuracy %
  - Data table: top insights by views

### 7.13 — Admin API Wrapper Hooks (Frontend)

- [ ] Create `apps/web/src/hooks/admin/useAdminInsights.ts` — TanStack Query hooks for all admin insight routes
- [ ] Create `apps/web/src/hooks/admin/useAdminPrompts.ts` — TanStack Query hooks for prompt CRUD
- [ ] Create `apps/web/src/hooks/admin/useAdminUsers.ts` — TanStack Query hooks for user management
- [ ] Create `apps/web/src/hooks/admin/useAdminPayments.ts` — TanStack Query hooks for plans and subscriptions
- [ ] Create `apps/web/src/hooks/admin/useAdminAnalytics.ts` — TanStack Query hook for analytics overview; `staleTime: 5 * 60 * 1000` (5 minutes)
- [ ] Create `apps/web/src/hooks/admin/useAdminAI.ts` — TanStack Query hooks for AI usage and routing config
- [ ] Create `apps/web/src/lib/adminApiClient.ts` — separate API client that attaches admin JWT cookie instead of user JWT

### 7.14 — Phase 7 Verification & Final Integration Test

- [ ] Log into admin panel at `http://localhost:3000/admin/login`
- [ ] Complete 2FA setup: scan QR code with authenticator app, enter TOTP code
- [ ] Navigate to Admin → Prompts — create a `daily_insight` prompt; click "Test with Live Data"; confirm AI response renders in result pane
- [ ] Navigate to Admin → Insights → Generate — trigger AI generation; confirm draft appears in Drafts tab
- [ ] Approve and Publish the draft — confirm insight appears on public `http://localhost:3000/en/insights`
- [ ] Navigate to Admin → Translations — confirm translation jobs were queued; approve one translation; navigate to `/bn/insights` and confirm Bengali insight is visible
- [ ] Navigate to Admin → Speech Decoder — create an event, activate it, submit a segment, confirm it appears in premium user's feed via WebSocket
- [ ] Navigate to Admin → Analytics — confirm all KPI cards show data
- [ ] Navigate to Admin → Audit Log — confirm all admin actions above are logged with actor, timestamp, and payload
- [ ] Run full E2E user journey: anonymous visit → scroll past 70% → unlock modal → sign up → read free insight → attempt COT → upgrade to premium (Stripe test card) → access COT → submit feedback
- [ ] Commit: `git add . && git commit -m "feat(phase-7): admin panel — all modules, prompt builder, analytics dashboard"`

---

## Post-Phase: Production Readiness Checklist

> Complete these after all 7 phases are verified and before deploying to production.

### Infrastructure & DevOps

- [ ] Create `infrastructure/docker/docker-compose.prod.yml` — production compose: removes volume mounts, adds resource limits, uses env vars for all secrets
- [ ] Create `infrastructure/scripts/deploy.sh` — deployment script: pull latest, run migrations, restart services, health check
- [ ] Create `apps/api/Dockerfile` — multi-stage build: `builder` stage compiles TypeScript; `runner` stage uses minimal `node:20-alpine` image
- [ ] Create `apps/web/Dockerfile` — Next.js production build with standalone output mode
- [ ] Set `output: "standalone"` in `apps/web/next.config.ts` for Docker-optimized builds
- [ ] Configure environment variables in deployment platform (Railway or Render) — never commit real `.env` files
- [ ] Set up Cloudflare as CDN + DDoS protection in front of both frontend and API

### Monitoring & Observability

- [ ] Register project on Sentry — add `SENTRY_DSN` to env; initialize Sentry in `apps/api/src/main.ts` and `apps/web/src/app/[locale]/layout.tsx`
- [ ] Register project on PostHog — add `NEXT_PUBLIC_POSTHOG_KEY` to env; initialize PostHog in `apps/web/src/lib/analytics.ts`
- [ ] Configure Pino log output to JSON format in production; set up Logtail or Axiom ingestion endpoint
- [ ] Create health check endpoint `GET /health` in `apps/api/src/modules/health/health.controller.ts` — returns DB connectivity status, Redis connectivity status, queue worker status

### Security Hardening

- [ ] Enable NestJS Helmet middleware in `apps/api/src/main.ts`: `app.use(helmet())`
- [ ] Enable rate limiting: `pnpm --filter @tradesense/api add @nestjs/throttler`; configure: 100 requests/minute for public routes, 20 requests/minute for auth routes
- [ ] Validate all DTOs with `class-validator` and `class-transformer` — enable global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true`
- [ ] Set all admin JWT cookies with `httpOnly: true, secure: true, sameSite: "strict"`
- [ ] Add CSRF protection for admin panel form submissions
- [ ] Review all database queries for N+1 problems — add `DataLoader` pattern where needed

### Database Production Setup

- [ ] Set up Supabase Pro project (or Railway PostgreSQL) with connection pooling via PgBouncer
- [ ] Run all migrations against production database before first deploy
- [ ] Add database indexes: `CREATE INDEX` on `insights(status, published_at)`, `insights(slug)`, `calendar_events(scheduled_at, currency)`, `cot_reports(currency_pair, report_date)`, `users(referral_code)`, `subscriptions(user_id, status)`
- [ ] Configure database backup schedule (daily automated backups in Supabase)
- [ ] Set up Upstash Redis for production (pay-per-request, no server management)
- [ ] Configure read replicas if on Supabase Pro — update Drizzle config to use replica for SELECT-heavy modules (insights, calendar, COT)

### Final Commit & Tag

- [ ] Update root `README.md` with: project overview, local setup instructions, environment variables guide, links to Architecture Document
- [ ] Run `pnpm lint` from root — fix all ESLint errors
- [ ] Run `pnpm build` from root — confirm both `apps/web` and `apps/api` build successfully
- [ ] Tag release: `git tag -a v1.0.0-beta -m "TradeSense v1.0 — All 7 phases complete"`
- [ ] Push to remote: `git push origin main --tags`

---

*Roadmap version: 1.0 | Derived from TradeSense CTO Architecture Document v1.0*
*Phases: 7 | Total Tasks: 300+ | Target: Production-ready TradeSense platform*
