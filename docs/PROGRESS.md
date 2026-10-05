# PROGRESS

## Status: Phase 2 complete / Phase 3 next (Results queue, advanced lists, users/plans/audit/revisions/media screens)

## Done (per phase)
- Phase 0: docs/SPEC.md and docs/PROGRESS.md created.
- Phase 1: scaffold (Vite + React + TS + Tailwind client, Hono Worker server, wrangler.jsonc with Workers Static Assets, SPA fallback, run_worker_first for /api/*, /files/*, /sitemap.xml, /robots.txt), migrations 0001 schema / 0002 indexes / 0003 triggers (21), auth (PBKDF2, session cookie, CSRF, KV rate limit, optional TOTP, member magic link), seed, login screens.
- Phase 2 (Admin core):
  - Settings registry (src/shared/settings.ts: Zod schema + default per key) + SettingsService + settings screen (all editable keys; active_evaluation_rule_version is read-only, changed on the Phase 3 rules screen).
  - Repositories (D1) + services + routes: markets, analysts, tags (CatalogService), posts (PostService), notes (NoteService), attachments (AttachmentService), revisions (read side), audit helper.
  - Admin shell: role-aware sidebar built from the permission map (components/admin/nav.ts), AdminLayout route guard, RequirePermission per screen.
  - Screens: Settings, Markets, Analysts, Tags, Posts list + speed tools (duplicate yesterday, full-day template, bulk create), Post editor (autosave, live sanitized markdown preview, draft/schedule/publish, locked-field UI, edit history), Notes list + Quick note, Note editor (linked-post auto-suggest), Screenshots panel (multi-upload, captions, per-image access, SHA-256 + upload time shown, locked state).
  - Authorized GET /files/:id (R2 is never public).
  - VERIFIED: typecheck and `npm run build` pass. Curl checks by the owner: 401 on /api/admin/* without a session, 404 JSON on unknown /files/:id.
  - NOT YET CONFIRMED in the owner's browser (re-run at the start of Phase 3): create/autosave/publish a post, upload a screenshot (appears Locked after publish), edit text after publish (appears in Edit history), refused edit of a locked field (API returns 409 code "locked"), Quick note, Note editor, analyst role check.

## File map
- docs/SPEC.md (full spec, change only on request), docs/PROGRESS.md (this file)
- package.json, tsconfig.json (client), tsconfig.server.json (server + scripts), vite.config.ts, tailwind.config.js, postcss.config.js
- wrangler.jsonc: Worker, assets, D1 tradesense-db, R2 tradesense-files (binding BUCKET), KV (placeholder IDs, local only)
- migrations/0001_schema.sql, 0002_indexes.sql, 0003_triggers.sql
- scripts/seed.ts, scripts/seed-admin.ts
- src/shared/: constants.ts (enums, upload limits), permissions.ts (THE permission map), schemas.ts (auth/market/analyst/tag Zod), settings.ts (settings registry), content.ts (post/note Zod schemas + DTO types: PostDto, NoteDto, AttachmentDto, PostDetail, NoteDetail, Paged, BatchResult...), attachments.ts (upload/update schemas, UploadResponse), types.ts (PublicUser, MarketDto, AnalystDto, TagDto, LookupsResponse)
- src/server/index.ts: app, middleware, mounting (/api/auth, /api/admin/settings|posts|notes|attachments, /api/admin catalog, /files)
- src/server/env.ts, middleware.ts (context, csrfGuard, requirePermission, securityHeaders)
- src/server/lib/: ids.ts, time.ts (nowIso, addDaysDate, weekStartOf, todayDate...), errors.ts, crypto.ts, totp.ts, ratelimit.ts, validate.ts (parseJson, parseQuery), email.ts, audit.ts (audit(c, action, entity, id, diff)), diff.ts (changedFields), dto.ts (toAttachmentDto, hides r2Key)
- src/server/repositories/types.ts: row shapes + interfaces (Users, Sessions, MagicLinks, Settings, Audit, Markets, Analysts, Tags, Posts, Notes, Revisions, Attachments)
- src/server/repositories/d1/: util.ts (toBool/fromBool, clampPage, buildSet), users, sessions, magicLinks, settings, audit, markets, analysts, tags, posts, notes, revisions (also revisionStatement for atomic batches), attachments, index.ts (createRepositories)
- src/server/services/: auth.ts, settings.ts, catalog.ts, posts.ts (PostService, Actor type), notes.ts (NoteService), attachments.ts (AttachmentService)
- src/server/routes/: auth.ts, settings.ts, catalog.ts (lookups, markets, analysts, tags), posts.ts, notes.ts, attachments.ts, files.ts
- src/client/lib/: api.ts (api, apiForm, ApiError, errorMessage, setCsrf), auth.tsx, admin.ts (useLookups, useRefreshLookups), dates.ts (UTC helpers, weekStartOf, fmtDateTime), labels.ts
- src/client/components/: Layout.tsx (wider container under /admin), ui.tsx (inputCls, btn*, PageHeader, Field, Notice, Badge), Markdown.tsx (sanitized), admin/{nav.ts, AdminLayout.tsx, badges.tsx, PostSpeedTools.tsx, QuickNote.tsx, AttachmentsPanel.tsx}
- src/client/pages/: Home, Login, LoginVerify, Admin.tsx (admin routes + dashboard), admin/{SettingsPage, MarketsPage, AnalystsPage, TagsPage, PostsPage, PostEditorPage, NotesPage, NoteEditorPage}.tsx

## Key decisions & conventions
- Names: Worker tradesense, D1 tradesense-db, R2 tradesense-files, brand TradeSense.
- IDs: TEXT ULID via newId(). Timestamps: ISO-8601 UTC TEXT via nowIso(). Dates: YYYY-MM-DD TEXT (UTC calendar day). Booleans: INTEGER 0/1.
- Row shapes camelCase in repository interfaces; snake_case only inside repositories/d1. Only repositories/d1 touches D1Database.
- Error format: { error: { code, message, details? } }. AppError helpers (badRequest, unauthorized, forbidden, notFound, conflict, tooMany); locked edits use new AppError(409, "locked", msg, { fields }); upload errors use 413 too_large, 415 unsupported_type.
- Hono 4.6.14 (own ErrorStatus type in errors.ts). Aliases @shared/*, @client/*.
- Auth/CSRF as in Phase 1 (cookie ts_session, header x-csrf-token; apiForm adds the header for multipart).
- Staff pages: every /api/admin/* route needs admin:access (middleware in index.ts); finer permission per route with requirePermission. Permission map (src/shared/permissions.ts) was NOT changed in Phase 2. Permissions used: settings:manage, market:manage, analyst:manage, tag:manage, post:create|edit|publish, note:create|edit|publish, attachment:manage.
- Settings: stored values override defaults; invalid stored values fall back to defaults. PUT only changed keys; audit diff = from/to.
- Posts: weekly posts are dated by their Monday (postDate = weekStartDate). One daily per market per day, one weekly per market per week (unique indexes; service returns 409 conflict with details.existingId). Default validity window: daily T00:00:00.000Z to T23:59:59.000Z of the day; weekly Monday 00:00 to Friday 23:59:59 (same as the seed). Posts always start as draft.
- Publish rules (PostService.assertComplete): title required, summary or body required, no "[TODO]" text left in any text field (template shells carry [TODO]), validity window present. Schedule needs a future time and the same completeness. Delete: only draft/scheduled, not when notes are linked, not when screenshots exist.
- Locks after publish (service stricter than triggers): posts: type, marketId, postDate, bias, confidence, validFrom, validUntil, publishAt. Notes: marketId, killzone, status, linkedPostId, noteDate, publishAt. Violations -> 409 "locked". Text-level edits after publish are allowed (posts: title, summary, bodyMd, keyDriversMd, riskEventsMd, invalidationMd, sentiment, access, analystId, tags; notes: title, noteMd, confidence, access, analystId, tags) and each saved edit writes one post_revisions row (entity_type post|note, old_json/new_json hold only changed fields; tagIds included) in the SAME D1 batch as the update (repo.update(id, patch, revision)).
- Roles: analyst can create, and edit/delete only their OWN DRAFTS (posts, notes, their screenshots); cannot publish/schedule. Editors/admins can do everything allowed by the permission map.
- Notes: must link to a post of the same market; publish requires the linked post to be published; quick entry (POST /notes/quick) auto-picks the linked post (published daily of that date, else weekly of that week) and can create already-published in one call.
- Attachments: multipart POST /api/admin/attachments (ownerType post|note, ownerId, files[], captions[], optional kind/access/caption); max 10 files, 10 MB each; type decided by file signature (png/jpeg/webp/gif); SHA-256 computed server-side and passed to R2 as checksum; R2 key attachments/{ownerType}/{ownerId}/{id}.{ext}; same image (same SHA) on same owner is skipped. Per-image access change needs attachment:manage. Adding screenshots to a PUBLISHED post/note needs attachment:manage and the row is auto-locked by trigger. Locked screenshots cannot be deleted (409), caption stays editable. Default access = settings.default_access_screenshot.
- GET /files/:id: staff (admin:access) can view everything; everyone else only 'public' (or inherit->public) screenshots of PUBLISHED owners; otherwise 404 (same as missing). Phase 4 must replace the non-staff branch in AttachmentService.canView with the entitlement check (plan, free delay, open archive). Response headers: private must-revalidate, ETag = sha256, nosniff, CSP sandbox.
- Catalog: markets and analysts are never deleted (deactivate). A tag in use cannot be deleted (rename instead).
- Audit actions written: settings.update; market.create|update; analyst.create|update; tag.create|rename|delete; post.create (diff.via = duplicate|template|bulk when applicable), post.update, post.edit_published, post.publish, post.schedule, post.unschedule, post.delete; note.create, note.create_publish (quick), note.update, note.edit_published, note.publish, note.schedule, note.unschedule, note.delete; attachment.upload|update|delete.
- Editors (client): autosave 2 s after the last change for draft/scheduled; published uses an explicit "Save changes" button. Dirty detection compares normalized values (trimmed title, weekly Monday date) so autosave cannot loop. Only changed fields are sent.
- Bias/status are always shown with icon + word (badges.tsx), never colour alone.
- Windows Git Bash has no python: deliver every file as a full heredoc script, never python/sed edits.
- HOW TO ADD A NEW ENDPOINT: (1) Zod schema in src/shared/ (content.ts / schemas.ts / a new file) + DTO type; (2) repository interface in repositories/types.ts + D1 implementation + register in d1/index.ts; (3) service in src/server/services/ for business rules and lock rules (Actor = {id, role}); (4) route file in src/server/routes/ with requirePermission("x:y"), parseJson / parseQuery, and audit(c, action, entity, id, diff) after every admin change; (5) mount in src/server/index.ts (static paths before /:id).
- HOW TO ADD A NEW SCREEN: page in src/client/pages/admin/, nav item in components/admin/nav.ts, <Route> in pages/Admin.tsx wrapped in <RequirePermission>, data via TanStack Query + api() (apiForm for uploads), shared look from components/ui.tsx, dropdown data from useLookups().

## Commands
- Dev: `npm run dev:api` (wrangler on :8787, serves the built client: run `npm run build` first) and `npm run dev:web` (Vite on :5173, proxies /api and /files). Without a build, http://127.0.0.1:8787 shows the previous build.
- `npm run migrate:local` | `npm run seed` (once per fresh DB) | `npm run seed:admin` (env ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD, or prompts)
- `npm run typecheck` | `npm run build` (verified) | `npm run deploy` (Phase 6)
- Reset local DB: stop wrangler, `rm -rf .wrangler/state && npm run migrate:local`, then `npm run seed` and `npm run seed:admin`. This also empties local R2 (screenshots).

## Env vars / secrets list (names only)
APP_NAME, APP_URL, SESSION_SECRET, IP_HASH_SALT, RESEND_API_KEY, RESEND_FROM, NOWPAYMENTS_API_KEY, NOWPAYMENTS_IPN_SECRET.
- Local (.dev.vars): all set; RESEND_API_KEY, NOWPAYMENTS_API_KEY, NOWPAYMENTS_IPN_SECRET empty.
- Production: none set yet (Phase 6, via `npx wrangler secret put NAME`).

## Known issues / TODO
- Phase 2 browser checks for Parts 7-12 are listed under Done as NOT YET CONFIRMED. Re-run them first.
- Scheduled posts/notes (status scheduled + publishAt) are NOT flipped to published automatically yet: the Cron trigger is Phase 5. Public pages (Phase 4) must treat only status published as visible.
- Attachments with ownerType "result" are not supported yet (AttachmentService.ownerInfo returns null, assertOwnerWritable needs attachment:manage). Add in Phase 3 with the results repository.
- free_delay_hours and open_archive_days are stored and editable but not applied anywhere yet (Phase 4).
- Repositories still missing: results, evaluation rules, plans, payments, subscriptions, bookmarks, view_log, saved_views, events. RevisionRepository has no cross-entity list yet; AttachmentRepository has no global list (needed for the Phase 3 revisions and media screens).
- Deleting posts/notes with screenshots is refused (remove screenshots first, which is impossible once locked; drafts only so this is fine).
- Production note: client bundle is ~414 KB (123 KB gzip), acceptable.
- wrangler 4.20.0 pinned (4.147 available). Revisit in Phase 6. npm audit: dev-tooling vulnerabilities only.
- Seed is run-once. KV rate limiting is eventually consistent. Magic-link emails only print to the console until Resend is configured (Phase 5). Seed system user system@tradesense.local has no password and cannot log in.
- The local admin password was shared in chat. Use a different one in production.

## Next phase checklist
Phase 3: Results queue, advanced lists (filters, column chooser, saved views, bulk, CSV), users/plans/audit/revisions/media screens. Details in docs/SPEC.md.
- First: re-run the Phase 2 browser checks listed above.
- Results: repository + service + routes + screen for the results queue (published posts past valid_until without a result), result entry with evaluation rule version, corrections (append-only), result screenshots (extend AttachmentService for ownerType result), audit every action.
- Evaluation rules: repository + screen; changing the active rule version updates settings.active_evaluation_rule_version.
- Advanced lists for posts, notes, results: filters, column chooser, saved views (saved_views repository), bulk actions, CSV export. PostFilter/NoteFilter in repositories/types.ts are the base to extend.
- Users screen (create staff users with createUserSchema, change role, reset), plans screen, audit log screen (AuditRepository.list exists), revisions screen (add RevisionRepository.list across entities), media screen (add AttachmentRepository.list).
- Keep all lock rules in services + triggers; audit every admin action; nav + route + permission for each new screen.
- VERIFY: typecheck, `npm run build`, enter a result for an expired published post and see it become immutable, create a correction, export a CSV, save and reuse a view.
