## T-2026-09-17-audit-web — web/ui fixes from the 1.8.0 pre-release audit

- Created: 2026-09-17
- Completed: 2026-09-17
- Owner: claude
- Spec: #695, #696, #697, #700, #701
- Result: [PR #703](https://github.com/kkucherenkov/course_shelf/pull/703)
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
  - [x] #701.4 — home rows + course detail show rate-limit advice on a 429 instead of "check your connection" (browse.vue's own generic error banner left as a follow-up — no status code plumbed there yet; tracked in tuxedo)
  - [x] #701.5 — sign-in submit only disabled by rate-limit lockout, not client-side password-length validity
- Notes: Storybook baselines (AppTab, AppAvatar, AppNavigationShell) and the
  `/dev/foundations` e2e visual baseline both moved and were regenerated via
  `Actions → Regenerate visual snapshots` on the PR branch — no unrelated
  component pulled in either regen.
