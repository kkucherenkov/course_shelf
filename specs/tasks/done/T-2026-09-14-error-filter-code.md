## T-2026-09-14-error-filter-code — HttpExceptionFilter drops code/detail on object-bodied HttpException

- Created: 2026-09-14
- Owner: claude
- Spec: none — `packages/specs/openapi/openapi.yaml`'s `Problem` schema
  already has `code`/`detail` as optional properties; no spec change needed
- Goal: closes #479 — `PATCH /api/v1/courses/{id}` (and every other
  controller-level `throw new BadRequestException({ code, detail })`, the
  shape used consistently across this codebase) answered a bare
  `about:blank` 400 with neither field, while a `DomainError` 400 always
  carries both.
- Root cause (measured — reproduced through the real filter + a real Nest
  app rather than deduced from the source): Nest's `HttpException.createBody`
  passes a caller-supplied object straight through `getResponse()` with no
  added `message`/`error`/`statusCode` keys. `HttpExceptionFilter.toProblem`'s
  `HttpException` branch only ever read `obj.message` / `obj.error` — Nest's
  own conventional keys — never `obj.code` / `obj.detail`, the keys every
  controller in this codebase actually uses (mirrors `DomainError`'s shape).
  Confirmed by a failing test against `courses.controller.ts`'s exact
  `rating-fields-must-be-paired` throw before touching the filter.
- Fix: read `obj.code` / `obj.detail` first, falling back to Nest's
  `error`/`message` for framework-built exceptions (e.g. `ValidationPipe`)
  that were never touched by this bug.
- Sub-steps:
  - [x] failing unit test reproducing the drop against the real filter
  - [x] fix `HttpExceptionFilter.toProblem`
  - [x] lint/format/typecheck/test gates green (2101 backend tests passed)
  - [x] open PR with `Closes #479`
- Status: done
- Completed: 2026-09-14
