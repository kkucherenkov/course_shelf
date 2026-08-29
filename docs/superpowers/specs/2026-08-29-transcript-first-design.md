# Transcript-first search — design

- Date: 2026-08-29
- Status: approved for planning
- Scope: stages B3 → B1 → B2 of the v2 programme
- Audience of the product: a personal, self-hosted instance (single maintainer, a handful of users)

## 1. Context and goal

The v1 roadmap is complete (119/119 cards). CourseShelf can scan a folder tree
into a catalogue, stream video with Range support, convert `.srt` sidecars to
WebVTT on the fly, track progress, notes and bookmarks, and serve a web SPA plus
a Flutter client with offline downloads.

What it cannot do is answer the question a person actually asks of their own
course library: **"where was this said, and what minute?"**

Search today is `ILIKE` over titles only — `prisma-search.adapter.ts` matches
course title, section title and lesson title, nothing else. The words spoken in
the videos are on disk, in subtitle sidecars, and are invisible to the product.

Closing that gap is the one direction that makes CourseShelf different from a
media server rather than a nicer skin on one. This document designs it.

## 2. Decisions

| # | Decision | Rationale |
| --- | --- | --- |
| D1 | Ship the in-lesson transcript panel (B3) **first**, before any storage or search work | It is client-side only and depends on nothing. See finding F1. |
| D2 | Index cues with `pg_trgm` + GIN, not `tsvector` | Substring matching is what "find where they said X" means, it matches how search already behaves, and it needs no raw SQL in application code and no per-language text-search configs. See §6.2. |
| D3 | Leave the `Note` model untouched | Timestamped notes were considered and deferred; `Bookmark` already carries `positionSeconds` and covers "mark this minute". Revisit only if the panel makes the need concrete. |
| D4 | ~~Defer Whisper transcription (B4) until the gap is measured~~ **Superseded 2026-08-29: B4 goes first.** | The measurement came back from the real library: most courses have no subtitle track at all, so B3 and B2 would render data that does not exist. Design: [`2026-08-29-b4-transcription-design.md`](./2026-08-29-b4-transcription-design.md). |
| D5 | Web only for B3; mobile transcript panel is a follow-up | Keeps the first increment small. The data path (§4) is platform-neutral. |

## 3. Findings from the code that shaped this design

**F1 — the sidebar is already built for this.**
`apps/web/app/components/lesson-player/PlayerSidebar.vue` is a four-tab sidebar
(`sections`, `notes`, `bookmarks`, `materials`) that already takes a
`currentTime` prop and already emits a `seek` event consumed by the page. A
transcript tab is a fifth sibling next to `PlayerBookmarksTab.vue`, wired
through machinery that exists.

**F2 — subtitles are broken on web today, and this is not in the known-limits list.**
`apps/web/app/composables/useLessonPlayer.ts:205-211` toggles subtitles by
walking `videoEl.textTracks` and flipping each track's `mode`. But the page
never renders a `<track>` element — the `<video>` in
`apps/web/app/pages/courses/[id]/lessons/[lessonId].vue:381-389` carries only
`:src`. The list is always empty, so the subtitle button in the player chrome
does nothing.

Everything needed to fix it already exists on the server: `LessonDto.subtitles[]`
is in the contract, and `GET /api/v1/stream/lessons/{id}/subtitles/{language}`
is documented as *"Same token as the video endpoint — a `<track>` element cannot
send an Authorization header either"*, i.e. it was designed for exactly this
element and then never wired up.

This makes the fix a prerequisite of B3 rather than a separate errand.

**F3 — subtitle rows are deleted and recreated on every scan.**
`apps/backend/src/modules/catalog/infra/prisma-lesson.repository.ts:123-127`
saves a lesson by `deleteMany` + `createMany` on the `subtitle` table inside a
transaction. Cues therefore cannot hang off `Subtitle` by foreign key: the first
scan after ingest would erase them. Transcript rows must be keyed by
`(lessonId, language)` and survive lesson saves.

**F4 — the scanner already sees subtitle file signatures and throws them away.**
`run-scan.handler.ts:315-319` builds `group.subtitles` as `{ path, language }`
while `file.mtime` and `file.size` are in scope and used for the video in the
neighbouring branch. Re-parse-only-when-changed therefore costs one widened
tuple, not new I/O.

