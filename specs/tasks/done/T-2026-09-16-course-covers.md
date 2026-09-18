## T-2026-09-16-course-covers — one course, four different covers

- Created: 2026-09-16
- Owner: claude
- Spec: none — audit finding, issue #569 (tuxedo 24 / #267's private-hex ask
  resolved onto the same PR).
- Goal: `cover-map.ts`'s `initials()` (length-filtered words) and
  `search.vue`'s inline duplicate (raw first-two-words) disagreed on ~30/68
  real course titles, and search always painted the flat `--brand-accent`
  while the catalog hashed a per-course colour from `COVER` — one course, up
  to four different covers depending on where you looked. Also: `COVER` and
  `AVATAR_PALETTES` (duplicated across `AdminUserRow.vue` and
  `admin/permissions/[userId].vue`) were private hex literals DESIGN.md
  forbids; `coral` had no backing token at all.
- Root cause: two independent, undertested string-splitting algorithms for
  the same monogram, plus per-course colour never having been wired into
  `search.vue` in the first place.
- Found along the way (not part of the original ask): both avatar circles
  read `--brand-accent-fg`, a token that flips per theme, against a
  background that intentionally doesn't — near-black-on-blue in dark mode.
  Also: axe's `color-contrast` gate never caught the pre-existing
  under-4.5:1 cover/avatar hues because every initials/avatar element is
  `aria-hidden="true"` (correctly — the name is already exposed elsewhere),
  which exempts it from axe regardless of hex-vs-token. Tokenizing does not
  close that CI gap; noted in the PR, not fixed here.
- Sub-steps:
  - [x] one `initials()` in `@app/ui` — stopword/punctuation filtered, falls
        back to a single word's own first two letters (fixes "Основы Git" vs
        "Основы Golang" colliding on the stopword's initial)
  - [x] `search.vue` consumes that `initials()` plus `COVER[accentFromId]`
        for both course and lesson thumbs, replacing the flat accent
  - [x] `COVER` (6 hues) and `AVATAR_PALETTES` (6 hues, extracted into
        `apps/web/app/utils/avatar-color.ts`) moved into `tokens.json`
        (`media.cover*`, new `avatar.*` group), darkened where the original
        hex didn't clear 4.5:1 against the white text drawn on it
  - [x] both avatar foregrounds switched to the theme-independent
        `--media-fg`
  - [x] tests: `cover-map.spec.ts`, `avatar-color.spec.ts` new; regression
        assertions added to `AdminUserRow.spec.ts` and `search.spec.ts` —
        all confirmed red against the pre-fix code, green after
  - [x] `pnpm design:build` regenerated; gates green (lint/test/typecheck ×
        `@app/ui`/`@app/web`/`@app/design-tokens`, stylelint, format,
        check:i18n, design:audit)
- Status: done
- Completed: 2026-09-16
- PR: https://github.com/kkucherenkov/course_shelf/pull/584
