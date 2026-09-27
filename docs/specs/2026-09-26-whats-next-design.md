# What's next for course_shelf — 2026-09-26

Twenty-one questions settled what the project does after 1.9.1, and the answer is
not the roadmap's next epic. Work is selected by the pain of using the library
rather than by card order, and the first pain is lesson ordering: 344 lessons
across the real library are placed by path sort because their filenames carry no
ordinal the parser can read. The fix spans the scan's parser tiers, a new
Postgres override read as an input to position ranking, an admin drag-to-reorder
screen on the existing course editor, and a per-lesson `orderSource` so a guessed
order is visible as a guess. It ships as **1.10.0**, followed on the NAS by the
force-resync of the eight courses E32-F01-S06 reshaped. Two other tracks run
alongside: a reconciliation pass over 46 debt items, and a mobile revival that
starts by building an audit rig rather than by fixing what git makes easy to see.
The mechanism and the three tracks are drawn in
[2026-09-26-whats-next-visual.html](./2026-09-26-whats-next-visual.html).

## Terms

| Term            | Definition                                                                                                                                | Avoid                        |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| **card**        | A story file in `docs/roadmap/tasks/` — the source of truth for a unit of work; GitHub issues only mirror it.                              | ticket, issue, story point   |
| **debt item**   | An open tuxedo entry or a milestone-less GitHub issue that has no card behind it.                                                          | bug, todo, backlog           |
| **audit**       | A `pre-release-audit` run: a local instance on a production dump, driven by a browser and scored on Nielsen's ten heuristics.              | review, QA, testing          |
| **the library** | The maintainer's real course collection on the NAS — roughly 70 courses, the data every claim about coverage is measured against.          | the database, content        |
| **orderSource** | Per-lesson provenance of a position: `parsed`, `folder`, `mtime` or `manual`. Decided here; does not exist yet.                            | confidence, quality, guessed |
| **override**    | The Postgres record holding a human-declared lesson order, read as an input to ranking. Decided here; does not exist yet.                  | pinned position, manual sort |

## Why

The topic was given as two words: "what's next". There was no stated problem, so
the problem was reconstructed from the repository, and the reconstruction is the
first finding.

1.9.1 was on the NAS and `main` was green. Four piles of candidate work existed
with nothing ordering them against each other: the `2.0 — Ownership and taxonomy`
milestone (11 issues), the `v2 — Transcript-first` milestone (2), 29 issues with
no milestone at all, and 46 open tuxedo items. The roadmap said E33 was next.
Measurement said E33's first shippable feature would be a filter over data that
does not exist — `E33-F02` puts tags on the card and widens browse filters, while
tuxedo 280 measured the library at 6% of courses carrying a tag, 3% a
description, 6% an instructor and 0% a level.

So the real question was not which card to pull. It was what should be allowed to
choose, and everything else followed from that.

## Locked decisions

Nine decisions passed all three gates — hard to reverse, surprising without
context, a real trade-off.

### 1. Work is selected by usage pain, not by roadmap order (Q1 → B)

What stops the maintainer using the library on the NAS today is converted into
cards, and that is the queue.

**Rejected — roadmap order (A):** the roadmap was written before the library held
70 real courses, and the measurements taken since keep disagreeing with it. Its
next epic ships a tag filter over 6% tag coverage.
**Rejected — the audit as the list (C):** the cheaper instrument and a genuine
overlap, but the audit drives a browser over the web UI and cannot see a single
ordinal defect. It remains pre-registered in tuxedo 206.
**Rejected — burn the 29 milestone-less issues first (D):** spends a release on
work chosen by what is already written down rather than by what hurts.

**The cost accepted.** Usage pain has no finite end and no milestone. It must be
converted into cards in the same pass or it becomes a mood rather than a plan.

### 2. The mobile client is revived, not frozen (Q2 → B)

One card for a device pass plus the fix list it produces, then decide again.

