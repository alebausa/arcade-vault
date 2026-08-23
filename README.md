## Arcade Vault

Es una plataforma para jugar online y competir por la mayor cantidad de puntos.

## Stack

Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + TypeScript, con
Supabase como backend (auth por implementar, scores persistidos en tabla
`scores`).

## Estado actual

- `/` biblioteca, `/game/[id]` detalle, `/game/[id]/play` jugador, `/login`,
  `/leaderboard` — todas portadas de `references/templates/` a Next.js real.
- Supabase conectado (`lib/supabase/client.ts`, `lib/supabase/server.ts`).
- **ROCAS** (`/game/rocas/play`) es el único juego real por ahora: clon de
  Asteroids portado desde `references/started-games/02-asteroids/`, con
  puntajes guardados de verdad en Supabase. El resto del catálogo sigue
  usando el arena/HUD falso de la maqueta.
- `/leaderboard` lee puntajes reales desde Supabase para todos los juegos.

Ver `specs/` para el detalle de cada entrega (01 MVP screens, 02 integración
Supabase, 03 port de Asteroids).

## Comandos

```bash
npm run dev      # servidor de desarrollo (Turbopack)
npm run build    # build de producción
npm run start    # levanta el build de producción
npm run lint     # ESLint
```

## Usa Spec Driven Design

Basado en /spec y /spec-impl

Siguiendo las buenas practicas recomendadas aquí:
https://github.com/Klerith/fernando-skills

## Skills usadas

```bash
npx skills@latest add Klerith/fernando-skills
```
