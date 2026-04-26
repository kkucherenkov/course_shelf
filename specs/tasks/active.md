# Active tasks

## T-2026-04-26-016 — extend scan parser: composite ordinals + word-prefixed sections

- Created: 2026-04-26
- Owner: claude
- Spec: ad-hoc — surfaced when sample courses landed in `docs/data/courses/` (gitignored). Two of four real-world layouts produced corrupted lesson labels. The composite `N.M` pattern is common in Russian Udemy-style exports; word-prefixed section folders (`Модуль NN - …`, `Глава NN. …`, `Module N - …`) are also widely used.
- Goal: every realistic course folder layout in `docs/data/courses/` (Pragmatic Clean, Udemy, Neovim, videosmile) is recognised by the scanner with clean section/lesson labels and correct ordinals — without falling back to `course.json` overrides.
- Acceptance:
  - `parseFolderName('Модуль 2 - Настройки окружения')` → `{ ordinal: 2, label: 'Настройки окружения' }`.
  - `parseFolderName('Глава 2. Продвинутые техники')` → `{ ordinal: 2, label: 'Продвинутые техники' }`.
  - `parseFolderName('Module 1 - Setup')` → `{ ordinal: 1, label: 'Setup' }`.
  - `parseLessonFileName('2.5 Установка на Windows.mp4')` → `{ sectionOrdinal: 2, ordinal: 5, label: 'Установка на Windows', extension: '.mp4' }`.
  - `parseLessonFileName('2.6.mp4')` → `{ sectionOrdinal: 2, ordinal: 6, label: '2.6', extension: '.mp4' }` (no inline title → fallback to bare).
  - Existing `parseFolderName` / `parseLessonFileName` test cases still pass; no regression on `01 - Foo` / `01. Foo` / bare.
  - `RunScanHandler` calls `parseFolderName` on section folders too, so `sectionTitles` carries clean labels (`Настройки окружения`, not `Модуль 2 - Настройки окружения`).
  - A handler test simulates the Neovim layout and asserts `sectionTitles` contain `Настройки окружения` rather than the raw `Модуль 2 - Настройки окружения`.
  - Sample `course.json` files placed at `docs/data/courses/<Neovim>/course.json` and `docs/data/courses/<videosmile>/course.json` (gitignored — for local manual verification only) demonstrate the override path for layouts the parser still cannot fully resolve (e.g. videosmile lessons whose original file name is just `2.6.mp4`).
  - Backend `lint && typecheck && test` clean.
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: see Acceptance.
- Sub-steps:
  - [ ] add `COMPOSITE_LESSON_RE` and `WORD_PREFIXED_RE` to `folder-name.parser.ts`; extend `ParsedLessonFileName` with optional `sectionOrdinal`
  - [ ] keep `PREFIX_RE` as the highest-priority match; the new regexes only fire when the existing one does not match
  - [ ] update `run-scan.handler.ts` to parse section folder names (cleaner `sectionTitles`)
  - [ ] new spec cases: composite with title, composite without title, word-prefixed (Russian + English)
  - [ ] new fixture-based handler test asserting Neovim-style layout produces clean labels
  - [ ] write minimal demo `course.json` files under `docs/data/courses/{Neovim..., videosmile - Super Figma}/` (gitignored — purely for manual cross-check)
  - [ ] backend lint / typecheck / test clean; prettier on touched files
- Status: in-progress
- Blockers: —
