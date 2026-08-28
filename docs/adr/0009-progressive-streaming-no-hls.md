# 0009 — Direct progressive streaming with HTTP Range; HLS deferred

- **Status:** accepted
- **Date:** 2026-08-29
- **Deciders:** @kkucherenkov
- **Tags:** backend, streaming, performance

> Recorded retroactively. Implemented in
> [E08-F02-S01](../roadmap/tasks/E08-F02-S01.md) /
> [E08-F02-S02](../roadmap/tasks/E08-F02-S02.md).

## Context

CourseShelf serves video files that already exist on disk, to a small number of
known users, usually over a LAN. The files are whatever the user downloaded —
arbitrary containers and bitrates.

Adaptive streaming (HLS/DASH) solves a problem this deployment does not have:
bandwidth that varies enough mid-playback to need renditions. It costs a
transcoding pipeline, a segment store that grows with the library, and an
invalidation story for when a source file changes.

## Decision

Serve the source file directly with full HTTP `Range` support and defer HLS
until something demands it. `streaming.controller.ts` implements 200 (no Range),
206 single-range, 206 `multipart/byteranges`, 416 with `Content-Range: bytes */N`,
and 400 on a malformed header, setting `Accept-Ranges: bytes` throughout.

Access is a short-lived HMAC stream token minted by `issueStreamUrl`, so the
byte routes are `@AllowAnonymous()` and verified by `StreamTokenSigner` instead
of the session guard.

`ffmpeg`/`ffprobe` are used, but only to probe metadata and cut thumbnails
(`local-ffmpeg.adapter.ts`) — never to transcode.

## Consequences

### Positive

- Zero storage overhead and zero pre-processing: the library is the files the
  user already has, and adding a course is copying it into place.
- Seeking works, in every browser and in `video_player` on mobile, because
  `Range` is implemented properly rather than partially.
- The same byte-range semantics are what the mobile download queue resumes on
  ([ADR-0006](0006-bloc-on-mobile.md)) — one mechanism serves playback and
  offline download.

### Negative

- No adaptive bitrate. A client on a weak connection buffers; it cannot drop to
  a smaller rendition.
- Playback compatibility is the source file's problem. A container or codec the
  client cannot decode simply does not play, and there is no transcode fallback.
- These routes are **outside** the OpenAPI contract — binary responses with
  custom status codes and Range semantics that OpenAPI describes poorly, so the
  validator is bypassed and only controller tests cover them. That is a real hole
  in [ADR-0002](0002-spec-first-openapi.md): nothing in CI would catch the Range
  implementation being removed except its own tests.

### Neutral

- Subtitles ride the same token: `.vtt` is piped as-is, `.srt` is converted in
  memory and cached to a `*.cache.vtt` sibling, best-effort so a read-only mount
  cannot break the request.
- Nothing here forecloses HLS. It would be an additional endpoint plus a
  pipeline, not a rewrite.

## Alternatives considered

### Option A — HLS with pre-transcoded renditions

Rejected for v1. It multiplies storage by the number of renditions and adds a
transcode step to every ingest, to solve a bandwidth problem a self-hosted LAN
deployment does not have.

### Option B — on-the-fly transcoding

Rejected. It converts an I/O-bound file server into a CPU-bound one, on hardware
the operator chose for storage.

### Option C — no Range support, whole-file responses

Rejected: seeking would not work, and the mobile download queue could not resume.
Material sidecar files (PDF, Markdown, images) _do_ take this path, because they
are small and never seeked.

## Related

- [ADR-0002](0002-spec-first-openapi.md) — why these routes are exempt.
- [ADR-0006](0006-bloc-on-mobile.md) — the download queue built on Range.