**Rejected — freeze it explicitly (A), the recommendation:** mobile charges every
backend and spec change a toll (codegen needs Dart 3.12.2 from Flutter 3.44.4 on
`PATH`, plus the Flutter CI job and the locale-parity gate) and returns nothing
measurable; the intention recorded in tuxedo 203 on 2026-09-16 had expired ten
days later. The maintainer chose revival anyway.
**Rejected — leave it as is (C):** keeps paying the toll and decides nothing.
**Rejected — move it to its own repository (D):** splits the spec-to-client loop
across two repos, which is what this monorepo exists to prevent.

### 3. Lesson order is the first pain (Q4 → A)

Ahead of metadata emptiness, transcript reachability and wayfinding.

**Why it wins.** Order is the only one of the four that makes a course *wrong*
rather than *thin*. A library with 3% descriptions is sparse but usable; a course
whose lessons play in path order is actively misleading and the learner cannot
tell it is happening.

**Rejected — metadata (B):** 3% descriptions, 6% tags, 6% instructors, 0% levels
is a real hole, and the LLM-fills-it question (tuxedo 280) is still undecided —
but sparse is not wrong.
**Rejected — transcript reachability (C):** cues are lifted from a `<track>`
element whose URL derives from the stream URL (`utils/subtitle-url.ts:63`,
`composables/useTranscriptCues.ts:57`), so a lesson whose media will not open
shows no transcript even with rows in the database; plus 41 orphan `.und.srt`
files with no GC (tuxedo 179). Real, but narrower.
**Rejected — wayfinding (D):** no way back from lesson to course to browse
(tuxedo 217). The cheapest of the four and the one to pair with a long card if a
quick win is wanted.

### 4. Every reconciled debt survivor gets one home (Q6 → A)

A card in `docs/roadmap/tasks/` plus an issue on a milestone; the tuxedo entry is
deleted.

**Rejected — tuxedo stays the store (B), the recommendation:** 46 cards for
things like "replace `/api/*` with `/api/*path`" risks burying a directory that
is readable precisely because a card means a planned story. The maintainer chose
one home anyway, and Q10 below limits the volume.
**Rejected — GitHub issues as the store (C):** contradicts the project's own rule
that issues are stable URLs for cross-referencing and nothing more.
**Rejected — all three with a link field (D):** three stores that can disagree.

**The cost accepted.** tuxedo is host-side and not in the repository, so today's
debt list is invisible to anyone but the maintainer. Moving it into cards and
issues fixes that, at the price of directory volume.

### 5. Parent-folder ordinals, then mtime (Q7 → B)

For the shared-basename shape, the ordinal comes from the parent folder. Where no
name signal exists at all, `mtime` is the last resort.

**Rejected — mtime uniformly (A):** treats two different shapes as one problem
and replaces present information with evidence.
**Rejected — scraper metadata (C):** the most correct answer available and the
most expensive — it needs the course matched to a source, and source metadata
reaches 6% of the library.
**Rejected — leave them unordered with an "order unknown" mark (D):** honest, but
leaves 344 lessons unusable in sequence.

**The cost accepted, and the first sub-step.** `mtime` is evidence, not
information, and it can be confidently wrong. Before any code, list the 282
PurpleSchool files with their timestamps on the NAS and check whether they are
monotonic and spread or all within one minute. If they are flat, `mtime` is not
the answer for them and the card must say so rather than shipping a sort that
looks authoritative.

### 6. The override is declarative, not a database patch (Q8 → A)

An explicit lesson order the scan honours over any heuristic, read before
positions are computed.

**Rejected — `PATCH /lessons/{id}` with a position plus a protection flag (B):**
reintroduces "the scan must not clobber this row", which is the concept whose
absence produced the duplicate-position bug family `E32-F01-S01` closes.
**Rejected — a bulk reorder route with the same protection flag (C):** same
objection; superseded in part by Q20, which adds the route without the flag.
**Rejected — no override, heuristics plus an uncertainty badge (D):** any
heuristic will be wrong somewhere across 70 courses.

Originally decided as a `course.json` in the course folder. Q11 and Q17 moved the
storage; the principle — the override is an input the scan reads, never an output
it must avoid overwriting — is what is locked here.

### 7. The backend never writes the library (Q11 → B, then Q17)

`/data/courses` is bind-mounted read-only (`compose.prod.yml:142`,
`compose.release.yml:140`) and stays that way.

