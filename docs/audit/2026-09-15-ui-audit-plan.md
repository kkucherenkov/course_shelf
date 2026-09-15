# Browser-driven UI audit — plan

Written 2026-09-15. Runs after the 1.6.0 wave lands: two passes by a
browser-driving agent over a local instance restored from a production dump,
first hunting for what is broken, then auditing the UI and UX of what survives.

Findings go in a sibling document named for the day you gather them.

## Why this exists, and what it is not

`tests/e2e/` already holds nine Playwright specs — auth, browse filters, course
detail across three viewports and four states, the lesson player's resume,
libraries register-and-scan, CSP, foundations. They are regression tests: they
assert that a known thing still holds, on seeded data, one page at a time.

This audit walks **journeys** across pages, on **real data**, looking for what
nobody thought to assert. When it finds something a Playwright spec could have
caught, extend that spec as well as filing the finding.

A browser agent sees symptoms. Locate the cause in code before you open an
issue: a symptom that matches a known bug is a lead, and today's session spent
an hour proving that several such matches were already fixed.

## Environment

**A local stack restored from a NAS dump**, rather than the live instance or
the stock seed.

The stock `seed-catalog.ts` produces sterile data: Latin titles, short
descriptions, small courses. Every bug this project shipped in the last
month lived in the gap between that and reality — a non-Latin title that
deleted a course, a 4203-character description with nowhere to go, 1945
transcripts filed under `und`, 153 lessons sorted by a parser rule their import
predates. An audit on seeded data re-proves what `tests/e2e/` already proves.

The live instance is the other wrong answer: half the interesting scenarios are
destructive — revoke a grant mid-playback, delete a course, restart a scan,
ban a user — and they cannot be run against the maintainer's real library.

So: dump the NAS database, restore locally, and bring across a handful of real
media files (a Cyrillic-titled course with real `.mp4`s, at least one lesson
with a generated transcript and one with a sidecar `.srt`, and one course whose
scan produced errors). The rest of the rows can point at absent files —
scenarios that do not play video do not care, and a missing-file path is itself
worth watching.

**Prerequisites to settle before the run:**

- a restore procedure that does not touch the NAS (read-only dump, local
  restore), written down in this folder once it works
- three accounts: the instance owner (ADMIN), a USER with one course granted,
  and a USER with **no** grants
- `DERIVED_PATH` populated for at least the courses used in player scenarios,
  since posters, thumbnails and generated transcripts all live there

## Harness — which tool for which scenario

| Tool | Use for | Why |
| --- | --- | --- |
| Playwright / CDP | Navigation, forms, admin tables, state assertions, screenshots | Scriptable, repeatable, already configured in `tests/e2e/playwright.config.ts` |
| `computer-use` | Fullscreen, the native `<track>` CC menu, keyboard media keys, picture-in-picture, OS file dialogs | Page automation cannot see or drive the browser's own video chrome |
| `impeccable` | Pass 2 analysis over captured screenshots and live pages | It is the audit lens, not a driver |

This application is a video player, and the browser draws its most user-visible
surface: the CC menu that renders `Unknown` for 1945 tracks. A Playwright-only
audit would report the transcript panel as fine and never open that menu.

Capture a screenshot at every scenario step regardless of pass; pass 2 reads
them.

## Personas

Derived from `docs/user-guide.md` §"Who is who" — two roles, and access granted
separately from role.

| Persona | Setup | Exists to catch |
| --- | --- | --- |
| **Owner** | ADMIN, all libraries | Admin surfaces, destructive paths, long-running operations |
| **Granted learner** | USER, one course granted | The ordinary path — the only persona most real users ever are |
| **Empty-handed learner** | USER, zero grants | Whether "you have been granted nothing" reads as an explanation or as breakage |

---

# Pass 1 — exploratory bug hunt

Walk each scenario as the persona named. Record what happened, not what should
have. A scenario that completes without incident is a result worth recording.