**F5 — there is a reusable, pure subtitle parser.**
`apps/backend/src/modules/streaming/domain/subtitle-converter.ts` is a
dependency-free `convertSrtToVtt(input: string): string`. Cue extraction is the
natural companion function and belongs beside it.

## 4. Stage B3 — the transcript panel (web)

The first increment, and the only one a user sees immediately.

**B3a — render the subtitle track.** In
`apps/web/app/pages/courses/[id]/lessons/[lessonId].vue`, render one `<track>`
per entry of `lessonData.subtitles`, `src` pointing at
`/api/v1/stream/lessons/{id}/subtitles/{language}` with the same stream token
the `<video>` already uses, `kind="subtitles"`, `srclang` and `label` from the
DTO, and `default` on the track matching the user's locale when present. This
alone makes the existing subtitle button work.

**B3b — the transcript tab.** A new
`apps/web/app/components/lesson-player/PlayerTranscriptTab.vue`, registered as a
fifth tab in `PlayerSidebar.vue`:

- Reads cues from the video element's `TextTrack.cues` with the track's `mode`
  set to `hidden` (cues are populated in `hidden` as well as `showing`, so the
  panel works whether or not subtitles are burned on screen).
- Highlights the cue containing `currentTime` and keeps it scrolled into view,
  suppressing auto-scroll while the user is scrolling manually.
- Click on a cue emits the existing `seek` event with the cue's `startTime`.
- A filter box narrows the visible cues to those containing the typed string.
  Purely local, over an array already in memory.

**B3c — deep links.** The page accepts a `?t=<seconds>` query parameter and
seeks there once metadata has loaded. This is what B2's search results will link
to, and it is useful on its own for sharing a position.

No new endpoint, no schema change, no codegen. Strings go through `t()`, and any
component promoted into `@app/ui` gets a Storybook story plus a colocated spec.

**Risk.** Cue availability depends on the browser having loaded the track. The
panel must handle "track present but cues not yet parsed" by listening for the
track's `load` event rather than assuming a populated list on mount.

## 5. Stage B1 — transcript storage

**Schema.** Two tables. The parent exists solely so the ingester can tell "never
parsed" from "parsed and unchanged" — without it, the first scan after this
feature ships would see unchanged files and index nothing.

```prisma
model Transcript {
  id          String          @id @default(cuid())
  lessonId    String
  language    String
  sourcePath  String
  sourceMtime DateTime
  sourceSize  Int
  cues        TranscriptCue[]

  @@unique([lessonId, language], name: "uq_transcript_lesson_language")
  @@map("transcript")
}

model TranscriptCue {
  id           String     @id @default(cuid())
  transcriptId String
  startMs      Int
  endMs        Int
  text         String
  transcript   Transcript @relation(fields: [transcriptId], references: [id], onDelete: Cascade)

  @@index([transcriptId, startMs])
  @@map("transcript_cue")
}
```

The migration additionally runs, as raw SQL:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX transcript_cue_text_trgm ON transcript_cue USING gin (text gin_trgm_ops);
```

`Transcript` deliberately does **not** reference `subtitle.id` (finding F3), and
for the same reason it carries no foreign key to `Lesson` — a cascade from
either would be a cascade from a row the scanner recreates. Nothing therefore
removes a transcript automatically, so B1 owns that explicitly: when a scan
finds a lesson gone, or a subtitle language no longer present for a lesson, it
deletes the matching transcript rows.

**Parser.** `extractCues(vtt: string): { startMs, endMs, text }[]` lands next to
`convertSrtToVtt` in `streaming/domain/subtitle-converter.ts` — pure, no I/O,
same file, same test style. `.srt` input is normalised through the existing
converter first, so there is exactly one timestamp-parsing implementation.

**Ingest.** Inside `run-scan.handler.ts`, where subtitles are already grouped:

1. Widen `group.subtitles` to `{ path, language, mtime, size }` (finding F4).
2. After the lesson is saved, for each subtitle file compare `(mtime, size)`
   against the `Transcript` row for `(lessonId, language)`.
3. Absent row, or a differing signature → read the file, extract cues, replace
   the transcript and its cues in one transaction.
4. Matching signature → skip, no file read.

A second scan over an unchanged library therefore reads zero subtitle files,
preserving the existing "counters-zero no-op" property of a repeat scan.

Failures are recorded through the scan's existing `recordError` channel and never
abort the scan: a malformed sidecar costs its own transcript, not the library.

## 6. Stage B2 — global transcript search

### 6.1 Contract

`GET /api/v1/search` gains a third result array. Adding an optional property is
additive and does not break existing clients; per the spec-first loop the
OpenAPI change lands first, then codegen, then the implementation.

```yaml
transcripts:
  type: array
  items:
    $ref: "#/components/schemas/SearchTranscriptHitDto"
