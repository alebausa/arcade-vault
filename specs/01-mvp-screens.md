# 01 — MVP Screens (Visual Port)

**State:** Approved
**Depends on:** none
**Date:** 2026-08-23

**Objective:** Port the five reference-mockup screens (library, game detail, game player, auth, hall of fame) from `references/templates/` into real Next.js App Router pages, visual/interactive-only with no real games and no persisted data.

## Scope

**In:**
- Five routed pages, each a faithful visual/interaction port of its `references/templates/*.jsx` counterpart:
  - `/` — Library (`biblioteca.jsx`): hero, search, category chips, game grid/cards.
  - `/game/[id]` — Game Detail (`detalle.jsx`): cover, tags, description, stat strip, leaderboard aside, "play now" CTA.
  - `/game/[id]/play` — Game Player (`reproductor.jsx`): HUD, CRT frame with the existing fake arena animation, pause/end controls, game-over modal with a name field and a "save score" button.
  - `/login` — Auth (`auth.jsx`): sign-in/sign-up tabs, guest entry, social button mockups.
  - `/leaderboard` — Hall of Fame (`salon.jsx`): per-game tabs, podium, ranking table.
- A persistent Nav (`nav.jsx`) rendered in the root layout on every route, including the mobile hamburger panel.
- An in-memory session (React context) so that logging in/guest-entering on `/login` updates the Nav's logged-in state across client-side navigation for the rest of that browser session.
- Porting `data.jsx` (`GAMES`, `CATS`, `PLAYERS`, `seededScores`) into a `/data` mock repository layer, structured so a later spec can swap the in-memory implementation for real database calls without changing call sites.
- Wiring the game-over "save score" button to a fake success state via a `/data` repository stub (`saveScore`) that resolves like a real write but persists nothing.
- Reusing `app/globals.css` (already ported from `styles.css`) and the fonts/background layers already wired in `app/layout.tsx`.

**Not in scope (explicitly deferred):**
- Any real game logic — the player screen keeps the prototype's fake auto-incrementing score loop, nothing more.
- Real authentication (no backend, no password checks, no accounts).
- Any persistence — no `localStorage`, no database, no cookies. Reloading a page always resets to logged-out/default state.
- Real per-game leaderboards backed by actual play data — `seededScores` mock generation is kept as-is.
- Wiring an actual database or ORM — the `/data` layer is DB-*shaped* (async repository functions, typed records) but still backed by in-memory arrays/generators. Picking and connecting a real database is a later spec.
- Design changes — no new visual design work; this is a straight port of the existing mockup.
- SEO/metadata per route, accessibility audit, automated tests — none requested for this MVP pass.

## Data model

Nothing is actually persisted in this MVP, but the read/write shape is modeled as if a database sat behind it, under `/data`, so a later spec can swap the in-memory backing for real queries without touching call sites. Every `/data` function is `async` (returns a `Promise`) even though it currently resolves synchronously from an in-memory array or generator.

- `data/games.ts`
  - `type Game = { id: string; title: string; short: string; long: string; cat: string; cover: string; color: string; best: number; plays: string }`
  - `GAMES: Game[]` — seed data (from `data.jsx`), module-private.
  - `getGames(): Promise<Game[]>`, `getGameById(id: string): Promise<Game | null>`.
- `data/categories.ts`
  - `CATS: string[]` — category filter list; `getCategories(): Promise<string[]>`.
- `data/scores.ts`
  - `type ScoreEntry = { id: string; gameId: string; playerName: string; score: number; createdAt: string }`
  - `getLeaderboard(gameId: string, limit?: number): Promise<ScoreEntry[]>` — wraps the ported `seededScores(seed, count)` generator (seed derived from `gameId`, as in `detalle.jsx`/`salon.jsx`) to produce deterministic mock rows shaped like real leaderboard records.
  - `saveScore(entry: { gameId: string; playerName: string; score: number }): Promise<ScoreEntry>` — stub matching a future insert call: builds and returns a `ScoreEntry` (generated `id`/`createdAt`) but does not store it anywhere; the caller uses the resolved value only to render the "saved" toast.
