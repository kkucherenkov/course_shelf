## T-2026-09-13-ci-workflow-filters — path-filter Flutter jobs + reorder release validation

- Created: 2026-09-13
- Completed: 2026-09-13
- Result: https://github.com/kkucherenkov/course_shelf/pull/456
- Owner: claude
- Spec: none — `tuxedo` 97 and `tuxedo` 102
- Goal: stop every backend/web-only PR from paying the Flutter toolchain, and
  stop the release workflow from pushing images before the compose bundle it
  ships alongside them is known to be valid.
- Acceptance:
  - a PR touching only `apps/backend/**` or `apps/web/**` reports `flutter` in
    seconds, not ~4m18s, and never reports it `skipped` (required check)
  - a PR touching `packages/specs/**` or `pnpm-lock.yaml` still runs the full
    Flutter job
  - `release.yml` fails at "Render and validate release compose" — before any
    image is built — if the compose bundle is broken
  - `release.yml` can be exercised via `workflow_dispatch` against `HEAD`
    without publishing anything
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: `actionlint` (via `rhysd/actionlint` docker image) on both edited
  workflow files — clean except one pre-existing, out-of-scope shellcheck nit
  in `codegen-drift`. Neither workflow runs on a PR the way it runs on
  `main`/a tag; `ci.yml`'s own `flutter` job in this PR is the closest proof
  of change 1, `release.yml` could not be exercised (no tag, and dispatch
  can't fire from a PR context).
- Sub-steps:
  - [x] `changes` job (`dorny/paths-filter@v4`) in `ci.yml`
  - [x] `flutter-integration` — job-level `if:` (not a required check)
  - [x] `flutter` — always runs, `if:` on each expensive step (required check)
  - [x] rebase onto `origin/main` for #455 (merged as `b7db811c`)
  - [x] `release.yml` — split "Stage release bundle" into
        render+validate (moved ahead of the image build) and assemble/tar
        (stays where it needs the release notes)
  - [x] `release.yml` — `workflow_dispatch` trigger, dry run, publishes nothing
  - [x] PR + bookkeeping
