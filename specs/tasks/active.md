# Active tasks

## T-2026-09-17-audit-web — web/ui fixes from the 1.8.0 pre-release audit

- Created: 2026-09-17
- Owner: claude
- Spec: #695, #696, #697, #700, #701
- Goal: fix the five web/ui findings from the 1.8.0 pre-release audit (Assessment A) — an admin ejected by a transient session blip, an unreachable Transcript tab, untitled truncated lesson rows, four sub-scale hardcoded font sizes plus the gate that missed them, and five small papercuts (page title, raw cuid, browse filter bar over a denial, wrong 429 advice, dead sign-in button).
- Spec diff: none — apps/web + packages/ui only; apps/backend / packages/specs / packages/api-client-\* belong to the parallel kkucherenkov/audit-backend lane.
- Codegen impact: no
- Sub-steps:
  - [x] #695 — admin.ts: third "role unknown" state agrees with auth.global.ts instead of contradicting it
  - [x] #696 — AppTab raised to `--text-md`; PlayerSidebar tabs wrap instead of hiding under an affordance-less horizontal scroll
  - [x] #697 — AppLessonRow gets a native `title` attribute so a truncated name is recoverable
  - [x] #700 — 9 sub-scale `font-size: $var` literals replaced with scale tokens (4 named in the issue + 5 more the new gate would otherwise have broken CI on); new `course-shelf/font-size-token-only` stylelint plugin + self-check
  - [x] #701.1 — courses/[id].vue gets a real `useHead` document title
  - [x] #701.2 — admin dashboard's last-scan card names the library, not its raw cuid
  - [x] #701.3 — browse.vue hides the filter bar over an access denial (browse.vue's own `hasLibraryAccess`, same pattern as home's #666)
  - [x] #701.4 — home rows + course detail show rate-limit advice on a 429 instead of "check your connection" (browse.vue's own generic error banner left as a follow-up — no status code plumbed there yet)
  - [x] #701.5 — sign-in submit only disabled by rate-limit lockout, not client-side password-length validity
- Status: in-progress (running full quality gates + Storybook baseline regen before PR)
- Blockers: —

## T-2026-09-16-typography-roles — raise text roles one step (#658)

- Created: 2026-09-16
- Owner: claude
- Spec: https://github.com/kkucherenkov/course_shelf/issues/658
- Goal: raise the two bottom-heavy text steps (`--text-xs` 78% of usage) by
  exactly one existing scale step per role — no new scale steps, no
  mechanical grep-replace. Course title (`--text-2xl`) stays.
  - body copy: `--text-sm` → `--text-base`
  - lesson row / section heading: `--text-sm` → `--text-md`
  - meta / caption: `--text-xs` → `--text-sm`
  - deliberately dense surfaces (admin tables, tight rows): left alone
- Baseline (re-measured on 6bb6fee5): 282 `font-size: var(--text-*)` decls,
  82 files, `apps/web/app` + `packages/ui/src`.
- Codegen impact: no (design tokens only, no new scale steps)
- Sub-steps:
  - [ ] T1 — `packages/ui/src/components/*` primitives (~80 decls)
  - [ ] T2 — reader surfaces: lesson-player, course-detail, home, search (~50)
  - [ ] T3 — admin surfaces (~70, dense tables stay put)
  - [ ] T4 — remaining pages: auth, settings, libraries, dev (~80), closes #658
- Status: in-progress
- Blockers: —

## T-2026-09-16-kkucherenkov-flashcards-domain — flashcard + SM-2 domain and API

- Created: 2026-09-16
- Owner: claude
- Spec: [docs/roadmap/tasks/E29-F01-S01.md](../../docs/roadmap/tasks/E29-F01-S01.md), [docs/roadmap/tasks/E29-F01-S02.md](../../docs/roadmap/tasks/E29-F01-S02.md)
- Goal: Flashcard aggregate with a pure SM-2 scheduler and review-queue query (S01), then CRUD + due-queue + grade endpoints over it (S02). Issues #232, #233, umbrella #250.
- Spec diff: openapi.yaml — flashcard routes (create/list per lesson, due queue, update, delete, grade)
- Codegen impact: yes
- Sub-steps:
  - [x] Prisma schema + migration for `Flashcard`
  - [x] `ReviewSchedule` pure SM-2 function + table-driven tests
  - [x] `Flashcard` aggregate + repository port + Prisma adapter
  - [x] Migration verified against real Postgres — [PR #684](https://github.com/kkucherenkov/course_shelf/pull/684)
  - [ ] OpenAPI routes + codegen (own commit)
  - [ ] Commands/queries + controller + handler specs
- Status: in-progress
- Blockers: —
