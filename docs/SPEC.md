PROJECT NAME: TradeSense (brand used in UI, emails, meta tags)

PRODUCT
An English-only market-research subscription site. A small team writes EVERYTHING manually through an advanced admin panel.
- Daily and Weekly BIAS posts (bullish/bearish/neutral) per market, each later given a manually entered RESULT.
- KILLZONE NOTES (asia, london, ny_am, ny_pm) per market. A note has NO bias and NO result. It is a factual technical-analysis observation linked to a Daily/Weekly post, with status: followed | non_followed | invalidation | neutral.
Research/education only. NEVER include entry, stop-loss, take-profit, lot size, or "buy/sell now" fields anywhere. "Not financial advice / past performance is not indicative of future results" disclaimer in footer and on every post and note. No profit claims, fake countdowns, or urgency tricks in UI copy.
NO public accuracy scoreboard. Only accuracy-related public UI: a Confidence filter (high/medium/low) and the result shown inside each post.

TECH STACK (exactly this)
- Cloudflare Workers + Workers Static Assets, single project, single deploy. wrangler.jsonc with assets.not_found_handling = "single-page-application" and run_worker_first for /api/* and other server routes.
- Hono (TypeScript) API. D1 (SQLite) with SQL migrations in /migrations via `wrangler d1 migrations`. R2 for screenshots. KV for rate limit/cache. Cron Triggers.
- Frontend: Vite + React + TypeScript + Tailwind CSS + React Router + TanStack Query. Public site and admin in one SPA, admin under /admin. Dark mode default, mobile-first.
- Zod on every endpoint, shared types. react-markdown (sanitized) + textarea live-preview editor.
- Auth: own implementation. Email: Resend. Payments: NOWPayments only.

DATABASE-PORTABLE ARCHITECTURE (may move to Postgres later)
- ALL DB access through a repository layer: src/server/repositories/*.ts (interfaces) + src/server/repositories/d1/*.ts (implementations), created by one factory. Routes/services never contain raw SQL or touch the D1 binding.
- Standard SQL where possible: TEXT ULID ids, ISO-8601 TEXT timestamps, INTEGER booleans. README lists what needs rewriting for Postgres (triggers, JSON, pagination).
- Business rules enforced in BOTH the service layer and DB triggers.

DATA MODEL
- markets(id, symbol, name, category[gold|forex|index|crypto|oil|dxy], active, sort_order); analysts(id, name, bio, avatar_attachment_id, active)
- posts: id, type[daily|weekly], market_id, post_date, week_start_date, bias, confidence[high|medium|low], sentiment[risk_on|risk_off|mixed], title, summary, body_md, key_drivers_md, risk_events_md, invalidation_md (text only, never a price level), access[free|paid], status[draft|scheduled|published], publish_at, valid_from, valid_until, analyst_id, created_by, created_at, updated_at, published_at
- killzone_notes: id, market_id, killzone, note_date, linked_post_id (required), status[followed|non_followed|invalidation|neutral], confidence (optional), title, note_md, access, publish_status[draft|scheduled|published], publish_at, analyst_id, created_by, timestamps, published_at
- results(post_id UNIQUE, outcome[correct|wrong|partial], note_md, evaluated_by, evaluated_at, evaluation_rule_version). IMMUTABLE via SQL triggers blocking UPDATE/DELETE, plus API refusal. Fixes go to result_corrections(result_id, new_outcome, reason_md, created_by, created_at), shown publicly on the post.
- attachments: id, owner_type[post|note|result], owner_id, kind[bias_chart|result_chart|note_chart|other], r2_key, mime, size, sha256 (computed SERVER-side at upload, never client-supplied), caption, access[inherit|free|paid|public], uploaded_by, uploaded_at, locked. Show SHA-256 + upload time in admin and as small "verified upload" text on public posts. Attachments of published items and all result attachments are locked (no replace/delete; only add new).
- Lock rules (trigger + service): after publish, post market_id/type/post_date/bias/confidence/valid_from/valid_until are locked; note status/linked_post_id/market/killzone locked. Text typo edits allowed but saved in post_revisions(entity_type, entity_id, old_json, new_json, edited_by, edited_at) and shown as "edited" with history.
- evaluation_rules(id, version, text_md, active_from); tags/post_tags/note_tags; events(calendar, manual)
- users(id, email, name, role[admin|editor|analyst|member], password_hash, totp_secret, timezone, created_at), sessions, magic_link_tokens
- plans(id, code, name, duration_days, price_usd, active, sort_order); region_prices(plan_id, country_code, price_usd) used ONLY if setting regional_pricing_enabled = true (default false; flat global price otherwise)
- payments(id, user_id, plan_id, provider, provider_payment_id, provider_invoice_id, price_amount, price_currency, pay_currency, actually_paid, status, raw_payload_json, timestamps); subscriptions(user_id, plan_id, status[active|expired|cancelled], starts_at, expires_at, granted_manually, granted_by, note)
- bookmarks, view_log(user_id, entity_type, entity_id, viewed_at, ip_hash), saved_views(id, user_id, scope, name, filters_json, columns_json, shared), settings(key, value_json, updated_by, updated_at), audit_log(id, user_id, action, entity, entity_id, diff_json, created_at) — log EVERY admin action.
- Indexes on all filter columns.

FILTERS (one engine for API, public UI, admin; state in URL query string)
Primary: type (daily/weekly/killzone note), period (today, this week, date, range, month), killzone (multi), bias, note status, market (multi).
Secondary: confidence, result (correct/wrong/partial/pending), driver tag, sentiment, analyst, access, publish status, has screenshot, bookmarked, keyword search. Public UI shows only visitor-relevant filters; admin shows all.

AUTH & ROLES
Staff: email+password (PBKDF2 via Web Crypto, per-user salt), HttpOnly Secure SameSite=Lax cookie, CSRF, KV login rate limit, optional TOTP for admins. Members: magic link via Resend. Roles: admin = all; editor = create/edit/publish posts & notes, add results, manage attachments; analyst = drafts only. Permission map in one file. `npm run seed:admin` creates the first admin.

ACCESS CONTROL (admin-controlled settings, nothing hard-coded)
Settings: default_access_daily=free, default_access_weekly=paid, default_access_killzone_note=paid, default_access_screenshot=inherit, free_delay_hours, open_archive_days=7 (older items open to all so visitors can verify), announcement banner, disclaimer text, active evaluation rule version, regional_pricing_enabled, reminder_days=7,3,1, refund policy text. Per-item override on every post/note/screenshot.
Security: paid content and paid screenshots NEVER sent to non-members (API-enforced, locked placeholders; R2 files only via authorized Worker routes, never public R2 URLs). Invisible per-user watermark (zero-width encoded user ID + footer token) + view_log. Rate limits, security headers (CSP, HSTS...).

PUBLIC SITE
Pages: Home/Today, Matrix, Weekly Outlook, Post detail, Note detail, Feed, Month Heatmap, Event Calendar, Evaluation Rules, Pricing, Account, Login, Terms, Privacy, Risk Disclaimer.
BIAS MATRIX (signature UI): week navigation, market selector, columns Mon-Fri + WEEKLY. Row 1 = Daily bias cell (▲ green bullish, ▼ red bearish, ● grey neutral; icons always shown; result badge ✓ ✗ ~ ⏳). Rows below = one per killzone showing NOTE STATUS icons (Followed, Non-Followed, Invalidation ⚠, Neutral ●) with legend. Click a cell -> side drawer with full content, screenshots, linked bias, result, edit history. Mobile = day-wise stacked cards. Timezone selector for killzone times. SEO meta/OG tags, sitemap.xml, robots.txt.

PAYMENTS: NOWPAYMENTS ONLY
PaymentProvider interface { createCheckout, handleWebhook, mapStatus } + NowPaymentsProvider. Server-side invoice creation, IPN webhook verifying x-nowpayments-sig (HMAC-SHA512 over JSON body with keys sorted alphabetically, IPN secret), idempotent by payment id. Only `finished` grants access; `partially_paid` goes to admin "Underpaid" queue (grant / request top-up / reject). Period-based access, no auto-renew: payment extends expires_at by duration_days (stacking on active expiry). Daily cron: expire subscriptions and send Resend reminders at reminder_days with renew link. Admin payments screen: filters, manual grant/revoke with reason, CSV export.

ADMIN PANEL (most important; manual posting must be FAST)
- Dashboard: missing items today (market x killzone / Daily bias), results queue, drafts, scheduled, underpaid payments, active subscribers, MRR estimate, expiring soon.
- Post editor (all fields, markdown live preview, multi-screenshot upload with captions + per-image access, draft/schedule/publish, autosave, duplicate yesterday, "create full day template" for selected markets, bulk create).
- Killzone Note editor + quick-entry mode (market -> killzone -> status -> short note -> publish), linked-post auto-suggest.
- Results queue: published posts past valid_until with no result; one-click Correct/Wrong/Partial with required note and optional result screenshots; shows active rule; locks after submit; correction flow.
- Advanced lists (posts, notes, results, users, payments): all filters, column chooser, saved views, bulk actions, CSV export, per-item view/bookmark counts and "who viewed".
- Management: markets, analysts, tags, events, users & roles, subscriptions, plans & prices (+ optional regional prices), evaluation rules, settings, audit log, revision history, media library (SHA-256 + upload time).

SEED
Markets XAUUSD, EURUSD, GBPUSD, USDJPY, DXY, NAS100, US30, BTCUSD, ETHUSD, USOIL; sample Daily/Weekly posts with some results; sample notes of all four statuses; default settings; plans monthly (30 days) and annual (365 days). Works locally via `npm run seed`.

PHASES (ONE PHASE PER CHAT)
Phase 1: Scaffold (package.json, tsconfig, vite, tailwind, wrangler.jsonc, .gitignore, .dev.vars.example), repository layer, migrations with triggers, seed, auth and roles. VERIFY: migrate:local, seed, `npx wrangler dev`, login works.
Phase 2: Admin core (settings, markets/analysts/tags, post editor, note editor, attachments with SHA-256).
Phase 3: Results queue, advanced lists (filters, column chooser, saved views, bulk, CSV), users/plans/audit/revisions/media screens.
Phase 4: Public site (Today, Matrix, drawer, filters, feed, heatmap, rules, events), access control, watermark, view log.
Phase 5: NOWPayments, Resend, Cron (publish, expire, reminders), SEO, security headers, pricing/account pages.
Phase 6: Production deploy (remote D1/R2/KV, migrate:remote, secrets, wrangler deploy, custom domain, D1 backup script, final checklist, README with setup/backup/Postgres notes/troubleshooting).
