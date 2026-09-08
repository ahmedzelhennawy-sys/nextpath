# NEXTPATH Backend — Implementation Plan

This document records what was learned from the two reference projects, what the
live database actually looks like, and how the active backend was changed to match
the live schema without ever running a migration, seed, or Supabase mutation.

It is the single source of truth for "why this file looks the way it does" for
the increment.

## 1. Three projects, three roles

| Path | Role | Read-only? |
| --- | --- | --- |
| `C:\Users\asus\Documents\ChatGPT\NEXTPATH\backend` | **Active** local backend. The only project modified. | No — this is the work target. |
| `C:\Users\asus\Documents\ChatGPT\NEXTPATH-team` | **Database + AI reference** (read-only). Holds `schema.sql`, `seed-expanded.sql`, `requirements-fix.sql`, eligibility-engine, match-engine, OpenRouter client. | Yes. |
| `C:\Users\asus\Documents\ChatGPT\NEXT-ERA-BACKEEND-PROJECT-main\next era backend project(claude)\nextpath-backend` | **Second backend reference** (read-only). Holds Next.js App Router patterns, repository/service split, seven-component match weights, AI adapter boundary, mock-Supabase test pattern. | Yes. |

## 2. Live database — source of truth

The live database is described by `NEXTPATH-team/schema.sql` plus
`NEXTPATH-team/requirements-fix.sql`. Important facts the active backend must
adapt to:

- `profiles.id` **equals the Supabase Auth user id** (`auth.uid()`). Profiles do
  not have a separate `user_id` column.
- Profile columns used by the engines: `full_name`, `age`, `nationality`,
  `country_of_residence`.
- Related profile data lives in: `education`, `profile_skills`,
  `profile_languages`, `experience`, `interests`, `documents`.
- Eligibility requirements are **rows** in `eligibility_requirements` with
  columns `requirement_type`, `operator`, `value (jsonb)`, `is_mandatory`,
  `display_label`. There is **no** single `opportunities.hard_requirements`
  JSONB column.
- Observed requirement types in production rows: `nationality`,
  `education_level`, `gpa_min`, `age_min`, `age_max`, `language_test_min`,
  `experience_years_min`, `major`, `team_size_min`, `team_size_max`.
- `opportunities` columns include `funding_type`, `location_mode`,
  `location_country`, `verification_status`, `deadline`.
- `applications.status` enum: `('draft', 'ready', 'submitted', 'in_review',
  'accepted', 'rejected')` — **six states**, not eight.
- `saved_opportunities` uses a composite primary key `(profile_id,
  opportunity_id)`; there is **no** `id` column.
- Row-level security is already enforced by the schema; the backend never runs a
  migration.

## 3. Architecture rule (non-negotiable)

AI must never decide eligibility or match scores. Two deterministic, pure
engines own every verdict:

- `src/core/eligibility/database-evaluate.ts` — runs against
  `eligibility_requirements` rows; output is one of
  `ELIGIBLE | LIKELY_ELIGIBLE | UNKNOWN | NOT_ELIGIBLE`.
- `src/core/match/database-score.ts` — runs over opportunity text and the
  profile's soft facts; returns an inspectable per-component breakdown
  (`academics`, `skills`, `interests`, `language`) plus `why_this_match` and
  `gaps`. The seven-component pattern from the second reference is documented
  in code but only the four components above are actually present in the live
  database — the rest stay wired through the engine's structured contract.

AI is allowed only to:

- turn natural-language search into structured filters (via
  `src/lib/search/aiAdapter.ts`, which is a no-op by default);
- explain structured backend verdicts in prose;
- draft application text from real profile data.

The AI never returns opportunity rows. The database is the only source of
truth.

## 4. What was preserved from the active backend

- Health endpoint, `src/app/api/health/route.ts`.
- The `service -> pure core engine -> route` layering for eligibility and
  match.
- `evaluateDatabaseEligibility` against `eligibility_requirements` rows.
- The four-state verdict model: `ELIGIBLE | LIKELY_ELIGIBLE | UNKNOWN |
  NOT_ELIGIBLE`.
- The `ApiError` + Zod-error JSON envelope in `src/lib/http.ts`.
- The search endpoint's structured-filter contract.

## 5. What was added

### 5.1 Authentication and per-request Supabase client
- `src/lib/auth.ts` — `requireUser(request)` validates the Bearer token with
  `supabase.auth.getUser` and returns the verified user.
- `src/lib/supabase.ts` — `createUserSupabase(accessToken)` builds a Supabase
  client that sends `Authorization: Bearer ...` on every PostgREST call so RLS
  policies resolve `auth.uid()` to the real student.
