# 02 — Supabase Integration (Base Setup)

**State:** Approved
**Depends on:** none
**Date:** 2026-08-23

**Objective:** Wire up the Supabase SDK (browser + server clients, env config) into the Next.js app and verify the project connects, without changing the `/data` layer, auth, or any schema yet.

## Scope

**In:**

- Install `@supabase/supabase-js` and `@supabase/ssr`.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` (gitignored via the existing `.env*` rule) — already added by the user, sourced from the connected Supabase project.
- Add `.env.example` documenting the required variables with placeholder values (safe to commit).
- Create `lib/supabase/client.ts` — browser client factory (`createBrowserClient` from `@supabase/ssr`).
- Create `lib/supabase/server.ts` — server client factory (`createServerClient` from `@supabase/ssr`, reading/writing cookies via `next/headers`), for use in Server Components/Route Handlers.
- A one-time connectivity check proving both clients can reach the Supabase project (see Acceptance criteria) — removed or kept minimal, not a permanent feature.

**Not in scope (explicitly deferred):**

- Any database schema/tables — `public` currently has 0 tables; table design is a future spec.
- Swapping `/data`'s in-memory implementation (`data/games.ts`, `data/scores.ts`, `data/users.ts`) for real Supabase queries — future spec, once a schema exists.
- Real authentication (Supabase Auth email/password, sessions, `middleware.ts` session refresh) — future spec; `SessionProvider`'s in-memory session from spec 01 is untouched.
- Row Level Security policies — nothing to secure yet since there are no tables.
- Any UI changes.

## Data model

No new data structures — no tables exist yet and none are created by this spec.

## Implementation plan

1. Run `npm install @supabase/supabase-js @supabase/ssr`.
2. ~~Add env vars to `.env.local`~~ — already done by the user (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`); just confirm both are present and non-empty before continuing.
3. Create `.env.example` with the same variable names as placeholders (`NEXT_PUBLIC_SUPABASE_URL=`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=`), no real values.
4. Create `lib/supabase/client.ts` exporting a `createClient()` function that returns a browser Supabase client via `createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!)`.
5. Create `lib/supabase/server.ts` exporting an async `createClient()` function that returns a server Supabase client via `createServerClient(...)`, wired to `next/headers`' `cookies()` for get/set/remove per the current `@supabase/ssr` App Router pattern — check `node_modules/next/dist/docs/` per `AGENTS.md` for any App Router API differences before writing the cookie-handling code.
6. Add a temporary verification: a Server Component or script that calls the server client (e.g. `supabase.auth.getSession()` or an equivalent lightweight call) and logs/renders success vs. connection error, used to confirm step 7's acceptance criteria, then removed (or left as a minimal `/api/health` route if the user prefers — decide at implementation time, not part of this spec's required scope).
7. Run `npm run lint` and `npm run build` to confirm nothing breaks with the new dependencies and env var usage.

## Acceptance criteria

- [ ] `@supabase/supabase-js` and `@supabase/ssr` appear in `package.json` dependencies.
- [ ] `.env.local` contains `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with real values from the connected project.
- [ ] `.env.example` exists, is committed, and lists both variable names with no real values.
- [ ] `lib/supabase/client.ts` and `lib/supabase/server.ts` exist and export working client factories.
- [ ] A connectivity check (browser or server client) successfully reaches the Supabase project with no auth/network error, confirming the URL and anon key are correct.
- [ ] No `/data` file, page, or component is modified — this spec only adds new files plus env/dependency changes.
- [ ] `npm run lint` and `npm run build` both pass.

## Decisions taken and discarded

- **Install `@supabase/ssr` now even though auth isn't implemented yet** — chosen over installing only `@supabase/supabase-js` so the server-side client pattern (cookie-aware, App Router-correct) is in place before the auth spec needs it, avoiding a later refactor of how the client is constructed.
- **No `middleware.ts` in this spec** — session-refresh middleware is only meaningful once real Supabase Auth exists; adding it now would be dead code. Deferred to the auth spec.
- **No database schema in this spec** — user explicitly wants integration (SDK, env, clients, connectivity) separated from schema design, which will be specified in detail in a future spec.
- **Verification step is temporary/minimal, not a permanent feature** — this spec's job is proving the plumbing works, not shipping a health-check endpoint; whether to keep a minimal `/api/health` route is left to implementation-time judgment rather than mandated here.

## Identified risks

- **Env var exposure**: `NEXT_PUBLIC_*` vars are bundled client-side by Next.js — only the publishable key (safe to expose) goes there; any future service-role/secret key must stay non-`NEXT_PUBLIC_` and server-only.
- **App Router API drift**: `@supabase/ssr`'s documented cookie-handling pattern for Server Components may not match Next.js 16.3.2's current `cookies()`/`next/headers` API — verify against `node_modules/next/dist/docs/` before implementing `lib/supabase/server.ts`, per the project's standing AGENTS.md instruction.
