## T-2026-09-15-filter-dead-socket — dead-socket write in the shared error filter, and a self-contradicting architecture doc

- Created: 2026-09-15
- Owner: claude
- Spec: none — `apps/backend/src/common/filters/http-exception.filter.ts` and
  `docs/architecture.md` only. Closes #556, #557.
- Goal (#556): `GET /stream/lessons/{id}` logged `ERR_STREAM_PREMATURE_CLOSE`
  plus `ERR_HTTP_HEADERS_SENT` every time a browser aborts a range request
  (seek, tab close) — ordinary player behaviour, not a server failure. The
  shared `HttpExceptionFilter.catch()` wrote to `response` unconditionally;
  a streaming route had already sent status + headers by the time the abort
  reached the filter, so the filter's own write threw a second error on top.
  Fixed in the shared filter (not the stream route) so every route with a
  dead-socket write is covered, not just this one.
- Goal (#557): `docs/architecture.md` §13 asserted `main` has no branch
  protection while §18 asserted it does. Verified live via
  `gh api repos/kkucherenkov/course_shelf/branches/main/protection`:
  protection is on, four required status checks, `strict: true`, no required
  review, `enforce_admins: false`. Removed the stale §13 paragraph, replaced
  with the measured state and the `strict` + `enforce_admins: false`
  interaction that explains why parallel-lane waves merge one at a time.
- Sub-steps:
  - [x] failing unit test against `HttpExceptionFilter.catch()` with a mocked
        `headersSent: true` response, confirmed red before the fix
  - [x] guard in `catch()`: `response.headersSent` short-circuits before any
        header/status/body write, logs at `warn` ("client disconnected"), no
        Sentry capture
  - [x] re-verified branch protection numbers against the live GitHub API,
        fixed the contradiction in `docs/architecture.md`
  - [x] lint/format/test gates on the touched backend files
  - [ ] open PR with `Closes #556, Closes #557`
- Status: done
- Completed: 2026-09-15
- Blockers: —