- `src/lib/supabase-server.ts` — shared server module that exposes the same
  factory but reads `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  first, falling back to the active backend's env names.

### 5.2 Repository layer
- `src/lib/db/opportunities.ts` — public read-only repository against the live
  schema; maps `opportunities` + nested `organizations`, `eligibility_requirements`,
  `required_documents`.
- `src/lib/db/profiles.ts` — loads the authenticated user's profile and
  related tables.
- `src/lib/db/saved.ts` — `saved_opportunities` repository (uses the live
  composite primary key, not an `id` column).
- `src/lib/db/applications.ts` — `applications` repository using the live six-state
  enum.

### 5.3 Engine additions
- `src/core/eligibility/evaluate.ts` extended with `team_size_min/max`,
  `experience_years_min`, `major` cases so every requirement type observed in the
  live database has a deterministic branch. Unrecognised types return
  `AMBIGUOUS_UNSTATED` and never invent a verdict.
- `src/core/match/database-score.ts` expanded with `interests`, `language`
  weighting that mirrors the seven-component design where the live data allows.

### 5.4 Routes (every route returns a structured JSON envelope)
- `GET  /api/health` — public, no auth.
- `GET  /api/opportunities` — public, structured filters only.
- `GET  /api/opportunities/:id` — public, includes eligibility_requirements +
  required_documents.
- `POST /api/search` — public, accepts either `{ filters: {...} }` (validated)
  or `{ query: "..." }` (delegated to the AI adapter; no-op by default).
- `GET  /api/opportunities/:id/eligibility` — authenticated, returns the
  four-state verdict plus structured checks and "why not?" reasons.
- `GET  /api/opportunities/:id/match` — authenticated, runs only when
  eligibility is not `NOT_ELIGIBLE`. Returns `match: null` plus a short reason
  otherwise.
- `GET  /api/profile` — authenticated, returns the caller's profile.
- `PUT  /api/profile` — authenticated, Zod-validated upsert (against
  `profiles` only; related tables stay out of scope to keep this increment
  reviewable).
- `POST /api/saved` / `DELETE /api/saved/:opportunityId` — authenticated
  write routes. Implemented but **not** executed against the live database
  during verification; tests run only against the mock Supabase client.
- `GET  /api/applications` / `POST /api/applications` / `PATCH
  /api/applications/:id` — authenticated write routes using the live six-state
  enum. Same testing rule as saved opportunities.

### 5.5 AI adapter
- `src/lib/search/aiAdapter.ts` — `AiSearchAdapter` interface, a `noOpAdapter`
  that returns `status: "disabled"` with a stable message, and
  `selectAiAdapter()` which picks a real adapter only when an env var is set.
  The AI extraction path is **only** invoked from `/api/search` when the body
  carries `query` instead of `filters`, and its output is validated by Zod
  before it reaches the SQL builder.

### 5.6 Tests
- Unit tests for both pure engines remain in place and pass.
- New route tests use a shared `src/test/mock-supabase-client.ts` that
  records calls and returns canned results, mirroring the second reference's
  pattern. No test ever talks to a live Supabase project.
- Tests live in `*.test.ts` next to the files they cover.

## 6. What was NOT copied and why

- The second reference's `OpportunityHardRequirements` JSONB shape — replaced by
  per-row `eligibility_requirements`.
- The second reference's `nationality_code / birth_date / soft_facts` profile
  columns — not present in the live schema. The active backend reads
  `nationality`, `age`, `country_of_residence` and the related
  `education / profile_skills / profile_languages / experience / interests`
  tables.
- The second reference's eight-state application state machine
  (`DISCOVERED / SAVED / PREPARING / READY / SUBMITTED / ACCEPTED / REJECTED /
  EXPIRED`) — the live enum has six states (`draft / ready / submitted /
  in_review / accepted / rejected`). The active backend uses the live values.
- The second reference's `saved_opportunities.id` column — the live composite
  primary key is `(profile_id, opportunity_id)`. The route exposes
  `{ profileId, opportunityId, savedAt }`.
- The second reference's `verification_status` columns and `confidence`
  columns — not present in the live schema. The active backend reads
  `verification_status` only (text), never returns a `confidence` field.
- All SQL migrations, `seed.sql`, `seed-expanded.sql`, `requirements-fix.sql`
  — intentionally never run. The live database already contains the
  ~25 opportunities and their requirements.
- The second reference's `__setTestAuthenticate` hook — replaced with a
  module-level mockable Supabase client factory so tests can inject a fake
  client without exporting private symbols.

## 7. Verification (this increment)

The following are run before declaring the increment done. None of them writes
to Supabase.

- `pnpm typecheck` — `tsc --noEmit` on the active backend.
- `pnpm test` — Vitest unit + route tests with mock Supabase.
- `pnpm build` — Next.js production build (only if env is present and the
  build succeeds without contacting the network).
- `curl http://localhost:3000/api/health` — local health probe.
- `curl http://localhost:3000/api/opportunities?page=1&page_size=5` — read-only
  list, only when local env is configured.

If a verification step requires contacting a live Supabase project, that step
is skipped and recorded here with the reason.

## 8. Safety guarantees

- No `.sql` file is ever read for execution, only for inspection of the live
  schema.
- No Supabase mutation is ever performed during verification.
- No `.env.local` content is ever printed, copied, committed, or requested.
- No file in the two reference projects is modified.
- Frontend / AI integration work is intentionally left out of this increment.