**Rejected — make the course mount writable (D):** one drag-to-reorder screen is
not worth making the user's only copy of their library writable by a network
service. `docker/compose.yml:136` records the read-only course mount as a
conscious invariant, in the comment explaining why the model-weights volume was
allowed to become writable.
**Rejected — no admin write at all, hand-edited files only (A):** workable, but
gives up the screen the maintainer asked for.

The derived volume was chosen here and then overturned by Q17; see Risks.

### 8. The override is an ordered list of paths, not positions (Q14 → A)

An ordered list of library-relative video paths per section. Anything not listed
keeps its heuristic key and ranks behind the list.

**Rejected — a map of path to explicit position 1..N (B):** the shape a naive
screen would produce, and the one to avoid — an inserted lesson renumbers every
row after it, so the record rewrites itself on every change.
**Rejected — a sort-key override (C):** works, but is not what a human means by
"this is the order".
**Rejected — overriding the parse instead of the order (D):** the cleverest
option, and legible as "the parser should have seen 7 here", but it cannot
express an order that no numbering implies — which is exactly the PurpleSchool
case.

**The cost accepted.** A half-ordered section is order-then-heuristic, and that
rule has to be visible in the admin screen or it will surprise.

### 9. The override lives in Postgres, as an input to ranking (Q17 → C)

Not on the derived volume, and not as protected output rows.

**Why it overturned Q11's derived-volume answer.** Three facts found while
working out the file layout: the derived layout is keyed by `libraryId`, a cuid
(`derived-path.ts`), so a rebuilt database orphans everything under the old one —
very likely the mechanism behind tuxedo 179's 41 unreferenced `.und.srt` files;
nothing backs the derived volume up, because the only backup is `pg_dump`
(`admin/infra/pg-dump-archiver.ts`); and every other derived artefact is
re-derivable from the library, while a hand-made order is not.

The distinction that made Postgres viable after Q11 rejected it: an override
**table read as an input** to `assignLessonPositions` is not the same as
**protected output rows**. Positions stay recomputed ranks on every scan, and
nothing in the scan learns that some rows are untouchable.

**Rejected — a file on the derived volume (A):** unbacked, and keyed by an id
that changes on rebuild.
**Rejected — the same file keyed by course slug (B):** fixes the keying, not the
backup.
**Rejected — Postgres plus a derived-file export (D):** buys portability back for
the price of two stores that can disagree; worth revisiting only if moving
courses between instances becomes a real workflow.

## Routine choices

- **Debt is reconciled once, then governed by a rule (Q3 → A).** All 46 items are
  checked against the code, stale ones closed, survivors carded; thereafter a
  debt item without a card lives at most one release. Most of the pile's cost is
  distrust, not work — three items were found wrong during this interview alone.
- **The mobile audit procedure is built before the device pass (Q5 → C).** So the
  pass produces a score rather than a feeling.
- **Cluster cards for clusters, single cards for one-offs (Q10 → D).** The four
  visual-snapshot items (307, 319, 243, 165) are one PR, not four; the route
  string and the icon array are genuinely unrelated. Keeps the 46 from becoming
  46 cards in a directory that already holds 179.
- **The mobile rig is an Android emulator against a seeded local stack, driven by
  `integration_test` (Q12 → A).** Chosen over a real device on production data.
- **The three tracks run in parallel (Q13 → D)**, as refined by Q16.
- **The rig drives to fixed states and captures screenshots; scoring happens
  afterwards from that set (Q15 → B).** `integration_test` asserts, it does not
  score, and Nielsen's heuristics are not assertions.
- **Lane collisions resolved (Q16 → C).** The debt pass runs in the coordinator
  session rather than a worktree, because lanes may not write tuxedo and that is
  its entire job. The order lane takes the one Docker stack — the subnet is
  pinned at `docker/compose.yml:10`, so there is only one. The mobile lane waits
  for it.
- **Screenshots stay out of git (Q18 → B).** Only the scored findings are
  committed. Reusing them as a visual-regression gate was refused outright: the
  Storybook baselines have already produced three documented traps, and an
  emulator screenshot is far less deterministic than a Storybook render.
