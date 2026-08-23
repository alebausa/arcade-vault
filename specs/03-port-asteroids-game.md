# 03 — Port Asteroids Game ("ROCAS")

**State:** Approved
**Depends on:** SPEC 01, SPEC 02
**Date:** 2026-08-23

**Objective:** Port the already-built vanilla-JS Asteroids clone from `references/started-games/02-asteroids/game.js` into `/game/rocas/play`, replacing the fake auto-score arena with the real playable canvas game for that one catalog entry — restyled to the Arcade Vault neon/CRT palette instead of the reference's plain white-on-black look, with scores persisted for real in Supabase instead of the spec 01 in-memory stub.

## Scope

**In:**

- Port `references/started-games/02-asteroids/game.js` (ship, bullets, asteroids, particles, power-up, HUD, state machine) into a canvas-rendering module usable from a React client component, preserving all existing mechanics unchanged: rotation/thrust movement, toroidal wrap, shooting, asteroid splitting (size 3→2→1), particle explosions, the triple-shot power-up (drop chance, duration, TTL, pulsing icon), 3 lives with respawn invincibility flicker, scoring (`POINTS` table), and level progression (`nextLevel`, more asteroids per level).
- Restyle every canvas draw call from the reference's plain white-on-black look to the Arcade Vault neon palette (`app/globals.css` `:root` vars), so the ported game reads as part of the same product rather than a pasted-in prototype:
  - Ship, bullets, asteroid outlines, life icons, and HUD text switch from `'#fff'` to `--cyan` (`#00f5ff`), matching this game's other neon UI accents, with a `ctx.shadowColor`/`ctx.shadowBlur` glow (mirroring the `.neon-cyan` text-shadow treatment) instead of flat strokes.
  - Thruster flame stays warm (orange/`--gold` `#ffcf3a`) for contrast against the cyan ship, as in the original.
  - The triple-shot power-up keeps its existing cyan (`#0ff`) styling — it already matches the palette — but the pulsing box gets the same glow treatment for consistency.
  - Particle explosions shift from white to `--yellow` (`#f5ff00`), giving hits a distinct "impact" color from the cyan ship/asteroids.
  - HUD/overlay text (`drawHUD`, `drawOverlay`) uses the vault's pixel font stack (`--pixel`, i.e. `var(--font-pixel), system-ui, monospace`) instead of bare `monospace`, sized/positioned as in the reference.
  - Canvas background stays solid black (`ctx.fillRect` `#000`), matching `.crt-screen`'s existing black backdrop — no change needed there.
