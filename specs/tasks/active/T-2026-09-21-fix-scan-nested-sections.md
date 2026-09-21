## T-2026-09-21-fix-scan-nested-sections — Stop collapsing nested folders into one section

- Created: 2026-09-21
- Owner: claude
- Spec: [`docs/roadmap/tasks/E32-F01-S06.md`](../../../docs/roadmap/tasks/E32-F01-S06.md)
- Goal: a course whose videos live two folders deep imports one section per
  real subfolder, in the author's order, instead of one section holding every
  lesson interleaved.
- Acceptance:
  - A course laid out `Course/Block/Week/video.mp4` shows one section per
    `Week`, not a single section named `Block`.
  - Lessons inside those sections run in the author's order — the six
    `Slap_Bass_-_Week_N/00_-_Introduction.mkv` files no longer open the course
    back to back.
  - A folder holding exactly one video stays a lesson, not a section: the
    31-folder `[Фоксфорд] Шахматы` layout imports unchanged.
  - Two sibling folders reducing to the same title (`27. Enemy AI`,
    `38. Enemy AI`) import as two sections, not one.
  - A flat course (videos directly in the course folder) is unchanged.
- Spec diff: none — `SectionDto` and `SectionOutline` carry no path, and the
  section's source folder stays a scan-internal detail.
- Codegen impact: no.
- Design impact: none.
- Tests: unit (`run-scan.handler.spec.ts`, `course.spec.ts`) — nested layout,
  folder-per-lesson layout, duplicate titles, section ordering by composed path
  ordinals, force-resync reusing a section id by `sourcePath`.

### The measurement that opened this

Counted on `pre-1.8.0-nas.dump` (5973 lessons, 68 courses), 2026-09-21:

|                                            |                         |
| ------------------------------------------ | ----------------------- |
| Lessons deeper than `course/section/file`  | 736 (12.3%)             |
| Sections merging several source folders    | 64 of 681               |
| …of which folder-per-lesson, correct as-is | 49                      |
| …of which genuinely lost sections          | 13, holding 371 lessons |
| Sections lost to a title collision instead | 3, holding 79 lessons   |

`run-scan.handler.ts:572` reads `relSegments[0]` as the section for every
lesson, so anything below the first level is folded into it. Separately,
lessons find their section through `sectionIdByTitle`, so two sibling folders
whose parsed labels match land in one row.

- Sub-steps:
  - [x] Add `Section.sourcePath` (nullable, `@@unique([courseId, sourcePath])`) + migration
  - [x] `Course.addSection` / `replaceSections` carry `sourcePath`
  - [x] Scan resolves the section folder by descending while a subfolder holds >1 video
  - [x] Order sections by the composed ordinals of every path segment
  - [x] Match a rescanned folder to its persisted section by `sourcePath`, falling back to title while the column is null
  - [x] Prove a moved lesson keeps its id — covers the orphaned `lesson_progress` / `bookmark` risk
  - [x] Card `docs/roadmap/tasks/E32-F01-S06.md` + GitHub issue
- Status: in-progress
- Blockers: —
