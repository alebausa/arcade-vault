# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault (`README.md`): a platform to play games online and compete for
high scores. The project follows Spec Driven Design via the `/spec` and
`/spec-impl` workflow from https://github.com/Klerith/fernando-skills
(installed with `npx skills@latest add Klerith/fernando-skills`).

The app is built out via three implemented specs (`specs/01-mvp-screens.md`,
`specs/02-supabase-integration.md`, `specs/03-port-asteroids-game.md`) —
check `specs/` before assuming something is still a stub.

### Routes and structure

- `/` — library (`app/page.tsx`, `library-client.tsx`).
- `/game/[id]` — game detail (`app/game/[id]/page.tsx`).
- `/game/[id]/play` — game player (`app/game/[id]/play/page.tsx`,
  `game-player-client.tsx`). Every game except `rocas` still uses spec 01's
  fake auto-incrementing score arena.
- `/login` — auth screen (in-memory session only, see
  `app/lib/session.tsx`; no real Supabase Auth yet).
- `/leaderboard` — hall of fame, reads real rows from Supabase for every
  game via `data/scores.ts`.
- `data/` — repository layer (`games.ts`, `categories.ts`, `scores.ts`,
  `users.ts`). `scores.ts` is real (Supabase `insert`/`select`); the rest
  are still in-memory/seed data ported from `data.jsx`.
- `lib/supabase/client.ts` / `server.ts` — browser/server Supabase client
  factories (`@supabase/ssr`). `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` live in `.env.local` (gitignored);
  see `.env.example`.

### ROCAS — the one real game

`/game/rocas/play` renders `app/components/asteroids-player-client.tsx`,
which mounts a real canvas Asteroids clone from
`app/components/games/asteroids-engine.ts` (ported from
`references/started-games/02-asteroids/game.js`, restyled to the neon
palette). Its final score is saved for real via `saveScore()` into the
Supabase `scores` table (see spec 03 for the schema and RLS policies —
currently open/anonymous insert+select, no auth yet). Every other
`/game/[id]/play` route is still spec 01's fake arena.

### Design/gameplay reference (not live code)

`references/` holds prototype/reference material, not imported anywhere
under `app/` except where explicitly ported per a spec:

- `references/templates/` — the original standalone HTML/vanilla-React
  mockup of the Arcade Vault UI (`app.jsx`, `nav.jsx`, `auth.jsx`,
  `biblioteca.jsx`, `detalle.jsx`, `reproductor.jsx`, `salon.jsx`,
  `data.jsx`, `styles.css`, `Arcade Vault.html`). Spec 01 ported this into
  `app/`; treat it as historical UX reference now that the real pages exist.
- `references/started-games/` — standalone vanilla-JS game prototypes
  (`02-asteroids`, `03-tetris`, `04-arkanoid`). Only `02-asteroids` has been
  ported so far (spec 03); `03-tetris` and `04-arkanoid` are unported and
  available for a future spec.

## Commands

```bash
npm run dev      # start dev server (Turbopack, per next dev conventions)
npm run build    # production build
npm run start    # run production build
npm run lint     # ESLint (flat config, eslint-config-next core-web-vitals + typescript)
```

No test runner is configured yet.

## Skills

Always use `/frontend-design` to design user interfaces.

## Supabase

Schema/RLS changes go through the `mcp__supabase__*` tools (`list_tables`,
`apply_migration`, `get_advisors`, `execute_sql`, etc.), not hand-written
SQL files — there's no local migrations directory in this repo. Check
`mcp__supabase__get_advisors` after any RLS-affecting change.

## Architecture notes

- Next.js **16.3.2** App Router, React **19.2.8**, Tailwind CSS **4** (via
  `@tailwindcss/postcss`), TypeScript, path alias `@/*` → repo root.
- **This Next.js version has breaking changes from what training data
  assumes.** Before writing App Router code (layouts, pages, routing types,
  data fetching, etc.), read the relevant guide under
  `node_modules/next/dist/docs/` and follow any deprecation notices there.
  Example already in the codebase: `app/layout.tsx`'s `RootLayout` uses the
  generated `LayoutProps<"/">` type instead of a hand-written props type —
  check current docs before adding/changing layouts or pages rather than
  reusing older Next.js patterns.
- `eslint.config.mjs` is flat-config ESLint; `.next/`, `out/`, `build/`, and
  `next-env.d.ts` are ignored.