```

`SearchTranscriptHitDto`: `lessonId`, `lessonTitle`, `courseId`, `courseTitle`,
`sectionTitle`, `language`, `startMs`, `text`.

`SearchPort` (`catalog/domain/search.port.ts`) gains `findTranscriptHits(q,
limit, libraryIds)` alongside the existing two methods, implemented in
`prisma-search.adapter.ts` with Prisma's `contains` — the same operator the
adapter already uses, now backed by the trigram index.

### 6.2 Why trigram and not `tsvector`

A generated `tsvector` column cannot pick its text-search configuration from a
sibling `language` column: `to_tsvector(language::regconfig, text)` is not
`IMMUTABLE`, so the column would have to be filled by hand from application code,
which drags `Unsupported("tsvector")` into the schema and `$queryRaw` into both
the write path and the read path.

Trigram costs one extension and one index in a migration, keeps the application
on typed Prisma, is language-agnostic, and behaves consistently with the
title search a user has already been using. It gives up stemming and `ts_rank`.
If stemming turns out to matter in practice, the upgrade is additive — a second
index and a swapped `WHERE` clause behind the same port method. The adapter
carries a `ponytail:` comment naming that ceiling and that path.

### 6.3 Access control

Transcript hits go through the same `libraryIds` filter as course and lesson
hits: `null` means the admin path with no filter, an empty array means the user
has grants on zero libraries and the adapter must return `[]` without touching
the database. Skipping this would turn the transcript index into a way to read
the contents of videos a user has no grant for.

### 6.4 Web

The search page renders a transcript group whose entries link to
`/courses/{courseId}/lessons/{lessonId}?t=<startMs / 1000>`, which B3c already
understands. The matched substring is highlighted in the cue text.

## 7. Testing

| Unit | Test |
| --- | --- |
| `extractCues` | Pure unit tests beside the existing converter tests: SRT and VTT input, CRLF, BOM, missing trailing newline, malformed timestamps, empty file. |
| Scan ingest | Handler test asserting that a second scan with unchanged `(mtime, size)` performs no subtitle reads and leaves cue rows untouched, and that a changed signature replaces them. |
| Search adapter | `libraryIds: []` returns `[]` without a query; `libraryIds: [a]` never returns a cue from library `b`. |
| Transcript panel | Component spec: cue highlighted for a given `currentTime`, click emits `seek` with the cue start, filter narrows the list. |
| Player track | Spec asserting one `<track>` per `LessonDto.subtitles` entry, and that the locale-matching track carries `default`. |

## 8. Out of scope

- **B4, Whisper transcription.** No longer deferred — it now leads the
  programme and has its own design,
  [`2026-08-29-b4-transcription-design.md`](./2026-08-29-b4-transcription-design.md).
  It also creates the `Transcript` and `TranscriptCue` tables described in §5
  below (with two added columns) and fills cues for the content it generates,
  which narrows B1 to parsing pre-existing sidecars and building the index.
- **B6, notes export.** Follows B3.
- **Timestamped notes.** Decided against for now (D3).
- **Mobile transcript panel.** Follow-up to B3 (D5).
- **Stage C and scraper plugins.** Separate sub-projects of the v2 programme;
  each gets its own design document.

## 9. Open questions

1. ~~What fraction of lessons in a real library have zero subtitle tracks?~~
   **Answered 2026-08-29:** most of them. B4 was promoted ahead of B3 and B1 as
   a result.
2. Should the transcript tab be hidden or shown-empty for a lesson with no
   subtitles? Leaning hidden, to keep the tab strip honest.
