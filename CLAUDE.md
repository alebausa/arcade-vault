# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault (`README.md`): a platform to play games online and compete for
high scores. The project follows Spec Driven Design via the `/spec` and
`/spec-impl` workflow from https://github.com/Klerith/fernando-skills
(installed with `npx skills@latest add Klerith/fernando-skills`).

The app is currently a fresh `create-next-app` scaffold — `app/page.tsx` and
`app/layout.tsx` still hold the default template content and have not been
built out yet.

### Design reference (not live code)

`resources/templates/` contains a standalone HTML/vanilla-React prototype of
the intended Arcade Vault UI — it is reference/mockup material, not part of
the Next.js build (not imported anywhere under `app/`):

- `app.jsx` — root component with hash-based routing (`route` state synced to
  `location.hash`) and `localStorage`-backed auth/session (`av_user`) and
  score persistence (`av_scores`)
- `nav.jsx`, `auth.jsx` — navigation shell and login/signup
- `biblioteca.jsx` — game library/browse view
- `detalle.jsx` — game detail view
- `reproductor.jsx` — game player view
- `salon.jsx` — leaderboard/hall of fame view
- `data.jsx` — shared mock data (`GAMES` catalog: id, title, category,
  cover, color theme, best score, play count, etc.)
- `styles.css` — prototype styling
- `Arcade Vault.html` — static shell that wires the above together outside
  of Next.js

When implementing real pages/routes, treat this directory as the UX/data
spec to port into `app/` (Next.js App Router, Server Components, real
routing) rather than code to import directly.

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
