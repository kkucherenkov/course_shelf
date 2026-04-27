# Active tasks

## T-2026-04-27-032 — Admin dashboard aggregator (E21-F01-S01)

- Created: 2026-04-27
- Owner: claude
- Spec: `docs/roadmap/tasks/E21-F01-S01.md` (PRD FR-OPS-02). Single admin-only endpoint that joins existing read models — no new domain logic.
- Goal: `GET /api/v1/admin/dashboard` returns library/user/course/lesson totals, the most recent scan summary, and the count of scan errors over the last 24 hours. Admin-only via `AdminGuard`. No projection writes; pure read aggregation.
- Acceptance:
  - `GET /api/v1/admin/dashboard` declared in OpenAPI; returns `AdminDashboardDto`.
  - Admin-only: 401 anonymous, 403 non-admin, 200 admin.
  - Body shape:
    ```ts
    AdminDashboardDto {
      generatedAt: string;          // ISO instant
      counts: {
        libraries: number;
        users: number;
        courses: number;
        lessons: number;
      };
      latestScan: AdminDashboardLatestScan | null;
      errorsLast24h: number;
    }
    AdminDashboardLatestScan {
      scanId: string;
      libraryId: string;
      status: 'running' | 'succeeded' | 'failed' | 'cancelled';
      startedAt: string;            // ISO instant
      finishedAt: string | null;    // ISO instant; null while running
      filesScanned: number;
      errorsCount: number;
    }
    ```
  - "errors over 24h" = `ScanErrorRecord` rows whose parent `Scan.startedAt > now - 24h`. ScanErrorRecord has no own timestamp; using the parent's `startedAt` is a load-bearing approximation that works because no scan is expected to outlive a single 24-hour window. Document in code.
  - Reads from existing tables (`Library`, `User`, `Course`, `Lesson`, `Scan`, `ScanErrorRecord`) via PrismaService directly. New `AdminModule` doesn't import from sibling bounded contexts (boundaries-config friendly: only `common/prisma`, `common/auth`).
  - Six counts run in parallel via `Promise.all`.
  - Empty platform: `latestScan: null`, all counts 0, `errorsLast24h: 0`.
- Spec diff: yes — new path + 2 schemas.
- Codegen impact: yes — TS client regenerates.
- Design impact: none.
- Tests:
  - Handler: assembles all parts from Prisma fixtures (counts, latest scan, error count).
  - Handler: `latestScan: null` when no scans exist; counts default to 0.
  - Handler: errorsLast24h cutoff respects exact 24-hour boundary.
- Sub-steps:
  - [ ] T-032-A: spec — add path + schemas (spec-writer)
  - [ ] T-032-B: codegen
  - [ ] T-032-C: AdminModule + AdminController + GetAdminDashboardQuery/Handler + tests (backend-engineer)
  - [ ] T-032-D: lint, typecheck, test, prettier; flip card; archive T-032
- Status: in-progress
- Blockers: —
