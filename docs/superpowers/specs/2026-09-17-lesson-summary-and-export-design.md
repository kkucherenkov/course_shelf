# Lesson summary with screenshots, and the Markdown export

Design pre-step for [E28-F01-S01](../../roadmap/tasks/E28-F01-S01.md), whose
first sub-step asks for exactly this: settle the scope, the file shape, and
whether the export is a download or a copyable block. It also covers the
feature that card stops short of, a generated summary of the lesson, which
needs a card of its own under E29.

**Goal:** take a lesson out of the app as something you would keep in a notes
vault: what was said, what was on screen, what you wrote, and where to click
back to.

## 1. Decisions

| # | Decision | Why |
| --- | --- | --- |
| D1 | A summary is preparatory work, and editing happens outside the app | The maintainer exports into an Obsidian vault and edits the Markdown there, with a real editor and the rest of the notes alongside. So `bodyMd` is immutable and the lifecycle is `Quiz`'s propose/apply/discard verbatim: accept this draft, or throw it away and generate another. An in-app editor would be a worse Obsidian. |
| D2 | Frames come from ffmpeg scene detection, filtered by a vision model | `select='gt(scene,0.4)'` finds slide changes without a model and without a token. On a talking head it returns noise, so a vision pass drops what carries no information and writes the alt text for what stays. |
| D3 | Detection and extraction are one ffmpeg command | The `select` filter writes only the frames it picks, and `showinfo` prints their `pts_time` to the same log. Finding timestamps in one pass and seeking back for each frame in a second decodes the video twice. |
| D4 | Frames sit in the body as `![](frame:<frameId>)`, written by our code after the vision pass | One body renders two ways: the admin preview swaps in a signed URL, the export swaps in `images/NNN.jpg`. Position comes from the frame's timestamp against the section's window. A model asked for filenames invents them, so it is never asked, the same call `quiz-window.ts` makes about timestamps. |
| D5 | Two model calls per lesson, not one multimodal pass | The vision call reasons about images; the summary call reasons about text and runs on a model that costs half as much. Splitting them makes each testable on its own, and a frame landing in the wrong section becomes a renderer bug with a fixture, not a prompt mystery. Fold them together later if the summary turns out to be blind to slides that the narration never mentions. |
| D6 | The export is a ZIP: `lesson.md` plus `images/` | Relative image links survive being unpacked into an Obsidian vault. A single `.md` carrying `data:` URIs triples in size and Obsidian renders those unreliably; links back to the API die the moment the file leaves the machine or the token expires. |
| D7 | `yazl` streams the ZIP into the response | Node ships `zlib`, which compresses bytes but writes no ZIP container. The alternatives are `apk add zip` plus a temp directory per export, or 80 lines of hand-rolled container. `yazl` is 11 KB with no transitive dependencies and needs neither. |
| D8 | Generating is admin-only and on demand; exporting is for any user who can see the lesson | Generation spends money and CPU, and mirrors `POST /courses/{id}/quizzes`. Export reads what is already there, so it follows the access rules of the data it renders. |
| D9 | Text and vision calls go through a hosted provider | Local llama.cpp measures 0.91 tok/s on the target NAS. A summary is roughly 600 output tokens, so one lesson costs ten minutes of a machine that is also serving video. ADR-0011 ruled hosted APIs out on privacy grounds; the library holds published courses rather than personal data, so that reasoning needs revisiting in an ADR, not a code comment. |
| D10 | No run row for a course-wide walk | `LessonSummary` rows stamped with their model are the record of what ran, the same call `Quiz` made. A killed process leaves the rest ungenerated, and you re-run it. |

## 2. What already exists

- `FfmpegAdapter.writeThumbnail({videoAbsolutePath, outAbsolutePath, atSecond, widthPx, heightPx, jpegQuality})`, a thin `execFile` wrapper (`infra/local-ffmpeg.adapter.ts`). `widthPx` and `heightPx` are typed as the literals `320` and `180`, which no scaling knob can get past.
- `derivedThumbnailPath({derivedRoot, libraryId, videoPath})` and `DERIVED_PATH`, already holding scan thumbnails and downloaded posters.
- `GET /api/v1/courses/{id}/poster?token=…`, a signed short-lived token minted into the DTO. The precedent for serving an image out of `DERIVED_PATH`.
- `windowCues(cues, charBudget = 5000)` in `learning/domain/quiz/quiz-window.ts`, plus `QuizGenerationLockService` and the fire-and-forget handler shape from `RunTranscriptionHandler`.
- `bookmark(positionSeconds, label)`, `note(userId, lessonId, body)`, `transcript_cue`.

Missing: a way to pull several frames out of one video, a hosted model adapter, the summary aggregate, and the renderer.

## 3. Frame extraction

One command per lesson:

```sh
ffmpeg -i <video> -vf "select='gt(scene,0.4)',showinfo,scale=1280:-2" \
  -vsync vfr -q:v 4 <derived>/summaries/<lessonId>/cand_%03d.jpg
```

