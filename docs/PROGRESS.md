# PROGRESS

## Status: Phase 1 complete / Phase 2 next (Admin core)

## Done (per phase)
- Phase 0: docs/SPEC.md and docs/PROGRESS.md created.
- Phase 1:
  - Scaffold: Vite + React + TS + Tailwind (client), Hono Worker (server), wrangler.jsonc with Workers Static Assets (SPA fallback, run_worker_first for /api/*, /files/*, /sitemap.xml, /robots.txt).
  - Migrations 0001 (full schema), 0002 (indexes), 0003 (21 triggers: results/corrections immutable, result only on published + expired post, audit/revisions append-only, post/note core-field locks after publish, note link validation, attachment locks and auto-lock).
  - Repository layer: interfaces in src/server/repositories/types.ts, D1 implementations + single factory. Implemented so far: users, sessions, magicLinks, settings, audit, markets.
  - Auth: PBKDF2 (100k iterations, Workers max), session cookie (token hashed in DB), CSRF (Origin check + per-session header), KV login rate limit, optional admin TOTP, member magic link (printed to the dev console when no Resend key).
  - Seed: `npm run seed` (markets, settings, plans, rule v1, tags, 29 sample posts, 21 results, 18 notes) and `npm run seed:admin`.
  - Client: login screen (staff + member tabs), magic-link verify page, auth context, admin placeholder page, layout with disclaimer footer.
  - VERIFIED: typecheck, migrate:local, seed, trigger immutability test, /api/auth/* curl tests.

## File map
- docs/SPEC.md: full product spec (change only on request)
- docs/PROGRESS.md: this file
- package.json, tsconfig.json (client), tsconfig.server.json (server + scripts), vite.config.ts, tailwind.config.js, postcss.config.js: tooling
- wrangler.jsonc: Worker, assets, D1 (tradesense-db), R2 (tradesense-files), KV bindings (placeholder IDs, local only)
- .gitignore, .dev.vars.example (.dev.vars is git-ignored)
- migrations/0001_schema.sql, 0002_indexes.sql, 0003_triggers.sql
- scripts/seed.ts: writes .seed/seed.sql (run once per fresh local DB)
- scripts/seed-admin.ts: writes .seed/admin.sql (re-runnable, resets that admin's password)
- src/shared/constants.ts: enums (roles, biases, killzones...), cookie/CSRF names
- src/shared/permissions.ts: THE permission map + can() / isStaff()
- src/shared/schemas.ts: Zod schemas shared by client and server
- src/shared/types.ts: PublicUser, MeResponse, ApiErrorBody
- src/server/index.ts: Hono app, middleware wiring, route mounting, error handler
- src/server/env.ts: Bindings, Variables, AppEnv types
- src/server/middleware.ts: context (repos + session load), csrfGuard, requireAuth, requirePermission(perm), securityHeaders
- src/server/routes/auth.ts: /api/auth/me, login, logout, magic/request, magic/verify, totp/setup|enable|disable
- src/server/services/auth.ts: AuthService (login, rate limits, sessions, magic links)
- src/server/lib/: ids.ts (ULID, tokens, sha256Hex), time.ts, errors.ts (AppError), crypto.ts (PBKDF2), totp.ts, ratelimit.ts (KV), validate.ts (parseJson), email.ts (Resend / dev console)
- src/server/repositories/types.ts: row shapes + repository interfaces + Repositories
- src/server/repositories/d1/: util.ts, users.ts, sessions.ts, magicLinks.ts, settings.ts, audit.ts, markets.ts, index.ts (createRepositories factory)
- src/client/: index.html, index.css, main.tsx, App.tsx (routes)
- src/client/lib/api.ts: fetch wrapper (CSRF header, ApiError); lib/auth.tsx: AuthProvider/useAuth
- src/client/components/Layout.tsx: header, footer disclaimer
- src/client/pages/: Home.tsx, Login.tsx, LoginVerify.tsx, Admin.tsx (placeholder)

## Key decisions & conventions
- Names: Worker tradesense, D1 tradesense-db, R2 tradesense-files, brand TradeSense.
- IDs: TEXT ULID via newId(). Timestamps: ISO-8601 UTC TEXT via nowIso(). Dates: YYYY-MM-DD TEXT. Booleans: INTEGER 0/1 (toBool/fromBool in repositories/d1/util.ts).
- Row shapes are camelCase in repository interfaces; snake_case only inside repositories/d1.
- Error format everywhere: { error: { code, message, details? } }. Throw AppError helpers (badRequest, unauthorized, forbidden, notFound, conflict, tooMany). The global onError converts them.
- Aliases: @shared/* -> src/shared/*, @client/* -> src/client/*. Server code imports @shared (works in wrangler dev).
- Hono 4.6.14 has no ContentfulStatusCode, so errors.ts defines its own ErrorStatus type.
- Auth: cookie ts_session (HttpOnly, SameSite=Lax, Secure when APP_URL is https). The DB stores only sha256(token) as sessions.id. CSRF: header x-csrf-token must equal session.csrfToken on POST/PUT/PATCH/DELETE (exempt: login, magic/request, magic/verify, /api/webhooks/*). Client gets the token from /api/auth/me and the login responses; api.ts adds it automatically.
- Only repositories/d1 touches D1Database. Routes and services receive c.var.repos.
- Staff login only for roles admin/editor/analyst. Members use magic link only. Seed system user system@tradesense.local (role editor, no password) cannot log in.
- HOW TO ADD A NEW ENDPOINT: (1) Zod schema in src/shared/schemas.ts; (2) repository interface in repositories/types.ts + implementation in repositories/d1/*.ts + register in d1/index.ts; (3) service in src/server/services/ for business rules (also add a DB trigger if it is a lock rule); (4) route file in src/server/routes/ using requirePermission("x:y") and parseJson(c, schema), audit every admin action via c.var.repos.audit.add; (5) mount in src/server/index.ts.
- HOW TO ADD A NEW SCREEN: page in src/client/pages/, route in App.tsx, data via TanStack Query + api() from lib/api.ts.

## Commands
- Dev: `npm run dev:api` (wrangler on :8787) and `npm run dev:web` (Vite on :5173, proxies /api and /files). Open http://localhost:5173.
- `npm run migrate:local` | `npm run seed` (once per fresh DB) | `npm run seed:admin` (env ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD, or prompts)
- `npm run typecheck` | `npm run build` (vite build, not yet verified) | `npm run deploy` (Phase 6)
- Reset local DB: stop wrangler, `rm -rf .wrangler/state && npm run migrate:local`, then seed again.
- VERIFIED local state: D1 tradesense-db and R2/KV are local-only with placeholder IDs in wrangler.jsonc (database_id all zeros, KV id all zeros). Real resources are created in Phase 6.

## Env vars / secrets list (names only)
APP_NAME, APP_URL, SESSION_SECRET, IP_HASH_SALT, RESEND_API_KEY, RESEND_FROM, NOWPAYMENTS_API_KEY, NOWPAYMENTS_IPN_SECRET.
- Local (.dev.vars): all set. RESEND_API_KEY, NOWPAYMENTS_API_KEY and NOWPAYMENTS_IPN_SECRET are empty.
- Production: none set yet (Phase 6, via `npx wrangler secret put NAME`).

## Known issues / TODO
- `npm run build` (vite build) not yet run. Verify early in Phase 2.
- wrangler 4.20.0 is pinned (4.147 available). Fine for now, revisit in Phase 6.
- npm audit shows 19 vulnerabilities, all in dev tooling. Ignored for now.
- Seed is run-once. Re-running it on a populated DB fails on unique constraints. Reset the DB instead.
- Rate limiting uses KV, which is eventually consistent (a brake, not an exact meter).
- Magic-link emails are only printed to the console until a Resend key is set (Phase 5).
- Repositories for posts, notes, attachments, tags, analysts, revisions, results, evaluation rules, plans, payments, subscriptions, bookmarks, view_log, saved_views, events are not written yet (tables exist).
- The admin password used in local dev was shared in a chat. Use a different one in production.

## Next phase checklist
Phase 2: Admin core.
- Admin shell: sidebar/nav, route guard, role-aware menu (permission map).
- Repositories + services + routes for: settings (all spec keys, editable), markets, analysts, tags, posts, notes, attachments, post_revisions.
- Settings screen (access defaults, free_delay_hours, open_archive_days, banner, disclaimer, reminder_days, refund text, regional_pricing_enabled).
- Management screens: markets, analysts, tags.
- Post editor: all fields, markdown live preview (react-markdown, sanitized), draft/schedule/publish, autosave, duplicate yesterday, create full-day template for selected markets, bulk create; analyst role = drafts only.
- Note editor + quick-entry mode, linked-post auto-suggest.
- Attachments: multi-upload to R2, SHA-256 computed server-side, captions, per-image access, show SHA-256 + upload time, authorized /files/:id Worker route (never public R2), lock after publish.
- Lock rules enforced in services (triggers already exist); text edits after publish saved to post_revisions.
- Audit log entry for every admin action.
- VERIFY: typecheck, `npm run build`, create/edit/publish a post and a note, upload a screenshot, try an edit on a locked field and see it refused.
