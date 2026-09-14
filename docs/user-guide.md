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
  - [Rescanning one course](#rescanning-one-course)
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
  - [Authoring a scraper definition](#authoring-a-scraper-definition)
  - [Transcription](#transcription)
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
are converted to WebVTT on the fly for the browser. A track is identified by
its language, so each language gives you exactly one entry in the player's
subtitle menu, named after the language (`English`, `Russian`) rather than
after the file. If you ship both `1.1 Why Vim.en.srt` and
`1.1 Why Vim.en.vtt`, the `.vtt` is the one that gets used.

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

A library scan **never re-imports a course it already knows** — your title,
poster and other course-level edits are always kept. It does keep that
course's lesson order and lesson list in sync with its folder: a new video is
picked up, and every lesson's position is recomputed from its filename, so a
renamed file resorts the course the same way a per-course **Rescan** would.
What a library scan will not do for an already-known course is add a
brand-new section folder or remove a lesson whose video is gone — for either
of those, rescan the course itself.

### Rescanning one course

The **Rescan** button on a course page (admin only) re-reads that one folder,
and unlike a library scan it *re-imports* what it finds:

- lessons the first import missed are added;
- lessons are renumbered to match the files on disk;
- a lesson whose video file is gone is removed, together with its transcript,
  your progress on it, and its bookmarks and notes;
- lessons that are still there keep their identity, so your progress and
  bookmarks survive the rescan.

**Your edits to the course itself are kept** — title, description, poster,
level, language, rating, instructors, studio and tags are never taken back from
the folder or from `course.json`. Only the sections and lessons underneath are
rebuilt.

If the folder itself is missing (renamed on disk, or a drive that did not
mount), the rescan reports the error and changes nothing, rather than treating
every lesson as deleted.

---

## Everyday use

### Home

Four rows, each answering a different question:

- **Continue watching** — lessons you started and have not finished.
- **Recently added** — what the last scans brought in.
- **Recently completed** — courses you finished.
- **Your week** — your watch activity over the last seven days.

### Browse and search

**Browse** lists everything you have access to. Four filters narrow the shelf,
and they combine:

| Filter | Values |
| --- | --- |
| **Status** | all · in progress · completed · not started |
| **Library** | any one of your libraries |
| **Length** | under 5h · 5–10h · 10–20h · over 20h — total runtime of every lesson |
| **Instructor** | anyone credited on a course (hidden when nobody is) |

Sort orders are *recently watched* (default), *newest*, *alphabetical* and
*longest first*.

Every filter and the sort live in the address bar, so a reload, a bookmark or a
link you send yourself all reproduce the same shelf. Defaults are left out of
the URL — `/browse` and `/browse?status=all` are the same page. **Clear
filters** resets the narrowing without touching the sort order.

**Search** covers courses **and** individual lessons in one query, grouping the
results and showing a snippet, a thumbnail and the parent course for each hit.
On desktop it is also available as a command palette without leaving the page.

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

**Languages.** English and Russian, on both web and mobile.

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
it found *before* anything is written. Built-in extractors cover Udemy,
YouTube, Coursera and Stepik (each through its own public catalogue API — no
configuration needed), JSON-LD (the schema.org markup most course sites
publish) and generic HTML metadata.

Stepik fills the most of any built-in: title, the full description, cover,
language, release date, instructors and a real rating. Its page splits what
reads as one description across several blocks — the body, "what you'll learn",
who the course is for, requirements and workload — so they are folded into the
one description field under headings, in the course's own language. The
course's section list is deliberately **not** imported: your outline comes from
the folders and files on disk, and a second source for it would disagree with
the first partly downloaded course.

**Udemy is the exception — its course pages cannot be fetched.**
`www.udemy.com/course/…` sits behind a Cloudflare bot/JS challenge that no
plain HTTP client passes; a scrape-preview `url` request against it fails with
a "Scrape blocked by bot challenge" error, by design — this project does not
attempt to defeat that challenge. Udemy's Affiliate API, the sanctioned way
around it, stopped issuing keys to new callers on **2025-01-01** (existing
partners keep theirs; there is no other path to request one).

The supported route is pasting the page:

1. Open the course page in your own logged-in browser.
2. View source (or DevTools → Elements → right-click `<html>` → "Copy
   outerHTML").
3. In Scrape preview, choose `source: udemy`, `kind: fragment`, and paste the
   HTML into the `fragment` field.
4. Optionally also fill `url` with the page's address — the Udemy scraper uses
   it only to mint the course's external id, so metadata already comes through
   without it, but future re-scrapes and instructor/course matching need that
   id to recognise the course again.

**Identify** proposes a full metadata match for a course as an *identify task*
in `proposed` state. You then **apply** it — merged into the course under a
defined merge policy — or **discard** it. A task can only be applied or
discarded once; a second attempt is rejected.

Instructors, studios and tags are also editable directly as first-class
entities, so renaming an instructor updates every course that references them.

There is also a **maintenance backfill** that recomputes derived metadata
(durations, thumbnails) across the catalog, reporting progress in realtime.

### Authoring a scraper definition

The built-in scrapers (Udemy, YouTube, Coursera, Stepik, generic JSON-LD) cover the
common cases. For a site none of them recognise, drop a JSON file under
`DERIVED_PATH/scrapers/` — no rebuild, no code. The backend reads every
`*.json` file there once at startup and registers each as a scraper, checked
after the built-ins and before the generic JSON-LD fallback.

A definition names a URL pattern and a set of rules, each mapped onto one
course field. Take a real problem: `stepik.org` course pages carry no
schema.org `Course` markup — their one JSON-LD block describes a `Product`,
which the generic extractor ignores — so it falls back to OpenGraph, and
Stepik's `og:title` is SEO copy, not a course title:

> Алгоритмы: теория и практика. Методы: Бесплатно | курс на Stepik

The clean title *is* on the page, just not where the generic extractor looks:
Stepik's Ember frontend embeds the real course record as JSON in
`<script id="shoebox-main-store" type="fastboot/shoebox">`, and the record
sits at `records.course.courses.0` — a dotted path through an object and a
zero-indexed array, which is exactly what a JSON rule walks. This definition
fixes the title and picks up the language the generic extractor never finds
at all:

```json
{
  "id": "stepik",
  "kinds": ["url"],
  "match": { "urlPattern": "^https://stepik\\.org/course/\\d+" },
  "rules": {
    "title": {
      "json": "records.course.courses.0.title",
      "jsonFrom": "script#shoebox-main-store"
    },
    "description": {
      "json": "records.course.courses.0.summary",
      "jsonFrom": "script#shoebox-main-store"
    },
    "language": {
      "json": "records.course.courses.0.language",
      "jsonFrom": "script#shoebox-main-store"
    }
  }
}
```

`jsonFrom` is a plain CSS selector, not tied to `type="application/ld+json"`
— it matches this script by `id` regardless of its `type="fastboot/shoebox"`
attribute. Rules win over the generic extractor (D3 in the design doc), so
`title` and `language` here replace whatever OpenGraph produced; fields the
definition does not mention — `posterUrl`, in this case — still come through
from the generic extractor untouched.

- **`id`** must be unique — a definition whose id matches a built-in scraper
  (`udemy`, `youtube`, `coursera`, `stepik`, `json-ld`) or another definition is rejected, never
  silently overridden.
- **`kinds`** is the subset of `url` / `name` / `fragment` this definition
  supports. Most definitions only need `["url"]`.
- **`match.urlPattern`** is a regular expression, checked against the course
  URL to decide whether this definition applies.
- **`rules`** map a field name (`title`, `description`, `instructorNames`,
  `studioName`, `tags`, `level`, `language`, `releaseDate`, `posterUrl`,
  `externalIds`, `ratingAverage`, `ratingCount`) onto either a CSS rule
  (`selector` + `from: "text"` or `"attr:<name>"`, plus `many: true` to
  collect every match instead of just the first) or a JSON rule (`json`, a
  dotted path like `a.b.0.c`, walked over the parsed contents of the script
  tag named by `jsonFrom` — every `<script type="application/ld+json">` when
  omitted). Whichever rule wins fills in the field; where a rule and the
  generic extractor both produce a value, the rule wins.

A CSS rule would have worked for `title` too — Stepik's page also has a clean
`<h1 class="course-promo__header">` with the same text — so
`{ "selector": "h1.course-promo__header", "from": "text" }` is an equally
valid rule for it. The JSON rule above is worth the extra step because the
same embedded record also carries `language`, which has no tag on the page
for a CSS selector to target at all.

A malformed definition — invalid JSON, an unknown rule field, a bad regular
expression, a colliding id — is logged and skipped; it never prevents the
backend from starting. Changes to a definition file take effect on the next
backend restart, not immediately — there is no file watcher.

**Troubleshooting: a definition does not take effect.** There is no admin
screen listing loaded/rejected definitions yet, so the backend container logs
are the only signal — look for a line shaped
`Skipped "<file>": <reason>`. The reason names one of:

- unparseable JSON
- an unknown rule target field
- a bad `urlPattern` regular expression
- an id colliding with a built-in scraper

### Transcription

**Transcribe** on a course page generates a subtitle track for every lesson in
that course that has neither a hand-made `.srt`/`.vtt` sidecar nor an
up-to-date generated one — a lesson you already subtitled yourself is never
touched.

Prefer this to the library-wide button. Transcription runs at roughly twenty
minutes of CPU per lesson on modest hardware, so one course is an overnight
job while a five-thousand-lesson library is weeks. `Admin → Libraries →
(library) → Transcribe` still exists and does the same thing for everything at
once; **Start** there offers a "re-transcribe everything" checkbox for redoing
generated transcripts after switching models or languages.

One run per library at a time, whichever button started it: whisper uses every
core it is given, so a second run would only halve the first. If a run is
already going, the refusal names it and tells you to **Cancel** it first —
cancelling stops after the lesson currently in flight rather than mid-file.

Progress is counters against the total — skipped, transcribed, failed — over
the same realtime channel the scan card already uses, plus an error list, one
row per failed lesson. A generated transcript plays through the ordinary
subtitle track the player already renders; nothing distinguishes it in the
`<track>` menu from a sidecar you wrote by hand except that it exists at all.

Transcription is a CPU job measured in hours for a real course, and it stays
off until the instance has a whisper model configured — see
[`docs/deployment.md`](./deployment.md#derived-artefacts-and-transcription)
for what to download and where it goes.

### Backups

`POST /api/v1/admin/backups` produces a compressed PostgreSQL snapshot via
`pg_dump` and hands back a **signed download link, valid for 5 minutes**.
The archive contains the database only — your media files are not copied,
because CourseShelf never owned them in the first place. Back those up the way
you already back up the rest of that disk.

**Admin → Backups** is the button for it. One click runs the dump; the page
shows that it is running, then the archive's size, when it was taken, and a
download link with the time it stops working. If `pg_dump` is missing or its
version does not match the server, the screen shows what the server said —
that message names the exact mismatch, which is usually the whole fix.

---

## Known limits in this release

Stated plainly, because finding these by surprise is worse.

**This release has none left to state.** Every limit this table used to list has
been closed: the browse filters are built, backups have a screen, the mobile
client ships only the two locales a human has actually read, and the storage bar
is covered. When the next one appears it goes here, before anyone trips over it.

---

## Troubleshooting

**A course did not appear after a scan.** Check **Admin → Scans** for per-file
errors on that folder. The usual causes are a video extension outside the
supported five, or a `course.json` that failed to parse.

**A course is there but some of its lessons are missing.** Fix whatever the
scan reported. If the missing lessons sit in a section the course already
has, the next library scan picks them up on its own. If they are in a section
folder the course has never had before, or a lesson's video file is gone, use
**Rescan** on the course page instead (see
[Rescanning one course](#rescanning-one-course)).

**Lessons appear in the wrong order.** Folder-name inference did not find the
ordinals you expected. Either rename to a recognised pattern (`01 - Title`) or
declare the order explicitly in `course.json`, then scan again — a plain
library scan renumbers an already-known course the same way **Rescan** does.

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
