# Contributing

This repo is the upstream boilerplate. Contributions here should keep the
template small, opinionated, and spec-first — not add features for a specific
downstream product.

## Prerequisites

- Node.js ≥ 24, pnpm ≥ 10
- Docker + Docker Compose
- Flutter 3.41 (only for mobile changes)

## Local setup

```sh
pnpm install
pnpm spec:codegen
pnpm design:build
docker compose -f docker/compose.yml up -d
```

## Task discipline

Every non-trivial change follows the task-stack convention enforced in
[.claude/CLAUDE.md](.claude/CLAUDE.md):

1. Before coding, create `specs/tasks/active/<id>.md` (template in
   `specs/tasks/README.md`).
2. Check items off as you progress. Flip to `blocked` with a reason if
   stuck.
3. On completion, `git mv` the file into `specs/tasks/done/` and add the PR
   link. Cancelled tasks move there too, with the reason —
   never delete history.

## Spec-first loop (non-negotiable)

All wire contracts live in `packages/specs`. For any API surface change:

1. Edit `packages/specs/openapi/openapi.yaml` (or
   `packages/specs/asyncapi/centrifugo.yaml`).
2. Run `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen`.
3. Implement in `apps/backend`. `express-openapi-validator` will reject
   drift at runtime.
4. Consume in `apps/web` / `apps/mobile` via the regenerated client.
5. Commit the codegen artefacts in their own commit.

The `codegen-drift` CI job regenerates every client on each PR and fails
the build if `git diff` is non-empty.

## Formatting

After editing `.ts` / `.vue` / `.scss` / `.css` / `.json` / `.md`, run in order:

```sh
pnpm --filter <pkg> lint --fix   # ESLint
pnpm stylelint:fix               # Stylelint
pnpm format                      # Prettier
```

Never hand-fix what a fixer can do. Never add an `eslint-disable` line
without a `// WHY: …` comment explaining the constraint.

## Commits

Conventional Commits, enforced by `commitlint` on every commit:

```
type(scope): short imperative summary

Longer body if needed. Wrap at ~72 cols. References issues / PRs at the end.
```

Valid types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`,
`ci`, `build`, `style`.

## PR checklist

Before requesting review:

- [ ] Task file in `specs/tasks/active/` is up to date (or moved to `done/`)
- [ ] Spec changes are in their own commit, followed by `spec:codegen`
      output in the next commit
- [ ] `pnpm lint && pnpm typecheck && pnpm test` is green locally
- [ ] If UI changed: Storybook story updated and visual check done
- [ ] If a user-visible string was added: every locale covered
      (`pnpm check:i18n` is green)
- [ ] If a `@app/ui` component was added: colocated `.stories.ts` and
      `.spec.ts` exist
- [ ] No `any`, no inline `style=""`, no `!important`, no hard-coded hex
      colors
- [ ] `.claude/docs/testing.md` DoD items covered

## What we won't merge

- Routes added without a corresponding OpenAPI / AsyncAPI entry
- Hand-edits to `packages/api-client-ts/src/generated/` or
  `packages/api-client-dart/lib/generated/`
- Direct `process.env.*` reads outside the config module
- Unapproved dependency licenses (CI license-checker is the source of truth)
- User-visible strings without `t()` / `AppLocalizations`
- Features not captured in the task stack

## Reporting bugs / requesting features

Use the issue templates under `.github/ISSUE_TEMPLATE/`. For security
issues, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.
