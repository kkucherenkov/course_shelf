---
description: Pre-feature checklist — verify baseline before starting a new task.
---

Before pushing an entry to `specs/tasks/active.md` and writing code, verify the
baseline is healthy. Bugs that show up after you edit are easier to attribute
when you start from green.

Run, in order:

```sh
# 1. Docker stack running? (backend, postgres, redis, centrifugo)
docker ps --format '{{.Names}}\t{{.Status}}' | grep -E 'backend|postgres|redis|centrifugo'

# 2. Dependencies in sync with lockfile
pnpm install --frozen-lockfile

# 3. Codegen artefacts match the current spec
pnpm spec:codegen
git diff --exit-code -- packages/api-client-ts packages/api-client-dart

# 4. Design tokens + inventory clean
pnpm design:build
pnpm design:audit

# 5. Types compile everywhere
pnpm typecheck
```

Then read `specs/tasks/active.md` to check:

- Is there already an in-progress task? If yes, finish or explicitly park it
  (`status: blocked` with reason) before starting a new one.
- Does the new task belong on the stack, or is it small enough to do inline?
  (See `.claude/CLAUDE.md` task stack rules.)

Push the new entry using the template at
`specs/tasks/templates/feature.md`.

If any of steps 1–5 fail, fix the baseline first. Starting a feature on a red
tree compounds debugging cost.
