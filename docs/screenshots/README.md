# Screenshots

Captures from the running Stage A prototypes — referenced by the top-level README and the deployment doc.

## Files

| File | Source | Notes |
|---|---|---|
| `home.png` | `http://localhost:8080/` (signed in) | Browse + recent + continue-watching shelves. |
| `course-detail.png` | `http://localhost:8080/courses/<slug>` | Hero + sections list + materials right-rail. |
| `lesson-player.png` | `http://localhost:8080/lessons/<id>` | `<video>` + chrome overlay + bookmarks panel. |
| `admin-dashboard.png` | `http://localhost:8080/admin` | Stat cards + recent-scans table. |
| `mobile-home.png` | iOS / Android simulator | Home tab — apps/mobile Stage A. |

## Capture conventions

- 1440 × 900 viewport for web; default device frame for mobile.
- Light theme by default; capture dark counterparts as `<name>-dark.png` only when the surface looks materially different.
- PNG, lossless. Aim for under 600 KB per file — run through `pngcrush` or `oxipng` if needed.
- Reproducible content: seed the local stack via `pnpm seed:demo` (when available) so the same fixtures appear across captures.

## Quick capture flow

```sh
docker compose -f docker/compose.yml up -d
# wait until http://localhost:8080/api/v1/health responds 200
pnpm seed:demo               # optional — fills the catalog with deterministic fixtures
open http://localhost:8080
# Cmd+Shift+4 (macOS) → window mode → save as docs/screenshots/<name>.png
```

For automated captures, the Playwright config in `tests/e2e/` can drive a headless Chromium against the running stack — extend `playwright.config.ts` with a `screenshot` project once the seed fixtures land.

## Updating the README references

The README's **Screenshots** section embeds these images via relative paths (`docs/screenshots/<file>.png`). When you add a new capture, also add a row to the table above and a thumbnail to the README so the section stays in sync with what's on disk.
