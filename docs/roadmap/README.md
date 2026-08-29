# CourseShelf — Roadmap

This directory holds the executable plan for CourseShelf v1: 121 stories
in 24 epics, each with a one-file task spec and a checkbox in `TODO.md`.
The roadmap is the static plan; the live work log is `specs/tasks/active.md`.

## Files

- **[`TODO.md`](./TODO.md)** — flat checklist of every story, grouped by
  epic. Click any ID to open its task file. Tick the box when the story
  ships.
- **[`ROADMAP.md`](./ROADMAP.md)** — Mermaid Gantt of the same stories
  with dependencies and duration estimates.
- **[`tasks/`](./tasks)** — one markdown file per story (`121` files).
  Each file follows the `feature.md` template: status, dependencies,
  goal, acceptance, spec/codegen/design impact, tests, sub-steps, notes.
- **[`tools/generate.py`](./tools/generate.py)** — regenerates
  `README.md`, `TODO.md`, `ROADMAP.md`, and every `tasks/<ID>.md` from a
  single in-script story registry.

## Counts

- Total stories: **121**
  - Stage A (implementable directly from the design bundle): **114**
  - Stage B (needs a design pre-step): **7**

## Epics

- **E00** Stage the design bundle — 1 story
- **E01** Repository foundations — 3 stories
- **E02** API contracts as the spine — 6 stories
- **E03** Design tokens — 2 stories
- **E04** Backend skeleton + Better Auth — 5 stories
- **E06** Catalog bounded context — 5 stories
- **E07** Access control — 2 stories
- **E08** Streaming — 3 stories
- **E09** Learning — 4 stories
- **E10** Cross-context coupling — 1 story
- **E11** Web foundations — 3 stories
- **E12** Storybook for web — 1 story
- **E13** Web component catalog — 22 stories
- **E14** Web pages — 7 stories
- **E15** Mobile foundations — 4 stories
- **E16** Widgetbook — 1 story
- **E17** Mobile widget catalog — 19 stories
- **E18** Mobile features — 6 stories
- **E19** Mobile offline — 3 stories
- **E20** Mobile sync — 1 story
- **E21** Admin & operations — 4 stories
- **E22** CI/CD — 6 stories
- **E23** Distribution & docs — 5 stories
- **E24** Realtime / Centrifugo — 1 story

## Two trackers, one direction

The roadmap is **the plan**. The task stack at `specs/tasks/active.md`
is **what is happening right now**. Carry both:

|                                                     | Roadmap (`docs/roadmap/`) | Task stack (`specs/tasks/`)                    |
| --------------------------------------------------- | ------------------------- | ---------------------------------------------- |
| Lives forever                                       | yes                       | `active.md` while in flight, `done.md` forever |
| Granularity                                         | one story = one card      | one feature pass = one entry                   |
| Statuses                                            | ⬜ → ✅ on merge          | `in-progress` / `blocked` / shipped            |
| Source of truth for _what is being built right now_ | no                        | **yes**                                        |
| Source of truth for _what is on the v1 plan_        | **yes**                   | no                                             |

## How an agent picks up a story

1. Open `TODO.md` and find the next unchecked story whose dependencies
   are all ✅.
2. Open the linked `tasks/<ID>.md` file and read **Spec / Design
   references**, **Goal**, **Acceptance**, sub-steps. If anything is
   ambiguous, leave a question under **Notes** and stop.
3. Push a fresh entry to the top of `specs/tasks/active.md` using the
   `specs/tasks/templates/feature.md` template. The card under
   `tasks/<ID>.md` stays at ⬜ Not started until the story actually ships
   — the `active.md` entry is where progress is tracked while in flight.
4. Do the work. Tick sub-step boxes inside the `active.md` entry as you
   land them. If you get stuck, flip `Status: blocked` and document the
   blocker.
5. When the PR merges:
   - Move the `active.md` entry to the top of `specs/tasks/done.md` with
     `- Completed: YYYY-MM-DD` and `- Result: <PR link>`.
   - Edit `tasks/<ID>.md`: change **Status** to ✅ Done, tick the
     sub-step list, append `- Completed: YYYY-MM-DD` and
     `- Result: <PR link>` under **Notes**.
   - Edit `TODO.md`: change the matching `- [ ]` to `- [x]`.

Use `🚫 Blocked` in `tasks/<ID>.md` only after a story was started and
got blocked by an external dependency; document the blocker under
**Notes**.

## Status legend

| Glyph | Meaning                                                |
| ----- | ------------------------------------------------------ |
| ⬜    | Not started                                            |
| 🔄    | In progress (rare — `active.md` is the primary marker) |
| 🚫    | Blocked (see Notes)                                    |
| ⏸     | Paused (see Notes)                                     |
| ✅    | Done                                                   |

## Six non-negotiables that ride on every story

These come from `.claude/CLAUDE.md` and `AGENTS.md`. Apply them without
being asked.

1. **Spec-first.** If the story changes an HTTP route, the
   `packages/specs/openapi/openapi.yaml` edit is sub-step #1 and
   `pnpm spec:validate && pnpm spec:bundle && pnpm spec:codegen` is
   sub-step #2. For real-time channels, edit
   `packages/specs/asyncapi/centrifugo.yaml` first. Codegen artefacts
   land in their own commit.
2. **Live work log.** No coding starts without an entry in
   `specs/tasks/active.md`. The card in `tasks/<ID>.md` is the _plan_;
   the `active.md` entry is the _log_.
3. **Catalog-first.** Any new visual primitive starts as a `@app/ui`
   Storybook story (web) or a `ui_flutter` Widgetbook use case (mobile),
   each with a colocated spec. Pages and screens compose from the
   catalog; they never inline a one-off primitive.
4. **Domain-first.** Aggregates, value objects, and invariants come
   before persistence and controllers. CQRS handlers route through
   `apps/backend` modules; raw `process.env` reads are forbidden — use
   `AppConfig`.
5. **Better Auth owns auth.** No custom JWT, hashing, session, or
   refresh plumbing. If a story seems to need one, stop and find the
   plugin.
6. **Design upstream of code.** UI stories reference a path under
   `docs/design/<slug>/`. Stage B stories produce that bundle as their
   first sub-step.

Quality gate for every story:
`turbo run lint test typecheck && pnpm format && pnpm stylelint:fix &&
pnpm check:i18n`, plus `flutter analyze && flutter test` for mobile work.

## Re-generating

Everything in this directory is regenerated by
`docs/roadmap/tools/generate.py`. The script reads a single in-script
story registry and emits all files. Edit story metadata in the script
and re-run:

```sh
python3 docs/roadmap/tools/generate.py
```

Outputs land in `docs/roadmap/` (the script resolves its target
directory from `__file__`). Hand-edited notes inside a `tasks/<ID>.md`
file are not preserved by the generator — copy them out before
regenerating, or only run the generator after porting them into the
in-script registry.

> Last generated: 2026-04-26