- **The shipping unit is 1.10.0 (Q19 → A).** A minor, not a patch — the work adds
  a route, a screen and a table. 1.10.0 reaching the NAS gives tuxedo 283's
  force-resync a natural home.
- **`PUT /api/v1/admin/courses/{id}/lesson-order`, whole-course, in the existing
  editor (Q20 → A).** Matches the shape of the admin course routes already there
  (`scrape-preview` at `openapi.yaml:1406`, `identify` at `:1567`) and inherits
  the leave guard that `courses/[id]/edit.vue` already has.
- **Unmatched entries are kept, not pruned (Q21 → D).** Ranking skips a path with
  no lesson behind it, so a file restored after a rename or a re-import regains
  its place — which is exactly what tuxedo 283's force-resync is about to create
  across eight courses.
- **A per-lesson `orderSource` (Q22 → A).** `parsed | folder | mtime | manual`,
  surfaced in the reorder screen. A course is normally mixed, and only a
  per-lesson value points at the three rows that fell through.

## Verified facts

Established by reading the repository during the interview, not by asking.

- **`main` is green.** CI, E2E smoke and CodeQL all succeeded on 2026-09-25 —
  which makes tuxedo 198 ("reset-progress e2e is red on `main`") stale.
- **tuxedo 277 is accurate.** `folder-name.parser.ts` uses `WORD_PREFIXED_RE`
  only inside `parseFolderName` (line 153). `parseLessonFileName`'s tier chain is
  calendar-date, composite `N.M`, numeric prefix, trailing digits, `#`/`№`
  marker, bare — so `Урок 1 - Фактура.mp4` matches none of them.
- **`mtime` needs no new plumbing.** `node-fs-adapter.ts:87` takes `info.mtime`
  from `stat` for every file — only directories and failed stats get the
  `new Date(0)` sentinel — `prisma-scan.repository.ts` persists it with path and
  size, and `prisma-lesson.repository.ts` stores and reads it per lesson.
- **Positions are ranks, never sort keys.** `lesson-position.ts` documents the
  rule: the composed key is `sectionOrdinal * 1_000_000 + ordinal`, the fallback
  is the full `videoPath` lexicographically, and the emitted position is always
  the 1-based rank — which is what makes collisions structurally impossible.
- **Corrected 2026-09-26: the `videoPath` fallback never runs.** Found while
  planning this work, and it makes the line above half false. `sortKey` returns
  `Number.POSITIVE_INFINITY` when nothing parses, so for two ordinal-less
  entries the comparator computes `Infinity - Infinity`, which is `NaN`; the
  guard is `if (diff !== 0) return diff`, and `NaN !== 0` is true, so the
  comparator returns `NaN` and the `localeCompare` tiebreak on the next line is
  unreachable (`lesson-position.ts:62-66`). A comparator returning `NaN` is
  treated as equal, and a stable sort then preserves input order — which is
  `FsAdapter.walk()`'s enumeration order, the very thing the file's WHY comment
  says it refuses to depend on because it is not guaranteed stable across two
  listings. So the 344 lessons this release is about are not in path order and
  are not reproducibly in any order; the ranking is only correct when at least
  one entry of a compared pair parsed an ordinal. The fix belongs with the new
  tiers rather than in its own card.
- **A lesson has no write route.** The spec's lesson operations are `getLesson`,
  `streamLessonVideo`, `streamLessonSubtitle`, `exportLesson`, plus bookmarks,
  flashcards, quizzes and progress hanging off the id. Nothing mutates the lesson
  itself.
- **A course rescan renumbers.** Since E32-F01-S03 it is a force-resync that adds
  missing lessons, renumbers positions as a batch and removes lessons whose video
  is gone (`run-scan.handler.ts:1074`, `:1130`).
- **`/data/courses` is read-only** in `compose.prod.yml:142` and
  `compose.release.yml:140`; `docker/compose.yml:136` states the invariant
  deliberately. The backend writes only to `/data/derived` and `/models`.