- Wire this real game into `/game/[id]/play` **only when `id === "rocas"`** (the existing catalog entry: "ROCAS — Pulveriza asteroides en gravedad cero", `data/games.ts`). Every other game id keeps the current fake CRT arena/score-simulation from spec 01 untouched.
- Reuse the existing on-canvas HUD from `game.js` (`drawHUD`, `drawOverlay`) as the only score/lives/level/game-over display for this game — the React top stat row (Jugador/Puntuación/Vidas/Nivel boxes) is hidden for the `rocas` branch.
- Keep the existing CRT frame chrome (rounded bezel, scanlines, `crt-bottom` status line) and the existing PAUSA/FIN/SALIR buttons, retargeted to control the real game instance instead of the fake interval.
- Keep the existing game-over modal (name input, GUARDAR PUNTUACIÓN, `saveScore` call, "PUNTUACIÓN GUARDADA" toast, JUGAR DE NUEVO / VOLVER AL VAULT) driven by the real final score.
- Canvas keeps its native 800×600 internal resolution (matches `.crt-screen`'s existing 4:3 `aspect-ratio`) and is scaled to fill the container via CSS.
- **Real Supabase persistence for scores**, replacing the spec-01 in-memory stub in `data/scores.ts`:
  - Create a `scores` table in the connected Supabase project (see Data model) via a migration.
  - Rewrite `saveScore()` to `insert` a row into `scores` using the browser Supabase client (`lib/supabase/client.ts`) — it's called from client components (`asteroids-player-client.tsx`, and the existing `game-player-client.tsx` for every other game), so it keeps writing real rows for all games, not just `rocas`.
  - Rewrite `getLeaderboard()` to `select` from `scores` (filtered by `gameId`, ordered by `score` desc, limited) instead of returning `seededScores()`. This is a shared data-layer change — it affects `/leaderboard` for every game, not only `rocas` — since `data/scores.ts` has one implementation used everywhere; keeping a fake path for other games and a real path for `rocas` would split the data layer for no benefit.
  - Add minimal RLS policies on `scores` allowing public `insert` and `select` — there is no real auth yet (spec 02 explicitly deferred it), so anon read/write is the only option that keeps the app working end to end; tightened once real auth exists.

**Not in scope (explicitly deferred):**

- Any other reference game (`03-tetris`, `04-arkanoid`) — this spec covers only Asteroids/"rocas".
- Touch/mobile controls — keyboard-only (`←` `→` `↑` `Space`), matching the original README; no on-screen buttons added.
- A generic "real game vs. fake game" registry/plugin system — the branch is a hardcoded `game.id === "rocas"` check, since only one game is being ported.
- Changing `data/games.ts` catalog content (title/description/cover/color) for `rocas` — it already matches.
- Real Supabase Auth, user-scoped RLS, or per-player score ownership — `scores` rows stay anonymous (`playerName` is just free-text input), matching the existing name-input flow; tightening RLS to auth-scoped writes is future work once spec 02's auth deferral is picked up.
- Redesigning `/leaderboard`'s layout, podium, or "your rank" panel — only its data source changes (real rows instead of `seededScores()`); the page's existing 3-row minimum guard and layout are untouched.
- Backfilling `/leaderboard` with historical/seed data — once this ships, boards start empty and fill up from real play; no migration of the old fake scores into the new table.
- Sound effects — the reference `game.js` has none to port.
- Changing the level-selection UX, difficulty tuning, or any gameplay rebalancing — ported verbatim from the reference.

## Data model

New Supabase table, `scores`:

```sql
create table public.scores (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  player_name text not null,
  score integer not null check (score >= 0),
  created_at timestamptz not null default now()
);

create index scores_game_id_score_idx on public.scores (game_id, score desc);

alter table public.scores enable row level security;

create policy "Anyone can read scores" on public.scores
  for select using (true);

create policy "Anyone can insert scores" on public.scores
  for insert with check (true);
```

`data/scores.ts`'s existing `ScoreEntry` type (`id`, `gameId`, `playerName`, `score`, `createdAt`) stays the public shape used by callers — `getLeaderboard`/`saveScore` map `game_id`/`player_name`/`created_at` (snake_case Supabase columns) to/from `gameId`/`playerName`/`createdAt` (camelCase `ScoreEntry` fields) so `leaderboard/page.tsx` and `game-player-client.tsx` need no changes. `saveScore({ gameId: "rocas", playerName, score })` now persists a real row instead of an in-memory stub — only the source of `score` changes, from the fake interval to the real game's final score.

## Implementation plan

1. Create `app/components/games/asteroids-engine.ts`: port `game.js`'s classes (`Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle`) and free functions (`spawnAsteroids`, `initGame`, `nextLevel`, `explode`, `killShip`, `update`, `draw`, `drawHUD`, `drawOverlay`) into a factory function `createAsteroidsGame(canvas: HTMLCanvasElement)` that closes over per-instance state (no module-level globals) and returns `{ start(), pause(), resume(), forceGameOver(), reset(), dispose() }`. Accept an `onGameOver: (score: number) => void` callback fired exactly once when `lives` reaches 0, instead of drawing to a shared global `score`/`state`. Disable the reference's internal `Space`-to-restart-on-gameover handling (`state === 'gameover'` branch in `update`) since restart is driven by React only. While porting `draw`/`drawHUD`/`drawOverlay`/`Particle.draw`/`Ship.draw`, apply the neon restyle from Scope (cyan strokes + glow, gold thruster flame, yellow particles, `--pixel` font for HUD text) in place of the reference's `'#fff'`/bare-`monospace` styling.
2. Inside the factory, attach `keydown`/`keyup` listeners scoped to the instance (added in `start()`, removed in `dispose()`), and call `event.preventDefault()` for `ArrowLeft`/`ArrowRight`/`ArrowUp`/`Space` to stop page scroll while playing.
3. `pause()`/`resume()` stop/restart the `requestAnimationFrame` loop (freeze `dt`) without touching game state, so `resume()` continues exactly where it left off. `forceGameOver()` sets `lives = 0` and routes through the existing `killShip()` → `state = 'gameover'` path so the on-canvas "GAME OVER" overlay and the `onGameOver` callback both fire normally.
4. Create `app/components/asteroids-player-client.tsx` ("use client"): renders a `<canvas width={800} height={600}>` styled to fill `.crt-screen` (CSS `width:100%; height:100%`), mounts `createAsteroidsGame` in a `useEffect` (`dispose()` on unmount), exposes local `over`/`finalScore` state set by `onGameOver`, and renders the CRT frame + PAUSA/FIN/SALIR buttons + game-over modal (name input, `saveScore`, toast, JUGAR DE NUEVO calling `reset()` + clearing `over`) — reusing the existing markup/classes from `game-player-client.tsx`'s CRT block and modal, minus the top HUD stat row.
5. Update `app/components/game-player-client.tsx` (or its caller, `app/game/[id]/play/page.tsx`): branch on `game.id === "rocas"` to render `AsteroidsPlayerClient` instead of the existing fake-arena `GamePlayerClient` body; all other ids render unchanged.
6. Use `mcp__supabase__list_tables` to confirm `scores` doesn't already exist, then `mcp__supabase__apply_migration` to create it per the Data model SQL (table, index, RLS enable, the two public policies). Run `mcp__supabase__get_advisors` (security lints) afterward to confirm the intentionally-open RLS policies aren't flagging anything else unexpected.
7. Rewrite `data/scores.ts`: `saveScore()` calls `createClient().from("scores").insert({ game_id, player_name, score }).select().single()` and maps the returned row to `ScoreEntry`; `getLeaderboard()` calls `createClient().from("scores").select("*").eq("game_id", gameId).order("score", { ascending: false }).limit(limit)` and maps rows to `ScoreEntry[]`. Both use the browser client from `lib/supabase/client.ts` since every caller (`asteroids-player-client.tsx`, `game-player-client.tsx`, `leaderboard/page.tsx`) is a client component. Delete `seededScores()`/`PLAYERS`-based mock generation once no longer referenced (confirm `data/users.ts`'s `PLAYERS` export isn't used elsewhere first).
8. Manually playtest in a browser: rotate/thrust/shoot, confirm wrap-around, asteroid splitting, particle explosions, triple-shot power-up pickup and expiry, life loss + respawn flicker, level-up after clearing asteroids, PAUSA freezes/resumes cleanly, FIN forces immediate game-over with the current score, save-score flow writes through `saveScore` and shows the toast, JUGAR DE NUEVO fully resets, and that page scroll doesn't happen when pressing arrows/space during play. Confirm the canvas renders in the cyan/gold/yellow neon palette, not the reference's white-on-black. Confirm a saved score appears in Supabase (`mcp__supabase__execute_sql` `select * from scores order by created_at desc limit 5`) and shows up on `/leaderboard` under the ROCAS tab once ≥3 rows exist for `rocas`.
9. Run `npm run lint` and `npm run build`.

## Acceptance criteria

- [ ] Visiting `/game/rocas/play` renders the real canvas Asteroids game (not the fake CSS arena); every other `/game/[id]/play` route is visually/behaviorally unchanged from spec 01.
- [ ] Ship rotates (`←`/`→`), thrusts (`↑`), and shoots (`Space`); all positions wrap toroidally; arrow/space keypresses don't scroll the page while the game is mounted.
- [ ] Large asteroids split into medium then small on hit; small asteroids are destroyed outright; score increases per the original `POINTS` table.
- [ ] Triple-shot power-up occasionally spawns on kill, can be picked up, visibly expires, and grants the 3-bullet spread while active.
- [ ] Losing a life triggers the respawn flicker/invincibility; losing the 3rd life ends the run.
- [ ] Clearing all asteroids advances to the next level with more asteroids, matching the reference's `nextLevel` behavior.
- [ ] On-canvas HUD shows live score/level/lives/power-up timer; the React top stat row (Jugador/Puntuación/Vidas/Nivel boxes) is not rendered for `rocas`.
- [ ] Ship, asteroids, bullets, and HUD text render in the Arcade Vault neon palette (cyan strokes/glow, `--pixel` HUD font) instead of the reference's plain white-on-black; thruster flame stays warm-colored; explosion particles render yellow.
- [ ] PAUSA freezes the game (no update/draw progress) and resumes exactly where it left off; FIN immediately ends the run using the current score.
- [ ] On game over (via lives reaching 0 or FIN), the existing name-input + GUARDAR PUNTUACIÓN modal appears with the real final score, `saveScore({ gameId: "rocas", ... })` is called and resolves to the "PUNTUACIÓN GUARDADA" toast.
- [ ] `saveScore` persists a real row to the Supabase `scores` table (verifiable via `select * from scores`), not an in-memory stub.
- [ ] `/leaderboard`'s ROCAS tab reflects real saved rows (ordered by score desc) once at least 3 exist; every other game's tab reads from the same real `scores` table via the same `getLeaderboard`, with no seeded/mock data remaining in `data/scores.ts`.
- [ ] `mcp__supabase__get_advisors` reports no unexpected security issues beyond the intentionally-open public insert/select policies on `scores`.
- [ ] JUGAR DE NUEVO fully resets the game (score/lives/level/asteroids) via the engine's `reset()`, without a page reload.
- [ ] Unmounting the play screen (SALIR / navigating away) removes all `keydown`/`keyup` listeners and stops the `requestAnimationFrame` loop — no console warnings or continued input handling after leaving the route.
- [ ] `npm run lint` and `npm run build` both pass.

## Decisions taken and discarded

- **Gate the real game behind a hardcoded `game.id === "rocas"` check** rather than building a generic real-vs-fake game registry — only one game is being ported; a registry is speculative structure for games (Tetris, Arkanoid) not yet in scope.
- **Encapsulate the ported engine in a factory function closing over per-instance state**, rather than keeping `game.js`'s module-level globals — the original relies on a single global `canvas`/`ctx`/`keys`/`ship` etc., which breaks under React (StrictMode double-effects, remounts, potential future multi-instance) unless de-globalized. Mechanics/values are ported verbatim; only the state-scoping changes.
- **On-canvas HUD only, React top stat row hidden for `rocas`** — the reference already draws score/level/lives/power-up timer on canvas (`drawHUD`); duplicating that in React state would require a per-frame bridge for no visual benefit and risks the two numbers drifting.
- **PAUSA/FIN drive the engine directly (freeze loop / force game over) instead of relaying synthetic key events** — keeps one source of truth for game state in the engine instance rather than routing UI actions through the keyboard-input path.
- **Disable the reference's internal Space-to-restart on game over** — restart is exclusively the React "JUGAR DE NUEVO" button calling `reset()`, avoiding two independent restart paths that could leave React's `over` state out of sync with the canvas.
- **Canvas stays fixed at 800×600 internal resolution, scaled via CSS to fill `.crt-screen`** — `.crt-screen` already uses a 4:3 `aspect-ratio` (matching 800×600 exactly), so no changes to the reference's coordinate system, physics constants, or wrap logic are needed.
- **No sound, no touch controls, no gameplay rebalancing** — this spec is a faithful port of already-working, already-tuned code; the goal is integration and restyling, not gameplay redesign.
- **Restyle canvas colors to the vault palette rather than leave the reference's white-on-black** — the reference was a standalone prototype with no shared design system; leaving it unstyled would make `rocas` look like a foreign embed next to the rest of the vault's neon CRT aesthetic. Colors/glow are chosen to match existing CSS vars/utility classes (`--cyan`, `--gold`, `--yellow`, `.neon-cyan`'s shadow treatment) rather than inventing a new palette.
- **Swap `data/scores.ts` to real Supabase for all games, not just a `rocas`-only code path** — `data/scores.ts` is one shared implementation already called by every game's play screen (`game-player-client.tsx` for the fake arenas, the new `asteroids-player-client.tsx` for `rocas`). Branching it per-game would mean maintaining two persistence implementations (real + fake) indefinitely for no reason; a single real implementation is simpler and was already the acknowledged next step deferred by spec 02.
- **Public (unauthenticated) insert/select RLS policies on `scores`** — spec 02 explicitly deferred real Supabase Auth; without it, there's no user identity to scope writes to. Open policies are the only way to keep score-saving working end to end right now. This is a known, temporary gap (any client can write arbitrary rows), acceptable pre-launch and tightened once auth ships.
- **No leaderboard-page redesign, no historical data backfill** — swapping the data source is enough to satisfy "integrated with Supabase"; restyling `/leaderboard` or seeding it with fake historical rows would be scope creep unrelated to porting Asteroids.

## Identified risks

- **React StrictMode double-mount in dev**: `useEffect` runs twice in development, which could attach duplicate `keydown`/`keyup` listeners or start two `requestAnimationFrame` loops if `dispose()` isn't called correctly between the two mounts — verify by checking for doubled input effects (e.g., double rotation speed) during manual playtest in dev mode.
- **CSS canvas scaling vs. crisp rendering**: scaling an 800×600 canvas via CSS to fit a responsive `.crt-screen` can blur or misalign mouse-independent (keyboard-only) rendering at non-integer scale factors — acceptable here since there's no pointer input to misalign, but verify visually at a few viewport widths.
- **Focus stealing**: `preventDefault()` on arrow keys/space needs the keydown listener active only while this route is mounted, or it will interfere with browser navigation/scrolling on every other page — mitigated by attaching/removing listeners in the engine's `start()`/`dispose()`, tied to the component's mount lifecycle.
- **Open RLS policies are spoofable**: any client with the publishable key can insert arbitrary `(game_id, player_name, score)` rows directly, bypassing the game entirely — acceptable for this spec (no auth exists to scope writes to) but a known gap; flagged in Decisions as future hardening once real auth exists.
- **`/leaderboard` starts empty for every game**: since `getLeaderboard` now reads real rows instead of `seededScores()`, and `data/scores.ts` no longer fabricates 12 rows per game, every tab shows nothing (the page's existing `rows.length < 3` guard returns `null`) until real players save ≥3 scores for that game — expected given "real persistence," but a visibly different first-run experience from today's always-populated boards; worth flagging to the user/reviewer since it affects every game's leaderboard tab, not just ROCAS.
- **Type drift between `ScoreEntry` and the Supabase `scores` schema**: hand-mapping snake_case columns to the camelCase `ScoreEntry` shape in `data/scores.ts` can silently drift from the table if the schema changes later — consider running `mcp__supabase__generate_typescript_types` and diffing against the manual mapping if this becomes a maintenance point in a future spec.
