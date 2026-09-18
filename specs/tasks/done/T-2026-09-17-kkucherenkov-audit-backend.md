## T-2026-09-17-kkucherenkov-audit-backend — 1.8.0 pre-release audit: backend fixes

- Created: 2026-09-17
- Owner: claude
- Spec: #693, #694, #698, #699
- Goal: fix four defects the 1.8.0 pre-release audit found — instance-wide rate
  limiting (`trust proxy` misconfigured), course-level access grants ignored by
  four read handlers, a missing subtitle file answering 500 instead of the
  documented 404, and a scan with thousands of errors reporting `succeeded`.
- Spec diff: openapi.yaml — new scan status value for #699 (partial success)
- Codegen impact: yes (own commit)
- Sub-steps:
  - [x] #693 — pin the docker network subnet, trust it by CIDR (not a hop
        count — unsafe with :3000 published), fix the two lying comments/text
  - [x] #694 — course grants: make `evaluate()` honour them on every course
        read path, one coherent model
  - [x] #698 — 404 for a missing subtitle file, both `.vtt` and `.srt` forms,
        fixed in `lesson-file-locator.ts`
  - [x] #699 — spec-first: new scan status for "completed with errors";
        required a minimal, scoped `apps/web` compile-safety fix (widen
        `ScanStatus` usages) since CI's typecheck spans the monorepo —
        chip colour and #699's second finding left to follow-up #702
- Status: done
- Completed: 2026-09-17
- Result: [PR #704](https://github.com/kkucherenkov/course_shelf/pull/704) — all 11 CI checks green
- Blockers: —