`showinfo` writes one `pts_time:` line per kept frame to stderr, in the same
order as the files. A parser pairs them up.

1280 px wide, not 320: at thumbnail size a slide's text is unreadable to you
and to the model.

Caps: at most 24 candidates survive to the vision call, at most 8 reach the
summary. A lecture that changes slides 60 times gets the 24 most widely
spaced. Without a cap, one screen-recorded terminal session sends a hundred
near-identical frames.

`probe` and `writeThumbnail` both hard-code a 30 s timeout, which fits a seek
to one frame. Decoding an hour of video to the end does not, so this call
takes its budget from config the way `extractAudio` does.

## 4. Model calls

**Vision call.** Up to 24 JPEGs plus the cue lines around each timestamp. The
model returns, per frame, whether to keep it and a one-line caption. Keeps are
capped at 8.

**Summary call.** The cues, windowed by `windowCues`, into a text model. Output
is Markdown: a short lead paragraph, then sections with their start timestamps.
Lessons over roughly four windows summarise per window first and then over
those summaries, so the input stays bounded.

Neither call sees a filename or invents a timestamp.

The model is a per-request choice defaulting to config, the way
`GenerateQuizRequest.modelId` already works, so two models can be compared on
one lesson. A lesson with no transcript cannot be summarised: the route
answers 409 rather than generating a summary from nothing.

Cost, against the current library (68 courses, 5973 lessons, 1092 hours, 1952
transcripts; median transcript 4624 characters, p90 10645):

| Scope | Cost |
| --- | --- |
| One lesson (11 min, ≤24 candidates, ≤8 frames) | $0.0007 |
| One course (median 49 lessons) | $0.03 |
| Every existing transcript | $1.30 |

CPU, not money, is the constraint: scene detection decodes the whole video, so
a 49-lesson course occupies ffmpeg for 20 to 40 minutes.

## 5. The aggregate

```prisma
model LessonSummary {
  id        String   @id @default(cuid())
  lessonId  String
  status    String   // proposed | applied | discarded
  modelId   String
  bodyMd    String
  createdAt DateTime @default(now())
  appliedAt DateTime?
  frames    SummaryFrame[]
}

model SummaryFrame {
  id        String @id @default(cuid())
  summaryId String
  atMs      Int
  relPath   String   // under DERIVED_PATH
  caption   String
}
```

Frames get their own table because each one is served over HTTP by id.

Lifecycle: `proposed` on generation, then applied or discarded. Nothing
rewrites `bodyMd`. A second generation adds another `proposed` row rather than
replacing the first, so two models can be compared on one lesson. At most one
`applied` row per lesson, and that row is what the export renders.

A placeholder whose frame row is gone renders as nothing, which keeps a
deleted frame from breaking an export.

## 6. API

Admin:

- `POST /lessons/{id}/summaries`, `POST /courses/{id}/summaries` — 202, fire and forget, locked per course by `QuizGenerationLockService`
- `GET /lessons/{id}/summaries`
- `POST /summaries/{id}/apply`, `POST /summaries/{id}/discard`

Any user who can see the lesson:

- `GET /lessons/{id}/export` — `application/zip`
- `GET /courses/{id}/export` — `application/zip`
- `GET /stream/summaries/{id}/frames/{frameId}?token=…` — signed, mirroring the poster route

Every route lands in `openapi.yaml` before any handler exists.

## 7. The export

```text
lesson.md
images/001.jpg
```

`lesson.md` carries the lesson title, a deep link back into the player, the
applied summary with its `frame:` placeholders rewritten to `images/NNN.jpg`,
the user's note, and the bookmarks, each with its timestamp, its `?t=` link,
and the transcript lines it points at.

A course export is `course.md`, `lessons/NN-slug.md` in outline order, and one
shared `images/`.

No applied summary means a file without that section. The export predates the
summary feature and keeps working without it.

## 8. Testing

- Renderer: fixture in, Markdown out, including a placeholder whose frame was
  deleted.
- `showinfo` parser: a captured stderr log, asserting timestamps pair with
  filenames in order.
- Vision selection: mocked adapter, asserting the caps hold.
- Access control: export and frame routes, against a user without a grant.
- ZIP: one integration test unpacking the stream and checking the entries.

## 9. Out of scope

- Editing a summary in the app, captions and frame order included. The draft
  leaves in the ZIP and gets edited in the vault.
- Summaries on mobile.
- Regenerating one section of a summary.
- Any summary in a language other than the transcript's.

## 10. Order of work

1. Hosted model adapter plus ADR-0012 superseding ADR-0011. Blocks everything
   below.
2. `FfmpegAdapter`: widen the thumbnail dimensions, add scene extraction.
3. `LessonSummary` plus its routes, generation, and the admin review screen.
4. E28-F01-S01: the renderer, the ZIP, and the web entry point.

Steps 2 and 4 touch no shared file with steps 1 and 3 and can run as separate
lanes.