- `data/users.ts`
  - `type User = { id: string; name: string; email: string | null; isGuest: boolean; createdAt: string }`
  - `PLAYERS: string[]` — mock name pool (from `data.jsx`), used internally by `data/scores.ts`.
  - `authenticateUser(input: { username: string; password: string }): Promise<User>` and `createGuestUser(): Promise<User>` — stubs matching a future auth call: construct and return a `User` record but do not persist it.
- `app/lib/session.tsx` (client, UI state — not part of `/data`)
  - `SessionProvider` (React context, in-memory `useState`, no storage) + `useSession()` hook exposing `{ user: User | null, login(user: User), logout() }`. The `/login` page calls `data/users.ts`'s stubs and passes the resolved `User` into `useSession().login(...)`.

## Implementation plan

1. Create the `/data` mock repository layer: `data/games.ts`, `data/categories.ts`, `data/scores.ts`, `data/users.ts` per the Data model section above — typed records, async functions, seed content ported from `references/templates/data.jsx` (no `window.*` globals, ES exports, `seededScores` logic kept verbatim inside `data/scores.ts`).
2. Create `app/lib/session.tsx`: client-component `SessionProvider` + `useSession()` hook holding `user: User | null` (imported type from `data/users.ts`) in React state only.
3. Update `app/layout.tsx`: wrap `children` in `SessionProvider`, render the ported `Nav` component above `<main className="av-main">`, and add the footer line from `app.jsx` (`© 2026 ARCADE VAULT · ...`). Keep the existing `av-bg`/`av-noise`/`av-root` structure and fonts as-is.
4. Port `Nav` (`app/components/nav.tsx`, client component): same markup/classes as `nav.jsx`, but `navigate`/`route` replaced by Next.js `<Link>`/`usePathname()`, and `user`/`onSignOut` sourced from `useSession()`.
5. Port the Library screen into `app/page.tsx` (async server component fetching `getGames()`/`getCategories()`, with a client child for search/filter state): hero, search input, category chips, `GameCard` grid; card click routes to `/game/[id]` via `<Link>`.
6. Port Game Detail into `app/game/[id]/page.tsx` (async server component): `await getGameById(id)`, render cover/tags/description/stat-strip, and a leaderboard aside from `await getLeaderboard(id)`; "JUGAR AHORA" links to `/game/[id]/play`. Missing/`null` game calls `notFound()`.
7. Port Game Player into `app/game/[id]/play/page.tsx` (client component): HUD, CRT arena (ported markup/animations unchanged), pause/end controls, game-over modal with local score/name state; the save button calls `saveScore(...)` from `data/scores.ts` and shows the "saved" toast once the promise resolves — the resolved value is not written anywhere else. Player name defaults to the in-memory session user's name, else `"INVITADO"`.
8. Port Auth into `app/login/page.tsx` (client component): sign-in/sign-up tabs, guest button; submitting any of the three paths calls `authenticateUser(...)` or `createGuestUser()` from `data/users.ts`, passes the resolved `User` into `useSession().login(...)`, and routes to `/`.
9. Port Hall of Fame into `app/leaderboard/page.tsx` (client component, or server component + client tabs): per-game tabs (from `getGames()`), podium, ranking table from `getLeaderboard(gameId)`, "your score" row shown only when `useSession().user` is set.
10. Remove the leftover `create-next-app` boilerplate content (the old `app/page.tsx` default markup, `public/next.svg`/`vercel.svg` if now unused).
11. Run `npm run lint` and `npm run build`; manually click through Library → Detail → Play → (game over → save score) → Leaderboard → Login → back to Library, confirming Nav reflects the in-memory session and resets on a hard reload.

## Acceptance criteria

