# CourseShelf — user guide

CourseShelf turns a folder of downloaded video courses into a real learning
library: a browsable catalog with posters and metadata, a player that remembers
where you stopped, notes and bookmarks tied to timestamps, and offline
downloads on mobile.

It is **self-hosted**. Your files stay on your server; nothing is uploaded
anywhere. One instance serves many people, each with their own progress and
their own view of the catalog.

> Setting up the server for the first time? Start with the
> [README quick start](../README.md#quick-start) and
> [deployment guide](./deployment.md). This document assumes the instance is
> already running.

---

## Contents

- [Who is who](#who-is-who)
- [First run — creating the instance owner](#first-run--creating-the-instance-owner)
- [Getting your media in: libraries and scanning](#getting-your-media-in-libraries-and-scanning)
  - [How CourseShelf reads a folder](#how-courseshelf-reads-a-folder)
  - [Taking control with `course.json`](#taking-control-with-coursejson)
  - [Running a scan](#running-a-scan)
- [Everyday use](#everyday-use)
  - [Home](#home)
  - [Browse and search](#browse-and-search)
  - [Course detail](#course-detail)
  - [The lesson player](#the-lesson-player)
  - [Notes and bookmarks](#notes-and-bookmarks)
- [Mobile](#mobile)
  - [Downloads and offline playback](#downloads-and-offline-playback)
- [Settings](#settings)
- [Administration](#administration)
  - [Users](#users)
  - [Permissions](#permissions)
  - [Metadata: scrape and identify](#metadata-scrape-and-identify)
  - [Backups](#backups)
- [Known limits in this release](#known-limits-in-this-release)
- [Troubleshooting](#troubleshooting)

---

## Who is who

CourseShelf has two roles and one permission mechanism.

| Role | What it means |
| --- | --- |
| **USER** | Sees the courses they have been granted, tracks their own progress, writes their own notes and bookmarks. |
| **ADMIN** | Everything a USER can do, plus the entire `/admin` section: libraries, scans, users, permissions, metadata, backups. |

Access to content is **not** derived from the role. It is granted explicitly
through *access grants*, each of which points at either a whole **library** or
a single **course**. A user with no grants signs in successfully and sees an
empty catalog — that is correct behaviour, not a bug.

Admins can also be **banned** (with an optional reason and expiry) and can
**impersonate** a user to reproduce what that person sees.

---

## First run — creating the instance owner

A fresh instance has no users. The web app detects this and turns the sign-up
wizard into the setup flow:

1. Open the instance in a browser (by default `http://localhost:8080`).
2. Because no account exists yet, every route redirects to **`/setup`** — a
   three-step wizard.
3. The account you create there becomes the first **ADMIN**.
4. Once that account exists, `/setup` locks itself and redirects to `/sign-in`.
   It can never be used again to mint a second owner.

After this, additional people are created by an admin under
**Admin → Users**, or they self-register at `/sign-up` if the instance allows
it — either way they start with **no access grants** until an admin gives them
some.

---

## Getting your media in: libraries and scanning

### Libraries

A **library** is a folder on the server that CourseShelf is allowed to index.
Register one under **Admin → Libraries** with:

- a **name** you will recognise ("Computer Science", "Design"), and
- an absolute **path on the server** — not on your laptop. If CourseShelf runs
  in Docker, this must be a path *inside the container*, so the host folder has
  to be mounted into it first.

Each root path can be registered only once.

### How CourseShelf reads a folder

The scanner expects one folder per course, with lessons inside — optionally
grouped into section subfolders:

```
/media/courses/
└── Advanced TypeScript/
    ├── 01 - Getting started/
    │   ├── 01 - Why types.mp4
    │   ├── 01 - Why types.en.srt
    │   ├── 01 - Why types.pdf
    │   └── 02 - Setting up.mp4
    └── 02 - Generics/
        └── 01 - The basics.mp4
```

**Ordering and titles come from the names.** Four patterns are recognised, in
priority order:

| Pattern | Example | Result |
| --- | --- | --- |
| Numeric prefix | `01 - Title`, `01. Title`, `01_Title`, `01 Title`, `07` | ordinal `1` (or `7`) + title |
| Word-prefixed numeric | `Модуль 2 - Title`, `Глава 2. Title`, `Module 1 Setup` | leading word dropped, ordinal kept |
| Composite (lesson files) | `2.5 Title`, `2.6` | section `2`, lesson `5` |
| Bare title | `Introduction` | no ordinal, title as written |

If a numeric prefix has no title after it (a folder literally named `07`), the
folder name itself is used as the title — you never get a blank entry.

**Recognised video extensions:** `.mp4`, `.m4v`, `.mkv`, `.webm`, `.wmv`.
Anything else is reported as a per-file scan warning, not a scan failure.

**Sidecar files attach automatically.** A file whose name matches a video's is
grouped with it as course material or subtitles:

```
1.1 Why Vim.mp4      ← the lesson
1.1. Why Vim.pdf     ← attached material (note the extra dot — handled)
1.1 Why Vim.png      ← attached material
1.1 Why Vim.en.srt   ← English subtitles
```

Subtitle language is read from the `.<lang>.srt` / `.vtt` suffix. `.srt` files
are converted to WebVTT on the fly for the browser.

**Video duration, resolution and thumbnails** are extracted with ffprobe/ffmpeg
during the scan. If those binaries are missing on the server, the scan still
succeeds — lessons just have no duration and no thumbnail.

### Taking control with `course.json`

Folder names get you 90 % of the way. When you want exact titles, an ordering
that does not match the filenames, or real metadata, drop a `course.json` in
the course folder. It overrides the inferred structure.

Minimal (**schema v1**):

```json
{
  "schemaVersion": 1,
  "title": "Advanced TypeScript",
  "instructor": "Jane Doe",
  "description": "Generics, conditional types, and the type-level toolbox.",
  "sections": [
    {
      "title": "Getting started",
      "lessons": [
        { "title": "Why types", "file": "01 - Why types.mp4" }
      ]
    }
  ]
}
```

Full (**schema v2** — same shape plus richer metadata):

```json
{
  "schemaVersion": 2,
  "title": "Advanced TypeScript",
  "description": "Generics, conditional types, and the type-level toolbox.",
  "instructorNames": ["Jane Doe", "John Roe"],
  "studioName": "Frontend Masters",
  "tags": ["typescript", "types"],
  "level": "advanced",
  "language": "en",
  "releaseDate": "2025-03-01",
  "posterUrl": "https://example.com/poster.jpg",
  "externalIds": [
    { "source": "udemy", "externalId": "1234567", "url": "https://…" }
  ],
  "sections": [ /* as above */ ]
}
```

`level` accepts `beginner`, `intermediate`, `advanced`, `expert`, `all_levels`.

**A malformed `course.json` never fails the scan.** It is recorded as a scan
error against that one folder, and the course falls back to folder-name
inference. Check **Admin → Scans** to see the errors.

### Running a scan

Start a scan from **Admin → Libraries → (library) → Scan**. While it runs, a
live progress indicator shows files scanned, courses discovered, and the file
currently being read — pushed over a realtime connection, no page refresh
needed.

Scans are **incremental**. Each scan records every file's path, size and
modification time; on the next scan, files whose signature is unchanged are
skipped. Re-scanning a large, unchanged library is fast.

When it finishes you get counts (`scanned` / `added` / `updated` /
`coursesDiscovered`) and the list of per-file errors, if any. Scans can also be
cancelled mid-run.

---

## Everyday use

### Home

Four rows, each answering a different question:

- **Continue watching** — lessons you started and have not finished.
- **Recently added** — what the last scans brought in.
- **Recently completed** — courses you finished.
- **Your week** — your watch activity over the last seven days.

### Browse and search

**Browse** lists everything you have access to, with a status filter
(all / in progress / completed / not started) and three sort orders:
*recently watched* (default), *newest*, *alphabetical*.

**Search** covers courses **and** individual lessons in one query, grouping the
results and showing a snippet, a thumbnail and the parent course for each hit.
On desktop it is also available as a command palette without leaving the page.

> Filtering by library, duration bucket or instructor — and sorting by duration —
> is designed but **not yet built**. See [known limits](#known-limits-in-this-release).

### Course detail

Poster, description, instructors, studio, tags, level and language; total
duration and lesson count; your progress across the course; and the full
outline with collapsible sections.

Two whole-course actions live here: **mark complete** and **reset progress**.

### The lesson player

Video streams from your server — progressive HTTP with byte-range support, so
seeking is instant and nothing is transcoded or pre-packaged. Subtitles appear
as selectable tracks. Attached materials (PDFs, slides, images) are listed
beside the video and download over a signed link.

The player tracks your position continuously. Once you pass **90 %** of a
lesson it is marked complete — once, permanently; rewatching does not undo it.
That 90 % threshold is a server rule and is not configurable per user.

Depending on your settings the player will resume where you left off, apply
your default speed, and roll straight into the next lesson.

### Notes and bookmarks

**Notes** — one Markdown note per lesson, per person. The editor has an
edit/preview toggle and saves as you type, with a visible sync indicator
(saving / saved / offline / failed). Nobody else sees your notes.

**Bookmarks** — timestamped marks with an optional label. Add one at the
current position; click any bookmark to jump straight back to that second.

---

## Mobile

The Flutter app (iOS + Android) carries the same catalog through five tabs:
**Home**, **Browse**, **Search**, **Downloads**, **Settings**, plus course
detail and a full-screen player with landscape edge gestures.

Sign in with the same account. The app holds a bearer token in the platform
secure storage (Keychain / Keystore).

### Downloads and offline playback

Tap the download icon on any lesson row to queue it, or use
**Download course · `<size>`** on the course detail screen to queue everything
at once. The estimated size is fetched from the server before you commit.

The **Downloads** tab shows the queue grouped by course, with a storage bar
(used by the app / used by other apps / free), an offline banner when there is
no connection, per-course *delete all*, and an empty state when nothing is
queued.

**Downloaded files are encrypted at rest** with AES-256-GCM, chunked so that
each block gets its own nonce. The key never leaves the device's secure
storage. A downloaded lesson plays through a local loopback that decrypts on
demand — the player never sees ciphertext, and neither does anything else on
the device.

Downloads are **resumable**: interrupt one and it continues from where it
stopped rather than starting over.

### Working offline

Watch position, notes and bookmarks are all recorded on the device first and
sent to the server afterwards — so they work with no connection and nothing
waits on the network.

Queued work is sent when the connection comes back (immediately, not on a
timer), when you reopen the app, every few minutes while you use it, and right
after each change while you are already online. Nothing is lost if the app is
closed in between: the queue is on disk.

Two rules are worth knowing:

- **The newest edit wins.** Editing a note four times offline sends the fourth
  version, not four requests. Same for your position in a lesson.
- **If the server already has newer progress** for a lesson — you watched it on
  the web in the meantime — the server's version stands and your queued one is
  discarded rather than overwriting it.

---

## Settings

Four groups, saved automatically as you change them.

**Profile** — display name, email (read-only), password change.
Avatar upload and email change are visible but not yet functional.

**Appearance** — theme (dark / light / system) and density
(comfortable / cozy / compact).

**Playback**

| Setting | Effect |
| --- | --- |
| Default speed | Playback rate applied when a lesson first loads |
| Autoplay next lesson | Roll into the next lesson automatically |
| Resume where I left off | Jump to your last position when reopening |
| Mark-as-complete threshold | When the "completed" badge appears **in your UI**. The server still marks a lesson complete at 90 % regardless. |

**Account** — sign out of this device; sign out of *all other* devices
(revokes every session but the current one, behind a confirmation dialog).
Account deletion is shown but not yet functional.

**Languages.** The mobile app ships English, Russian, Ukrainian and Greek.
The web app currently ships English and Russian.

---

## Administration

Everything below is `/admin`, ADMIN role only.

The **dashboard** aggregates instance health: user count, library and course
totals, recent scans and their outcomes.

### Users

List, view and edit users: display name, role (USER / ADMIN), ban state with
reason and expiry. Admins can impersonate a user to see the catalog exactly as
that person sees it.

### Permissions

`Admin → Permissions → (user)` is where you hand out access. Each grant targets
either a **library** (everything in it, including courses added by later scans)
or a **single course**, at read level.

Practical rule: grant libraries for people who should track the collection as it
grows, grant courses for one-off access.

Remove a grant and the content disappears from that user's catalog immediately —
their progress and notes are preserved, not deleted.

### Metadata: scrape and identify

Two tools for filling in metadata you did not write by hand.

**Scrape preview** fetches metadata for a course from a URL and shows you what
it found *before* anything is written. Built-in extractors cover Udemy, YouTube,
JSON-LD (the schema.org markup most course sites publish) and generic HTML
metadata.

**Identify** proposes a full metadata match for a course as an *identify task*
in `proposed` state. You then **apply** it — merged into the course under a
defined merge policy — or **discard** it. A task can only be applied or
discarded once; a second attempt is rejected.

Instructors, studios and tags are also editable directly as first-class
entities, so renaming an instructor updates every course that references them.

There is also a **maintenance backfill** that recomputes derived metadata
(durations, thumbnails) across the catalog, reporting progress in realtime.

### Backups

`POST /api/v1/admin/backups` produces a compressed PostgreSQL snapshot via
`pg_dump` and hands back a **signed download link, valid for 5 minutes**.
The archive contains the database only — your media files are not copied,
because CourseShelf never owned them in the first place. Back those up the way
you already back up the rest of that disk.

> This exists as an API endpoint. There is no button for it in the admin UI yet.

---

## Known limits in this release

Stated plainly, because finding these by surprise is worse.

| Limit | Detail |
| --- | --- |
| **Browse filters incomplete** | Library, duration-bucket and instructor filters, and sort-by-duration, are designed but not implemented on web. |
| **Backups have no UI** | API only. |
| **Web ships 2 locales** | English and Russian. Mobile ships four (en, ru, uk, el). |
| **Greek and Ukrainian are machine-written** | Not yet reviewed by a native speaker. |
| **Storage bar on mobile** | The free/used disk figures use a native plugin that has not been verified on a real device. |

---

## Troubleshooting

**A course did not appear after a scan.** Check **Admin → Scans** for per-file
errors on that folder. The usual causes are a video extension outside the
supported five, or a `course.json` that failed to parse.

**Lessons appear in the wrong order.** Folder-name inference did not find the
ordinals you expected. Either rename to a recognised pattern (`01 - Title`) or
declare the order explicitly in `course.json`.

**A lesson has no duration or thumbnail.** ffmpeg/ffprobe is not available to
the server. Install it, then re-scan.

**Someone signs in but sees nothing.** They have no access grants. Give them
one under **Admin → Permissions**.

**Video will not play.** Stream links are signed and expire after 15 minutes
by default. A link copied out of the network tab and reused later will 401 —
reload the lesson page instead.

**The scan says "running" forever.** Cancel it from **Admin → Scans** and
re-run. Check the server logs for filesystem permission errors on the library
root.

For toolchain and server-side problems, see
[`docs/troubleshooting.md`](./troubleshooting.md).
