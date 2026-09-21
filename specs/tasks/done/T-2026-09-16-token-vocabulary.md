## T-2026-09-16-token-vocabulary — stop consuming short design-token aliases; clamp CourseDescription

- Created: 2026-09-16
- Owner: claude
- Spec: —
- Goal: `packages/ui/src` and `apps/web/app` outside `admin/` stop consuming
  `emit-scss.ts`'s short-name token aliases (`--primary`, `--error`, ...) and
  reference the canonical DTCG long names directly, so the alias layer can
  eventually be deleted without redoing this work file-by-file (#654). Second,
  unrelated fix in the same PR: `CourseDescription.vue` gets a readable
  measure + line-clamp, and literal `line-height` values in this lane's scope
  move to `--leading-*` tokens.
- Spec diff: none (no API/contract change)
- Codegen impact: no
- Sub-steps:
  - [x] Measured real `var(--alias)` consumption in scope (not comments, not
        BEM modifiers that happen to share a token's English word) — 7 files,
        25 occurrences, not the ~99 raw-grep figure quoted in the brief (that
        count included BEM modifier classes like `&--primary`/`&--error` and
        historical "ships as alias" doc comments, neither of which are actual
        token consumption)
  - [x] Replaced all 25 with canonical names: `AppAlert.vue`, `AppBanner.vue`,
        `AppSkeleton.vue`, `AppToast.vue`, `AppAlert.stories.ts`,
        `HomeRow.vue`, `forgot.vue`; cleaned the one now-stale alias-mapping
        comment (`AppSkeleton.vue`)
  - [x] Left `emit-scss.ts`'s `themedAliasLines()` untouched — admin-dialect
        lane still depends on it; final removal deferred to maintainer go-ahead
  - [x] `CourseDescription.vue`: 70ch measure, 6-line clamp with a "show
        more"/"show less" toggle (`AppButton` ghost/sm), collapses again on a
        new `description` (no stale expand state across course navigation).
        `line-height: 1.6` → `--leading-relaxed`.
  - [x] Literal `line-height` → `--leading-*` elsewhere in scope: 11 of the
        planned 12 (6 web + 5 ui, not 6 — see next line), exact-value matches
        (`1` → `--leading-none`, `1.25` → `--leading-tight`) and two
        nearest-token approximations (`1.2`/`20px` → `--leading-tight`/
        `--leading-relaxed`, both sub-pixel at their font sizes)
  - [x] **Left one deliberately literal**: `AppNoteEditor.vue`'s
        `line-height: 20px` looked like the same "nearest token" case as the
        rest (`--leading-relaxed` = 19.5px, 0.5px off) but the Storybook
        visual-regression run measured otherwise — 7 stories drifted 2.0–2.3%,
        one grew 10px and clipped a line of note text. It's a fixed-height
        preview box, not flowing body copy, so a 0.5px per-line rounding
        compounds across a multi-line note into a real reflow. Reverted to
        the literal `20px` with a comment explaining why; confirmed 0 drift
        on the re-run
  - [x] `pnpm design:build`, `turbo run lint test typecheck` (18/18 green,
        568/568 web tests including a new spec case for the toggle)
  - [x] Storybook visual regression, full suite, in the pinned
        `mcr.microsoft.com/playwright:v1.59.1-jammy` container: 51/51 suites,
        305/305 snapshots — 0 drift on both the token-alias swap and the
        final line-height set (after reverting `AppNoteEditor.vue`)
  - [x] Measured the paragraph the same way as the brief (`measure-type.mjs`
        methodology) against this branch's `web` image, hot-swapped onto the
        shared `csh-audit` stand's `web` container and reverted after:
        **70ch at both 1440px and 1024px** (was 111ch/96ch on `main`).
        `IUJgcSn2VoE9cPFTG63Lw` (the course the brief named) has a **null**
        description on the current stand's data, not "several thousand
        characters" — used `lINAImJmhXXLSEGHkL5iH` instead (4734-char
        description, the longest of the 68 seeded courses)
  - [x] Verified the clamp on that course: 6 lines exactly
        (`clientHeight: 117px` = 6 × 19.5px), toggle appears
        ("Показать полностью"), click removes the clamp and shows all 4734
        characters, label flips to "Свернуть" — screenshotted both states
  - [x] Gates + PR
- Status: done
  `themedAliasLines()` removal deferred to maintainer go-ahead)
- Blockers: —
- Completed: 2026-09-16
- Result: https://github.com/kkucherenkov/course_shelf/pull/663
- PR: https://github.com/kkucherenkov/course_shelf/pull/663 (merged)