- **Derived is keyed by `libraryId` and is not backed up.** Layout is
  `<derivedRoot>/<libraryId>/<library-relative video path>.<lang>.srt`
  (`derived-path.ts`); the only backup path is `pg_dump`
  (`admin/infra/pg-dump-archiver.ts`).
- **`course.json` is already read** per course folder (`run-scan.handler.ts:467`)
  and feeds the poster, instructor, studio and tag linkers. It is also the
  scraper's payload shape (`scraper.types.ts:4`).
- **The course editor already exists** at `apps/web/app/pages/courses/[id]/edit.vue`,
  with a metadata form and a leave guard (`course-edit-leave-guard.spec.ts`).
- **Admin course routes follow one shape:** `/api/v1/admin/courses/{id}/<verb>`.
- **`docs/roadmap/tasks/` holds 179 cards, 13857 lines** — about 77 lines each.
- **Two orphaned generated locales, not one.** `apps/mobile/lib/i18n/` holds both
  `strings_el.g.dart` and `strings_uk.g.dart` against `*_en` and `*_ru` sources;
  tuxedo 108 records only the Greek one.
- **`apps/mobile` has `android/`, `ios/` and `web/`.** The "never launched, no
  platform folders" claim was stale; last mobile change was #466 on 2026-09-14.

## Risks

- **`mtime` may carry no signal.** If the 282 PurpleSchool files were unpacked in
  one operation their timestamps may share a minute and mean nothing. The card's
  first sub-step is the measurement; if it comes back flat, Q7's answer needs
  revisiting before code.
- **A guessed order looks exactly like a correct one.** `orderSource` mitigates
  this only where someone looks. Nothing pushes the information at the
  maintainer.
- **The override is invisible from the filesystem.** Q17 accepted this: a course
  folder copied to another machine arrives unordered, and an instance restored
  from a `pg_dump` taken before a reorder loses that reorder like any other row.
- **The order list grows quietly.** Q21 keeps unmatched entries, so a renamed
  folder leaves its old paths in the record forever. The screen must show
  unmatched entries or the record becomes a place where wrongness accumulates
  unseen.
- **1.10.0 changes lesson numbering for existing courses.** That is a change a
  user notices and mistrusts if unannounced; the release notes have to say it
  plainly.
- **Adding `orderSource` to `LessonDto` drags the Dart toolchain into the order
  lane.** Codegen needs Dart 3.12.2 from Flutter 3.44.4 on `PATH` (tuxedo 265) —
  on the same lane whose first PR is backend work, and while the mobile lane is
  deliberately waiting.
- **Four `orderSource` values are a taxonomy.** It will want a fifth the moment
  another tier is added, and widening a published enum is the expensive kind of
  change.
- **"Three parallel tracks" is really two.** Q16 has the mobile lane waiting for
  the stack. Planning as if three run at once invites the failure already
  recorded on 2026-09-18, when a lane ran Compose from its worktree without a
  project name and rewrote the dev stack's services.
- **Evidence that is not committed is gone.** Q18 keeps screenshots out of git,
  so the findings text must be specific enough to stand without them when
  arguing with the previous release's score.

## Deferred

Nothing was deferred. All 21 questions were answered.

Adjacent work explicitly *not* scheduled by this interview, and what would bring
it back: `E33` and the 2.0 milestone (11 issues) wait behind 1.10.0 and behind
the tag-coverage problem that makes `E33-F02` premature; the post-E29 audit
(tuxedo 206) is pre-registered and would run on its own schedule; the metadata
LLM-versus-manual decision (tuxedo 280) is the natural second pain once ordering
lands.

## Open threads

- **Whether the mobile lane should have been frozen.** Q2 chose revival against
  the recommendation. The device pass is the thing that can settle it — if it
  produces no fix list worth a release, Q2's option A returns with evidence
  behind it.
- **Concurrency on the reorder write.** Q21 settled staleness against the scan
  and explicitly set aside the two-tabs case as thin on a one-person instance. A
  version token and a 409 is the correct answer the day there is a second admin.
- **Portability of the order.** Q17 rejected the derived-file export (option D)
  rather than dismissing it. If moving course folders between instances becomes a
  real workflow, the export is the thing to add.
