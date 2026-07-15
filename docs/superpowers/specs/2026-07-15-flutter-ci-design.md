# Flutter checks in GitHub CI — design

**Date:** 2026-07-15
**Scope:** Make `flutter analyze` + `flutter test` (including goldens) run in GitHub Actions for `packages/ui_flutter` and `apps/mobile`.
**Not in scope:** deleting `.forgejo/`, the mobile feature work (E15-F02-S01 Drift, E15-F01-S03 auth).

## Why

PR #138 merged 2,977 lines of Flutter — `AppTheme`, a bundled brand font, 22 Flutter tests and 2 golden PNGs — and **not one CI check exercised any of it**. It went green because nothing looked:

| Check on #138 | Runs Flutter? |
| --- | --- |
| Analyze (javascript-typescript) | no |
| CodeQL | no |
| Codegen drift guard | Flutter toolchain, but only `spec:codegen` |
| Security (secret scan · license audit) | no |
| Checks (lint · typecheck · test · specs · ui audit) | no |

Neither Flutter package has a `package.json`, so `turbo run lint test typecheck` cannot see them. `pnpm-workspace.yaml` globs `packages/*`, which matches `packages/ui_flutter`, but pnpm skips it for the same reason; `apps/mobile` is not in the workspace at all. The sole enforcement today is a manual checkbox in `.github/PULL_REQUEST_TEMPLATE.md`.

This matters more than a normal coverage gap. Reviewing #138 turned up **four separate tests that asserted against values the test itself supplied and passed while broken**. All four were caught by mutation testing during review; none by reading. Review caught them once — nothing stops them being re-broken tomorrow. Goldens in particular rot silently.

## Ground truth (verified 2026-07-15)

| Concern | Value |
| --- | --- |
| Local Flutter | **3.44.4** (Dart 3.12.2) — the goldens on `main` were generated with this |
| `ci.yml` `FLUTTER_VERSION` | **3.41.0** |
| `.claude/CLAUDE.md` | "apps/mobile Flutter 3.41" |
| both `pubspec.yaml` floors | `flutter: ">=3.41.0"` |
| local version pin (`.fvmrc` / `.tool-versions`) | none |
| `subosito/flutter-action@v2` | already used by the `codegen-drift` job |

Golden PNGs are rendering-engine artefacts. Adding a Flutter job that runs 3.41.0 would very likely fail the goldens now on `main` — not because they are wrong, but because they were baked on 3.44.4.

**Decision:** 3.44.4 becomes canonical, in CI and in the docs. Chosen because the committed goldens already match it, so nothing needs regenerating.

## Design

A new `flutter` job in `.github/workflows/ci.yml` — that file already carries `FLUTTER_VERSION` and already runs `subosito/flutter-action@v2`, so no new workflow file is warranted.

```yaml
flutter:
  name: Flutter (analyze · test · goldens)
  runs-on: ubuntu-latest
  timeout-minutes: 15
  steps:
    - uses: actions/checkout@v6
    - uses: subosito/flutter-action@v2
      with:
        flutter-version: ${{ env.FLUTTER_VERSION }}
        cache: true
    # packages/ui_flutter: pub get → analyze → test
    # apps/mobile:         pub get → analyze → test
    - uses: actions/upload-artifact@v5
      if: failure()
      # test/**/failures/ — golden_toolkit's pixel-diff PNGs
```

Action versions follow the repo's existing pins: `actions/checkout@v6`, `actions/upload-artifact@v5` (as used in `e2e.yml`), `subosito/flutter-action@v2`.

The job needs **no Node and no pnpm**: `tokens.g.dart` is committed, so nothing has to run `pnpm design:build` first. That keeps it fast and independent of the `checks` job.

`packages/ui_flutter` runs first — it is the dependency, and its 15 tests + 2 goldens are where a token/theme regression surfaces. `apps/mobile` (8 tests) follows.

**Failure artifacts are not optional.** `golden_toolkit` writes pixel diffs to `test/**/failures/`. A golden failure whose diff you cannot see tells you only "pixels changed", which is close to useless for deciding whether to accept or fix.

### Version bump — three places

- `ci.yml` `FLUTTER_VERSION: "3.41.0"` → `"3.44.4"`
- `.claude/CLAUDE.md` — "Flutter 3.41" → "Flutter 3.44"
- `packages/ui_flutter/pubspec.yaml` and `apps/mobile/pubspec.yaml` — `flutter: ">=3.41.0"` → `">=3.44.0"`

The pubspec floor is a guard, not bookkeeping: an older local Flutter then fails `pub get` with a clear message instead of silently producing goldens that disagree with CI. It is only a floor — a *newer* local Flutter still slips through. Fully pinning local dev needs `fvm`/`asdf`; deliberately out of scope (YAGNI), noted as a follow-up.

### Stale comment in the same file

`ci.yml`'s header says "Development happens on the self-hosted Forgejo; this file mirrors `.forgejo/workflows/ci.yml`". Forgejo was dropped 2026-07-14; GitHub is the sole repo. The comment is corrected while the file is open. `.forgejo/` still exists and its deletion is a separate PR.

## Risks

Two that cannot be verified before CI runs. Both are acceptable — the job's whole purpose is to surface exactly this class of truth.

1. **`codegen-drift` shares `FLUTTER_VERSION`.** Bumping to 3.44.4 may make `pnpm spec:codegen` regenerate `packages/api-client-dart` differently (Dart formatter output changes between SDK versions), turning that job red. If it does, the correct fix is to regenerate the clients on the canonical toolchain and commit the diff — **not** to revert the bump. Could not be tested locally: `packages/specs/dist` and `apps/backend/dist` are root-owned by the dev containers, so `pnpm spec:bundle` fails with `EACCES` on this machine.

2. **Goldens may not reproduce on `ubuntu-latest`.** Same Flutter version and repo-bundled fonts *should* render deterministically, but this repo has precedent for the opposite: the Storybook baselines needed a jammy container to match CI glyph metrics. If Flutter goldens diverge, the fallbacks are a pinned container image or CI-generated baselines. The uploaded diff artifacts are the evidence that decides it.

## Testing

The workflow is the test. Success = the `flutter` job runs on this PR and passes:

- `packages/ui_flutter` — `analyze` clean, 15/15 including both goldens
- `apps/mobile` — `analyze` clean, 8/8
- `codegen-drift` still green on the bumped version

A red `flutter` job on this PR is a *result*, not a setback: it means CI is looking at Flutter for the first time and has found something real.

## Follow-ups (not this PR)

1. **Delete `.forgejo/`** — 5 workflow files for a host dropped 2026-07-14.
2. **Pin local Flutter** (`fvm` / `.tool-versions`) so contributors cannot generate goldens on a version CI does not run.
3. **`pnpm issues:sync`** still targets the dead Forgejo host; CLAUDE.md documents it as working.
4. **`docs/design/DESIGN_BRIEF.md`** stale on every token path.
5. **Root-owned `dist/` dirs** from dev containers break `pnpm spec:bundle` locally.