- [ ] `/`, `/game/[id]`, `/game/[id]/play`, `/login`, `/leaderboard` all render and are reachable via the Nav and in-page links, with no dead links between the five screens.
- [ ] `/game/does-not-exist` renders a not-found result instead of crashing.
- [ ] Library search input and category chips filter the visible game grid client-side.
- [ ] Game Detail page shows the correct game's title/description/stats and a leaderboard list for that game's id.
- [ ] Game Player page's score increases automatically while not paused, pause/resume toggles the ticker, "FIN" opens the game-over modal, and the modal's save button shows the "saved" toast without writing to `localStorage` or any storage (verified by inspecting Application storage in devtools).
- [ ] Submitting the login form (sign-in, sign-up, or "guest") updates the Nav to show the username (or "INVITADO"/guest state per the prototype) on every route reached via in-app navigation, and a hard page reload resets the Nav back to logged-out.
- [ ] Hall of Fame's "your score" row only appears when a session user is set.
- [ ] `npm run lint` and `npm run build` both pass with no new errors.
- [ ] No `localStorage`, `sessionStorage`, or cookie writes occur anywhere in the ported screens.
- [ ] All catalog/leaderboard/auth reads and writes go through `/data` functions (`getGames`, `getGameById`, `getCategories`, `getLeaderboard`, `saveScore`, `authenticateUser`, `createGuestUser`) — no page imports `GAMES`/`PLAYERS` arrays directly.
- [ ] Every `/data` function returns a `Promise` and is called with `await`.

## Decisions taken and discarded

- **Port `styles.css` as global CSS almost verbatim, keep prototype class names** — rejected rebuilding with Tailwind utilities to avoid visual drift from the mockup and extra effort; this was already done in `app/globals.css`/`app/layout.tsx` before this spec was written, confirmed to match the decision.
- **English route slugs** (`/game/[id]`, `/login`, `/leaderboard`) over Spanish ones — chosen for codebase consistency even though UI copy stays in Spanish.
- **Keep the player screen's fake auto-incrementing score loop** rather than a static mockup — matches "implement all the screens" while explicitly not building real game logic.
- **No persistence anywhere** (no `localStorage`/database for session or scores) — session state lives only in a React context in memory, reset on reload; `saveScore`/`authenticateUser`/`createGuestUser` fake success (resolve with a constructed record) without writing anything, since there is nowhere to persist to under this decision.
- **In-memory session across client-side navigation** — a `SessionProvider` context (not per-page state) so the Nav stays consistent while navigating within the app, without introducing real persistence.
- **Mock data lives behind a `/data` repository layer shaped like a future database** (typed records, async `get`/`save` functions) instead of plain imported constants — chosen over inline constants so a later spec can swap the in-memory implementation for real DB queries without touching call sites in pages/components. Covers both read data (games/categories/scores) and the shape of writes (`saveScore`, `authenticateUser`, `createGuestUser`), even though nothing is actually persisted yet.
- **Async repository functions over sync ones** — every `/data` function returns a `Promise`, even though it currently resolves instantly from an in-memory array/generator, so call sites already `await` and won't need changes when a real (async) database call replaces the in-memory implementation.

## Identified risks

- **CSS/JS behavior fidelity**: some prototype interactions (card tilt-on-mouse, CRT scanline animation, typewriter toast) rely on inline style manipulation via refs — needs care porting from vanilla React (`app.jsx`'s `React.useState`/`window.*` globals) to Next.js client components without behavior drift.
- **Client/Server component boundaries**: most screens need `"use client"` for interactivity (search, tabs, hover, timers); mis-marking a component server-side will break hooks silently — verify each ported file compiles and behaves under Next.js 16.3.2's App Router conventions (check `node_modules/next/dist/docs/` per `AGENTS.md` before writing routing/layout code, since this version diverges from training-data assumptions).
- **Over-modeling risk**: `data/users.ts`'s `authenticateUser`/`createGuestUser` and `data/scores.ts`'s `saveScore` are typed and async for a database that doesn't exist yet — if the eventual DB schema differs (e.g. different `User`/`ScoreEntry` fields), these types get replaced rather than reused, but the call-site shape (`await save/authenticate(...)`) should still hold.
