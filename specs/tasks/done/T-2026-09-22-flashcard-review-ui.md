## T-2026-09-22-flashcard-review-ui — Flashcard review UI on web

- Created: 2026-09-22
- Owner: claude
- Spec: [docs/roadmap/tasks/E29-F01-S03.md](../../docs/roadmap/tasks/E29-F01-S03.md), issue #234
- Goal: a review session that takes a minute and is worth doing daily —
  reveal-and-grade flow, due count visible from Home, and a way to turn a
  note or a transcript line into a card without leaving the lesson.
- Acceptance:
  - `/flashcards/review` shows one due card at a time: front, a reveal
    action, then a 4-button grade row, keyboard-operable throughout.
  - Home's "Your week" rail surfaces the due count and links to the review
    screen when there is something to review.
  - The lesson player's Notes tab and Transcript tab each have a "make a
    flashcard" entry point that opens a front/back form and posts to the
    lesson's flashcard collection.
  - Every string above is in `en` and `ru`; `pnpm check:i18n` is green.
- Spec diff: none — `packages/specs/openapi/openapi.yaml` already carries
  the flashcard paths (E29-F01-S02); not touched here.
- Codegen impact: no — `@app/api-client-ts` already has
  `listDueFlashcards`/`createFlashcard`/`updateFlashcard`/`gradeFlashcard`.
- Design impact: two new `@app/ui` primitives — `AppFlashcardReview`
  (front/back reveal + grade row) and `AppFlashcardEditor` (front/back
  creation form for the two entry points). No existing export in the
  62-symbol index covers reveal-and-grade or a two-field card form; both
  compose existing primitives (`AppButton`, `AppCard`, `AppField`,
  `AppInput`, `AppTextarea`) rather than reinventing them.
- Tests: component specs for `AppFlashcardReview` (reveal, grade emit,
  disabled-while-grading) and `AppFlashcardEditor` (save/cancel payload,
  disabled-while-submitting); composable spec for the due-queue fetch +
  grade-and-advance + empty-queue behaviour.
- Sub-steps:
  - [x] Review screen + specs
  - [x] Creation entry points
  - [x] Due count on Home
  - [x] Locale keys in both languages
- Status: done
- Blockers: —
- Completed: 2026-09-22
- Result: https://github.com/kkucherenkov/course_shelf/pull/762

### Notes

- **Grade-button mapping (0..5 → 4 buttons):** Again→0, Hard→3, Good→4,
  Easy→5. The API's own doc says grades 0-2 are all "a lapse" with
  identical scheduling effect (reset to a 1-day interval, streak to 0), so
  collapsing 0-2 to a single "Again" loses no scheduling behaviour; 3/4/5
  keep their exact API meaning ("correct, serious difficulty" /
  "some hesitation" / "perfect recall"). A 6-button row would faithfully
  mirror the enum and be unusable under a keyboard-shortcut, one-a-day
  review flow.
- **`sourceCueId` on transcript-line cards:** the web player's transcript
  panel (`useTranscriptCues`) reads cues out of the browser's own parsed
  `TextTrack`, which carries no server-side cue id — and no endpoint the
  web client calls (`SearchTranscriptHitDto` included) exposes one either.
  Cards created from a transcript line therefore omit `sourceCueId`; the
  field stays populated for whatever future surface does have a real cue
  id (e.g. search results, if that flow grows a "make a flashcard" action
  of its own).
