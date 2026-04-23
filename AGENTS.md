# AGENTS.md

Universal rules file for AI coding agents. Works for Claude Code, Codex, Aider,
Gemini CLI, and any other tool that reads an `AGENTS.md` at the repo root.

**The canonical, deep rules live in [`.claude/CLAUDE.md`](.claude/CLAUDE.md).**
This file is the short intro; `.claude/CLAUDE.md` + `.claude/docs/*` have the
details.

---

## What this repo is

Greenfield monorepo boilerplate for agent-driven product work.

```
apps/backend    NestJS 11 + Prisma 7 + CQRS + Better Auth
apps/web        Nuxt 4 SPA + Nuxt UI v4 + Tailwind 4 + @app/ui + @nuxtjs/i18n
apps/mobile     Flutter 3.41 + flutter_bloc + get_it + Dio
packages/specs  OpenAPI 3.1 + AsyncAPI 3.0 — single source of API truth
packages/ui     brand components + colocated Storybook + specs
packages/api-client-{ts,dart}   generated clients — never edit by hand
specs/tasks/    active.md (LIFO stack) + done.md (archive)
specs/design/   W3C tokens + optional JSX mockups under mockups/
docker/         local stack (postgres / redis / centrifugo / otel-lgtm)
```

## Five rules every agent must follow

1. **Task stack.** On session start, read `specs/tasks/active.md` first. Push an
   entry before coding, move it to `specs/tasks/done.md` when the PR is merged.
   Use [`specs/tasks/templates/feature.md`](specs/tasks/templates/feature.md).

2. **Spec-first.** Any wire change starts in `packages/specs/openapi/openapi.yaml`
   or `packages/specs/asyncapi/centrifugo.yaml`. Then:
   ```sh
   pnpm spec:codegen   # turbo chains validate → bundle → codegen
   ```
   Then implement. `express-openapi-validator` rejects drift at runtime; CI
   rejects drift in generated clients.

3. **Never edit generated code.** `packages/api-client-ts/src/generated/` and
   `packages/api-client-dart/lib/generated/` are owned by codegen.

4. **Never ship a user-visible string without i18n.** `t()` in web / Nuxt,
   `AppLocalizations` in Flutter. See [`.claude/docs/i18n.md`](.claude/docs/i18n.md).

5. **Never ship a `@app/ui` component without a Storybook story and colocated
   spec.** Use design tokens — no hardcoded hex, no `!important`, no inline
   `style=""`. See [`.claude/docs/design-system.md`](.claude/docs/design-system.md).

## Auto-format before you declare done

```sh
pnpm --filter <pkg> lint --fix   # ESLint
pnpm stylelint:fix               # Stylelint
pnpm format                      # Prettier
```

Never hand-fix what a fixer handles. Never add `eslint-disable` without a WHY
comment.

## Local runtime

The Docker stack is usually running. Check before starting anything:

```sh
docker ps --format '{{.Names}} {{.Status}} {{.Ports}}'
```

| Service    | Port | URL                          |
|------------|------|------------------------------|
| web        | 3001 | http://localhost:3001        |
| backend    | 3000 | http://localhost:3000/api/v1 |
| centrifugo | 8000 | ws://localhost:8000          |
| grafana    | 3200 | http://localhost:3200        |

Containers mount the repo as a volume — edits reach the running container. Do
not start `pnpm dev` if the container is up.

## Go deeper

- [.claude/CLAUDE.md](.claude/CLAUDE.md) — the canonical rules (superset of this file)
- [.claude/docs/handbook.md](.claude/docs/handbook.md) — backend conventions, CQRS, Prisma
- [.claude/docs/design-system.md](.claude/docs/design-system.md) — tokens, BEM, Storybook
- [.claude/docs/i18n.md](.claude/docs/i18n.md) — web + mobile + backend translations
- [.claude/docs/testing.md](.claude/docs/testing.md) — pyramid, DoD, PR checklist
- [.claude/docs/security.md](.claude/docs/security.md) — secrets, observability, a11y
- [docs/troubleshooting.md](docs/troubleshooting.md) — known gotchas and their fixes
