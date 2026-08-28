# 0007 — Storybook and Widgetbook as the two component catalogs

- **Status:** accepted
- **Date:** 2026-08-29
- **Deciders:** @kkucherenkov
- **Tags:** frontend, mobile, design-system, testing

> Recorded retroactively. Storybook arrived with E12, Widgetbook with E16.

## Context

The design system exists twice — `packages/ui` (Vue) and `packages/ui_flutter`
(Flutter) — because the two platforms cannot share components, only tokens. Both
copies have to be reviewable in isolation: a component's full state matrix
(loading, empty, error, long text, dark mode) is unreachable by clicking through
the running app, and "it looked fine on the page I checked" is how `AppIcon`
shipped rendering at 2–4× its intended size and `AuthLayout` shipped with no
padding.

## Decision

Two catalogs, one per platform, and both are CI surfaces rather than developer
toys:

- **Storybook** for `packages/ui` — every component ships with a colocated
  story and spec. `@storybook/test-runner` drives visual regression against
  committed PNGs in `packages/ui/test/__snapshots__/`, run by `quality.yml` in
  the exact `mcr.microsoft.com/playwright:v1.59.1-jammy` image the baselines were
  captured in.
- **Widgetbook** for `packages/ui_flutter` and `apps/mobile` — the Flutter
  equivalent, with `golden_toolkit` grid sheets (76 PNGs across 19 areas) as the
  assertion surface, run by `ci.yml`'s Flutter job.

## Consequences

### Positive

- A state matrix is a diff. A token change that reflows every page shows up as
  pixels in CI instead of as a bug report two days later.
- The catalog is where a component is developed, so `packages/ui` never needs
  `apps/web` running — and the Flutter design system is exercised without an
  emulator.
- Both catalogs consume the generated tokens, so a drift between the platforms'
  rendering is visible side by side.

### Negative

- Baselines are image files pinned to an exact container image. They cannot be
  regenerated on a dev host without drifting glyph metrics, so refreshing them
  needs a dedicated workflow (`regen-snapshots.yml`) rather than a local command.
- Every `@app/ui` component owes a story _and_ a spec, which is real cost on
  small components.
- Two catalogs means two toolchains, two build steps and two flavours of
  "snapshot" to keep straight.

### Neutral

- The a11y addon currently runs at `STORYBOOK_A11Y_LEVEL: todo` in CI, so
  accessibility violations are reported but not enforced. Deliberate, temporary,
  and tracked — the assertions are meant to come back on.

## Alternatives considered

### Option A — no catalog, review in the running app

Rejected on evidence: that is the regime the two rendering regressions above
shipped under.

### Option B — Storybook's Flutter support / a single cross-platform catalog

Rejected as not real. The platforms share tokens, not components; a single
catalog would be a directory with two unrelated halves.

### Option C — Chromatic or another hosted visual-diff service

Rejected for a self-hosted, single-maintainer project: it adds an external
dependency and an account to a pipeline that is otherwise entirely inside the
repo.

## Related

- [ADR-0010](0010-design-bundle-tokens-source-of-truth.md) — what both catalogs
  render.