**At every step, check that the page rendered correctly**, not only that it
behaved. The two fail independently: a screen whose buttons all work can still
be missing its stylesheet, and a screen that looks right can be showing stale
data. Concretely, at each step confirm:

- no text clipped, truncated without an ellipsis, or overflowing its container
- no horizontal scrollbar on the body, at any viewport in the scenario
- every image resolved: posters, thumbnails, avatars. A broken poster and a
  deliberate placeholder look different; say which you saw
- fonts loaded, rather than a fallback stack standing in
- spacing and alignment consistent with the same component elsewhere on the page
- nothing overlapping, nothing behind anything, no element at zero height
- no flash of unstyled content on first paint or after a route change
- the browser console clean of CSS and resource errors

Two rendering failures in this codebase pass every functional test, so look for
them by name:

- **Design tokens are generated and gitignored.** If `pnpm design:build` has not
  run against this checkout, the token CSS is absent and the app renders
  unstyled while working perfectly. Confirm the build ran before you trust a
  single visual observation.
- **Scoped styles can vanish silently.** Vue 3.5.42 dropped `data-v-*` scoped
  attributes, which detaches scoped CSS from its component with no error
  anywhere (#276 — the fix is a 3.5.39 pin in `pnpm.overrides`). If a component
  looks unstyled while its siblings look fine, check the pin before hunting the
  component.

`/dev/foundations` and `/__tokens` exist to answer "is the design system itself
rendering?" in one page. Open them first, and again after any dependency change.

## A. First contact

**A1 — a brand-new instance.** Empty database, no users. Walk the first-run
wizard to the owner account, register a library pointing at the real media
folder, run the scan, wait it out, open the first course.

Watch for: whether the wizard says what it is doing between steps; whether the
scan's progress is legible while it runs; what the catalog looks like in the
gap between "scan finished" and "posters generated".

**A2 — the second user.** Sign up a second account while the instance already
has an owner. The wizard is supposed to drop its first-run framing.

## B. Access, granted and not

**B1 — the empty-handed learner.** Sign in with zero grants. The user guide
says plainly: *"A user with no grants signs in successfully and sees an empty
catalog — that is correct behaviour, not a bug."*

Hunt the wording instead. Does the screen distinguish "nothing has been shared
with you yet" from "something went wrong"? Is there anything to do next, or is
it a dead end?

**B2 — a grant appears.** With the learner's session open, have the owner grant
one course. Reload. Exactly one course should appear.

**B3 — a grant disappears mid-playback.** Learner is watching. Owner revokes
the grant. What happens to the open player — does it fail politely at the next
stream-token refresh, or does it fail as a stack trace? What does the next
navigation do?

**B4 — banned mid-session.** Owner bans the learner with a reason and an
expiry. What does the learner's next action look like? Is the reason surfaced?

**B5 — impersonation.** Owner impersonates the learner, confirms what that
person sees, and returns. Is it obvious while impersonating that you are not
yourself? Is the exit obvious?

## C. Everyday learning

**C1 — find a half-remembered lesson.** Search a word from the **middle** of a
lesson title. Real example from the library: lessons named
`Биология поведения человека Лекция #N. <topic>` — search `Лекция`, and
`Лекция #2`. This was broken (prefix-only matching) and fixed by #524; the
scenario verifies the fix on real data and checks that the result list is
readable when 25 lessons share a title stem.

**C2 — resume.** Watch a lesson to roughly 7:30, navigate away, return the next
"day" (clear the session, sign back in). Resume position, the
continue-watching row on Home, and the progress ring should agree with each
other. Three surfaces, one number — check all three.

**C3 — the CC menu.** *(computer use)* Open a lesson that has a generated
transcript filed under `und`. The native CC menu will read `Unknown`. Confirm
the user-visible shape of the #555 backfill problem, and check what the menu
shows for a lesson with both a sidecar `.srt` and a generated track.

**C4 — fullscreen and keyboard.** *(computer use)* Enter fullscreen, seek with
arrow keys, change volume, exit. Does the custom player chrome survive the
transition? Does focus return somewhere sane?

**C5 — notes and bookmarks.** Write a note mid-lesson, drop a bookmark at a
timestamp, navigate to another lesson and back. Then open the same lesson in a
second tab and edit the note in both — the sync indicator's honesty is the
thing under test.

**C6 — materials.** Download a course material (pdf, archive) from a lesson
that has them. Real courses carry ~1300 pdfs and ~1300 archives, so this is a
common path, not an edge.

## D. Transcript

**D1 — read along.** Open the transcript panel, scroll it while the video
plays, click a cue and confirm the player seeks. Check whether the panel keeps
up with playback or fights the user's scroll.

**D2 — search inside a transcript.** Search a phrase that appears mid-lecture.
Check ranking and whether the match is visible in context.

**D3 — a lesson with no transcript.** The outline row carries a flag (#514).
Confirm it is legible at a glance across a 25-lesson outline, which is the
whole point of putting it on the outline rather than in the lesson.

## E. Admin repairs a bad import

**E1 — wrong title.** Find a course the scan named badly. Reach it from
`admin/libraries/:id` (the route added in #540), open the editor, fix the title
and slug. Use a **Cyrillic** title — a non-Latin title used to delete the
course, and the slug path is the one that broke.

**E2 — fill from source.** In the editor, use the scrape-preview panel against
a real Stepik course URL. Apply fields one at a time, not wholesale. Then look
at what a 4203-character description does to the course hero — the cap was
raised and the rendering reworked (#517), and this is the scenario that proves
it on real text with real newlines.

**E3 — the identify queue.** *(new in 1.6.0 — #546)* Queue a scraped candidate
for review, walk the per-field comparison, reject some fields and accept
others, apply. Then confirm the course's instructors, studios and tags now
point at resolved entities — resolving those names is why the queue exists.

**E4 — rescan one course.** Rename a file on disk, rescan just that course,
confirm the outline follows and that progress and bookmarks survive.

## F. Long-running operations

**F1 — a full library scan.** Start it on the real library. Watch progress
while it runs, navigate away, come back. Then read the error list: the real
library produces ~106 errors of three kinds (unsupported extension,
order-unreliable, ffmpeg). Is that list usable, or is it a wall?

**F2 — transcription of one course.** Start it, watch per-lesson progress,
navigate away, return. Confirm a running transcription does not render as a
finished scan (#515, fixed in #521 — verify on real timing).

**F3 — two at once.** Start a scan and a transcription. There is an
at-most-one-running guard on transcription; check that the refusal is explained
rather than silent.

**F4 — interrupt.** Restart the backend container mid-transcription. Recovery
marks the run interrupted and preserves per-lesson work. Confirm the UI offers
something sensible afterwards.

## G. Administration

**G1 — users and permissions.** Create a user, grant a library, narrow it to a
course, revoke. Watch the permissions screen stay honest about what is granted.

**G2 — backups.** Create a backup, watch the list and the storage bar.

**G3 — settings.** Switch locale `en` ↔ `ru` mid-flow, on a page with data
already loaded. Russian text runs longer than English — this is where layout
breaks. Also compare `cozy` and `comfortable` density: they are known to render
identically (#488), and this scenario decides whether that is worth fixing or
whether one of them should go.

## H. Adversarial

**H1 — bad addresses.** A course id that does not exist, a course you have no
grant for, a stream token left to expire. Three different failures, three
different messages expected.

**H2 — abort a stream.** Seek aggressively, navigate away mid-download. The
server logs noise on this (#556); the question here is whether the user ever
sees anything.

## I. Rendering under real content

Content shapes that break layouts. These need deliberate setup, so they are
their own group rather than a check inside another scenario.

**I1 — the longest description.** A course whose description runs past 4000
characters, with newlines and a list of learning outcomes (real: Stepik course
181875, 4203 characters). The cap was raised and the hero reworked in #517.
Check the hero at all three viewports, and check what a course card does with
the same text as a subtitle.

**I2 — titles that collide.** A course with 25 lessons whose titles share a long
stem (`Биология поведения человека Лекция #N. <topic>`). Where does the outline
truncate, and is the distinguishing part of the title still visible after it
does?

**I3 — Russian against English.** Every surface in `ru`, compared with the same
surface in `en`. Russian runs longer; buttons, table headers, chips and tabs are
where it shows first.

**I4 — missing media.** A course whose video files are absent from disk, and one
whose poster never downloaded. Both are real states in the restored dump. The
page must degrade to something deliberate rather than to a broken-image icon and
a zero-height box.

**I5 — a remote poster.** The SPA ships `img-src self data: blob:`, so a poster
served from a third-party CDN is blocked by CSP and renders as nothing. #496
closed this by downloading posters into `DERIVED_PATH`; confirm on a scraped
course that the image now comes from our own origin, and that a poster which
failed to download shows a placeholder rather than a hole.

**I6 — the long tail of viewports.** 375, 768, 1024, 1440 and one very wide
window, on Home, course detail, the player, the course editor and every admin
surface. `tests/e2e/` covers the learner pages at three widths and covers the
editor and the admin screens at none, and those screens were built
desktop-first, so 375px is where to start.

**I7 — zoom and text scaling.** Browser zoom at 150% and 200%. Layouts built
with fixed pixel heights break here, and nothing else in the suite looks.

---

# Pass 2 — UI/UX audit with `impeccable`

Run after pass 1's findings are triaged, on the surfaces that are not actively
broken. A UX critique of a broken screen is wasted work.

**Surfaces, in descending order of how often a real user meets them:**

1. Home — four sections plus right rail, the first thing anyone sees
2. Course detail — hero, section list, rail, and the four progress states
3. Lesson player with the transcript panel — the screen users spend hours in
4. Browse and search — including the empty and no-results states
5. The course editor — `CourseMetadataForm.vue` is 16 KB and covers 14 fields;
   the highest-density form in the product
6. The identify queue — new, unproven, per-field comparison UI
7. Admin tables — users, permissions, scans, backups
8. Auth and first-run — high stakes, seen once

**Lenses to hold, beyond whatever `impeccable` brings:**

- **Both locales.** Every string ships in `en` and `ru`. Audit `ru` too;
  longer text is where hierarchy collapses.
- **Both themes**, if the product has them, and the tokens that drive them.
- **Empty, loading, error, and no-permission states** — four states per surface.
  Designers reach them last; a new user meets them first.
- **Accessibility basics**: focus order, focus visibility, the CC menu and
  player controls from the keyboard alone, and whether progress rings and state
  chips carry text as well as colour.
- **Density.** Settle `cozy` versus `comfortable`.
- **Rendering fidelity against the design system.** Pass 1 asks whether a screen
  rendered at all; pass 2 asks whether it rendered the way the tokens and
  `@app/ui` primitives say it should — spacing scale, type scale, colour roles,
  border radii, and whether any surface has drifted into one-off values.
  `pnpm design:audit` reports token drift and is the cheap half of this.

## What is NOT a finding

Write these down before starting, so the report does not fill with them:

- An empty catalog for a user with no grants. Documented, correct.
- Sidecar transcripts filed under `und`. Honest — none of the library's ~3267
  subtitle files carry a language tag in their name.
- A course folder's non-video files not appearing as lessons. Slides, archives
  and source code are course material, not failures.
- Anything already carrying an open issue. Check before writing; today's
  session closed seven issues that had been fixed weeks earlier, and the same
  staleness runs the other way.

## Output

- Findings → `docs/audit/YYYY-MM-DD-ui-audit.md`, each with the persona, the
  scenario, what happened, and a screenshot reference
- Each confirmed finding → a GitHub issue, after the cause is located in code
- Anything that a Playwright spec should have caught → a note saying which spec
  to extend
- Deferred work → `tuxedo`, tagged `+course_shelf`
