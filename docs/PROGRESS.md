# PROGRESS

## Status: Phase 3 complete / Phase 4 next (Public site: Today, Matrix, drawer, filters, feed, heatmap, rules, events, access control, watermark, view log)

## Done (per phase)
- Phase 0: docs/SPEC.md and docs/PROGRESS.md created.
- Phase 1: scaffold (Vite + React + TS + Tailwind client, Hono Worker server, wrangler.jsonc with Workers Static Assets, SPA fallback, run_worker_first for /api/*, /files/*, /sitemap.xml, /robots.txt), migrations 0001 schema / 0002 indexes / 0003 triggers (21), auth (PBKDF2, session cookie, CSRF, KV rate limit, optional TOTP, member magic link), seed, login screens.
- Phase 2 (Admin core): settings registry + screen, markets/analysts/tags, posts (editor, autosave, speed tools), notes (editor, quick note), attachments (SHA-256, locks), revisions (per entity), authorized GET /files/:id, role-aware admin shell.
- Phase 3 (Results, lists, admin screens):
  - Results: repository + ResultService + routes. Queue = published posts past valid_until with no result (oldest first). Create (outcome + required note; server stamps evaluator, time and the ACTIVE rule version), append-only corrections (effective outcome = latest correction), result detail with correction history, result screenshots (AttachmentService supports ownerType "result"; always locked on upload, editor/admin only). DB triggers remain the last line of defence; their messages are mapped to clean 409s.
  - Evaluation rules: append-only versions (EvaluationService). Creating a version can activate it; "Make active" switches settings.active_evaluation_rule_version (the only writer of that setting). Rules screen under /admin/results/rules.
  - List engine: ONE filter language (shared/lists.ts) used by posts and notes lists, saved views, bulk "all matching" and CSV export. Multi-value filters are comma separated in the URL. D1ListRepository (allow-listed sorts, bound parameters). Endpoints /api/admin/lists/posts|notes (+ /export.csv, /bulk) and /api/admin/lists/results/export.csv.
  - Bulk actions (posts and notes): publish, unschedule, delete (drafts), set access, add tag, remove tag. They call the SAME services as the single-item screens, once per row, and report per-row failures.
  - CSV export: server-built, chosen columns in the chooser's order, 5000 row cap, formula-injection safe, UTF-8 BOM, audited as list.export.
  - Saved views (scope posts|notes|results|users|payments): private or shared, 30 per user per list.
  - Admin screens: Results (queue, all results, result detail, rules), Users (create, edit, role, password reset, 2FA reset), Plans (create, edit, regional prices, never deleted), Audit log, Revisions (cross-entity), Media library (global).
  - Posts and Killzone notes lists rebuilt on the list engine (multi-filters, sort, column chooser, saved views, bulk bar, CSV).
  - VERIFIED by the assistant: `npm run typecheck` and `npm run build` pass after every part; list SQL run against the real migrations in SQLite (sorts, filters, corrections override, pending filter).
  - VERIFIED by the owner: server endpoints answer 200 in the browser console (rules, queue, results, users, plans, audit, revisions, media, views, lists, CSV); Part 13 screen checks (filters, sort, columns, saved views, export, bulk) reported done.
  - NOT YET CONFIRMED in the owner's browser (run these first in Phase 4): (1) Part 14: evaluate a queue row and see it leave the queue; add rule v2 and confirm the next evaluation says "judged by rule v2"; (2) Part 15: all-results filters, result detail, add a correction (outcome shows "corrected" in Posts and All results), upload a result screenshot (shows Locked, delete disabled); (3) Part 16: users (own role dropdown disabled, create editor, change role, reset password), plans (edit with regional price, deactivate, no delete button); (4) Part 17: audit log filters and the details toggle (no password in user.create), revisions after editing a published post, media library thumbnails and filters, nav hides Users/Plans/Audit/Revisions/Media for non-admin roles; (5) the bulk failure path: select a PUBLISHED post, run "Delete drafts", expect "1 not changed" with a reason. The Phase 2 browser checks (create/autosave/publish, locked screenshot after publish, edit history, 409 on locked field, quick note, note editor, analyst role) are also still not explicitly confirmed.

## File map
- docs/SPEC.md (full spec, change only on request), docs/PROGRESS.md (this file)
- package.json, tsconfig.json (client), tsconfig.server.json (server + scripts), vite.config.ts, tailwind.config.js, postcss.config.js
- wrangler.jsonc: Worker, assets, D1 tradesense-db, R2 tradesense-files (binding BUCKET), KV (placeholder IDs, local only)
- migrations/0001_schema.sql, 0002_indexes.sql, 0003_triggers.sql (no new migrations in Phase 3)
- scripts/seed.ts, scripts/seed-admin.ts
- src/shared/: constants.ts, permissions.ts (THE permission map, unchanged), schemas.ts (auth/market/analyst/tag Zod, createUserSchema), settings.ts, content.ts (post/note Zod + DTOs), attachments.ts (owner types post|note|result), types.ts, NEW results.ts (result/correction/queue/rule schemas + DTOs), NEW admin.ts (user/plan/saved-view/audit/revision/media schemas + DTOs), NEW lists.ts (filter language, sorts, row DTOs, column definitions POST/NOTE/RESULT_COLUMNS, bulk schema)
- src/server/index.ts: app, middleware, mounting: /api/auth, /api/admin/settings|posts|notes|attachments|results|rules|users|plans|views|lists, /api/admin (history: audit, revisions, media; then catalog), /files
- src/server/env.ts, middleware.ts
- src/server/lib/: ids, time, errors, crypto, totp, ratelimit, validate, email, audit, diff, dto, NEW csv.ts (toCsv), NEW labels.ts (EntityLabels, safeJson)
- src/server/repositories/: types.base.ts (the Phase 2 types file, unchanged), types.ts (re-exports types.base and adds Phase 3 rows/interfaces; extended UserRepository, AuditRepository, RevisionRepository, AttachmentRepository; new ResultRepository, EvaluationRuleRepository, PlanRepository, SavedViewRepository; Repositories), listTypes.ts (PostFilterBase, NoteFilterBase, ListRepository), listAugment.ts (adds `lists` to Repositories by declaration merging)
- src/server/repositories/d1/: util, users (+search, findManyByIds), sessions, magicLinks, settings, audit (+filtered list), markets, analysts, tags, posts, notes, revisions (+cross-entity list), attachments (+global list), NEW results, evaluationRules, plans, savedViews, lists; index.ts (createRepositories)
- src/server/services/: auth, settings, catalog, posts (PostService, Actor), notes, attachments (+result owner), NEW results (ResultService), evaluation (EvaluationService), users (UserService), plans (PlanService), history (HistoryService: audit/revisions/media), savedViews, lists (ListService, filter mappers, CSV column maps), bulk (BulkService)
- src/server/routes/: auth, settings, catalog, posts, notes, attachments, files, NEW results, rules, users, plans, history, views, lists
- src/client/lib/: api, auth, admin (useLookups), dates, labels, NEW useListState (URL-state hook), useColumns (per-browser column choice), useSelection (row selection)
- src/client/components/: Layout, ui, Markdown, admin/{nav, AdminLayout, badges, resultBadges, PostSpeedTools, QuickNote, AttachmentsPanel (ownerType post|note|result)}, NEW list/{MultiSelect, ColumnChooser, Pagination (+SortTh), SearchBox, SavedViewsMenu, BulkBar, ExportLink}
- src/client/pages/: Home, Login, LoginVerify, Admin.tsx (routes + dashboard), admin/{SettingsPage, MarketsPage, AnalystsPage, TagsPage, PostsPage, PostEditorPage, NotesPage, NoteEditorPage, UsersPage, PlansPage, AuditPage, RevisionsPage, MediaPage}, admin/results/{index (tabs + routes), ResultsQueuePage, ResultsListPage, ResultDetailPage, RulesPage}

## Key decisions & conventions
- Names: Worker tradesense, D1 tradesense-db, R2 tradesense-files, brand TradeSense.
- IDs: TEXT ULID via newId(). Timestamps: ISO-8601 UTC TEXT via nowIso(). Dates: YYYY-MM-DD TEXT (UTC calendar day). Booleans: INTEGER 0/1.
- Row shapes camelCase in repository interfaces; snake_case only inside repositories/d1. Only repositories/d1 touches D1Database.
- Error format: { error: { code, message, details? } }. AppError helpers (badRequest, unauthorized, forbidden, notFound, conflict, tooMany); locked edits use AppError(409, "locked", msg, { fields }); upload errors 413 too_large, 415 unsupported_type.
- Hono 4.6.14 (own ErrorStatus type in errors.ts). Aliases @shared/*, @client/*.
- Auth/CSRF as Phase 1 (cookie ts_session, header x-csrf-token; apiForm adds it for multipart).
- Staff pages: every /api/admin/* route needs admin:access; finer permission per route. Permission map NOT changed in Phase 3. Phase 3 permission use: result:create (create result + correction + result screenshots), rules:manage (create/activate rules; reads are any staff), user:manage (users routes and users saved views), plan:manage (plans), audit:view (audit log, admin only), post:publish (revisions and media screens: editors and admins), list:export (CSV), post:edit|post:publish and note:edit|note:publish (bulk action chosen by the action), payment:manage (payments saved views).
- Settings, posts, notes, attachments, locks, roles, notes rules, catalog rules, editor behaviour: unchanged from Phase 2 (see previous conventions: posts dated by Monday for weekly, publish completeness rules, locked fields after publish with post_revisions in the same batch, analyst own-drafts only, GET /files/:id staff-all / public-only for others).
- Repositories types: types.base.ts holds the Phase 2 interfaces; types.ts re-exports it (`export * from "./types.base"`) and declares extended interfaces with the SAME names, which shadow the base ones. `lists: ListRepository` is attached to Repositories in listAugment.ts (declaration merging). When types.ts is next edited for another reason, fold listAugment and types.base into one file.
- Results: one result per post (UNIQUE post_id), never UPDATE/DELETE (trigger); service checks published + valid_until passed + no result; evaluation_rule_version is set by the server from the active rule; corrections append-only; effective outcome = latest correction else original (SQL EFFECTIVE expression in results.ts and lists.ts must stay identical). Result owner access follows the evaluated post.
- Evaluation rules append-only (no edit/delete); version = max + 1 in one INSERT with UNIQUE(version).
- Users: admins cannot change their own role (so the last admin cannot be removed); seed system user system@tradesense.local cannot be changed; staff accounts need a password; role change, password reset and 2FA reset delete the user's sessions (SessionRepository.deleteByUser). No user delete or disable yet.
- Plans: never deleted (deactivate); codes unique and immutable; region prices replaced atomically via PUT and used only when settings.regional_pricing_enabled is true.
- Saved views: personal preference, NOT audited; filters = flat string map identical to the list's URL query; only the owner edits; owner or admin deletes shared; permission per scope.
- List engine: filters are bound parameters, sorts come from allow-lists (POST_SORT, NOTE_SORT in d1/lists.ts), `mine=1` is mapped to createdBy in the service. Row DTOs and column ids live in shared/lists.ts; CSV columns are keyed by the same ids (services/lists.ts). Old GET /api/admin/posts and /notes list endpoints still exist (used by other screens such as linked-post suggestions); the Posts and Notes screens use /api/admin/lists/*.
- Bulk: BulkService runs the existing PostService/NoteService methods per row; max 100 rows per request (Worker database-call budget), response.truncated = true when more matched; "delete" needs explicit ids (never a filter); every success is audited with the normal action name and diff.via = "bulk"; set_access/add_tag/remove_tag go through update(), so published rows follow the edit-after-publish rules and write revisions.
- CSV export: GET /api/admin/lists/{posts|notes|results}/export.csv?filters&sort&columns=a,b; cap 5000 rows; header X-Export-Rows / X-Export-Truncated; audited as list.export with the filters.
- Audit actions added: result.create, result.correct, rules.create, rules.activate, user.create|update|role|password_reset|totp_disable, plan.create|update|region_prices, list.export; bulk rows reuse post.*/note.* actions with diff.via = "bulk".
- Client: list state lives in the URL (useListState: filters, sort, dir, offset; setting a filter resets to page 1); column choice is per browser (localStorage key ts.columns.<kind>, wrapped in try/catch); selection clears on any change of the query (useSelection(resetKey)). Outcome/bias/status are always icon + word (OutcomeBadge, BiasBadge, StatusBadge). Destructive or bulk actions use window.confirm.
- Windows Git Bash has no python: deliver every file as a full heredoc script, never python/sed edits.
- HOW TO ADD A NEW ENDPOINT: (1) Zod schema in src/shared/ + DTO type; (2) repository interface in repositories/types.ts + D1 implementation + register in d1/index.ts; (3) service in src/server/services/ (business and lock rules, Actor = {id, role}); (4) route file in src/server/routes/ with requirePermission("x:y"), parseJson / parseQuery, and audit(c, action, entity, id, diff) after every admin change; (5) mount in src/server/index.ts (static paths before /:id).
- HOW TO ADD A NEW SCREEN: page in src/client/pages/admin/, nav item in components/admin/nav.ts, <Route> in pages/Admin.tsx wrapped in <RequirePermission>, data via TanStack Query + api(), shared look from components/ui.tsx.
- HOW TO ADD A COLUMN TO A LIST: add the field to the row DTO (shared/lists.ts) and the SELECT/mapper in repositories/d1/lists.ts; add a ColumnDef in shared/lists.ts; add its cell in the page's `cell` map and its value in the CSV map in services/lists.ts (same id).
- HOW TO ADD A FILTER TO A LIST: add it to postFilterShape/noteFilterShape (shared/lists.ts), to PostFilterBase/NoteFilterBase (listTypes.ts), map it in postFilterFromQuery/noteFilterFromQuery (services/lists.ts), add the WHERE clause in postWhere/noteWhere (d1/lists.ts), add the control on the page. Saved views and bulk "all matching" pick it up automatically.

## Commands
- Dev: `npm run dev:api` (wrangler on :8787, serves the built client: run `npm run build` first) and `npm run dev:web` (Vite on :5173, proxies /api and /files).
- `npm run migrate:local` | `npm run seed` (once per fresh DB) | `npm run seed:admin` (env ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD, or prompts)
- `npm run typecheck` | `npm run build` | `npm run deploy` (Phase 6)
- Reset local DB: stop wrangler, `rm -rf .wrangler/state && npm run migrate:local`, then `npm run seed` and `npm run seed:admin`. This also empties local R2.
- Browser console tip (Chrome): type `allow pasting` and press Enter once before pasting code into DevTools.

## Env vars / secrets list (names only)
APP_NAME, APP_URL, SESSION_SECRET, IP_HASH_SALT, RESEND_API_KEY, RESEND_FROM, NOWPAYMENTS_API_KEY, NOWPAYMENTS_IPN_SECRET.
- Local (.dev.vars): all set; RESEND_API_KEY, NOWPAYMENTS_API_KEY, NOWPAYMENTS_IPN_SECRET empty.
- Production: none set yet (Phase 6, via `npx wrangler secret put NAME`).

## Known issues / TODO
- Browser checks marked NOT YET CONFIRMED under Done (Phase 3 and Phase 2). Re-run them first.
- Scheduled posts/notes (status scheduled + publishAt) are NOT flipped to published automatically yet: Cron is Phase 5. Public pages (Phase 4) must treat only status published as visible.
- free_delay_hours and open_archive_days are stored but not applied yet (Phase 4). AttachmentService.canView non-staff branch is the Phase 4 hook for entitlements (result screenshots follow their post's access via ownerInfo).
- Repositories still missing: payments, subscriptions, bookmarks, view_log, events. List filters/columns that need them (bookmarked, per-item view counts, who viewed) are not built yet (Phase 4).
- ListRepository is admin-only for now; Phase 4 adds the public variant on the same filter language (public must only ever see status published, respect access and free delay).
- Public display of corrections beside the original result is not built yet (Phase 4). The post editor has no "Evaluate" shortcut or result summary yet (small TODO).
- Users: no deactivate/delete, no invite email (Resend is Phase 5). Staff 2FA enrolment is the Phase 1 flow.
- Bulk limited to 100 rows per request; CSV export capped at 5000 rows; lists use a fixed page size of 25 (audit 50, media 24). The All results list has fixed order (newest post first) and no bulk actions (results are immutable).
- Deleting posts/notes with screenshots is refused (drafts only, fine).
- wrangler 4.20.0 and Hono 4.6.14 pinned. npm audit: dev-tooling vulnerabilities only. Client bundle ~498 KB (146 KB gzip); consider code-splitting admin routes in Phase 6.
- Seed is run-once. KV rate limiting is eventually consistent. Magic-link emails only print to the console until Resend is configured (Phase 5). Seed system user has no password and cannot log in.
- The local admin password was shared in chat. Use a different one in production.

## Next phase checklist
Phase 4: Public site (Today, Matrix, drawer, filters, feed, heatmap, rules, events), access control, watermark, view log. Details in docs/SPEC.md (Phase 4 and the public/access sections).
- First: re-run the NOT YET CONFIRMED browser checks above.
- Repositories to add: bookmarks, view_log, events (and subscriptions read side for entitlements). Keep the repository layer rule: only repositories/d1 touches D1.
- Public list engine: reuse the filter language in shared/lists.ts with a public variant of ListRepository (published only, access-aware). Do not expose admin fields.
- Access control: replace the non-staff branch of AttachmentService.canView with the entitlement check (active plan, free_delay_hours, open_archive_days, per-item access). Apply the same rule to post/note content endpoints so locked content never leaves the server.
- Public pages: Today, Matrix, post/note drawer, filters, feed, heatmap, public rules page (active evaluation rule + results with corrections shown beside the original), events.
- Watermark on screenshots shown to members, and view_log writing (privacy: IP hashed with IP_HASH_SALT).
- Keep the new admin screens working; add nav/route/permission for any new admin screen; audit every admin action.
- VERIFY: typecheck, `npm run build`, public pages for a logged-out visitor vs a member vs staff, locked content is not in the API response for a non-entitled visitor.
