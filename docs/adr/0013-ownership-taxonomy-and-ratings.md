# 0013 — Enrollment, tags, ratings and where a transcript lives

- **Status:** accepted
- **Date:** 2026-09-18
- **Deciders:** @kkucherenkov
- **Tags:** product, backend, web

## Context

Five questions blocked the 2.0 scope. Each had been carried as an open task
for days because none of them can be answered by reading the code: they are
product decisions about what the library *is*, and every one of them changes a
schema, a contract or both.

They are settled here together because they interlock. "My courses" cannot be
specified before it is known whether a course becomes yours by being watched or
by being joined; a tag filter cannot be specified before it is known who may
write a tag; and a star rating has to say which of the two numbers on a course
it means, because one already exists.

## Decisions

### 1. Enrollment is its own entity

`Enrollment(userId, courseId, startedAt)`, separate from `AccessGrant`.

A grant answers "may this account open the course". Enrollment answers "does
this person consider themselves to be taking it". Today the product answers the
second question by inspecting progress, which makes a course you opened once by
accident indistinguishable from a course you are three weeks into, and leaves no
way to say "I intend to start this" before the first play.

**Consequence.** "My courses" becomes the list of enrollments, not a filter over
`progress > 0`. Access is unchanged: enrolling neither grants nor requires a
grant, so an admin can still hand out a course-level grant and a learner can
still open a course they never enrolled in.

**Rejected:** a favourites flag. It is cheaper — one table, one PUT — but it
answers a third question ("do I like this") that neither of the first two needs,
and it would have to be renamed the moment enrollment arrived anyway.

### 2. Tags are read-only in the product

The scraper and the identify flow write tags. Nothing in the UI does.

`Tag(slug, displayName, category)` and `CourseTag` have existed since the
catalogue was built, along with `set-course-tags`, `/api/v1/catalog/tags` and
`/api/v1/admin/tags`. What has never existed is a reader: tags reach no card, no
course page and no filter, which is what made the model look dead.

**Consequence.** Tags become clickable on the card and the course page, and lead
to browse filtered by that tag. `set-course-tags` stays an internal command;
there is no tag-management screen and no per-user tagging.

**Rejected:** free user tags. They turn `CourseTag` into a per-user relation and
bring a merge policy with the scraper's tags — a cost with no demand behind it
on a single-owner instance.

### 3. A rating is personal, and the source's rating stays what it is

New `CourseRating(userId, courseId, stars)`. `Course.ratingAverage` and
`Course.ratingCount` keep meaning what the scraper imported.

A course carries a number from Stepik or Coursera today. Overwriting it with a
local average would erase information that is not ours to erase and, on a
one-user instance, replace a rating from thousands of people with a rating from
one.

**Consequence.** The card and the course page show both, labelled differently.
Sorting offers both. This also settles what a `PATCH /courses/{id}` with
`ratingAverage: 0` and `ratingCount: null` means: it is about the source's
rating, and the personal one is not reachable through that route at all.

**Rejected:** an aggregate over the instance's users. It is the same field with
a different denominator, and on an instance with one active reader it is that
reader's own rating wearing a crowd's clothes.

### 4. A generated transcript is not a material

`MaterialKind` stays `doc | note | image | slide`.

A material is a file that came with the course, sitting beside the video on
disk. A transcript is produced by this system, carries a status and a coverage
figure, can be regenerated, and exists per language. Folding it into the
material list would mean keeping `Material` rows in step with `Subtitle` and
`Transcript` rows on every run.

**Consequence.** The course page gets its own transcript section — coverage
across the course, per-lesson state, and a download. The material list keeps
meaning "what shipped with the course".

### 5. The browse filters to add

Tag, language, level and studio. Release year is optional and may be dropped.
Filters for "my rating" and "the courses I enrolled in" come after decisions 1
and 3, not with the first batch.

`Course.language` and `Course.level` are already populated by the scrapers, and
studio is the same shape as the instructor filter that already works — so the
first three cost a query parameter each. The tag filter is what makes decision 2
reachable: without it, a clickable tag has nowhere to lead.

## Consequences across the stack

| Area | Effect |
| --- | --- |
| Schema | Two new tables (`Enrollment`, `CourseRating`); nothing dropped |
| Contract | Enrollment routes, a rating route, four new `listCourses` parameters, a transcript-coverage shape on the course page |
| Web | "My courses", a rating control, tag chips that lead to browse, the transcript section |
| Mobile | Untouched by this ADR; the same decisions apply when it catches up |

## References

- Supersedes nothing. ADR-0012 covers the model provider, not the catalogue.
- The audit that surfaced the five questions and the wave plan that sequences
  them live in the maintainer's vault, under `10 Projects/Dev/course_shelf`.
