# Screenshots

Captures from the running Stage A web prototype — referenced by the top-level README and the deployment doc. Generated reproducibly by `pnpm screenshots` (see [`scripts/screenshots.ts`](../../scripts/screenshots.ts)).

## Files

| File                  | Source                                                  | Notes                                                          |
| --------------------- | ------------------------------------------------------- | -------------------------------------------------------------- |
| `home.png`            | `http://localhost:3001/`                                | Continue-watching + Recently-added shelves + "Your week" rail. |
| `course-detail.png`   | `http://localhost:3001/courses/<id>`                    | Hero + sections list + Course materials right-rail.            |
| `lesson-player.png`   | `http://localhost:3001/courses/<id>/lessons/<lessonId>` | `<video>` + chrome overlay + sections sidebar tabs.            |
| `admin-dashboard.png` | `http://localhost:3001/admin`                           | Stat cards + recent-scans table.                               |

Mobile captures are not yet automated — when the `apps/mobile` Stage A surface is ready, add `mobile-home.png` (default device frame) and wire a Flutter integration-test capture step.

## Capture conventions

- **1440 × 900 viewport** for the web shots.
- **Dark theme by default** (matches the app's `colorMode.preference = 'dark'` in `apps/web/nuxt.config.ts`). Capture light counterparts as `<name>-light.png` only when the surface looks materially different.
- **PNG, lossless.** Aim for under 600 KB per file — run through `pngcrush` or `oxipng` if needed.
- **Reproducible content:** the capture script mocks every API endpoint with deterministic fixtures, so the same data appears across captures regardless of what's in your local Postgres.

## Quick capture flow

The capture script is hermetic — it intercepts every API call with Playwright `route()` and feeds in deterministic fixtures. The only prerequisite is a running SPA dev server (no backend, no database, no seed needed).

```sh
# 1. Start the web dev server (or `docker compose up -d` if you prefer the proxy).
pnpm --filter @app/web dev          # serves http://localhost:3001

# 2. Run the capture script in another terminal.
pnpm screenshots                    # WEB_URL=http://localhost:3001 by default
```

Output lands in this directory. To target the nginx proxy port instead (e.g. when running the full stack via Docker), override the base URL:

```sh
WEB_URL=http://localhost:8080 pnpm screenshots
```

## Updating the README references

The English and Russian READMEs both embed these images via relative `docs/screenshots/<file>.png` paths. When you add or rename a capture, update:

1. The file table above.
2. The capture loop in `scripts/screenshots.ts`.
3. The `![…]` references in `README.md` and `README.ru.md`.
