# 0001 — Monorepo on pnpm workspaces + Turborepo

- **Status:** accepted
- **Date:** 2026-08-29
- **Deciders:** @kkucherenkov
- **Tags:** infra, tooling

> Recorded retroactively. The decision was made and implemented in
> [E01-F01-S01](../roadmap/tasks/E01-F01-S01.md); this ADR captures the
> reasoning that was never written down.

## Context

CourseShelf ships three deployable artefacts (NestJS API, Nuxt SPA, Flutter app)
that share one API contract and one design system. Three of the shared pieces —
the OpenAPI spec, the generated clients, and the design tokens — are _generated_
into their consumers. A spec change is only correct if the backend, the two
generated clients, and both frontends move together, and a token change has to
reach `apps/web`, `packages/ui` and `packages/ui_flutter` in the same commit.

Split repositories make that atomicity impossible: the change becomes N pull
requests with a version-bump dance between them, and every intermediate state is
broken.

## Decision

One repository, pnpm workspaces for linking, Turborepo for task orchestration.
Workspace globs are `apps/backend`, `apps/web`, `packages/*`
(`pnpm-workspace.yaml`), pinned to `pnpm@10.33.0` via `packageManager`.

## Consequences

### Positive

- A spec edit and everything it regenerates land in one reviewable commit; the
  `Codegen drift guard` CI job can assert the tree is self-consistent, which is
  only a meaningful check inside a single repo.
- `turbo run lint` / `test` / `typecheck` discover every package that declares
  the script. This is load-bearing: hand-written package lists in CI silently
  skipped `@app/ui`'s 852 tests and its `vue-tsc` typecheck for as long as they
  existed. An inverted filter cannot omit a package the way a list can.
- One lockfile, so a transitive dependency cannot be at two versions in two
  services that talk to each other.

### Negative

- Every CI job installs the whole workspace, so an unrelated backend dependency
  slows down a docs-only PR.
- Turborepo is a second build vocabulary on top of pnpm scripts; contributors
  have to know which one owns a given task.
- The Flutter packages are outside the pnpm graph entirely (no `package.json`),
  so `turbo run test` cannot see them — they need their own CI job. This was not
  noticed until `#138` merged 2977 lines of Flutter with nothing running it.

### Neutral

- Turborepo's remote cache is not configured. Local caching only; revisit if CI
  wall-clock becomes a problem.

## Alternatives considered

### Option A — separate repositories per app

Rejected. The generated-artefact coupling is the whole problem: three repos turn
one spec change into three PRs with no way to check they agree.

### Option B — pnpm workspaces without Turborepo

Viable, and briefly the state of the repo. Rejected because task orchestration
degenerates into hand-maintained `--filter` lists in `package.json` and CI — the
exact failure mode that hid `@app/ui`'s test suite.

### Option C — Nx

Rejected as more framework than the project needs: a generator/plugin ecosystem
and a project graph configuration for a workspace of eight packages.

## Related

- [ADR-0002](0002-spec-first-openapi.md) — the generated artefacts this layout
  exists to keep in sync.
- [ADR-0010](0010-design-bundle-tokens-source-of-truth.md) — the other
  generated-into-consumers pipeline.
