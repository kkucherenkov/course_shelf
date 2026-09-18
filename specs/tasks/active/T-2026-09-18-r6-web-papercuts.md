## T-2026-09-18-r6-web-papercuts — fix three web papercuts closing out #578

- Created: 2026-09-18
- Owner: claude
- Spec: #578 (last three open items, measured against code by the coordinator)
- Goal: three unrelated small-surface defects fixed without touching shared
  surfaces (`packages/specs`, `packages/ui`) or other lanes' files.
- Acceptance:
  - `CourseMaterialsRail` shows an icon that matches its material kind for
    every kind (`doc`, `note`, `image`, `slide`); file size renders through
    `t()` in both locales, no bare `B`/`KB`/`MB` literal.
  - `PlayerTranscriptTab` scrolls the active cue row into view when
    `activeIndex` changes, respects `prefers-reduced-motion`, and stays put
    once the reader has scrolled the panel themselves.
  - `HomeRow`'s horizontal-scroll vs. wrap breakpoint has one deliberate
    switch point, not an unclaimed 640–767px gap; the choice is explained in
    a comment next to the media query.
- Spec diff: none
- Codegen impact: no
- Design impact: none — reused existing `IconCS` names, no new tokens/components
- Tests: unit (component specs) for CourseMaterialsRail (new) and
  PlayerTranscriptTab (scroll-into-view behaviour); HomeRow fix is CSS-only
- Sub-steps:
  - [x] CourseMaterialsRail: fix `kindIcon` for `image`/`slide`, route
        `fmtSize` units through `t()`, add en/ru locale keys
  - [x] PlayerTranscriptTab: scroll active row into view on `activeIndex`
        change, honour reduced-motion, suspend after manual scroll
  - [x] HomeRow: close the 640–767px breakpoint gap, document the choice
  - [x] `pnpm --filter @app/web lint --fix && pnpm stylelint:fix && pnpm format`
  - [x] `pnpm --filter @app/web test` and `pnpm check:i18n` green
- Status: in-progress
- Blockers: —
