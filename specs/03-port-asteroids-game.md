# 03 — Port Asteroids Game ("ROCAS")

**State:** Draft
**Depends on:** SPEC 01
**Date:** 2026-08-23

**Objective:** Port the already-built vanilla-JS Asteroids clone from `references/started-games/02-asteroids/game.js` into `/game/rocas/play`, replacing the fake auto-score arena with the real playable canvas game for that one catalog entry.

## Scope

**In:**

- Port `references/started-games/02-asteroids/game.js` (ship, bullets, asteroids, particles, power-up, HUD, state machine) into a canvas-rendering module usable from a React client component, preserving all existing mechanics unchanged: rotation/thrust movement, toroidal wrap, shooting, asteroid splitting (size 3→2→1), particle explosions, the triple-shot power-up (drop chance, duration, TTL, pulsing icon), 3 lives with respawn invincibility flicker, scoring (`POINTS` table), and level progression (`nextLevel`, more asteroids per level).
- Wire this real game into `/game/[id]/play` **only when `id === "rocas"`** (the existing catalog entry: "ROCAS — Pulveriza asteroides en gravedad cero", `data/games.ts`). Every other game id keeps the current fake CRT arena/score-simulation from spec 01 untouched.
- Reuse the existing on-canvas HUD from `game.js` (`drawHUD`, `drawOverlay`) as the only score/lives/level/game-over display for this game — the React top stat row (Jugador/Puntuación/Vidas/Nivel boxes) is hidden for the `rocas` branch.
- Keep the existing CRT frame chrome (rounded bezel, scanlines, `crt-bottom` status line) and the existing PAUSA/FIN/SALIR buttons, retargeted to control the real game instance instead of the fake interval.
- Keep the existing game-over modal (name input, GUARDAR PUNTUACIÓN, `saveScore` call, "PUNTUACIÓN GUARDADA" toast, JUGAR DE NUEVO / VOLVER AL VAULT) driven by the real final score.
- Canvas keeps its native 800×600 internal resolution (matches `.crt-screen`'s existing 4:3 `aspect-ratio`) and is scaled to fill the container via CSS.

**Not in scope (explicitly deferred):**

- Any other reference game (`03-tetris`, `04-arkanoid`) — this spec covers only Asteroids/"rocas".
- Touch/mobile controls — keyboard-only (`←` `→` `↑` `Space`), matching the original README; no on-screen buttons added.
- A generic "real game vs. fake game" registry/plugin system — the branch is a hardcoded `game.id === "rocas"` check, since only one game is being ported.
- Changing `data/games.ts` catalog content (title/description/cover/color) for `rocas` — it already matches.
- Real leaderboard/backend wiring — `saveScore` keeps calling the existing spec-01 stub; no Supabase changes (spec 02 is unaffected).
- Sound effects — the reference `game.js` has none to port.
- Changing the level-selection UX, difficulty tuning, or any gameplay rebalancing — ported verbatim from the reference.

## Data model

No new persisted data structures. `saveScore({ gameId: "rocas", playerName, score })` continues to use the existing `ScoreEntry` shape from `data/scores.ts` (spec 01) — only the source of `score` changes, from the fake interval to the real game's final score.

## Implementation plan

1. Create `app/components/games/asteroids-engine.ts`: port `game.js`'s classes (`Bullet`, `Asteroid`, `PowerUp`, `Ship`, `Particle`) and free functions (`spawnAsteroids`, `initGame`, `nextLevel`, `explode`, `killShip`, `update`, `draw`, `drawHUD`, `drawOverlay`) into a factory function `createAsteroidsGame(canvas: HTMLCanvasElement)` that closes over per-instance state (no module-level globals) and returns `{ start(), pause(), resume(), forceGameOver(), reset(), dispose() }`. Accept an `onGameOver: (score: number) => void` callback fired exactly once when `lives` reaches 0, instead of drawing to a shared global `score`/`state`. Disable the reference's internal `Space`-to-restart-on-gameover handling (`state === 'gameover'` branch in `update`) since restart is driven by React only.
2. Inside the factory, attach `keydown`/`keyup` listeners scoped to the instance (added in `start()`, removed in `dispose()`), and call `event.preventDefault()` for `ArrowLeft`/`ArrowRight`/`ArrowUp`/`Space` to stop page scroll while playing.
3. `pause()`/`resume()` stop/restart the `requestAnimationFrame` loop (freeze `dt`) without touching game state, so `resume()` continues exactly where it left off. `forceGameOver()` sets `lives = 0` and routes through the existing `killShip()` → `state = 'gameover'` path so the on-canvas "GAME OVER" overlay and the `onGameOver` callback both fire normally.
4. Create `app/components/asteroids-player-client.tsx` ("use client"): renders a `<canvas width={800} height={600}>` styled to fill `.crt-screen` (CSS `width:100%; height:100%`), mounts `createAsteroidsGame` in a `useEffect` (`dispose()` on unmount), exposes local `over`/`finalScore` state set by `onGameOver`, and renders the CRT frame + PAUSA/FIN/SALIR buttons + game-over modal (name input, `saveScore`, toast, JUGAR DE NUEVO calling `reset()` + clearing `over`) — reusing the existing markup/classes from `game-player-client.tsx`'s CRT block and modal, minus the top HUD stat row.
5. Update `app/components/game-player-client.tsx` (or its caller, `app/game/[id]/play/page.tsx`): branch on `game.id === "rocas"` to render `AsteroidsPlayerClient` instead of the existing fake-arena `GamePlayerClient` body; all other ids render unchanged.
6. Manually playtest in a browser: rotate/thrust/shoot, confirm wrap-around, asteroid splitting, particle explosions, triple-shot power-up pickup and expiry, life loss + respawn flicker, level-up after clearing asteroids, PAUSA freezes/resumes cleanly, FIN forces immediate game-over with the current score, save-score flow writes through `saveScore` and shows the toast, JUGAR DE NUEVO fully resets, and that page scroll doesn't happen when pressing arrows/space during play.
7. Run `npm run lint` and `npm run build`.

## Acceptance criteria

- [ ] Visiting `/game/rocas/play` renders the real canvas Asteroids game (not the fake CSS arena); every other `/game/[id]/play` route is visually/behaviorally unchanged from spec 01.
- [ ] Ship rotates (`←`/`→`), thrusts (`↑`), and shoots (`Space`); all positions wrap toroidally; arrow/space keypresses don't scroll the page while the game is mounted.
- [ ] Large asteroids split into medium then small on hit; small asteroids are destroyed outright; score increases per the original `POINTS` table.
- [ ] Triple-shot power-up occasionally spawns on kill, can be picked up, visibly expires, and grants the 3-bullet spread while active.
- [ ] Losing a life triggers the respawn flicker/invincibility; losing the 3rd life ends the run.
- [ ] Clearing all asteroids advances to the next level with more asteroids, matching the reference's `nextLevel` behavior.
- [ ] On-canvas HUD shows live score/level/lives/power-up timer; the React top stat row (Jugador/Puntuación/Vidas/Nivel boxes) is not rendered for `rocas`.
- [ ] PAUSA freezes the game (no update/draw progress) and resumes exactly where it left off; FIN immediately ends the run using the current score.
- [ ] On game over (via lives reaching 0 or FIN), the existing name-input + GUARDAR PUNTUACIÓN modal appears with the real final score, `saveScore({ gameId: "rocas", ... })` is called and resolves to the "PUNTUACIÓN GUARDADA" toast.
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
- **No sound, no touch controls, no gameplay rebalancing** — this spec is a faithful port of already-working, already-tuned code; the goal is integration, not redesign.

## Identified risks

- **React StrictMode double-mount in dev**: `useEffect` runs twice in development, which could attach duplicate `keydown`/`keyup` listeners or start two `requestAnimationFrame` loops if `dispose()` isn't called correctly between the two mounts — verify by checking for doubled input effects (e.g., double rotation speed) during manual playtest in dev mode.
- **CSS canvas scaling vs. crisp rendering**: scaling an 800×600 canvas via CSS to fit a responsive `.crt-screen` can blur or misalign mouse-independent (keyboard-only) rendering at non-integer scale factors — acceptable here since there's no pointer input to misalign, but verify visually at a few viewport widths.
- **Focus stealing**: `preventDefault()` on arrow keys/space needs the keydown listener active only while this route is mounted, or it will interfere with browser navigation/scrolling on every other page — mitigated by attaching/removing listeners in the engine's `start()`/`dispose()`, tied to the component's mount lifecycle.
