---
description: Regenerate API clients from specs and verify no drift remains.
---

Run:

```sh
pnpm spec:codegen
git diff --exit-code -- packages/api-client-ts packages/api-client-dart
```

Step 1 runs the turbo graph `validate → bundle → codegen` and writes:

- `packages/api-client-ts/src/generated/**` (TypeScript fetch client)
- `packages/api-client-dart/lib/generated/**` (Dart dio client)
- `packages/api-client-ts/src/realtime/channels.ts` (AsyncAPI channels)
- `packages/specs/src/openapi-types.ts` (shared types)

Step 2 must exit with code 0. If it reports a diff:

1. **Expected diff** — a spec edit that the agent just made. Stage the codegen
   diff and commit it in its own commit (never mixed with source changes). Use
   a conventional message: `chore(codegen): regenerate after <spec change>`.

2. **Unexpected diff** — codegen is re-deriving files that shouldn't have
   changed. Likely causes: a generator-tool version bump pulled by dependabot,
   or a `packages/specs/scripts/*.ts` edit. Investigate before committing.
   Do NOT paper over by committing the diff without understanding it.

Never edit the generated files directly — the `.claude/CLAUDE.md` rule list
forbids it, and the next codegen run will clobber the change.
