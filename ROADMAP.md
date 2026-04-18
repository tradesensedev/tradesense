# TradeSense — Development Roadmap

**Project:** TradeSense — Make Sense of The Market
**Document Version:** 1.0
**Strategy:** Free-first, feature-sliced, launch-as-soon-as-first-product-ready
**Starting Point:** You have just created a GitHub repo and opened the empty folder in VS Code. Nothing else is set up.

---

## How to Use This Roadmap

1. **Read in order.** Every section depends on previous sections. Do not skip.
2. **Check off each micro-task** (`[ ]` → `[x]`) as you complete it. Treat this file as your single source of truth.
3. **Micro-numbering:** `1.1.1`, `1.1.2` are individual atomic tasks. Each should take between 2 minutes and 2 hours. If something feels bigger than that, break it down further before starting.
4. **Feature-slice rule (non-negotiable):** You never build a feature without also shipping its admin panel controls in the same slice. Never. This is the #1 reason the original sequence failed.
5. **Free-first rule:** Never pay for anything until (a) you hit a free-tier ceiling that blocks development, or (b) you have paying users generating revenue. Every paid upgrade has a trigger condition in Phase 15.
6. **No code in this document.** This is architecture and sequencing only. Code goes in the repo.

---

## Table of Contents

0. [Roadmap Philosophy & Strategy](#0-roadmap-philosophy--strategy)
1. [Local Machine Prerequisites](#1-local-machine-prerequisites)
2. [Cloud Accounts — Free Tier Setup](#2-cloud-accounts--free-tier-setup)
3. [GitHub Repository Setup](#3-github-repository-setup)
4. [Monorepo Initialization](#4-monorepo-initialization)
5. [Complete Target Folder Structure](#5-complete-target-folder-structure)
6. [Environment Variables — Master Reference](#6-environment-variables--master-reference)
7. [Phase 1 — Foundation Layer (Non-Feature Infrastructure)](#7-phase-1--foundation-layer-non-feature-infrastructure)
8. [Phase 2 — Public Static Pages & Layout Shell](#8-phase-2--public-static-pages--layout-shell)
9. [Phase 3 — Auth System (User + Admin)](#9-phase-3--auth-system-user--admin)
10. [Feature Slice Blueprint (Template for Every Feature)](#10-feature-slice-blueprint-template-for-every-feature)
11. [Phase 4 — First Feature: Daily Fundamental Insight (MVP)](#11-phase-4--first-feature-daily-fundamental-insight-mvp)
12. [Phase 5 — Launch-Ready Production Hardening](#12-phase-5--launch-ready-production-hardening)
13. [Phase 6 — Production Deployment & Public Launch](#13-phase-6--production-deployment--public-launch)
14. [Phase 7+ — Incremental Feature Expansion](#14-phase-7--incremental-feature-expansion)
15. [Scale-Stage Upgrade Path (Free → Paid)](#15-scale-stage-upgrade-path-free--paid)
16. [Ongoing Cadence (Daily / Weekly / Monthly)](#16-ongoing-cadence-daily--weekly--monthly)

Appendix A — [Complete Folder Structure (Expanded)](#appendix-a--complete-folder-structure-expanded)
Appendix B — [Environment Variables Complete Reference](#appendix-b--environment-variables-complete-reference)
Appendix C — [Cloud Services Checklist](#appendix-c--cloud-services-checklist)
Appendix D — [Feature Slice Checklist Template](#appendix-d--feature-slice-checklist-template)

---

## 0. Roadmap Philosophy & Strategy

### 0.1 The Three Core Principles

**0.1.1** — **Admin Panel is a first-class citizen, not an afterthought.** Every user-facing feature ships simultaneously with its admin controls. You never merge a feature whose content/config is not editable from the admin panel. This is enforced via the Feature Slice Blueprint (Section 10).

**0.1.2** — **Launch fast, iterate forever.** The goal is to launch a public URL as soon as ONE end-to-end feature works (Daily Fundamental Insight). Everything else becomes post-launch iteration. Scope creep before launch kills projects.

**0.1.3** — **Free-first, upgrade-on-trigger.** Every third-party service starts on its free tier. An explicit trigger condition (users, revenue, quota breach) must be met before paying. See Section 15.

### 0.2 Development Order Rationale

The original README sequence (Foundation → AI Core → Content → Access → Growth → Scale → Admin) would require ~6 months of work before anything is user-facing. The corrected sequence ships a live product in ~6–10 weeks:

```
Phase 0  → Local setup (Week 1, Day 1–2)
Phase 1  → Cloud accounts + env (Day 2)
Phase 2  → Monorepo + tooling (Day 3)
Phase 3  → Foundation layer (Week 1, Day 3–7)
Phase 4  → Static pages + layout (Week 2)
Phase 5  → Auth system (user + admin) (Week 3)
Phase 6  → First feature end-to-end INCLUDING admin panel (Week 4–6)
Phase 7  → Production hardening (Week 7)
Phase 8  → LAUNCH (Week 8)
Phase 9+ → Feature-by-feature expansion, each including its admin slice
```

### 0.3 The Launch MVP Definition

The site can launch publicly when ALL of the following are true:

- [ ] Landing page explains the product clearly
- [ ] User can register, log in, log out, reset password
- [ ] Admin can log in, edit prompts, review AI drafts, publish insights
- [ ] ONE feature (Daily Fundamental Insight) works end-to-end
- [ ] All legal pages exist (Terms, Privacy, Disclaimer, Cookie Policy, Refund Policy)
- [ ] Contact form works and emails the founder
- [ ] 404 and 500 pages are branded
- [ ] Sitemap.xml and robots.txt exist
- [ ] Error tracking (Sentry) and analytics (PostHog) are wired up
- [ ] Custom domain with SSL is live

Nothing else. No calendar, no COT, no speech decoder, no payments, no referrals. Those come post-launch.

---

## 1. Local Machine Prerequisites

Start here if your machine is a blank slate. Skip any sub-item you already have.

### 1.1 Operating System & Hardware

- [ ] **1.1.1** — Confirm OS: Windows 10/11, macOS 12+, or Ubuntu 22.04+. Anything older → upgrade first.
- [ ] **1.1.2** — Confirm RAM: 8 GB minimum, 16 GB recommended (Docker + Next.js + VS Code will eat 6–8 GB).
- [ ] **1.1.3** — Confirm free disk space: at least 20 GB free (node_modules alone can hit 2–3 GB).
- [ ] **1.1.4** — (Windows only) Enable WSL2 with Ubuntu. All dev should happen inside WSL2, not native Windows.

### 1.2 Core Software Installation (install in this order)

- [ ] **1.2.1** — Install **Git** (latest version). Verify: `git --version`.
- [ ] **1.2.2** — Install **nvm** (Node Version Manager). Do NOT install Node directly from nodejs.org — you will need multiple versions over time.
- [ ] **1.2.3** — Use nvm to install **Node.js 20 LTS**: `nvm install 20 && nvm use 20`. Verify: `node --version`.
- [ ] **1.2.4** — Enable **Corepack** (comes with Node): `corepack enable`.
- [ ] **1.2.5** — Install **pnpm** via Corepack: `corepack prepare pnpm@latest --activate`. Verify: `pnpm --version`. (Do NOT use npm or yarn for this project.)
- [ ] **1.2.6** — Install **Docker Desktop** (Windows/Mac) or Docker Engine + Compose (Linux). Verify: `docker --version` and `docker compose version`.
- [ ] **1.2.7** — Install **PostgreSQL client tools** (`psql` only, not the server — you'll use Supabase/Docker for the server). On Ubuntu: `sudo apt install postgresql-client`. On Mac: `brew install libpq`.
- [ ] **1.2.8** — Install **Redis client tools** (`redis-cli` only). Optional but useful.
- [ ] **1.2.9** — Install **GitHub CLI** (`gh`). Verify: `gh --version`. Log in with `gh auth login`.

### 1.3 VS Code Setup

- [ ] **1.3.1** — Install **Visual Studio Code** (not Visual Studio — that's a different product).
- [ ] **1.3.2** — Install these extensions (one at a time):
  - [ ] ESLint (`dbaeumer.vscode-eslint`)
  - [ ] Prettier (`esbenp.prettier-vscode`)
  - [ ] Tailwind CSS IntelliSense (`bradlc.vscode-tailwindcss`)
  - [ ] Prisma (`Prisma.prisma`) OR Drizzle ORM snippets (depending on final ORM choice — Section 7.3)
  - [ ] GitLens (`eamodio.gitlens`)
  - [ ] GitHub Pull Requests (`GitHub.vscode-pull-request-github`)
  - [ ] Error Lens (`usernamehw.errorlens`)
  - [ ] Pretty TypeScript Errors (`yoavbls.pretty-ts-errors`)
  - [ ] Code Spell Checker (`streetsidesoftware.code-spell-checker`)
  - [ ] Docker (`ms-azuretools.vscode-docker`)
  - [ ] DotENV (`mikestead.dotenv`)
  - [ ] MDX (`unifiedjs.vscode-mdx`)
  - [ ] i18n Ally (`lokalise.i18n-ally`)
- [ ] **1.3.3** — (Optional but recommended) Install **Cursor** or keep VS Code + GitHub Copilot / Claude Code as AI pair programmer.
- [ ] **1.3.4** — Configure VS Code `settings.json` (workspace-level — commit this):
  - Format on save: enabled
  - Default formatter: Prettier
  - ESLint: autofix on save
  - Tailwind class sorting enabled
  - TypeScript: "Use workspace version" enabled
  (Exact values will be generated in Section 4.8.)

### 1.4 Git Configuration

- [ ] **1.4.1** — Set Git identity: `git config --global user.name "..."` and `git config --global user.email "..."`.
- [ ] **1.4.2** — Set default branch to `main`: `git config --global init.defaultBranch main`.
- [ ] **1.4.3** — Enable rebase on pull: `git config --global pull.rebase true`.
- [ ] **1.4.4** — Generate SSH key (if not already): `ssh-keygen -t ed25519 -C "your@email"`.
- [ ] **1.4.5** — Add SSH key to GitHub account (`gh ssh-key add ~/.ssh/id_ed25519.pub`).
- [ ] **1.4.6** — Configure GPG / commit signing (optional but recommended for trust).

### 1.5 Verify Installation

- [ ] **1.5.1** — Run this verification block and confirm all versions:
  ```
  git --version          → 2.40+
  node --version         → v20.x
  pnpm --version         → 9.x+
  docker --version       → 24.x+
  docker compose version → v2.x+
  gh --version           → 2.x+
  code --version         → latest
  ```
- [ ] **1.5.2** — Test Docker with a dummy container: `docker run --rm hello-world`. Confirm output.
- [ ] **1.5.3** — Test GitHub CLI: `gh repo list`. Should not error.

---

## 2. Cloud Accounts — Free Tier Setup

Create accounts in this order. Day-1 accounts are needed before writing any code. Others can be deferred until their corresponding phase.

### 2.1 Day-1 Essential Accounts

- [ ] **2.1.1** — **GitHub** — Free. You already have this since the repo exists.
- [ ] **2.1.2** — **Vercel** — Free Hobby tier. Sign up with GitHub SSO. Used for Next.js deployment.
- [ ] **2.1.3** — **Supabase** — Free tier (500 MB DB, 50K MAU auth, 1 GB storage). Used for PostgreSQL database + storage.
- [ ] **2.1.4** — **Upstash** — Free tier (10K Redis commands/day, 256 MB). Used for Redis cache + BullMQ queue.
- [ ] **2.1.5** — **Cloudflare** — Free tier. Used for DNS, CDN, R2 storage (10 GB free), and later Workers.
- [ ] **2.1.6** — **Google Cloud Console** — Free. Needed for Google OAuth credentials (only; nothing else from GCP yet).
- [ ] **2.1.7** — **Resend** — Free tier (3K emails/month, 100/day). Used for transactional email (welcome, password reset, etc.).
- [ ] **2.1.8** — **Sentry** — Free Developer tier (5K errors/month). Used for error tracking.
- [ ] **2.1.9** — **PostHog** — Free Cloud tier (1M events/month). Used for product analytics and feature flags.

### 2.2 Phase-Aligned Accounts (create when you reach that phase)

- [ ] **2.2.1** — **Google AI Studio (Gemini API key)** — Free generous tier. Create before Phase 4 (first AI feature). Start here, NOT OpenAI, because Gemini Flash is the cheapest model.
- [ ] **2.2.2** — **Cloudflare R2** — Inside Cloudflare account. Create a bucket before Phase 4.
- [ ] **2.2.3** — **Logtail / Better Stack** — Free tier (1 GB log ingestion). Create before Phase 5 (production hardening).
- [ ] **2.2.4** — **Uptime Robot** — Free tier (50 monitors, 5-min interval). Create before Phase 6 (launch).
- [ ] **2.2.5** — **Namecheap / Cloudflare Registrar** — for buying the domain. Create before Phase 6. (Cloudflare Registrar is cheaper and at-cost with no markup — prefer this.)

### 2.3 Deferred Accounts (post-launch)

- [ ] **2.3.1** — **Stripe** — create when Phase 14.4 starts (payment system).
- [ ] **2.3.2** — **OpenAI / Anthropic / Perplexity / Grok** — when you outgrow Gemini Flash (Phase 14.14).
- [ ] **2.3.3** — **PayPal, bKash, Razorpay, etc.** — when Phase 14.15 starts.
- [ ] **2.3.4** — **AWS (SES, R2 alternatives, ECS)** — only at scale (Stage 3 in Section 15).

### 2.4 Account Security Hygiene

- [ ] **2.4.1** — Enable 2FA on EVERY account. No exceptions. Use an authenticator app (not SMS).
- [ ] **2.4.2** — Use a password manager (Bitwarden free is fine). Generate unique 20+ char passwords per service.
- [ ] **2.4.3** — Save all recovery codes in the password manager.
- [ ] **2.4.4** — Create a dedicated project email (e.g., `founder@yourdomain.com` once domain is bought; meanwhile use `yourname+tradesense@gmail.com`).

---

## 3. GitHub Repository Setup

You already have the repo created. Now configure it properly.

### 3.1 Repository Configuration

- [ ] **3.1.1** — Set repository to **Private** until launch. Flip to Public (or keep private) post-launch.
- [ ] **3.1.2** — Add repo description and tags.
- [ ] **3.1.3** — Disable Wiki (clutter).
- [ ] **3.1.4** — Disable Projects (you'll use a different tool — Linear free / GitHub Projects later).
- [ ] **3.1.5** — Enable Issues with templates (set up in 3.4).
- [ ] **3.1.6** — Enable Discussions (useful once users exist).

### 3.2 Branch Strategy

- [ ] **3.2.1** — Default branch: `main` (production).
- [ ] **3.2.2** — Long-lived branch: `develop` (integration).
- [ ] **3.2.3** — Short-lived feature branches: `feature/<slice-name>` (e.g., `feature/insights-mvp`).
- [ ] **3.2.4** — Hotfix branches: `hotfix/<issue-id>`.
- [ ] **3.2.5** — Release branches: `release/v0.1.0`, `release/v0.2.0` (cut before each production deploy).

### 3.3 Branch Protection

- [ ] **3.3.1** — Protect `main`: require PR review (1 approval), require status checks to pass, require branch up-to-date before merge, disallow force-push, disallow direct commits.
- [ ] **3.3.2** — Protect `develop`: require PR, require status checks (relaxed: no review requirement since you're solo).
- [ ] **3.3.3** — Signed commits required on `main` (optional but recommended).

### 3.4 Initial Repository Files

Before any code, create these governance files in the root:

- [ ] **3.4.1** — `README.md` — Short project description + how to run (full spec stays in the existing README which you'll rename to `SPEC.md`).
- [ ] **3.4.2** — `SPEC.md` — your existing long README goes here (product/architecture spec).
- [ ] **3.4.3** — `roadmap.md` — this file. Keep it living; check off tasks as you complete them.
- [ ] **3.4.4** — `CONTRIBUTING.md` — code style, branch strategy, commit convention.
- [ ] **3.4.5** — `CODE_OF_CONDUCT.md` — standard Contributor Covenant.
- [ ] **3.4.6** — `LICENSE` — MIT for now; change to proprietary before launch if needed.
- [ ] **3.4.7** — `CHANGELOG.md` — starts empty; update on every release.
- [ ] **3.4.8** — `SECURITY.md` — vulnerability reporting policy.
- [ ] **3.4.9** — `.gitignore` — Node/Next.js/IDE/env template. Use GitHub's Node template as base.
- [ ] **3.4.10** — `.gitattributes` — line endings (LF everywhere), binary file handling.
- [ ] **3.4.11** — `.editorconfig` — indent, charset, line endings across editors.
- [ ] **3.4.12** — `.nvmrc` — pin Node version (`20`).
- [ ] **3.4.13** — `.npmrc` — pnpm settings (e.g., `engine-strict=true`, `auto-install-peers=true`).
- [ ] **3.4.14** — `.github/ISSUE_TEMPLATE/bug_report.md`
- [ ] **3.4.15** — `.github/ISSUE_TEMPLATE/feature_request.md`
- [ ] **3.4.16** — `.github/PULL_REQUEST_TEMPLATE.md`
- [ ] **3.4.17** — `.github/CODEOWNERS` — currently `* @your-github-username`.
- [ ] **3.4.18** — `.github/dependabot.yml` — weekly dependency updates for npm + github-actions.
- [ ] **3.4.19** — `.github/workflows/ci.yml` — empty placeholder (populated in Section 13.7).

### 3.5 GitHub Secrets Management

- [ ] **3.5.1** — Navigate to Repository Settings → Secrets and variables → Actions.
- [ ] **3.5.2** — Do NOT add secrets yet. They will be added progressively as each service is integrated.
- [ ] **3.5.3** — Create two **Environments**: `staging` and `production`. Environment-scoped secrets are safer than repo-wide secrets.
- [ ] **3.5.4** — Enable "Required reviewers" on `production` environment (yourself counts) — prevents accidental prod deploys.

---

## 4. Monorepo Initialization

This is where you actually start creating files locally.

### 4.1 Package Manager Setup

- [ ] **4.1.1** — In the repo root, create `package.json` with name `tradesense`, private `true`, engines (node `>=20`, pnpm `>=9`), and packageManager field.
- [ ] **4.1.2** — Create `pnpm-workspace.yaml` declaring workspaces: `apps/*`, `packages/*`, `services/*`.
- [ ] **4.1.3** — Run `pnpm install` (creates lockfile).

### 4.2 Turborepo Setup

- [ ] **4.2.1** — Add Turborepo as a dev dependency at the root: `pnpm add -D -w turbo`.
- [ ] **4.2.2** — Create `turbo.json` with pipelines: `build`, `dev`, `lint`, `typecheck`, `test`, `clean`. Configure cached vs non-cached outputs.
- [ ] **4.2.3** — Add root scripts in `package.json`: `dev`, `build`, `lint`, `typecheck`, `test`, `clean`, `format`.

### 4.3 Initial Workspace Skeleton

Create empty folder structure (no code yet, just directories with `.gitkeep`):

- [ ] **4.3.1** — Create `apps/` (will contain `web` and `api` in later phases).
- [ ] **4.3.2** — Create `packages/` — shared libraries.
- [ ] **4.3.3** — Create `services/` — background workers (scheduler, ai-worker).
- [ ] **4.3.4** — Create `infrastructure/` — docker, deployment scripts, IaC.
- [ ] **4.3.5** — Create `docs/` — project documentation (beyond SPEC.md).
- [ ] **4.3.6** — Create `scripts/` — one-off Node/shell scripts (DB seed, data migration).

### 4.4 Shared TypeScript Configuration Package

- [ ] **4.4.1** — Create `packages/tsconfig/` with `base.json`, `nextjs.json`, `node.json`, `react-library.json`.
- [ ] **4.4.2** — Each app later extends from these. Avoid per-app duplicated TS config.

### 4.5 Shared ESLint Configuration Package

- [ ] **4.5.1** — Create `packages/eslint-config/` with `base.js`, `next.js`, `node.js`.
- [ ] **4.5.2** — Include: TypeScript rules, import ordering, unused imports, Tailwind plugin, accessibility (jsx-a11y).
- [ ] **4.5.3** — Turn on strict rules. Any rule you weaken must be justified in a comment.

### 4.6 Prettier Setup

- [ ] **4.6.1** — Create `.prettierrc.json` at root with: `semi: true`, `singleQuote: true`, `printWidth: 100`, `trailingComma: all`, `tabWidth: 2`, plugin for Tailwind class sorting.
- [ ] **4.6.2** — Create `.prettierignore` (ignore `node_modules`, `.next`, `dist`, `pnpm-lock.yaml`, etc.).

### 4.7 Git Hooks — Husky + lint-staged + commitlint

- [ ] **4.7.1** — Install Husky: `pnpm add -D -w husky && pnpm exec husky init`.
- [ ] **4.7.2** — Install lint-staged: `pnpm add -D -w lint-staged`.
- [ ] **4.7.3** — Configure lint-staged in root `package.json`: run ESLint + Prettier on staged `*.{ts,tsx,js,jsx,json,md}`.
- [ ] **4.7.4** — Create pre-commit hook: runs lint-staged.
- [ ] **4.7.5** — Install commitlint + conventional config: `pnpm add -D -w @commitlint/cli @commitlint/config-conventional`.
- [ ] **4.7.6** — Create `commitlint.config.js`.
- [ ] **4.7.7** — Create `commit-msg` hook: runs commitlint.
- [ ] **4.7.8** — Install commitizen (optional): `pnpm add -D -w commitizen cz-conventional-changelog` for guided commit messages.

### 4.8 Editor Config — VS Code Workspace

- [ ] **4.8.1** — Create `.vscode/settings.json` (committed): format on save, Prettier default formatter, TypeScript workspace version, ESLint autofix, Tailwind custom class regexes.
- [ ] **4.8.2** — Create `.vscode/extensions.json` (committed): list of recommended extensions from Section 1.3.2 so teammates auto-see them.
- [ ] **4.8.3** — Create `.vscode/launch.json` (committed): debug configs for Next.js and the API (populated in Phase 1).

### 4.9 First Commit

- [ ] **4.9.1** — `git add -A && git commit -m "chore: initialize monorepo scaffolding"`.
- [ ] **4.9.2** — Push to `main` — this is still setup, no protected rules triggered yet.
- [ ] **4.9.3** — Create `develop` branch off `main` and push.

---

## 5. Complete Target Folder Structure

This is the final target. You won't create everything at once — each phase creates its part of it. But knowing the whole map now prevents restructuring later.

```
tradesense/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── workflows/
│   │   ├── ci.yml                         # lint, typecheck, test on every PR
│   │   ├── deploy-staging.yml             # auto-deploy develop → staging
│   │   ├── deploy-production.yml          # manual trigger from main
│   │   ├── db-migrate.yml                 # run migrations on deploy
│   │   └── security-scan.yml              # weekly dependency audit
│   ├── CODEOWNERS
│   ├── dependabot.yml
│   └── PULL_REQUEST_TEMPLATE.md
│
├── .vscode/
│   ├── settings.json
│   ├── extensions.json
│   └── launch.json
│
├── .husky/
│   ├── pre-commit
│   └── commit-msg
│
├── apps/
│   ├── web/                               # Next.js 14 App Router — public site + admin panel
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (marketing)/           # Route group — public marketing pages (no auth)
│   │   │   │   │   ├── layout.tsx         # Marketing layout (header + footer, no app chrome)
│   │   │   │   │   ├── page.tsx           # Landing page
│   │   │   │   │   ├── about/page.tsx
│   │   │   │   │   ├── contact/page.tsx
│   │   │   │   │   ├── pricing/page.tsx   # (deferred until payments exist)
│   │   │   │   │   ├── faq/page.tsx
│   │   │   │   │   └── blog/              # SEO blog (future)
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── [slug]/page.tsx
│   │   │   │   │
│   │   │   │   ├── (legal)/               # Route group — legal pages
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── terms/page.tsx
│   │   │   │   │   ├── privacy/page.tsx
│   │   │   │   │   ├── disclaimer/page.tsx
│   │   │   │   │   ├── cookie-policy/page.tsx
│   │   │   │   │   ├── refund-policy/page.tsx
│   │   │   │   │   └── acceptable-use/page.tsx
│   │   │   │   │
│   │   │   │   ├── (auth)/                # Route group — auth pages
│   │   │   │   │   ├── layout.tsx         # Minimal centered layout
│   │   │   │   │   ├── login/page.tsx
│   │   │   │   │   ├── register/page.tsx
│   │   │   │   │   ├── forgot-password/page.tsx
│   │   │   │   │   ├── reset-password/page.tsx
│   │   │   │   │   ├── verify-email/page.tsx
│   │   │   │   │   ├── magic-link/page.tsx
│   │   │   │   │   └── logout/page.tsx
│   │   │   │   │
│   │   │   │   ├── (app)/                 # Route group — authenticated user app
│   │   │   │   │   ├── layout.tsx         # App shell (sidebar/bottomnav)
│   │   │   │   │   ├── dashboard/page.tsx
│   │   │   │   │   ├── insights/
│   │   │   │   │   │   ├── page.tsx       # List
│   │   │   │   │   │   └── [slug]/page.tsx
│   │   │   │   │   ├── calendar/page.tsx  # (Phase 14.1)
│   │   │   │   │   ├── cot/page.tsx       # (Phase 14.2)
│   │   │   │   │   ├── news/page.tsx      # (Phase 14.3)
│   │   │   │   │   ├── speech-decoder/page.tsx  # (Phase 14.12)
│   │   │   │   │   ├── accuracy/page.tsx  # (Phase 14.8)
│   │   │   │   │   ├── referrals/page.tsx # (Phase 14.6)
│   │   │   │   │   ├── tasks/page.tsx     # (Phase 14.7)
│   │   │   │   │   ├── notifications/page.tsx
│   │   │   │   │   └── account/
│   │   │   │   │       ├── page.tsx       # Profile
│   │   │   │   │       ├── settings/page.tsx
│   │   │   │   │       ├── security/page.tsx
│   │   │   │   │       ├── billing/page.tsx   # (Phase 14.4)
│   │   │   │   │       ├── language/page.tsx
│   │   │   │   │       └── delete/page.tsx
│   │   │   │   │
│   │   │   │   ├── admin/                 # Admin panel — separate auth, separate layout
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   ├── login/page.tsx     # Admin login (separate from user)
│   │   │   │   │   ├── page.tsx           # Admin home (stats overview)
│   │   │   │   │   ├── content/
│   │   │   │   │   │   ├── insights/
│   │   │   │   │   │   │   ├── page.tsx   # List
│   │   │   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   │   │   ├── drafts/page.tsx
│   │   │   │   │   │   │   ├── scheduled/page.tsx
│   │   │   │   │   │   │   ├── published/page.tsx
│   │   │   │   │   │   │   ├── archived/page.tsx
│   │   │   │   │   │   │   └── [id]/
│   │   │   │   │   │   │       ├── page.tsx       # View
│   │   │   │   │   │   │       ├── edit/page.tsx
│   │   │   │   │   │   │       └── history/page.tsx
│   │   │   │   │   │   ├── calendar/      # (Phase 14.1)
│   │   │   │   │   │   ├── cot/           # (Phase 14.2)
│   │   │   │   │   │   ├── news/          # (Phase 14.3)
│   │   │   │   │   │   ├── speech-events/ # (Phase 14.12)
│   │   │   │   │   │   └── legal-pages/   # CMS for /legal/* pages
│   │   │   │   │   │       ├── page.tsx
│   │   │   │   │   │       └── [slug]/edit/page.tsx
│   │   │   │   │   │
│   │   │   │   │   ├── ai/
│   │   │   │   │   │   ├── prompts/
│   │   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   │   ├── new/page.tsx
│   │   │   │   │   │   │   └── [id]/
│   │   │   │   │   │   │       ├── edit/page.tsx
│   │   │   │   │   │   │       ├── test/page.tsx      # Test prompt w/ live data
│   │   │   │   │   │   │       └── versions/page.tsx
│   │   │   │   │   │   ├── models/
│   │   │   │   │   │   │   └── page.tsx   # Enable/disable AI models
│   │   │   │   │   │   ├── routing/
│   │   │   │   │   │   │   └── page.tsx   # Task → model mapping
│   │   │   │   │   │   ├── chains/        # Prompt chains
│   │   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   │   └── [id]/edit/page.tsx
│   │   │   │   │   │   ├── cost-caps/page.tsx
│   │   │   │   │   │   └── usage/page.tsx # Cost + token usage dashboard
│   │   │   │   │   │
│   │   │   │   │   ├── users/
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── [id]/
│   │   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   │   ├── edit/page.tsx
│   │   │   │   │   │   │   ├── grant/page.tsx    # Manual access grant
│   │   │   │   │   │   │   └── ban/page.tsx
│   │   │   │   │   │   ├── segments/page.tsx
│   │   │   │   │   │   └── exports/page.tsx
│   │   │   │   │   │
│   │   │   │   │   ├── access-control/
│   │   │   │   │   │   ├── page.tsx               # Overview
│   │   │   │   │   │   ├── tiers/page.tsx         # Free/Premium definitions
│   │   │   │   │   │   ├── lock-rules/page.tsx    # Scroll depth, time, etc. triggers
│   │   │   │   │   │   ├── preview-rules/page.tsx # preview_percentage defaults
│   │   │   │   │   │   └── unlock-cta/page.tsx    # Modal config
│   │   │   │   │   │
│   │   │   │   │   ├── payments/           # (Phase 14.4+)
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── plans/
│   │   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   │   └── [id]/edit/page.tsx
│   │   │   │   │   │   ├── providers/
│   │   │   │   │   │   │   └── page.tsx    # Enable/disable providers per region
│   │   │   │   │   │   ├── transactions/page.tsx
│   │   │   │   │   │   ├── refunds/page.tsx
│   │   │   │   │   │   ├── coupons/page.tsx
│   │   │   │   │   │   └── invoices/page.tsx
│   │   │   │   │   │
│   │   │   │   │   ├── growth/
│   │   │   │   │   │   ├── referrals/     # (Phase 14.6)
│   │   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   │   ├── rewards/page.tsx
│   │   │   │   │   │   │   ├── fraud/page.tsx
│   │   │   │   │   │   │   └── leaderboard/page.tsx
│   │   │   │   │   │   ├── tasks/         # (Phase 14.7)
│   │   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   │   └── [id]/edit/page.tsx
│   │   │   │   │   │   ├── campaigns/     # Email/push campaigns
│   │   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │   └── announcements/page.tsx  # Site-wide banners
│   │   │   │   │   │
│   │   │   │   │   ├── translations/      # (Phase 14.13)
│   │   │   │   │   │   ├── page.tsx       # Queue overview
│   │   │   │   │   │   ├── locales/page.tsx     # Enable/disable languages
│   │   │   │   │   │   ├── queue/page.tsx
│   │   │   │   │   │   └── ui-strings/page.tsx  # UI translation keys
│   │   │   │   │   │
│   │   │   │   │   ├── feedback/
│   │   │   │   │   │   ├── insights/page.tsx    # 👍/👎 with text feedback
│   │   │   │   │   │   ├── contact-messages/page.tsx
│   │   │   │   │   │   └── bug-reports/page.tsx
│   │   │   │   │   │
│   │   │   │   │   ├── accuracy/          # (Phase 14.8)
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── pending/page.tsx
│   │   │   │   │   │   └── settings/page.tsx
│   │   │   │   │   │
│   │   │   │   │   ├── notifications/
│   │   │   │   │   │   ├── templates/page.tsx
│   │   │   │   │   │   ├── triggers/page.tsx
│   │   │   │   │   │   └── history/page.tsx
│   │   │   │   │   │
│   │   │   │   │   ├── ads/               # In-app ad placements
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── placements/page.tsx
│   │   │   │   │   │   └── targeting/page.tsx
│   │   │   │   │   │
│   │   │   │   │   ├── feature-flags/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   │
│   │   │   │   │   ├── admins/            # Admin user management
│   │   │   │   │   │   ├── page.tsx
│   │   │   │   │   │   ├── invite/page.tsx
│   │   │   │   │   │   └── roles/page.tsx
│   │   │   │   │   │
│   │   │   │   │   ├── audit-log/page.tsx
│   │   │   │   │   ├── system/
│   │   │   │   │   │   ├── health/page.tsx
│   │   │   │   │   │   ├── jobs/page.tsx          # BullMQ UI or custom view
│   │   │   │   │   │   ├── cache/page.tsx
│   │   │   │   │   │   ├── backups/page.tsx
│   │   │   │   │   │   └── logs/page.tsx
│   │   │   │   │   │
│   │   │   │   │   └── settings/
│   │   │   │   │       ├── page.tsx               # General site settings
│   │   │   │   │       ├── seo/page.tsx
│   │   │   │   │       ├── branding/page.tsx
│   │   │   │   │       ├── smtp/page.tsx
│   │   │   │   │       ├── webhooks/page.tsx
│   │   │   │   │       ├── api-keys/page.tsx
│   │   │   │   │       └── integrations/page.tsx
│   │   │   │   │
│   │   │   │   ├── api/                   # Next.js BFF routes (lightweight)
│   │   │   │   │   ├── auth/
│   │   │   │   │   │   └── [...nextauth]/route.ts
│   │   │   │   │   ├── webhooks/
│   │   │   │   │   │   ├── stripe/route.ts       # (Phase 14.4)
│   │   │   │   │   │   ├── resend/route.ts
│   │   │   │   │   │   └── sentry/route.ts
│   │   │   │   │   ├── health/route.ts
│   │   │   │   │   ├── csp-report/route.ts
│   │   │   │   │   └── contact/route.ts
│   │   │   │   │
│   │   │   │   ├── sitemap.ts                     # Dynamic sitemap
│   │   │   │   ├── robots.ts
│   │   │   │   ├── manifest.ts                    # PWA manifest
│   │   │   │   ├── not-found.tsx                  # 404
│   │   │   │   ├── error.tsx                      # 500 / runtime errors
│   │   │   │   ├── global-error.tsx               # Top-level error boundary
│   │   │   │   ├── loading.tsx                    # Global loading state
│   │   │   │   └── layout.tsx                     # Root HTML layout
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── ui/                            # Base design system (shadcn-style)
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Select.tsx
│   │   │   │   │   ├── Checkbox.tsx
│   │   │   │   │   ├── Radio.tsx
│   │   │   │   │   ├── Switch.tsx
│   │   │   │   │   ├── Textarea.tsx
│   │   │   │   │   ├── Card.tsx
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   ├── Dialog.tsx
│   │   │   │   │   ├── Drawer.tsx
│   │   │   │   │   ├── Tooltip.tsx
│   │   │   │   │   ├── Popover.tsx
│   │   │   │   │   ├── Tabs.tsx
│   │   │   │   │   ├── Badge.tsx
│   │   │   │   │   ├── Avatar.tsx
│   │   │   │   │   ├── Skeleton.tsx
│   │   │   │   │   ├── Spinner.tsx
│   │   │   │   │   ├── Toast.tsx
│   │   │   │   │   ├── Table.tsx
│   │   │   │   │   ├── Pagination.tsx
│   │   │   │   │   ├── Breadcrumb.tsx
│   │   │   │   │   ├── Alert.tsx
│   │   │   │   │   ├── ProgressiveBlur.tsx        # Core to access control UI
│   │   │   │   │   ├── UnlockModal.tsx
│   │   │   │   │   ├── MetricCard.tsx
│   │   │   │   │   ├── EmptyState.tsx
│   │   │   │   │   └── index.ts                   # Barrel export
│   │   │   │   │
│   │   │   │   ├── layout/
│   │   │   │   │   ├── MarketingHeader.tsx
│   │   │   │   │   ├── MarketingFooter.tsx
│   │   │   │   │   ├── AppHeader.tsx
│   │   │   │   │   ├── AppSidebar.tsx
│   │   │   │   │   ├── AppBottomNav.tsx
│   │   │   │   │   ├── AuthLayout.tsx
│   │   │   │   │   ├── AdminLayout.tsx
│   │   │   │   │   ├── AdminSidebar.tsx
│   │   │   │   │   ├── AdminTopBar.tsx
│   │   │   │   │   ├── BeginnerModeWrapper.tsx
│   │   │   │   │   └── Breadcrumbs.tsx
│   │   │   │   │
│   │   │   │   ├── marketing/
│   │   │   │   │   ├── Hero.tsx
│   │   │   │   │   ├── FeaturesGrid.tsx
│   │   │   │   │   ├── AccuracyStats.tsx
│   │   │   │   │   ├── Testimonials.tsx
│   │   │   │   │   ├── PricingTable.tsx
│   │   │   │   │   ├── FAQ.tsx
│   │   │   │   │   ├── CallToAction.tsx
│   │   │   │   │   └── Newsletter.tsx
│   │   │   │   │
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   ├── RegisterForm.tsx
│   │   │   │   │   ├── ForgotPasswordForm.tsx
│   │   │   │   │   ├── ResetPasswordForm.tsx
│   │   │   │   │   ├── SocialAuthButtons.tsx
│   │   │   │   │   ├── MagicLinkForm.tsx
│   │   │   │   │   ├── TwoFactorForm.tsx
│   │   │   │   │   └── VerifyEmailBanner.tsx
│   │   │   │   │
│   │   │   │   ├── insights/
│   │   │   │   │   ├── InsightCard.tsx
│   │   │   │   │   ├── InsightDetail.tsx
│   │   │   │   │   ├── InsightList.tsx
│   │   │   │   │   ├── TradeContextLayer.tsx
│   │   │   │   │   ├── FeedbackBar.tsx
│   │   │   │   │   ├── DirectionBadge.tsx
│   │   │   │   │   ├── ConfidenceBar.tsx
│   │   │   │   │   └── InsightFilters.tsx
│   │   │   │   │
│   │   │   │   ├── calendar/                      # (Phase 14.1)
│   │   │   │   ├── cot/                           # (Phase 14.2)
│   │   │   │   ├── news/                          # (Phase 14.3)
│   │   │   │   ├── speech-decoder/                # (Phase 14.12)
│   │   │   │   ├── accuracy/                      # (Phase 14.8)
│   │   │   │   ├── market/
│   │   │   │   │   └── MarketStatusBadge.tsx
│   │   │   │   ├── growth/
│   │   │   │   │   ├── ReferralWidget.tsx
│   │   │   │   │   ├── TaskCard.tsx
│   │   │   │   │   └── AnnouncementBanner.tsx
│   │   │   │   │
│   │   │   │   ├── admin/                         # Admin-specific components
│   │   │   │   │   ├── PromptEditor.tsx
│   │   │   │   │   ├── VariableManager.tsx
│   │   │   │   │   ├── OutputSchemaBuilder.tsx
│   │   │   │   │   ├── ChainBuilder.tsx
│   │   │   │   │   ├── TestRunner.tsx
│   │   │   │   │   ├── VersionDiff.tsx
│   │   │   │   │   ├── ContentReviewQueue.tsx
│   │   │   │   │   ├── AccessTierEditor.tsx
│   │   │   │   │   ├── UserGrantForm.tsx
│   │   │   │   │   ├── AuditLogTable.tsx
│   │   │   │   │   └── AdminMetrics.tsx
│   │   │   │   │
│   │   │   │   ├── shared/
│   │   │   │   │   ├── CookieConsent.tsx
│   │   │   │   │   ├── MaintenanceBanner.tsx
│   │   │   │   │   ├── FeatureFlagGate.tsx
│   │   │   │   │   ├── SeoHead.tsx                # Next.js 14 uses metadata but still need JSON-LD
│   │   │   │   │   ├── JsonLd.tsx
│   │   │   │   │   ├── ScrollTracker.tsx          # For scroll-depth lock triggers
│   │   │   │   │   └── ErrorBoundary.tsx
│   │   │   │   │
│   │   │   │   └── icons/
│   │   │   │       └── index.ts                   # Barrel export for lucide-react + custom SVGs
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useAccessLevel.ts
│   │   │   │   ├── useMarketStatus.ts
│   │   │   │   ├── useSpeechDecoder.ts            # WebSocket (Phase 14.12)
│   │   │   │   ├── useProgressiveUnlock.ts
│   │   │   │   ├── useScrollDepth.ts
│   │   │   │   ├── useTimeOnPage.ts
│   │   │   │   ├── useDebounce.ts
│   │   │   │   ├── useMediaQuery.ts
│   │   │   │   ├── useLocalStorage.ts
│   │   │   │   ├── useFeatureFlag.ts
│   │   │   │   ├── useAnalytics.ts
│   │   │   │   ├── useToast.ts
│   │   │   │   └── useAuth.ts
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── api-client.ts                  # Typed fetch wrapper → apps/api
│   │   │   │   ├── auth.ts                        # NextAuth config
│   │   │   │   ├── admin-auth.ts                  # Admin JWT client helpers
│   │   │   │   ├── analytics.ts                   # PostHog wrapper
│   │   │   │   ├── sentry.ts                      # Sentry init
│   │   │   │   ├── seo.ts                         # generateMetadata helpers
│   │   │   │   ├── i18n.ts                        # next-intl config
│   │   │   │   ├── fonts.ts                       # next/font config
│   │   │   │   ├── dates.ts                       # date-fns/day.js wrappers
│   │   │   │   ├── formatters.ts                  # number/currency/percent formatters
│   │   │   │   ├── validators.ts                  # Zod schemas shared
│   │   │   │   └── constants.ts
│   │   │   │
│   │   │   ├── stores/                            # Zustand stores
│   │   │   │   ├── userStore.ts
│   │   │   │   ├── uiStore.ts
│   │   │   │   ├── adminStore.ts
│   │   │   │   └── notificationStore.ts
│   │   │   │
│   │   │   ├── middleware.ts                      # Next.js middleware: auth, locale, rate-limit
│   │   │   │
│   │   │   ├── i18n/
│   │   │   │   ├── config.ts
│   │   │   │   ├── messages/
│   │   │   │   │   ├── en.json
│   │   │   │   │   ├── bn.json                    # (Phase 14.13)
│   │   │   │   │   ├── hi.json
│   │   │   │   │   ├── pt.json
│   │   │   │   │   ├── ar.json
│   │   │   │   │   └── es.json
│   │   │   │   └── routing.ts
│   │   │   │
│   │   │   ├── styles/
│   │   │   │   ├── globals.css                    # Tailwind base + tokens
│   │   │   │   ├── tokens.css                     # CSS variables (design tokens)
│   │   │   │   └── print.css
│   │   │   │
│   │   │   └── types/                             # App-specific types (shared types in packages/types)
│   │   │       └── index.ts
│   │   │
│   │   ├── public/
│   │   │   ├── favicon.ico
│   │   │   ├── apple-touch-icon.png
│   │   │   ├── icon-192.png
│   │   │   ├── icon-512.png
│   │   │   ├── og-default.png
│   │   │   ├── logo.svg
│   │   │   ├── logo-dark.svg
│   │   │   └── fonts/                             # If self-hosting
│   │   │
│   │   ├── tests/
│   │   │   ├── e2e/                               # Playwright
│   │   │   └── unit/                              # Vitest
│   │   │
│   │   ├── .env.local.example
│   │   ├── next.config.mjs
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.mjs
│   │   ├── tsconfig.json
│   │   ├── package.json
│   │   └── README.md
│   │
│   └── api/                                       # Fastify backend
│       ├── src/
│       │   ├── main.ts                            # Entry point
│       │   ├── app.ts                             # Fastify instance factory
│       │   │
│       │   ├── modules/
│       │   │   ├── auth/                          # User auth (JWT + OAuth verification)
│       │   │   │   ├── auth.module.ts
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.service.ts
│       │   │   │   ├── auth.schema.ts             # Zod schemas
│       │   │   │   ├── auth.guard.ts
│       │   │   │   └── strategies/
│       │   │   │       ├── jwt.strategy.ts
│       │   │   │       └── google.strategy.ts
│       │   │   │
│       │   │   ├── admin-auth/                    # SEPARATE admin auth system
│       │   │   │   ├── admin-auth.module.ts
│       │   │   │   ├── admin-auth.controller.ts
│       │   │   │   ├── admin-auth.service.ts
│       │   │   │   ├── admin-jwt.strategy.ts
│       │   │   │   ├── roles.guard.ts
│       │   │   │   ├── two-factor.service.ts
│       │   │   │   └── audit-log.service.ts
│       │   │   │
│       │   │   ├── users/
│       │   │   │   ├── users.module.ts
│       │   │   │   ├── users.controller.ts
│       │   │   │   ├── users.service.ts
│       │   │   │   └── users.schema.ts
│       │   │   │
│       │   │   ├── insights/                      # Phase 4 (MVP)
│       │   │   │   ├── insights.module.ts
│       │   │   │   ├── insights.controller.ts    # Public + user endpoints
│       │   │   │   ├── insights.admin.controller.ts  # Admin endpoints
│       │   │   │   ├── insights.service.ts
│       │   │   │   ├── insights.schema.ts
│       │   │   │   └── insights.events.ts         # Event emitters
│       │   │   │
│       │   │   ├── calendar/                      # (Phase 14.1)
│       │   │   ├── cot/                           # (Phase 14.2)
│       │   │   ├── news/                          # (Phase 14.3)
│       │   │   ├── speech-decoder/                # (Phase 14.12)
│       │   │   │   ├── speech.module.ts
│       │   │   │   ├── speech.controller.ts
│       │   │   │   ├── speech.service.ts
│       │   │   │   └── speech.gateway.ts          # WebSocket
│       │   │   │
│       │   │   ├── ai/
│       │   │   │   ├── ai.module.ts
│       │   │   │   ├── pipeline.service.ts
│       │   │   │   ├── prompt.service.ts
│       │   │   │   ├── model-router.service.ts
│       │   │   │   ├── fallback.service.ts
│       │   │   │   ├── cost-tracker.service.ts
│       │   │   │   ├── chain-runner.service.ts
│       │   │   │   └── adapters/
│       │   │   │       ├── base.adapter.ts        # Abstract interface
│       │   │   │       ├── gemini.adapter.ts      # FIRST (cheapest)
│       │   │   │       ├── openai.adapter.ts      # (Phase 14.14)
│       │   │   │       ├── claude.adapter.ts      # (Phase 14.14)
│       │   │   │       ├── perplexity.adapter.ts  # (Phase 14.14)
│       │   │   │       └── grok.adapter.ts        # (Phase 14.14)
│       │   │   │
│       │   │   ├── access-control/
│       │   │   │   ├── access.module.ts
│       │   │   │   ├── access.service.ts          # CENTRAL — called by every content module
│       │   │   │   ├── tier.service.ts
│       │   │   │   └── lock-rules.service.ts
│       │   │   │
│       │   │   ├── payments/                      # (Phase 14.4)
│       │   │   │   ├── payments.module.ts
│       │   │   │   ├── payments.controller.ts
│       │   │   │   ├── payments.service.ts
│       │   │   │   ├── subscriptions.service.ts
│       │   │   │   ├── webhooks.controller.ts
│       │   │   │   └── adapters/
│       │   │   │       ├── base.adapter.ts
│       │   │   │       ├── stripe.adapter.ts      # First
│       │   │   │       ├── paypal.adapter.ts      # (Phase 14.15)
│       │   │   │       ├── bkash.adapter.ts
│       │   │   │       ├── razorpay.adapter.ts
│       │   │   │       └── crypto.adapter.ts
│       │   │   │
│       │   │   ├── referrals/                     # (Phase 14.6)
│       │   │   ├── tasks/                         # (Phase 14.7)
│       │   │   ├── accuracy/                      # (Phase 14.8)
│       │   │   ├── market-status/                 # (Phase 14.9)
│       │   │   ├── notifications/
│       │   │   │   ├── notifications.module.ts
│       │   │   │   ├── email.service.ts           # Resend wrapper
│       │   │   │   ├── push.service.ts            # Web push
│       │   │   │   └── templates/                 # React Email or MJML
│       │   │   │       ├── welcome.tsx
│       │   │   │       ├── password-reset.tsx
│       │   │   │       ├── email-verification.tsx
│       │   │   │       └── insight-published.tsx
│       │   │   │
│       │   │   ├── translations/                  # (Phase 14.13)
│       │   │   │   ├── translations.module.ts
│       │   │   │   ├── translation.service.ts
│       │   │   │   └── translation.queue.ts
│       │   │   │
│       │   │   ├── feedback/
│       │   │   ├── feature-flags/
│       │   │   ├── audit-log/
│       │   │   ├── legal-pages/                   # CMS for legal content
│       │   │   ├── settings/                      # Admin-editable site settings
│       │   │   ├── ads/
│       │   │   ├── contact/                       # Contact form handler
│       │   │   └── health/
│       │   │
│       │   ├── common/
│       │   │   ├── guards/
│       │   │   │   ├── auth.guard.ts
│       │   │   │   ├── admin.guard.ts
│       │   │   │   ├── roles.guard.ts
│       │   │   │   └── rate-limit.guard.ts
│       │   │   ├── interceptors/
│       │   │   │   ├── logging.interceptor.ts
│       │   │   │   └── transform.interceptor.ts
│       │   │   ├── filters/
│       │   │   │   └── http-exception.filter.ts
│       │   │   ├── decorators/
│       │   │   │   ├── current-user.decorator.ts
│       │   │   │   └── public.decorator.ts
│       │   │   ├── middleware/
│       │   │   │   ├── cors.middleware.ts
│       │   │   │   ├── helmet.middleware.ts
│       │   │   │   └── request-id.middleware.ts
│       │   │   └── dto/
│       │   │
│       │   ├── database/
│       │   │   ├── client.ts                      # Drizzle client
│       │   │   ├── schema/                        # Drizzle schema definitions
│       │   │   │   ├── index.ts
│       │   │   │   ├── users.ts
│       │   │   │   ├── admins.ts
│       │   │   │   ├── sessions.ts
│       │   │   │   ├── insights.ts
│       │   │   │   ├── prompts.ts
│       │   │   │   ├── ai-jobs.ts
│       │   │   │   ├── subscriptions.ts
│       │   │   │   ├── translations.ts
│       │   │   │   ├── access-tiers.ts
│       │   │   │   ├── referrals.ts
│       │   │   │   ├── tasks.ts
│       │   │   │   ├── feedback.ts
│       │   │   │   ├── accuracy-records.ts
│       │   │   │   ├── audit-logs.ts
│       │   │   │   ├── feature-flags.ts
│       │   │   │   ├── legal-pages.ts
│       │   │   │   ├── settings.ts
│       │   │   │   └── notifications.ts
│       │   │   ├── migrations/                    # Generated by drizzle-kit
│       │   │   └── seeds/
│       │   │       ├── admin-user.seed.ts
│       │   │       ├── access-tiers.seed.ts
│       │   │       ├── prompts.seed.ts
│       │   │       └── legal-pages.seed.ts
│       │   │
│       │   ├── queue/
│       │   │   ├── queue.module.ts
│       │   │   ├── queue.service.ts               # BullMQ wrapper
│       │   │   └── processors/
│       │   │       ├── insight-generation.processor.ts
│       │   │       ├── translation.processor.ts
│       │   │       ├── accuracy-evaluation.processor.ts
│       │   │       ├── email.processor.ts
│       │   │       ├── push-notification.processor.ts
│       │   │       └── scheduled-publish.processor.ts
│       │   │
│       │   ├── websocket/
│       │   │   ├── ws.module.ts
│       │   │   └── ws.gateway.ts
│       │   │
│       │   ├── integrations/                      # 3rd-party wrappers
│       │   │   ├── supabase.ts
│       │   │   ├── upstash.ts
│       │   │   ├── resend.ts
│       │   │   ├── posthog.ts
│       │   │   ├── sentry.ts
│       │   │   └── cloudflare-r2.ts
│       │   │
│       │   └── config/
│       │       ├── env.ts                         # Zod-validated env loader
│       │       ├── app.config.ts
│       │       ├── db.config.ts
│       │       ├── redis.config.ts
│       │       └── ai.config.ts
│       │
│       ├── tests/
│       │   ├── unit/
│       │   ├── integration/
│       │   └── e2e/
│       │
│       ├── .env.example
│       ├── tsconfig.json
│       ├── package.json
│       └── README.md
│
├── services/                                      # Long-running background workers
│   ├── scheduler/                                 # Cron triggers (or BullMQ repeatable jobs)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   └── jobs/
│   │   │       ├── daily-insight.job.ts
│   │   │       ├── weekly-cot.job.ts
│   │   │       ├── accuracy-evaluation.job.ts
│   │   │       └── cleanup.job.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ai-worker/                                 # Dedicated AI job consumer (scales independently)
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   ├── types/                                     # Shared TypeScript types
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── api.ts                             # API request/response types
│   │   │   ├── domain.ts                          # Business entities
│   │   │   └── enums.ts
│   │   └── package.json
│   │
│   ├── utils/                                     # Pure utility functions (no framework)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── dates.ts
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── crypto.ts
│   │   └── package.json
│   │
│   ├── ui/                                        # (Optional) Shared React UI package
│   │   └── ...
│   │
│   ├── config/                                    # Shared ESLint, Prettier, TS configs
│   │   ├── eslint-config/
│   │   ├── tsconfig/
│   │   └── prettier-config/
│   │
│   └── sdk/                                       # Typed API SDK generated from backend Zod schemas
│       └── ...
│
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.web
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.worker
│   │   ├── docker-compose.yml                     # Dev: postgres, redis, api, web
│   │   └── docker-compose.prod.yml
│   ├── scripts/
│   │   ├── db-seed.ts
│   │   ├── db-reset.ts
│   │   ├── create-admin.ts
│   │   └── backup.sh
│   └── deploy/
│       ├── vercel.json                            # Web deployment config
│       └── railway.json                           # API deployment config (or render.yaml)
│
├── docs/
│   ├── SPEC.md                                    # Moved from original README
│   ├── architecture/
│   │   ├── ai-pipeline.md
│   │   ├── access-control.md
│   │   ├── payments.md
│   │   └── i18n.md
│   ├── api/
│   │   └── openapi.yaml                           # Generated from Fastify routes
│   ├── runbooks/
│   │   ├── incident-response.md
│   │   ├── db-restore.md
│   │   └── deploy-rollback.md
│   └── adr/                                       # Architecture Decision Records
│       ├── 0001-choose-fastify.md
│       ├── 0002-choose-drizzle.md
│       └── ...
│
├── scripts/                                       # Root-level scripts
│   ├── setup.sh
│   └── check-env.ts
│
├── .env.example                                   # Master template
├── .gitignore
├── .gitattributes
├── .editorconfig
├── .nvmrc
├── .npmrc
├── .prettierrc.json
├── .prettierignore
├── commitlint.config.js
├── package.json                                   # Monorepo root
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
├── README.md
├── SPEC.md
├── roadmap.md                                     # THIS FILE
├── CHANGELOG.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── SECURITY.md
└── LICENSE
```

> **Note:** Folders marked `(Phase 14.x)` are intentionally empty until you reach that phase. Creating the directory tree up front (with `.gitkeep`) is fine; creating files before their phase is premature and leads to dead code.

---

## 6. Environment Variables — Master Reference

### 6.1 Organization

Three separate env files, never mixed:

- `apps/web/.env.local` → Next.js web app (public + server)
- `apps/api/.env` → Fastify backend API
- Root `.env` → Docker Compose only (local dev orchestration)

Every env variable goes through a **Zod validation layer** (`apps/api/src/config/env.ts` and `apps/web/src/lib/env.ts`). App will refuse to start if any required var is missing or malformed. This is non-negotiable.

### 6.2 Variable Naming Rules

- `NEXT_PUBLIC_*` → exposed to browser (only for non-secret values)
- All others → server-only
- No secret ever has `NEXT_PUBLIC_` prefix. Double-check this on every PR.

### 6.3 Master Environment Variable List

Grouped by concern. Add each variable when its corresponding phase starts — not before.

**App identity (Phase 1 — Foundation)**
- `NODE_ENV` — `development` | `staging` | `production` | `test`
- `APP_NAME` — `TradeSense`
- `APP_ENV` — same as NODE_ENV but explicit
- `APP_URL` — public URL of web app (`http://localhost:3000` in dev)
- `NEXT_PUBLIC_APP_URL`
- `API_URL` — backend URL (`http://localhost:4000` in dev)
- `NEXT_PUBLIC_API_URL`
- `WS_URL` — WebSocket URL (Phase 14.12)
- `NEXT_PUBLIC_WS_URL`
- `PORT` — API port (default 4000)
- `LOG_LEVEL` — `debug` | `info` | `warn` | `error`
- `CORS_ORIGIN` — comma-separated allowed origins
- `COOKIE_DOMAIN`
- `COOKIE_SECURE` — `true` in prod
- `TRUST_PROXY` — `true` behind Vercel/Railway

**Database (Phase 1)**
- `DATABASE_URL` — Postgres connection string (Supabase)
- `DATABASE_POOL_SIZE` — default `10`
- `DATABASE_SSL` — `true` in prod
- `DATABASE_MIGRATION_URL` — sometimes different (direct connection, non-pooled)

**Cache / Queue (Phase 1)**
- `REDIS_URL` — Upstash Redis REST or TCP URL
- `REDIS_TOKEN` — Upstash token (if REST)
- `QUEUE_PREFIX` — `tradesense` (namespace BullMQ keys)

**Auth — User (Phase 3)**
- `NEXTAUTH_URL` — same as APP_URL
- `NEXTAUTH_SECRET` — 32+ random bytes
- `JWT_SECRET` — 32+ random bytes (for API tokens)
- `JWT_EXPIRES_IN` — `15m`
- `REFRESH_TOKEN_SECRET`
- `REFRESH_TOKEN_EXPIRES_IN` — `30d`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `EMAIL_MAGIC_LINK_SECRET`

**Auth — Admin (Phase 3)**
- `ADMIN_JWT_SECRET` — distinct from user JWT
- `ADMIN_JWT_EXPIRES_IN` — `1h`
- `ADMIN_2FA_ISSUER` — `TradeSense Admin`
- `ADMIN_INITIAL_EMAIL` — seeded super admin email
- `ADMIN_INITIAL_PASSWORD_HASH` — pre-hashed via bcrypt

**Email (Phase 3)**
- `RESEND_API_KEY`
- `EMAIL_FROM` — `noreply@yourdomain.com`
- `EMAIL_FROM_NAME` — `TradeSense`
- `EMAIL_REPLY_TO` — `support@yourdomain.com`

**AI Providers (Phase 4 and later)**
- `GOOGLE_GEMINI_API_KEY` — Phase 4 (start here)
- `OPENAI_API_KEY` — Phase 14.14
- `ANTHROPIC_API_KEY` — Phase 14.14
- `PERPLEXITY_API_KEY` — Phase 14.14
- `GROK_API_KEY` — Phase 14.14
- `AI_DAILY_BUDGET_USD` — hard cap (admin can override)
- `AI_DEFAULT_MODEL` — `gemini-flash`

**File Storage (Phase 4)**
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL` — custom domain or r2.dev URL

**Analytics & Monitoring (Phase 5)**
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST` — `https://app.posthog.com`
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN` — for source map upload
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `LOGTAIL_TOKEN` — optional

**Security (Phase 5)**
- `RATE_LIMIT_WINDOW_MS` — default `60000`
- `RATE_LIMIT_MAX` — default `100`
- `CSRF_SECRET`
- `CAPTCHA_SITE_KEY` — hCaptcha / Turnstile
- `CAPTCHA_SECRET_KEY`

**Feature Flags (Phase 5)**
- `POSTHOG_FEATURE_FLAGS_ENABLED` — `true`

**Payments (Phase 14.4)**
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- (PayPal, bKash, Razorpay added in Phase 14.15)

**Cron / Background jobs (Phase 1)**
- `CRON_SECRET` — for protecting cron endpoints

**Contact / Support (Phase 2)**
- `SUPPORT_EMAIL` — forwards to founder

**Sitemap / SEO (Phase 2)**
- `NEXT_PUBLIC_SITE_VERIFICATION_GOOGLE`
- `NEXT_PUBLIC_SITE_VERIFICATION_BING`

### 6.4 `.env.example` Policy

- [ ] **6.4.1** — Every new env variable added to code MUST be added to `.env.example` in the same PR.
- [ ] **6.4.2** — `.env.example` uses dummy values that clearly indicate the format (e.g., `DATABASE_URL=postgres://user:pass@localhost:5432/db`).
- [ ] **6.4.3** — Never commit real secrets. Verify with `git-secrets` or `gitleaks` (add to CI in Section 12.6).
- [ ] **6.4.4** — Maintain `.env.example` grouped with comments matching Section 6.3 categories.

### 6.5 Secret Rotation Policy

- [ ] **6.5.1** — Document in `SECURITY.md` that secrets are rotated every 90 days.
- [ ] **6.5.2** — Critical secrets (JWT, admin JWT, DB password) rotated immediately if any machine is compromised.

---

## 7. Phase 1 — Foundation Layer (Non-Feature Infrastructure)

This is pure plumbing. Nothing user-facing. The goal: when this phase ends, you have a Next.js app serving a blank page, an API serving `/health`, both connected to a real database and Redis.

### 7.1 Frontend App Scaffold (`apps/web`)

- [ ] **7.1.1** — From repo root: `pnpm create next-app apps/web --typescript --tailwind --app --src-dir --import-alias "@/*"`. Do not accept npm — override to pnpm.
- [ ] **7.1.2** — Verify Next.js 14+ (App Router, not Pages).
- [ ] **7.1.3** — Delete Next.js default homepage content (keep the files, empty them).
- [ ] **7.1.4** — Install core dependencies: `zod`, `zustand`, `@tanstack/react-query`, `clsx`, `tailwind-merge`, `lucide-react`, `date-fns`.
- [ ] **7.1.5** — Install next-intl (i18n groundwork, even if only English at launch): `pnpm add next-intl`.
- [ ] **7.1.6** — Configure `next.config.mjs`: image remote patterns, redirects, rewrites, security headers.
- [ ] **7.1.7** — Extend `tsconfig.json` from `packages/tsconfig/nextjs.json`.
- [ ] **7.1.8** — Wire ESLint config from `packages/eslint-config/next.js`.
- [ ] **7.1.9** — Confirm dev server runs: `pnpm --filter web dev`. Should serve on `localhost:3000`.

### 7.2 Backend API Scaffold (`apps/api`)

- [ ] **7.2.1** — Create `apps/api/package.json` with name `@tradesense/api`.
- [ ] **7.2.2** — Install Fastify and core plugins: `fastify`, `@fastify/cors`, `@fastify/helmet`, `@fastify/rate-limit`, `@fastify/jwt`, `@fastify/multipart`, `@fastify/swagger`, `@fastify/swagger-ui`, `@fastify/sensible`.
- [ ] **7.2.3** — Install `zod`, `zod-to-json-schema`, `fastify-type-provider-zod`.
- [ ] **7.2.4** — Install `pino`, `pino-pretty` (dev).
- [ ] **7.2.5** — Install dev tooling: `tsx`, `tsup`, `@types/node`.
- [ ] **7.2.6** — Create `src/main.ts` with Fastify bootstrap (just responds `/health` → `{ ok: true }`).
- [ ] **7.2.7** — Create env loader (`src/config/env.ts`) using Zod — app refuses to start if invalid.
- [ ] **7.2.8** — Create structured logger (`src/common/logger.ts`) with Pino.
- [ ] **7.2.9** — Add `dev` script using `tsx watch src/main.ts`.
- [ ] **7.2.10** — Confirm dev server runs: `pnpm --filter api dev`. Should serve on `localhost:4000/health`.

### 7.3 Database Module — Drizzle ORM + Supabase

- [ ] **7.3.1** — Choose ORM: **Drizzle** (lighter, typed, SQL-first). Alternative: Prisma (bigger, more abstracted). Decision recorded in `docs/adr/0002-choose-drizzle.md`.
- [ ] **7.3.2** — In Supabase dashboard: create a new project (free tier). Note the connection string (Pooled + Direct).
- [ ] **7.3.3** — Install Drizzle in `apps/api`: `pnpm add drizzle-orm postgres` + `pnpm add -D drizzle-kit`.
- [ ] **7.3.4** — Create `drizzle.config.ts` pointing to `src/database/schema/` and `src/database/migrations/`.
- [ ] **7.3.5** — Create `src/database/client.ts` — Postgres connection pool using `DATABASE_URL`.
- [ ] **7.3.6** — Create first schema file `src/database/schema/users.ts` (minimal: id, email, createdAt — this gets expanded in Phase 3).
- [ ] **7.3.7** — Run first migration: `pnpm drizzle-kit generate` + `pnpm drizzle-kit migrate`.
- [ ] **7.3.8** — Verify connection from API: `/health/db` endpoint runs `SELECT 1`.

### 7.4 Redis Module — Upstash

- [ ] **7.4.1** — Create Upstash Redis database (free tier).
- [ ] **7.4.2** — Install `ioredis` (for BullMQ compatibility) and `@upstash/redis` (REST client for edge functions).
- [ ] **7.4.3** — Create `src/integrations/upstash.ts` — exports ioredis client.
- [ ] **7.4.4** — Verify from API: `/health/redis` endpoint runs `PING`.

### 7.5 Queue Module — BullMQ

- [ ] **7.5.1** — Install `bullmq`.
- [ ] **7.5.2** — Create `src/queue/queue.service.ts` — exports `createQueue(name)`.
- [ ] **7.5.3** — Create one placeholder processor: `src/queue/processors/healthcheck.processor.ts`.
- [ ] **7.5.4** — Confirm queue registers and processes a dummy job in dev.

### 7.6 Logger + Error Handler

- [ ] **7.6.1** — Pino logger already set up (7.2.8). Ensure pretty printing in dev, JSON in prod.
- [ ] **7.6.2** — Global error filter: catches all unhandled exceptions, sanitizes stack traces in prod.
- [ ] **7.6.3** — Request ID middleware (`src/common/middleware/request-id.middleware.ts`) — injects `X-Request-ID` header; logged on every log line.

### 7.7 Shared Packages

- [ ] **7.7.1** — Create `packages/types/`: shared TS types (User, Insight, AccessTier, etc.). Both `apps/web` and `apps/api` import from here.
- [ ] **7.7.2** — Create `packages/utils/`: pure functions (date formatters, currency formatters, validators). No framework dependency.
- [ ] **7.7.3** — Both packages use `tsup` for dual CJS/ESM output. Add them as `workspace:*` dependencies in apps.

### 7.8 API Client (Frontend ↔ Backend)

- [ ] **7.8.1** — Decide approach: plain typed fetch wrapper vs tRPC vs openapi-fetch. Recommendation: start with typed fetch wrapper + Zod validation. Upgrade to tRPC for admin panel if type-safety friction emerges.
- [ ] **7.8.2** — Create `apps/web/src/lib/api-client.ts` — typed wrapper using `fetch`.
- [ ] **7.8.3** — Define error shape (`ApiError`) used consistently across both apps.

### 7.9 Docker Compose (Local Dev)

- [ ] **7.9.1** — Create `infrastructure/docker/docker-compose.yml` with: `postgres`, `redis`, optional `meilisearch` (phase 14.x).
- [ ] **7.9.2** — Dev workflow documented: `docker compose up -d` → `pnpm dev` at root → Turborepo launches both apps.
- [ ] **7.9.3** — Optional: dockerize `api` and `web` services for parity with production (not required for local dev).

### 7.10 CI Skeleton

- [ ] **7.10.1** — Populate `.github/workflows/ci.yml`: on PR to `main` or `develop`, run `pnpm install`, `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- [ ] **7.10.2** — Add pnpm cache and node_modules cache for speed.
- [ ] **7.10.3** — Add `gitleaks` step to scan for leaked secrets.

### 7.11 First Deployment Smoke Test

- [ ] **7.11.1** — Deploy `apps/web` to Vercel (connect GitHub, select `apps/web` as root). Add env vars to Vercel dashboard.
- [ ] **7.11.2** — Deploy `apps/api` to Railway or Render (free tier). Add env vars.
- [ ] **7.11.3** — Verify both URLs work. This is the "heartbeat" deploy — no user-facing content yet, just proof infrastructure works.

### 7.12 Exit Criteria for Phase 1

Before moving to Phase 2:
- [ ] Web app dev server + API dev server both run cleanly
- [ ] Both connect to Supabase (DB) and Upstash (Redis) in dev
- [ ] Health endpoints (`/health`, `/health/db`, `/health/redis`) all respond OK
- [ ] Linting, typecheck, and tests all pass
- [ ] CI runs on every PR
- [ ] Both apps are deployed to their respective platforms (staging)
- [ ] Zero hardcoded secrets anywhere in the codebase

---

## 8. Phase 2 — Public Static Pages & Layout Shell

Goal: At the end of this phase, a stranger can visit your domain, read about the product, understand what it does, contact you, and see all the legal pages. No auth needed yet.

### 8.1 Design Tokens + Tailwind Config

- [ ] **8.1.1** — Define color tokens in `src/styles/tokens.css` as CSS variables (per Section 11.3 of SPEC.md).
- [ ] **8.1.2** — Light mode and dark mode tokens both defined; dark is default.
- [ ] **8.1.3** — Configure `tailwind.config.ts` to consume CSS vars — enables runtime theming.
- [ ] **8.1.4** — Typography scale defined (headings, body, small, mono).
- [ ] **8.1.5** — Spacing scale (confirm Tailwind defaults fit or override).
- [ ] **8.1.6** — Shadow tokens.
- [ ] **8.1.7** — Radius tokens.
- [ ] **8.1.8** — Motion tokens (transition durations, easings).
- [ ] **8.1.9** — Z-index scale (documented in comments).
- [ ] **8.1.10** — Install fonts via `next/font` (Inter + JetBrains Mono).

### 8.2 Base UI Kit (shadcn-style)

Install each component one at a time. Prefer copy-in pattern (own the code) over external library.

- [ ] **8.2.1** — Button
- [ ] **8.2.2** — Input
- [ ] **8.2.3** — Textarea
- [ ] **8.2.4** — Select
- [ ] **8.2.5** — Checkbox
- [ ] **8.2.6** — Radio
- [ ] **8.2.7** — Switch
- [ ] **8.2.8** — Card
- [ ] **8.2.9** — Modal / Dialog
- [ ] **8.2.10** — Drawer (mobile sheet)
- [ ] **8.2.11** — Tooltip
- [ ] **8.2.12** — Popover
- [ ] **8.2.13** — Tabs
- [ ] **8.2.14** — Badge
- [ ] **8.2.15** — Avatar
- [ ] **8.2.16** — Skeleton
- [ ] **8.2.17** — Spinner
- [ ] **8.2.18** — Toast (use sonner or similar)
- [ ] **8.2.19** — Table
- [ ] **8.2.20** — Pagination
- [ ] **8.2.21** — Breadcrumb
- [ ] **8.2.22** — Alert
- [ ] **8.2.23** — EmptyState
- [ ] **8.2.24** — Create `src/components/ui/index.ts` barrel export.

### 8.3 Layout Components

- [ ] **8.3.1** — `MarketingHeader.tsx` — logo left, nav center (About, Pricing, FAQ, Blog), CTA right (Login, Get Started).
- [ ] **8.3.2** — `MarketingFooter.tsx` — columns: Product, Company, Legal, Social. Newsletter signup inline.
- [ ] **8.3.3** — `AuthLayout.tsx` — centered card, minimal branding, no main nav.
- [ ] **8.3.4** — Placeholder `AppHeader`, `AppSidebar`, `AppBottomNav`, `AdminLayout` — fully built in Phase 3.
- [ ] **8.3.5** — Responsive behavior: mobile bottom nav triggers at `<768px`; desktop sidebar at `≥1024px`.

### 8.4 Marketing Pages

Each page follows the same pattern: route → Server Component page → metadata → sections.

- [ ] **8.4.1** — `app/(marketing)/page.tsx` — Landing page:
  - Hero (headline, subheadline, CTA, preview visual)
  - "What is TradeSense" section (3-layer philosophy in plain language)
  - Feature grid (Daily Insight, Calendar, COT, Speech Decoder — but only active ones linked)
  - Accuracy stats preview (placeholder values until Accuracy Engine exists)
  - Testimonials (empty or lorem until real ones)
  - FAQ preview
  - Final CTA
- [ ] **8.4.2** — `app/(marketing)/about/page.tsx` — Mission, team (or founder), story.
- [ ] **8.4.3** — `app/(marketing)/contact/page.tsx` — Form (name, email, subject, message). Submits to `/api/contact`.
- [ ] **8.4.4** — `/api/contact/route.ts` handler — validates via Zod, rate-limits by IP, sends email via Resend to founder.
- [ ] **8.4.5** — `app/(marketing)/faq/page.tsx` — Accordion with top 10 FAQs.
- [ ] **8.4.6** — `app/(marketing)/pricing/page.tsx` — **DEFERRED** until payments exist (Phase 14.4). Placeholder page: "Coming soon — join waitlist."
- [ ] **8.4.7** — `app/(marketing)/blog/page.tsx` — **DEFERRED**. Skeleton only.

### 8.5 Legal Pages

All legal pages are CMS-managed via admin panel (Phase 3.21). For launch, seed them with static content.

- [ ] **8.5.1** — Draft Terms & Conditions (use a generator + review with a lawyer eventually).
- [ ] **8.5.2** — Draft Privacy Policy (GDPR + CCPA compliant template).
- [ ] **8.5.3** — Draft **Disclaimer** (critical for a trading-adjacent product — "not financial advice" language must be prominent).
- [ ] **8.5.4** — Draft Cookie Policy.
- [ ] **8.5.5** — Draft Refund Policy (even if no payments yet — prep for Phase 14.4).
- [ ] **8.5.6** — Draft Acceptable Use Policy.
- [ ] **8.5.7** — Create pages under `app/(legal)/<slug>/page.tsx` — each renders MDX content from `content/legal/<slug>.mdx`.
- [ ] **8.5.8** — Footer links all legal pages.

### 8.6 Global Error / Status Pages

- [ ] **8.6.1** — `app/not-found.tsx` — 404 with helpful links.
- [ ] **8.6.2** — `app/error.tsx` — 500 runtime error with retry.
- [ ] **8.6.3** — `app/global-error.tsx` — top-level catch.
- [ ] **8.6.4** — `app/maintenance/page.tsx` — shown when `MAINTENANCE_MODE=true` env flag.
- [ ] **8.6.5** — Branded loading states (`app/loading.tsx`).

### 8.7 SEO Foundations

- [ ] **8.7.1** — `app/layout.tsx` — `generateMetadata` with defaults (title template, description, OG, Twitter card).
- [ ] **8.7.2** — `public/og-default.png` — fallback OG image (1200x630).
- [ ] **8.7.3** — `app/sitemap.ts` — static routes listed. Dynamic routes (insights) added in Phase 4.
- [ ] **8.7.4** — `app/robots.ts` — allow all in production, disallow all in staging.
- [ ] **8.7.5** — `app/manifest.ts` — PWA manifest (for mobile install).
- [ ] **8.7.6** — JSON-LD Organization schema in root layout.
- [ ] **8.7.7** — Favicon + apple-touch-icon + icon-192 + icon-512.

### 8.8 i18n Skeleton

- [ ] **8.8.1** — Install `next-intl`.
- [ ] **8.8.2** — Configure routing for `/` (default English) — no locale prefix yet. When Phase 14.13 ships, add `/bn/`, `/hi/`, etc.
- [ ] **8.8.3** — Create `src/i18n/messages/en.json` with ALL UI strings (even for pages not yet built — grep-proof the codebase).
- [ ] **8.8.4** — Wrap layout in `NextIntlClientProvider`.
- [ ] **8.8.5** — Rule: never hardcode UI strings in components. Every string comes from `useTranslations()`.

### 8.9 Cookie Consent

- [ ] **8.9.1** — Install a lightweight consent library or build custom (3-option: essential / analytics / marketing).
- [ ] **8.9.2** — Render banner on first visit. Respect user choice via cookie.
- [ ] **8.9.3** — PostHog and other analytics only initialize if user consented.

### 8.10 Accessibility Baseline

- [ ] **8.10.1** — Run Lighthouse accessibility audit on every page — target >= 95.
- [ ] **8.10.2** — Keyboard navigation works on all interactive elements.
- [ ] **8.10.3** — Focus rings visible and branded.
- [ ] **8.10.4** — All images have `alt`.
- [ ] **8.10.5** — All form inputs have associated labels.
- [ ] **8.10.6** — Color contrast ratios meet WCAG AA.

### 8.11 Exit Criteria for Phase 2

- [ ] Landing page is a presentable, scroll-complete page a stranger can understand
- [ ] All 6 legal pages exist, are reachable from footer, and have real (not placeholder) text
- [ ] Contact form sends email to founder successfully
- [ ] 404, 500, maintenance pages are branded
- [ ] sitemap.xml and robots.txt are generated correctly
- [ ] Lighthouse Desktop: Performance >= 90, Accessibility >= 95, SEO >= 100
- [ ] Lighthouse Mobile: Performance >= 85
- [ ] Cookie consent works
- [ ] Nothing throws errors in Sentry

---

## 9. Phase 3 — Auth System (User + Admin)

At end of this phase: a user can create an account, log in, manage their profile, and delete their account. An admin can log in to a separate admin panel that, for now, only shows an empty dashboard.

### 9.1 User Auth — Database Schema

- [ ] **9.1.1** — Expand `database/schema/users.ts` with all fields: id, email, emailVerified, passwordHash, name, avatarUrl, locale, timezone, role (default `user`), createdAt, updatedAt, deletedAt (soft delete).
- [ ] **9.1.2** — Create `database/schema/sessions.ts` — session tokens if using DB sessions (NextAuth adapter).
- [ ] **9.1.3** — Create `database/schema/accounts.ts` — OAuth account links (NextAuth adapter schema).
- [ ] **9.1.4** — Create `database/schema/verification-tokens.ts` — email verify, password reset, magic links.
- [ ] **9.1.5** — Create `database/schema/refresh-tokens.ts` — for API JWT refresh.
- [ ] **9.1.6** — Run migration.

### 9.2 User Auth — Backend Module

- [ ] **9.2.1** — Create `modules/auth/` in API: service, controller, schemas, strategies.
- [ ] **9.2.2** — Endpoints:
  - `POST /auth/register` — email + password
  - `POST /auth/login` — returns JWT + sets httpOnly refresh cookie
  - `POST /auth/logout` — invalidates refresh token
  - `POST /auth/refresh` — refresh JWT
  - `POST /auth/forgot-password` — sends email with reset token
  - `POST /auth/reset-password` — consumes token, sets new password
  - `POST /auth/verify-email/:token`
  - `POST /auth/resend-verification`
  - `GET /auth/me` — current user
- [ ] **9.2.3** — Rate-limit auth endpoints (5/min per IP, 3/hour per email).
- [ ] **9.2.4** — Password hashing: bcrypt (cost 12). Never argon2 — it's fine but bcrypt is safer to get right in Node.
- [ ] **9.2.5** — JWT: RS256 for admin, HS256 for user is acceptable. Short expiry (15m) + refresh token.
- [ ] **9.2.6** — Auth guard decorator / plugin for protected routes.

### 9.3 NextAuth.js Setup (Frontend Auth Glue)

- [ ] **9.3.1** — Install `next-auth` v5 (Auth.js).
- [ ] **9.3.2** — Configure `lib/auth.ts` with adapter → Drizzle adapter to Supabase.
- [ ] **9.3.3** — Configure providers: Credentials (email/password calling API), Google OAuth, Email (magic link).
- [ ] **9.3.4** — Session strategy: database-backed (not pure JWT, so revocation works).
- [ ] **9.3.5** — `app/api/auth/[...nextauth]/route.ts` → NextAuth handler.

### 9.4 Google OAuth Setup

- [ ] **9.4.1** — In Google Cloud Console: create OAuth 2.0 Client ID (Web Application).
- [ ] **9.4.2** — Authorized redirect URIs: dev (`http://localhost:3000/api/auth/callback/google`) + staging + prod.
- [ ] **9.4.3** — Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to env.
- [ ] **9.4.4** — Configure consent screen (scopes: email, profile).
- [ ] **9.4.5** — Test login flow end-to-end.

### 9.5 Email Magic Link

- [ ] **9.5.1** — NextAuth Email provider configured with Resend transport.
- [ ] **9.5.2** — Email template in `modules/notifications/templates/magic-link.tsx` (React Email).
- [ ] **9.5.3** — Test: request magic link → receive email → click → signed in.

### 9.6 Auth Pages

- [ ] **9.6.1** — `app/(auth)/register/page.tsx` — Register form (name, email, password, confirm password, accept terms checkbox).
- [ ] **9.6.2** — `app/(auth)/login/page.tsx` — Login (email, password) + "Continue with Google" + "Send me a magic link".
- [ ] **9.6.3** — `app/(auth)/forgot-password/page.tsx` — Enter email → request reset.
- [ ] **9.6.4** — `app/(auth)/reset-password/page.tsx?token=…` — New password form.
- [ ] **9.6.5** — `app/(auth)/verify-email/page.tsx?token=…` — Confirmation screen.
- [ ] **9.6.6** — `app/(auth)/magic-link/page.tsx` — "Check your inbox" success screen.
- [ ] **9.6.7** — `app/(auth)/logout/page.tsx` — Logout confirmation + auto-redirect.

### 9.7 Email Templates

- [ ] **9.7.1** — Welcome email (on successful registration).
- [ ] **9.7.2** — Email verification (on registration).
- [ ] **9.7.3** — Password reset.
- [ ] **9.7.4** — Magic link sign-in.
- [ ] **9.7.5** — Account deletion confirmation.
- [ ] **9.7.6** — All templates tested in Gmail, Outlook, Apple Mail (use Resend's test tool).

### 9.8 User Account Pages

- [ ] **9.8.1** — `app/(app)/account/page.tsx` — Profile overview.
- [ ] **9.8.2** — `app/(app)/account/settings/page.tsx` — Name, avatar, timezone, locale.
- [ ] **9.8.3** — `app/(app)/account/security/page.tsx` — Change password, sign-out other sessions, 2FA toggle (defer 2FA impl).
- [ ] **9.8.4** — `app/(app)/account/language/page.tsx` — Locale preference.
- [ ] **9.8.5** — `app/(app)/account/delete/page.tsx` — Confirmation flow → soft-delete with 30-day restoration window.
- [ ] **9.8.6** — `app/(app)/account/billing/page.tsx` — **DEFERRED** to Phase 14.4.

### 9.9 Auth Middleware

- [ ] **9.9.1** — `middleware.ts` in Next.js: protects `(app)/*` routes — redirects unauthenticated users to `/login?callbackUrl=...`.
- [ ] **9.9.2** — Protects `admin/*` routes — checks admin JWT (separate cookie from user session).
- [ ] **9.9.3** — Locale detection middleware (placeholder until Phase 14.13).
- [ ] **9.9.4** — Rate limiting middleware using Upstash Ratelimit.

### 9.10 Admin Auth — Separate System

Admin auth is deliberately separate from user auth. Different secret, different cookie name, different session table.

- [ ] **9.10.1** — Create `database/schema/admins.ts` — id, email, passwordHash, role (enum: super_admin, editor, moderator, finance), twoFactorSecret, twoFactorEnabled, lastLoginAt, createdAt.
- [ ] **9.10.2** — Create `database/schema/admin-sessions.ts`.
- [ ] **9.10.3** — Seed first super admin via `infrastructure/scripts/create-admin.ts` (reads env vars `ADMIN_INITIAL_EMAIL` + pre-hashed password).
- [ ] **9.10.4** — Create `modules/admin-auth/` in API with its own endpoints: `POST /admin/auth/login`, `/admin/auth/logout`, `/admin/auth/refresh`, `/admin/auth/2fa/setup`, `/admin/auth/2fa/verify`.
- [ ] **9.10.5** — All admin auth endpoints rate-limited 3/min.
- [ ] **9.10.6** — Admin password policy: 14+ chars, mixed case, number, symbol. Enforced in backend.

### 9.11 Admin Login Page

- [ ] **9.11.1** — `app/admin/login/page.tsx` — Minimal, branded differently from user login. No "Register" link.
- [ ] **9.11.2** — Form: email + password + TOTP code.
- [ ] **9.11.3** — Failed login attempts logged; 5 failures → 15-min lockout.
- [ ] **9.11.4** — Successful login redirects to `/admin`.

### 9.12 Admin Roles (RBAC)

- [ ] **9.12.1** — Role hierarchy defined: `super_admin` > `editor` > `moderator` > `finance`.
- [ ] **9.12.2** — Each admin page has a `requiredRole` prop on its layout/wrapper.
- [ ] **9.12.3** — Backend `RolesGuard` checks JWT role claim against endpoint requirement.
- [ ] **9.12.4** — Frontend hides nav items user doesn't have access to.

### 9.13 2FA for Admin (Mandatory)

- [ ] **9.13.1** — Install `otplib` + `qrcode`.
- [ ] **9.13.2** — On first admin login, force 2FA setup.
- [ ] **9.13.3** — QR code shown; admin scans with Google Authenticator / Authy.
- [ ] **9.13.4** — Verify code before completing setup.
- [ ] **9.13.5** — Generate + show recovery codes (10 codes, one-time use).

### 9.14 Audit Log System

This is critical — every admin action must be logged.

- [ ] **9.14.1** — Create `database/schema/audit-logs.ts` — id, actorId, actorType (admin/system/user), action, resourceType, resourceId, before (jsonb), after (jsonb), ip, userAgent, createdAt.
- [ ] **9.14.2** — Create `modules/audit-log/` service.
- [ ] **9.14.3** — Interceptor on all admin routes that logs the action automatically.
- [ ] **9.14.4** — Admin page `/admin/audit-log` with filtering (actor, date range, resource).

### 9.15 Admin Dashboard Shell

- [ ] **9.15.1** — `app/admin/layout.tsx` — sidebar + top bar + content area.
- [ ] **9.15.2** — Admin sidebar: Dashboard, Content, AI, Users, Access Control, Payments (placeholder), Growth, Translations (placeholder), Feedback, Notifications, Admins, Audit Log, Settings. Items for unshipped features show as "Coming soon".
- [ ] **9.15.3** — `app/admin/page.tsx` — stats cards (users count, insights published, AI cost this month). For now, dummy values from DB counts.
- [ ] **9.15.4** — Top bar: current admin email, role badge, logout button.

### 9.16 Exit Criteria for Phase 3

- [ ] User can register, verify email, log in via email/password
- [ ] User can log in via Google OAuth
- [ ] User can request magic link
- [ ] User can reset password
- [ ] User can update profile, change password
- [ ] User can delete account (soft delete, 30-day grace)
- [ ] Admin can log in with 2FA
- [ ] Admin dashboard is reachable and displays something real
- [ ] All admin actions are audit-logged
- [ ] Auth works in staging deploy
- [ ] All auth emails deliver successfully to Gmail/Outlook inbox (not spam)

---

## 10. Feature Slice Blueprint (Template for Every Feature)

**This is the most important section of the roadmap.** Every single feature from Phase 4 onward follows this blueprint. If a step is missing from your slice, you do not merge.

### 10.1 The Blueprint — 12 Required Steps per Slice

Every feature slice must include ALL of these before it is considered done:

**10.1.1 — Database Schema**
- Add table(s) in `apps/api/src/database/schema/<feature>.ts`.
- Define all relations (foreign keys).
- Generate migration (`drizzle-kit generate`).
- Write seed file if feature needs initial data.

**10.1.2 — Backend Service**
- Create module in `apps/api/src/modules/<feature>/`.
- Service handles business logic.
- Controller handles HTTP routing.
- Zod schemas validate every input.
- Every service method has unit tests.

**10.1.3 — Public API Endpoints**
- Endpoints for end-users (may require auth).
- Pagination, filtering, sorting baked in.
- Response shape matches `packages/types`.

**10.1.4 — Admin API Endpoints**
- Separate controller: `<feature>.admin.controller.ts`.
- All admin endpoints require admin JWT + correct role.
- CRUD: List, Get, Create, Update, Delete, Bulk operations, Status changes.
- Every admin action creates an audit-log entry.

**10.1.5 — Frontend User Pages**
- Route in `apps/web/src/app/(app)/<feature>/`.
- List page + detail page(s).
- Uses `useQuery` from TanStack Query for fetching.
- Proper loading/error/empty states.

**10.1.6 — Frontend Components**
- Feature-specific components in `apps/web/src/components/<feature>/`.
- Composed from base UI kit.
- Accessibility-audited.

**10.1.7 — Admin Panel Pages**
- Route in `apps/web/src/app/admin/<category>/<feature>/`.
- List view with filters, detail view, create/edit forms.
- Bulk actions where applicable.
- Audit log tab for that resource.

**10.1.8 — Access Control Integration**
- Decide: public / free-auth / premium / role-gated.
- Add to `access-tiers` table.
- Frontend uses `useAccessLevel` hook to gate content.
- ProgressiveBlur component wraps any gated content.

**10.1.9 — Analytics Events**
- Define event taxonomy for this feature (view, click, complete).
- Fire PostHog events from frontend.
- Server-side events for conversions.

**10.1.10 — i18n Strings**
- All user-facing text added to `i18n/messages/en.json`.
- Translation keys added to queue for other locales (Phase 14.13).

**10.1.11 — Documentation**
- Update `SPEC.md` if architecture changed.
- Add runbook in `docs/runbooks/` if feature has operational concerns.
- Update `CHANGELOG.md`.

**10.1.12 — QA Checklist**
- Unit tests pass (>= 80% coverage on service layer).
- E2E test covers happy path (Playwright).
- Manual QA on mobile + desktop.
- Lighthouse still passes.
- Sentry shows no new errors 24h after deploy.

### 10.2 Feature Slice Branch & PR Workflow

- [ ] **10.2.1** — Branch: `feature/<slice-name>` off `develop`.
- [ ] **10.2.2** — Commits follow Conventional Commits (`feat: …`, `fix: …`, `chore: …`).
- [ ] **10.2.3** — Open PR early as Draft to enable CI runs and self-review.
- [ ] **10.2.4** — PR description uses template; includes checkboxes for all 12 steps in 10.1.
- [ ] **10.2.5** — Merge only when all 12 checkboxes ticked + CI green.
- [ ] **10.2.6** — Merge to `develop` → auto-deploy to staging → smoke test → cherry-pick or merge to `main` for production.

See also: Appendix D for the full feature slice checklist template you can copy into every PR description.

---


## 11. Phase 4 — First Feature: Daily Fundamental Insight (MVP)

This is your launch feature. When this is done (plus Phase 5 hardening + Phase 6 deployment), you go public. No other feature exists at launch.

Follow the Feature Slice Blueprint (Section 10). Below are the micro-tasks specific to this slice.

### 11.1 Database Schema

- [ ] **11.1.1** — `schema/insights.ts`: id (uuid), slug, title, subtitle, body (jsonb — structured), summary, currencyPairs (text array), direction (enum: bullish/bearish/neutral), confidence (enum: low/medium/high), timeHorizon (enum: intraday/daily/weekly), riskLevel, bestSession, keyEvents (jsonb), correlatedPairs, accessLevel (enum: public/free/premium), previewPercentage (int 0–100), status (enum: draft/approved/scheduled/published/archived), publishedAt, scheduledFor, generatedByPromptId (fk), generatedByModel, costUsd, authorId (admin who reviewed), createdAt, updatedAt.
- [ ] **11.1.2** — `schema/prompts.ts`: id, taskType, modelTarget, systemPrompt, userPromptTemplate, variables (jsonb), outputFormat, outputSchema (jsonb), version, active, createdBy, createdAt.
- [ ] **11.1.3** — `schema/ai-jobs.ts`: id, jobType, promptId, inputData (jsonb), outputData (jsonb), model, tokensIn, tokensOut, costUsd, durationMs, status (pending/running/succeeded/failed), error, createdAt.
- [ ] **11.1.4** — `schema/access-tiers.ts`: id, slug (public/free/premium), name, priority (int), features (jsonb), active.
- [ ] **11.1.5** — `schema/feedback.ts`: id, contentType, contentId, userId, vote (1/-1), comment (nullable), createdAt.
- [ ] **11.1.6** — Indexes: `insights(status, publishedAt)`, `insights(slug)`, `insights(accessLevel)`, `ai_jobs(status, createdAt)`.
- [ ] **11.1.7** — Run migration.
- [ ] **11.1.8** — Seed: 3 access tiers (public, free, premium), 1 default prompt (`daily_insight`).

### 11.2 AI Adapter Layer

- [ ] **11.2.1** — Create `modules/ai/adapters/base.adapter.ts` — abstract interface: `generate(prompt, options)`, `estimateCost(tokensIn, tokensOut)`.
- [ ] **11.2.2** — Create `modules/ai/adapters/gemini.adapter.ts` using `@google/generative-ai` SDK. Start with Gemini 1.5 Flash (cheapest + fast).
- [ ] **11.2.3** — Implement retry with exponential backoff (3 retries max).
- [ ] **11.2.4** — Implement timeout (15s default).
- [ ] **11.2.5** — Unit tests with mocked API.
- [ ] **11.2.6** — Do NOT add OpenAI/Claude/etc. yet. Wait for Phase 14.14.

### 11.3 Prompt Service

- [ ] **11.3.1** — `modules/ai/prompt.service.ts`: `getActivePrompt(taskType)`, `renderPrompt(prompt, variables)` → interpolates `{variable}` placeholders.
- [ ] **11.3.2** — Variable resolver: each variable source is a function in `modules/ai/variable-resolvers/` (e.g., `current_date`, `upcoming_events`, `cot_bias_for_pair`). Since Calendar and COT features aren't built yet, these resolvers return static/mock values for MVP.
- [ ] **11.3.3** — Output validation: parse AI response against `outputSchema`; if invalid, retry once.

### 11.4 Pipeline Service (Chain Runner)

- [ ] **11.4.1** — `modules/ai/pipeline.service.ts`: `runChain(chainId, inputData)` — runs sequence of steps defined in DB.
- [ ] **11.4.2** — For MVP, single-step chain: `GENERATE_DRAFT` (Gemini Flash).
- [ ] **11.4.3** — Full chain (QUALITY_CHECK, ENRICH_EDUCATION, TRANSLATE_QUEUE) deferred to later phases.
- [ ] **11.4.4** — Every step writes an `ai_jobs` row for cost tracking.

### 11.5 BullMQ Queue

- [ ] **11.5.1** — `queue/processors/insight-generation.processor.ts` — consumes jobs, runs pipeline, saves draft insight.
- [ ] **11.5.2** — `queue/processors/scheduled-publish.processor.ts` — publishes insights whose `scheduledFor <= now`.
- [ ] **11.5.3** — Delayed retry strategy for failed jobs (1min, 5min, 15min).
- [ ] **11.5.4** — Dead-letter queue for permanently failed jobs.

### 11.6 Scheduler

- [ ] **11.6.1** — Create `services/scheduler/` worker (separate Node process).
- [ ] **11.6.2** — BullMQ repeatable job: "daily-insight-generation" at `06:00 UTC` (configurable via env + admin in future).
- [ ] **11.6.3** — Creates one `ai_jobs` per currency pair defined in admin (for MVP, default: EURUSD, GBPUSD, USDJPY).
- [ ] **11.6.4** — Deploy scheduler separately (Railway background worker).

### 11.7 Insights Backend Module

- [ ] **11.7.1** — `modules/insights/insights.service.ts` — CRUD + `publish()`, `archive()`, `schedule()`, `listPublished()`, `getBySlug()`.
- [ ] **11.7.2** — Public endpoints:
  - `GET /insights?pair=EURUSD&limit=20&cursor=...`
  - `GET /insights/:slug`
- [ ] **11.7.3** — Auth-gated endpoints:
  - `POST /insights/:id/feedback` (thumb up/down + optional comment)
- [ ] **11.7.4** — Response includes preview/full content based on user's access tier.
- [ ] **11.7.5** — Rate limit: 60 req/min per IP for public GETs.

### 11.8 Insights Admin Module

- [ ] **11.8.1** — `modules/insights/insights.admin.controller.ts`:
  - `GET /admin/insights` (all statuses, filters)
  - `POST /admin/insights` (manual create)
  - `POST /admin/insights/:id/generate` (trigger AI generation)
  - `PATCH /admin/insights/:id` (edit draft)
  - `POST /admin/insights/:id/approve`
  - `POST /admin/insights/:id/publish`
  - `POST /admin/insights/:id/schedule`
  - `POST /admin/insights/:id/archive`
  - `GET /admin/insights/:id/history` (audit log)
- [ ] **11.8.2** — Role required: `editor` or higher.

### 11.9 Prompts Admin Module

- [ ] **11.9.1** — `modules/ai/prompts.admin.controller.ts`:
  - List, get, create, update, delete prompts
  - `POST /admin/prompts/:id/test` — runs prompt against live data in staging only
  - `POST /admin/prompts/:id/activate` — sets this version active, deactivates others for same taskType
- [ ] **11.9.2** — Role required: `super_admin`.

### 11.10 Access Control Module

- [ ] **11.10.1** — `modules/access-control/access.service.ts`: `getUserAccessLevel(user)` → returns `public | free | premium` based on: no user → public, user exists → free, user has active subscription → premium (future).
- [ ] **11.10.2** — `canAccess(user, content)` helper used by content modules.
- [ ] **11.10.3** — For MVP, premium is unachievable (no payments yet) — used as placeholder demonstrating the lock UI works.

### 11.11 Frontend — User Pages

- [ ] **11.11.1** — `app/(app)/insights/page.tsx` — list page. Server Component. Fetches published insights from API. Filters (pair, direction, date range) as URL search params.
- [ ] **11.11.2** — `app/(app)/insights/[slug]/page.tsx` — detail page. Uses `generateStaticParams` + ISR (revalidate on publish webhook). Renders full content or preview based on access level.
- [ ] **11.11.3** — Loading states: Skeleton grids, not spinners.
- [ ] **11.11.4** — Empty state: "No insights yet" with illustration.

### 11.12 Frontend — Components

- [ ] **11.12.1** — `components/insights/InsightCard.tsx` — summary view with direction badge, confidence bar, pair tags.
- [ ] **11.12.2** — `components/insights/InsightDetail.tsx` — full view with TradeContextLayer, body, feedback bar.
- [ ] **11.12.3** — `components/insights/TradeContextLayer.tsx` — best session, key events, risk level, correlated pairs.
- [ ] **11.12.4** — `components/insights/FeedbackBar.tsx` — 👍/👎 buttons + "X% found this useful" + optional text feedback drawer.
- [ ] **11.12.5** — `components/insights/DirectionBadge.tsx` — color-coded pill.
- [ ] **11.12.6** — `components/insights/ConfidenceBar.tsx` — segmented low/med/high bar.
- [ ] **11.12.7** — `components/ui/ProgressiveBlur.tsx` — wraps locked content with gradient blur + CTA overlay.

### 11.13 Frontend — Admin Pages

- [ ] **11.13.1** — `app/admin/content/insights/page.tsx` — list with filters by status (drafts / scheduled / published / archived).
- [ ] **11.13.2** — `app/admin/content/insights/drafts/page.tsx` — review queue (newest first).
- [ ] **11.13.3** — `app/admin/content/insights/[id]/edit/page.tsx` — rich editor for body (use TipTap or Lexical), metadata form, publish/schedule buttons.
- [ ] **11.13.4** — `app/admin/content/insights/[id]/page.tsx` — read-only detail + history tab.
- [ ] **11.13.5** — `app/admin/content/insights/new/page.tsx` — manual create (fallback when AI skipped).
- [ ] **11.13.6** — Bulk actions: archive, delete, change access level.

### 11.14 Frontend — Admin Prompt Builder

- [ ] **11.14.1** — `app/admin/ai/prompts/page.tsx` — list prompts by taskType.
- [ ] **11.14.2** — `app/admin/ai/prompts/[id]/edit/page.tsx`:
  - System prompt editor (CodeMirror or Monaco, syntax highlighting)
  - User prompt editor with `{variable}` highlighting
  - Variable manager (list variables + source function)
  - Output format selector
  - Output schema builder (JSON schema)
  - Model target selector
  - Version history + diff viewer
- [ ] **11.14.3** — `app/admin/ai/prompts/[id]/test/page.tsx` — runs prompt with real inputs, shows response + token cost.
- [ ] **11.14.4** — "Activate" button makes this version live.

### 11.15 Frontend — Admin AI Settings

- [ ] **11.15.1** — `app/admin/ai/models/page.tsx` — enable/disable Gemini (only active model for now). Shows API key status.
- [ ] **11.15.2** — `app/admin/ai/routing/page.tsx` — map task types to primary/fallback models (only Gemini for now).
- [ ] **11.15.3** — `app/admin/ai/cost-caps/page.tsx` — daily cost cap (default $5/day for MVP).
- [ ] **11.15.4** — `app/admin/ai/usage/page.tsx` — cost + tokens chart (last 7 / 30 days), per model/task.

### 11.16 Frontend — Admin Access Control

- [ ] **11.16.1** — `app/admin/access-control/page.tsx` — overview of tiers.
- [ ] **11.16.2** — `app/admin/access-control/tiers/page.tsx` — edit tier features (for MVP, tiers are static, just read-only).
- [ ] **11.16.3** — Per-insight access level is editable on the insight edit page (11.13.3).

### 11.17 End-to-End Test

- [ ] **11.17.1** — E2E test (Playwright): Admin logs in → triggers generation → sees draft → edits → publishes → anonymous user visits `/insights` → sees card → clicks detail → sees preview blur (because no account) → registers → signs in → sees full content → clicks 👍 → feedback saved.
- [ ] **11.17.2** — Runs in CI against ephemeral DB.

### 11.18 Exit Criteria for Phase 4

- [ ] Admin can trigger generation, see draft, edit, publish
- [ ] Scheduled generation runs daily at 06:00 UTC
- [ ] Anonymous user sees blurred preview; logged-in user sees full content
- [ ] Feedback (👍/👎) works and aggregates
- [ ] AI cost tracking works (sum matches Gemini dashboard within 5%)
- [ ] Prompt can be edited from admin, versioned, and re-activated
- [ ] Nothing crashes in Sentry for 48 hours on staging

---

## 12. Phase 5 — Launch-Ready Production Hardening

Before you go public, every one of these must be done.

### 12.1 SEO

- [ ] **12.1.1** — Every page has unique `title` and `description` via `generateMetadata`.
- [ ] **12.1.2** — OG images per insight (use `@vercel/og` to generate at build/request time).
- [ ] **12.1.3** — JSON-LD schemas: Organization (root), Article (insight pages), BreadcrumbList, FAQ.
- [ ] **12.1.4** — Canonical URLs on every page.
- [ ] **12.1.5** — Sitemap includes dynamic insight URLs.
- [ ] **12.1.6** — Submit sitemap to Google Search Console + Bing Webmaster.
- [ ] **12.1.7** — Add site verification meta tags.
- [ ] **12.1.8** — Internal linking audit: every insight links to related insights.

### 12.2 Analytics

- [ ] **12.2.1** — PostHog installed, initialized only after cookie consent.
- [ ] **12.2.2** — Event taxonomy documented in `docs/analytics-events.md`.
- [ ] **12.2.3** — Server-side events (signup, first-login, insight-viewed, feedback-given).
- [ ] **12.2.4** — Funnels configured: Landing → Register → First Insight View.
- [ ] **12.2.5** — Session recording enabled for opted-in users only (privacy-first).

### 12.3 Error Tracking

- [ ] **12.3.1** — Sentry init in both web and API.
- [ ] **12.3.2** — Source maps uploaded on build (use `SENTRY_AUTH_TOKEN`).
- [ ] **12.3.3** — Release versioning set to git SHA.
- [ ] **12.3.4** — Alert rule: >= 5 errors of same type in 1 minute → email founder.
- [ ] **12.3.5** — PII scrubbing enabled (emails, IPs optional).

### 12.4 Structured Logging

- [ ] **12.4.1** — Pino → JSON in prod.
- [ ] **12.4.2** — Logs shipped to Logtail / Better Stack free tier.
- [ ] **12.4.3** — Log retention policy: 7 days at free tier.
- [ ] **12.4.4** — Never log passwords, tokens, full card numbers, etc.

### 12.5 Rate Limiting

- [ ] **12.5.1** — Per-endpoint limits using Upstash Ratelimit.
- [ ] **12.5.2** — Tiers: anonymous (strict), logged-in user (relaxed), admin (very relaxed), API key (custom).
- [ ] **12.5.3** — 429 response includes `Retry-After` header.

### 12.6 Security Hardening

- [ ] **12.6.1** — CSP (Content Security Policy) configured in `next.config.mjs` headers.
- [ ] **12.6.2** — HSTS, X-Frame-Options, X-Content-Type-Options headers.
- [ ] **12.6.3** — CORS: only allow known origins.
- [ ] **12.6.4** — Helmet on Fastify.
- [ ] **12.6.5** — SQL injection: Drizzle parameterizes everything — double-check no raw SQL with user input.
- [ ] **12.6.6** — XSS: React escapes by default — audit any `dangerouslySetInnerHTML`.
- [ ] **12.6.7** — CSRF: NextAuth + double-submit cookie on mutations.
- [ ] **12.6.8** — Secrets: `gitleaks` in CI prevents commit; weekly audit.
- [ ] **12.6.9** — Dependencies: `pnpm audit` weekly (Dependabot handles PRs).
- [ ] **12.6.10** — Contact form + register endpoints protected by hCaptcha / Cloudflare Turnstile.
- [ ] **12.6.11** — Admin panel IP allowlist (optional but recommended — use Cloudflare Access).

### 12.7 Input Validation

- [ ] **12.7.1** — Every API endpoint input validated via Zod.
- [ ] **12.7.2** — Every form on frontend validated via Zod + react-hook-form.
- [ ] **12.7.3** — File uploads: size limits, type validation (magic bytes, not just extension).

### 12.8 Health Checks

- [ ] **12.8.1** — `/health` — liveness (process up).
- [ ] **12.8.2** — `/health/ready` — readiness (DB + Redis reachable).
- [ ] **12.8.3** — `/health/deep` — admin-only, runs sample queries.
- [ ] **12.8.4** — Uptime Robot monitors `/health/ready` every 5 min on all deployments.

### 12.9 Background Jobs Monitoring

- [ ] **12.9.1** — Install `bull-board` — admin UI for BullMQ at `/admin/system/jobs` (protected).
- [ ] **12.9.2** — Alerts when dead-letter queue > 10 items.
- [ ] **12.9.3** — Alerts when any queue backlog > 100.

### 12.10 Database Backups

- [ ] **12.10.1** — Supabase free tier includes 7-day PITR.
- [ ] **12.10.2** — Manual nightly snapshot to Cloudflare R2 (cron job + `pg_dump`).
- [ ] **12.10.3** — Backup restoration tested once (document in runbook).

### 12.11 Performance

- [ ] **12.11.1** — Lighthouse on all key pages: Mobile >= 85, Desktop >= 90.
- [ ] **12.11.2** — Core Web Vitals: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1.
- [ ] **12.11.3** — Images: `next/image` with proper `sizes`.
- [ ] **12.11.4** — Fonts: `display: swap` + preload critical subsets.
- [ ] **12.11.5** — Third-party scripts deferred or lazy-loaded.
- [ ] **12.11.6** — Bundle analysis (`@next/bundle-analyzer`) — main bundle < 200 KB gzipped.

### 12.12 Legal Compliance

- [ ] **12.12.1** — Legal pages reviewed by a real lawyer OR use Termly/iubenda generator + disclaimers.
- [ ] **12.12.2** — GDPR: cookie consent, data export endpoint, data deletion endpoint.
- [ ] **12.12.3** — CCPA: "Do Not Sell" link in footer.
- [ ] **12.12.4** — Financial disclaimer on EVERY insight card ("Not financial advice").
- [ ] **12.12.5** — Terms explicitly disclaim liability for trading losses.

### 12.13 Email Deliverability

- [ ] **12.13.1** — Domain SPF, DKIM, DMARC records configured (Resend provides exact values).
- [ ] **12.13.2** — Test emails from prod domain → Gmail, Outlook, Yahoo inboxes (not spam).
- [ ] **12.13.3** — Warm up sending domain: start with low volume, ramp up.

### 12.14 Pre-Launch Audit

- [ ] **12.14.1** — Full manual QA pass on mobile (iPhone SE, iPhone 14, Pixel, Samsung).
- [ ] **12.14.2** — Full manual QA on desktop (Chrome, Firefox, Safari, Edge).
- [ ] **12.14.3** — Broken link check (`broken-link-checker` or similar).
- [ ] **12.14.4** — Accessibility audit (axe DevTools).
- [ ] **12.14.5** — Load test (optional at this scale; k6 against staging — 100 concurrent users).
- [ ] **12.14.6** — Security audit (OWASP Top 10 self-check).

### 12.15 Exit Criteria for Phase 5

- [ ] Every box in 12.1–12.14 is checked
- [ ] `docs/runbooks/incident-response.md` written
- [ ] `docs/runbooks/deploy-rollback.md` written
- [ ] Founder has personal devices logged in and tested end-to-end

---

## 13. Phase 6 — Production Deployment & Public Launch

### 13.1 Domain & DNS

- [ ] **13.1.1** — Buy domain (Cloudflare Registrar preferred).
- [ ] **13.1.2** — Delegate DNS to Cloudflare.
- [ ] **13.1.3** — Configure DNS records: `A` / `CNAME` for root + `www` (Vercel) + `api.yourdomain.com` (Railway/Render) + email records.
- [ ] **13.1.4** — Enable Cloudflare proxy (orange cloud) for CDN + DDoS + bot fight mode.
- [ ] **13.1.5** — SSL: automatic via Cloudflare (Full Strict mode; origin certs installed on Vercel/Railway).

### 13.2 Environment Separation

- [ ] **13.2.1** — Three envs: `development` (local), `staging` (develop branch), `production` (main branch).
- [ ] **13.2.2** — Separate Supabase projects per env (free tier = 2 free projects; staging can share with dev or be paid).
- [ ] **13.2.3** — Separate Upstash Redis per env.
- [ ] **13.2.4** — Separate Sentry environments.
- [ ] **13.2.5** — Separate domain: `staging.yourdomain.com`.

### 13.3 CI/CD Pipelines

- [ ] **13.3.1** — `.github/workflows/ci.yml` — on PR: lint, typecheck, test, build.
- [ ] **13.3.2** — `.github/workflows/deploy-staging.yml` — on push to `develop`: build + deploy web (Vercel), API (Railway), scheduler (Railway).
- [ ] **13.3.3** — `.github/workflows/deploy-production.yml` — on push to `main` (or release tag): manual approval gate + deploy.
- [ ] **13.3.4** — `.github/workflows/db-migrate.yml` — runs migrations before app deploy.
- [ ] **13.3.5** — Rollback strategy: previous deployments kept for 7 days; one-click rollback on Vercel; Railway redeploy previous commit.

### 13.4 Production Provisioning

- [ ] **13.4.1** — Supabase production project: upgrade connection limits if needed, enable PITR.
- [ ] **13.4.2** — Upstash production Redis: separate DB.
- [ ] **13.4.3** — Vercel production env vars set for all services.
- [ ] **13.4.4** — Railway production services set, scheduled jobs enabled.
- [ ] **13.4.5** — Cloudflare R2 production bucket.
- [ ] **13.4.6** — Resend production API key + verified sending domain.

### 13.5 Pre-Launch Data

- [ ] **13.5.1** — Seed production with 7 days of backdated insights (generate manually or via admin, backdate `publishedAt`). Empty lists kill first impressions.
- [ ] **13.5.2** — Seed legal pages.
- [ ] **13.5.3** — Seed first admin account.

### 13.6 Smoke Tests on Production

- [ ] **13.6.1** — Register with a throwaway email → verify → log in.
- [ ] **13.6.2** — Log out → log in again.
- [ ] **13.6.3** — Visit every static page.
- [ ] **13.6.4** — View insight list + detail.
- [ ] **13.6.5** — Submit contact form.
- [ ] **13.6.6** — Admin login + publish test insight.
- [ ] **13.6.7** — Check Sentry for any errors in last hour.

### 13.7 Soft Launch (Private Beta)

- [ ] **13.7.1** — Set `MAINTENANCE_MODE=false` but hide from Google (`robots.txt` disallow + `noindex` meta).
- [ ] **13.7.2** — Share URL with 10–30 trusted beta users (friends, Discord, small community).
- [ ] **13.7.3** — Collect feedback for 3–7 days.
- [ ] **13.7.4** — Fix top 10 issues.

### 13.8 Public Launch

- [ ] **13.8.1** — Remove `noindex` meta tags.
- [ ] **13.8.2** — Submit sitemap to Google Search Console.
- [ ] **13.8.3** — Post on Reddit (relevant trading subs), X/Twitter, LinkedIn, Product Hunt (Tuesday is best).
- [ ] **13.8.4** — Pin an announcement banner for 1 week.
- [ ] **13.8.5** — Monitor Sentry + PostHog hourly for first 48 hours.

### 13.9 Post-Launch Vigilance (First Week)

- [ ] **13.9.1** — Check Sentry daily.
- [ ] **13.9.2** — Check PostHog for drop-off points in funnel.
- [ ] **13.9.3** — Check AI cost dashboard daily.
- [ ] **13.9.4** — Respond to every contact form message within 24h.
- [ ] **13.9.5** — Daily journal: what users are saying, bugs found, performance metrics.

---

## 14. Phase 7+ — Incremental Feature Expansion

**After launch, every feature follows Section 10 Blueprint.** One feature at a time, each fully including its admin panel. Do NOT start feature N+1 until feature N is live, monitored, and stable for at least 7 days.

Recommended sequence (but reorderable based on user feedback):

### 14.1 Smart Economic Calendar

Data source: Investing.com API scraper, ForexFactory, or TradingEconomics free tier. Include admin pages for: data source config, event list, AI enrichment settings, manual event entry.

Micro-tasks follow the 12-step Blueprint. Key specifics:
- Ingestion cron (every 4 hours)
- AI enrichment job per event (`ai_context` field)
- Filter UI (currency, impact, date range)
- Admin override: edit any event, pin events, mark as critical
- Access control: public sees today only; free sees 3 days; premium sees 30 days

### 14.2 Smart COT Report

Data source: CFTC weekly release (CSV).
- Ingestion cron (Fridays 21:30 UTC).
- AI generates plain-language interpretation.
- Visual positioning component (Smart Money vs Retail bar).
- Admin: enable/disable pairs shown, edit interpretation.
- Access: public sees one pair preview; free sees all; premium sees historical trend.

### 14.3 AI News Intelligence

Sources: NewsAPI free tier, RSS feeds.
- Dedup + relevance scoring via embeddings (can use OpenAI embeddings once budget allows; early MVP can use keyword matching).
- AI enrichment: sentiment, impacted pairs, urgency.
- Admin: RSS feed management, blacklist/whitelist, manual news entry.
- Access: public sees headlines; free sees summaries; premium sees AI analysis + affected pairs.

### 14.4 Payment System — Stripe Only

The largest feature by lines of code. Only start when you have 100+ engaged users consistently — don't build monetization before you have something to monetize.

Sub-slices:
- **14.4.1** — Stripe account + webhook setup + test mode.
- **14.4.2** — Plans schema + seed (`premium_monthly`, `premium_yearly`).
- **14.4.3** — Checkout flow (Stripe Checkout hosted page — easiest).
- **14.4.4** — Webhook handler for subscription lifecycle events.
- **14.4.5** — User billing page (current plan, invoices, cancel, change plan).
- **14.4.6** — Admin plans management.
- **14.4.7** — Admin transactions list.
- **14.4.8** — Admin refund flow.
- **14.4.9** — Admin manual grant (give a user premium without payment).
- **14.4.10** — Access control service now checks subscription status.
- **14.4.11** — `/pricing` page built (was placeholder in Phase 2).
- **14.4.12** — Trial logic (7 days free).
- **14.4.13** — Dunning for failed payments (retry 3 times over 10 days).

### 14.5 Referral System

- Unique referral code per user.
- Cookie tracking (90-day window).
- Reward engine (configurable in admin: days granted, cash, credits).
- Fraud detection (same IP, same device fingerprint, velocity).
- Public referral dashboard for user.
- Admin referral analytics.

### 14.6 Task-Based Unlock

- Task definitions in DB (editable by admin).
- Completion verification per task type (share → OAuth callback; referral → tracking; review → webhook from review site).
- Reward application via access-control service.
- User page: available tasks, completed tasks, earned time.
- Admin: task CRUD, reward mapping, analytics.

### 14.7 Bias Accuracy Engine

- When an insight is published, extract prediction (direction + pair + time horizon).
- Scheduled job evaluates: fetch actual market close, compare, record accuracy.
- Public accuracy dashboard page.
- Per-pair, per-model, per-insight-type breakdowns.
- Admin: adjust evaluation rules, manually flag/unflag.

### 14.8 Market Status Layer

- Computed daily: combines COT + upcoming events + volatility.
- Cached in Redis.
- Displayed prominently on home / dashboard.
- Admin: manual override.

### 14.9 Smart Money vs Retail Comparison

- Built on top of COT data.
- UI component + AI-generated historical context.
- Admin: select which pairs to display.

### 14.10 Event Hype System + Notifications

- Notifications module (email + web push).
- Countdown components.
- Live reaction feed scaffolding (prerequisite for Speech Decoder).
- Admin: notification templates, triggers, frequency caps.

### 14.11 Speech Decoder (Flagship)

Hardest feature. Don't attempt until infrastructure is battle-tested.

- WebSocket gateway on API (Socket.io).
- Event-scheduled feature: admin creates event, starts/stops live session.
- Transcript ingestion: manual paste, Whisper API, or live caption feed.
- AI processes transcript in 60–120s chunks.
- Live feed UI (auto-scrolling).
- Post-event summary.
- Admin: event scheduler, transcript input, live AI controls, post-event publish.

### 14.12 Multi-Language Pipeline

- Enable Bengali + Hindi first (your closest markets).
- Translation queue: Gemini Flash per insight → draft → admin review → publish.
- UI strings translated once (manual, one-time review).
- Locale routing: `/en/`, `/bn/`, `/hi/`.
- Admin: locale enable/disable, translation review queue.

### 14.13 Additional AI Models

- Add OpenAI adapter (GPT-4o, GPT-4o-mini).
- Add Anthropic adapter (Claude Sonnet).
- Add Perplexity adapter.
- Add Grok adapter.
- Admin routing table: swap models per task.
- A/B testing framework for prompts/models.

### 14.14 Additional Payment Methods

- PayPal.
- bKash (Bangladesh).
- Razorpay UPI (India).
- Stripe PIX (Brazil).
- Coinbase Commerce / NOWPayments (crypto).
- Admin: enable per-region, currency mapping.

### 14.15 Progressive Unlock UX Refinement

- Scroll-depth triggers.
- Time-on-page triggers.
- Smart CTAs based on user behavior.
- Admin: configure thresholds.

### 14.16 Beginner "Start Here" Mode

- Toggle on profile.
- Replaces default UI with guided 5-step flow.
- Plain-language overrides for all technical terms.
- Admin: manage beginner mode copy.

### 14.17 Mobile App (Future)

- React Native (Expo) sharing the `packages/` types and API client.
- Only after web product-market fit is clear.

---

## 15. Scale-Stage Upgrade Path (Free → Paid)

Free-first is the rule. Paid upgrade is gated by explicit triggers.

### 15.1 Stage 1 — 0 to 1,000 Users (100% Free Tier)

| Service | Plan | Limit | Trigger to upgrade |
|---|---|---|---|
| Vercel | Hobby | 100 GB bandwidth | Hit 70% or commercial use needed |
| Supabase | Free | 500 MB DB, 1 GB storage, 50K MAU | 400 MB DB OR 40K MAU |
| Upstash Redis | Free | 10K commands/day | Hit 8K on peak day |
| Cloudflare | Free | Most needs | Never for most apps |
| Cloudflare R2 | Free | 10 GB storage | Past 7 GB |
| Resend | Free | 3K/month, 100/day | Past 80/day for 3+ days |
| Sentry | Developer | 5K errors/month | Past 4K |
| PostHog | Free | 1M events/month | Past 800K |
| Gemini API | Free | Generous | Hit rate limits |

**Monthly cost: $0 + domain ($10/year).**

### 15.2 Stage 2 — 1K to 10K Users (~$30–80/month)

- Supabase Pro: $25/mo (8 GB DB, 100 GB bandwidth, unlimited MAU).
- Resend Pro: $20/mo (50K/month).
- Vercel: still Hobby for solo; Pro if team ($20/user).
- Gemini: pay-as-you-go (~$5–20/mo at this scale).

### 15.3 Stage 3 — 10K to 100K Users (~$300–800/month)

- Supabase Team or self-hosted: $599/mo OR DIY.
- Upstash Pay-as-you-go Redis: ~$50/mo.
- Dedicated WebSocket server: Railway Pro $20/mo.
- Resend Scale: $80/mo (200K/month).
- AI costs rise with users: monitor and optimize prompts ruthlessly.
- Consider paid PostHog tier if over event cap.

### 15.4 Stage 4 — 100K+ Users ($2K+/month)

- Migrate toward AWS/GCP for compute.
- Multi-region DB read replicas.
- Self-hosted Redis.
- Dedicated DevOps contractor or hire.
- Follow original SPEC.md Section 14.1 Stage 3–4 guidance.

### 15.5 Upgrade Decision Rule

Never upgrade unless one of these is true:
1. A free-tier ceiling is actively blocking users.
2. Paid feature unlocks meaningful capability (e.g., Supabase Pro = PITR past 7 days).
3. Revenue > 5× the upgrade cost.

---

## 16. Ongoing Cadence (Daily / Weekly / Monthly)

### 16.1 Daily (15–30 min)

- [ ] Check Sentry — triage new errors.
- [ ] Check PostHog dashboard — any funnel drop?
- [ ] Check AI cost dashboard — within budget?
- [ ] Respond to contact messages + bug reports.
- [ ] Admin review queue: publish pending drafts.

### 16.2 Weekly (1–2 hours)

- [ ] Dependabot PR review and merge.
- [ ] Review top 10 PostHog events for anomalies.
- [ ] Database slow query review (Supabase Insights).
- [ ] Weekly financial review: AI costs vs revenue.
- [ ] Update CHANGELOG.md for the week's deploys.
- [ ] Review new feature candidates from user feedback.

### 16.3 Monthly (Half-day)

- [ ] Security audit: `pnpm audit`, dependency review, rotate non-critical secrets.
- [ ] Cost audit: every paid service reviewed.
- [ ] Performance audit: Lighthouse on top pages.
- [ ] Backup restoration test.
- [ ] Update this roadmap.md with actual progress.

### 16.4 Quarterly (Full day)

- [ ] Full security review (OWASP checklist, pen test if budget allows).
- [ ] Rotate all critical secrets.
- [ ] Architecture review — any deferred debt to pay down?
- [ ] Tech stack upgrade: major versions of framework/runtime.
- [ ] Legal page refresh.
- [ ] Customer interviews (at least 5) for roadmap input.

---

## Appendix A — Complete Folder Structure (Expanded)

See Section 5 above — the complete tree is in one place there. Use that as the authoritative map.

Rules for adding to the tree:

1. **Every feature gets its own folder** in `components/`, `app/`, and `modules/` — never flat-dump.
2. **Admin files mirror user files.** If `modules/insights/` exists, `modules/insights/insights.admin.controller.ts` must exist in the same folder (not a separate `/admin-insights/`).
3. **Shared code goes in `packages/`.** If it's used in 2+ apps, move it.
4. **Feature files never cross-import each other at the component level.** `components/calendar/*` never imports from `components/cot/*`. Shared pieces go in `components/shared/` or `components/ui/`.
5. **Route groups `(marketing)`, `(legal)`, `(auth)`, `(app)` are for layout separation, not for feature isolation.**

---

## Appendix B — Environment Variables Complete Reference

See Section 6 above. Maintain `.env.example` as the authoritative file — this document documents intent, `.env.example` documents reality. When they diverge, `.env.example` wins.

---

## Appendix C — Cloud Services Checklist

Print or keep open during Phase 0–1 account creation.

| Service | Free Tier? | Phase | Status |
|---|---|---|---|
| GitHub | Yes | Day 1 | [ ] |
| Vercel | Yes (Hobby) | Phase 1 | [ ] |
| Supabase | Yes (500 MB) | Phase 1 | [ ] |
| Upstash Redis | Yes (10K/day) | Phase 1 | [ ] |
| Cloudflare | Yes | Phase 1 | [ ] |
| Cloudflare R2 | Yes (10 GB) | Phase 4 | [ ] |
| Google Cloud OAuth | Yes | Phase 3 | [ ] |
| Google Gemini AI | Yes (generous) | Phase 4 | [ ] |
| Resend | Yes (3K/mo) | Phase 3 | [ ] |
| Sentry | Yes (5K/mo) | Phase 5 | [ ] |
| PostHog | Yes (1M events) | Phase 5 | [ ] |
| Better Stack (Logtail) | Yes (1 GB) | Phase 5 | [ ] |
| Uptime Robot | Yes (50 monitors) | Phase 5 | [ ] |
| Domain Registrar | $10–15/year | Phase 6 | [ ] |
| Stripe | Free (fees on tx) | Phase 14.4 | [ ] |
| OpenAI API | Pay-per-use | Phase 14.14 | [ ] |
| Anthropic API | Pay-per-use | Phase 14.14 | [ ] |
| Perplexity API | Pay-per-use | Phase 14.14 | [ ] |
| PayPal | Free (fees) | Phase 14.15 | [ ] |
| bKash | Approval required | Phase 14.15 | [ ] |
| Razorpay | Approval required | Phase 14.15 | [ ] |

---

## Appendix D — Feature Slice Checklist Template

Copy this into every feature-slice PR description.

```markdown
## Feature Slice: <Name>

### Scope
<one-line description>

### 12-Step Blueprint Compliance
- [ ] 1. Database schema added + migration generated
- [ ] 2. Backend service + controller + Zod schemas
- [ ] 3. Public API endpoints
- [ ] 4. Admin API endpoints + audit-log integration
- [ ] 5. Frontend user pages (list + detail)
- [ ] 6. Frontend feature components
- [ ] 7. Admin panel pages (list, create, edit, view)
- [ ] 8. Access control integration
- [ ] 9. Analytics events instrumented
- [ ] 10. i18n strings added to en.json
- [ ] 11. Documentation updated (SPEC.md / runbook / CHANGELOG)
- [ ] 12. QA: unit tests, E2E test, mobile+desktop manual, Lighthouse holds, no Sentry errors 24h on staging

### Environment Variables Added
- `NEW_VAR_NAME` — purpose

### Manual Test Steps
1.
2.
3.

### Screenshots
<attach>

### Risks / Rollback Plan
<describe>
```

---

## Final Notes

- **This roadmap is a living document.** Check off tasks as you complete them. Add new sub-tasks when reality diverges from this plan. Delete nothing — strike it through so history is preserved.
- **When in doubt, ship less.** A feature with 80% polish shipped today beats a feature with 100% polish that ships in 3 months.
- **Admin panel is not optional.** The moment you find yourself thinking "I'll just edit the DB directly this one time" — stop. Build the admin UI for that action instead. That's the compounding lesson.
- **Cost discipline matters.** A $50/month AWS bill with $0 revenue is how small projects die. Every free-tier upgrade is a commitment — make sure the trigger is real.
- **Launch date beats perfection.** The goal of this roadmap is to get you to Phase 6 Public Launch in 8–12 weeks with one solid feature. Everything else is iteration after launch.

Good luck. Build the thing. Ship. Learn. Repeat.