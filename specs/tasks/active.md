# Active tasks

## T-2026-04-26-008 — stage the design bundle under docs/design/ + index + .gitattributes

- Created: 2026-04-26
- Owner: claude
- Spec: closes `docs/roadmap/tasks/E00-F01-S01.md`. The bundle had been sitting on disk as untracked files (every PR-3a/3b reference path under `docs/design/shared/` was unresolvable for any cloned checkout); this PR commits the entire bundle plus the index README and `.gitattributes` so the references are real.
- Goal: a clone of the repository carries the full design handoff bundle alongside an index that names every project slug, its consumption story, and its file inventory; `.gitattributes` collapses prototype HTML/JSX/CSS as vendored so PR diffs and language stats stay relevant to actual source.
- Acceptance:
  - `docs/design/` is fully tracked; `git ls-files docs/design | wc -l` returns ≥ 50.
  - `docs/design/DESIGN_BRIEF.md` exists at top-level (moved from `uploads/`).
  - `docs/design/README.md` is an index keyed by project slug, with `Status` and `Consumed by` columns and a "Note on `cs-foundation`" row noting the singular-vs-plural slug discrepancy with `DESIGN_BRIEF.md §4`.
  - `.gitattributes` marks `docs/design/**/*.{html,jsx,css,json}` as `linguist-vendored=true`, `*.png` as binary, and `packages/ui_flutter/lib/src/theme/tokens.g.dart` as `linguist-generated=true`.
  - Card `docs/roadmap/tasks/E00-F01-S01.md` flips to ✅ Done with `Completed: 2026-04-26` + `Result:` lines under Notes; matching `- [ ]` in `docs/roadmap/TODO.md` is `- [x]` and progress counter goes from `6 / 115` to `7 / 115`.
  - Side-effect cleanup: `T-2026-04-26-006` (eslint boundaries, merged `6a17c89`) and `T-2026-04-26-007` (shared kernel, merged `a3a8449`) move from `active.md` to `done.md` per the task-stack protocol.
- Spec diff: none
- Codegen impact: no
- Design impact: yes — the bundle is now first-class repo content, not local-only state.
- Tests: visual sanity — `docs/design/README.md` renders the index table; index entries match the actual folders on disk.
- Sub-steps:
  - [x] move `docs/design/uploads/DESIGN_BRIEF.md` → `docs/design/DESIGN_BRIEF.md`
  - [x] write `docs/design/README.md` (index + handoff conventions + sources-of-truth pointer)
  - [x] write `.gitattributes` (linguist-vendored on `docs/design/**` + linguist-generated on Dart tokens)
  - [x] flip `docs/roadmap/tasks/E00-F01-S01.md` to ✅ Done; tick TODO; bump progress counter
  - [x] move T-006 / T-007 to `done.md` (this commit covers the carry-forward)
  - [x] prettier on touched markdown
- Status: in-progress
- Blockers: —
