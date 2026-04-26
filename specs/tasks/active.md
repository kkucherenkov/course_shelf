# Active tasks

## T-2026-04-26-020 — `GET /stream/lessons/{id}` with HTTP Range support (E08-F02-S01)

- Created: 2026-04-26
- Owner: claude
- Spec: `docs/roadmap/tasks/E08-F02-S01.md` — Streaming F02 first slice. Standards-compliant byte-range delivery for lesson video files. Verifies the stream token signed by E08-F01-S01, then streams the file with HTTP-conformant `Range` handling. `Spec diff: none` per the card — this endpoint returns raw bytes, not JSON, and is intentionally **excluded from openapi-validator**. The route URL stays inside `/api/v1/` prefix because the previous story issues URLs of the form `/api/v1/stream/lessons/{id}?token=…` and clients must round-trip them verbatim; the validator exemption is what the card means by "outside the v1 prefix".
- Goal: a video element pointing at the URL minted by `IssueStreamUrl` plays back smoothly with seek (single Range), parallel chunked download (multi-Range supported as multipart/byteranges), and rejects out-of-window seeks with 416. Path traversal is provably impossible.
- Acceptance:
  - Route: `GET /api/v1/stream/lessons/:id?token=…`. Response is **binary** (the lesson video). Token is the only auth surface — no `Authorization` header used (so plain `<video src="...">` works).
  - openapi-validator middleware (`/api/v1/*`) exempts `/api/v1/stream/lessons/`. Add the path to the existing `ignorePaths` regex from E04-F02-S03.
  - `200 OK` when `Range` header is absent: full file, `Content-Length`, `Content-Type` `video/*` derived from extension (`.mp4` → `video/mp4`, `.mkv` → `video/x-matroska`, `.m4v` → `video/x-m4v`, `.webm` → `video/webm`), `Accept-Ranges: bytes`.
  - `206 Partial Content` for a single range `Range: bytes=START-END` (also `START-` and `-SUFFIX`): correct `Content-Range: bytes START-END/TOTAL`, `Content-Length: <range size>`, body is the requested slice.
  - `206 Partial Content` for multi-range `Range: bytes=A-B,C-D`: `Content-Type: multipart/byteranges; boundary=…`, each part has its own `Content-Type` (the video MIME) and `Content-Range`. The `RangeRequestParser` returns the full list; the controller streams each part sequentially.
  - `416 Range Not Satisfiable` when **all** ranges are out of bounds; carries `Content-Range: bytes */TOTAL`.
  - `400` for malformed `Range` header (e.g. `Range: pages=0-`).
  - `401` for missing/tampered/expired token (delegate to `StreamTokenSigner.verify`); `404` for unknown lesson; `403` (PermissionDenied) is **not** thrown here — the issuance endpoint already gated the request, and the token is the proof. The verifier rejects on tamper / expiry / lesson-mismatch.
  - **Path traversal**: the `LessonFileLocator` resolves `lessonId → absolute path` via Lesson.videoPath joined with the parent Library.rootPath, then runs the result through a normalisation helper that asserts the resolved canonical path is still inside the library root. If it isn't, throw `LessonFilePathEscapedError extends DomainError` (500 / `lesson-file-path-escaped`) — the request fails closed. A unit test feeds a videoPath of `../../etc/passwd` and asserts the helper rejects.
  - Range delivery uses `fs.createReadStream(path, { start, end })`. Multi-range is implemented as a small async generator that emits the boundary headers + each slice + the closing boundary. Don't read the whole file into memory.
  - Tests:
    - `range-request-parser.spec.ts`: `bytes=0-499`; `bytes=500-`; `bytes=-100`; multi-range `bytes=0-499,1000-1499`; out-of-bounds `bytes=999999-`; malformed `pages=0-`.
    - `lesson-file-locator.spec.ts`: happy path; traversal `../etc/passwd`; absolute path that escapes; symlink-resolves-out check stubbed via mocked `fs.realpath` (or document that v1 trusts non-symlinked layouts and add a TODO for v2 hardening).
    - `stream-controller.e2e.spec.ts` (or unit-style with supertest against the controller): full GET, single-range, multi-range, 416, 401 (bad token), 404 (unknown lesson), Content-Type per extension. Uses a tmpfs fixture file via `node:os.tmpdir()`.
  - openapi-validator ignore pattern: extend the existing regex in E04-F02-S03's middleware mount (search for `ignorePaths` in `apps/backend/src/common/openapi/openapi-validator.middleware.ts`).
  - Quality gates: backend lint + typecheck + test all clean.
- Spec diff: none (per card)
- Codegen impact: no
- Design impact: none
- Tests: see Acceptance.
- Sub-steps:
  - [x] T-020-A: `RangeRequestParser` utility — parses RFC 7233 `Range` headers; returns `{ kind: 'single' | 'multi' | 'invalid', ranges: [{ start, end }] }` after clamping against fileSize
  - [x] T-020-B: `LessonFileLocator` — resolves `lessonId → absolute path` via `LESSON_REPOSITORY` + `LIBRARY_REPOSITORY` (Library carries rootPath); canonicalises via `path.resolve` + asserts result stays under `library.rootPath`
  - [x] T-020-C: `StreamingController.getLessonStream` — token verify (delegates to `StreamTokenSigner`), locator, range parse, status code branch (200 / 206 / 416), `fs.createReadStream` for the body, multipart writer for multi-range
  - [x] T-020-D: openapi-validator `ignorePaths` extension — `/api/v1/stream/lessons/` added
  - [x] T-020-E: unit tests — parser + locator + controller (supertest)
  - [x] T-020-F: lint, typecheck, test, prettier; flip card; archive T-020
- Status: done
- Blockers: —
