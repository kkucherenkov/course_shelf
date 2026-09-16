# Active tasks

## T-2026-09-16-admin-buttons — replace UButton with AppButton across admin pages

- Created: 2026-09-16
- Owner: claude
- Spec: n/a — component consolidation, not a contract change
- Goal: admin pages consume `@app/ui`'s `AppButton` instead of Nuxt UI's `UButton`, so the whole product speaks one component vocabulary (Nuxt UI stays only under `UApp`/`useToast`).
- Sub-steps:
  - [x] backups.vue (2)
  - [x] identify-tasks/[id].vue (1)
  - [x] index.vue (1)
  - [x] libraries/[id].vue (6)
  - [x] libraries/index.vue (3)
  - [x] permissions/index.vue (2)
  - [x] permissions/[userId].vue (5)
  - [x] users.vue (2)
  - [x] update specs referencing `UButton` stubs (admin-backups, admin-dashboard, admin-library-detail-scan-progress, admin-permissions-index, admin-permissions-user)
  - [x] `grep -c "<UButton" -r apps/web/app` → 0
  - [x] eyeball all 8 pages, light + dark (local docker stack, real admin session, all 4 `AppButton` variants confirmed — primary/secondary/ghost/destructive)
  - [x] lint/stylelint/format, `turbo run lint test typecheck`
- Status: done, pending maintainer reply on 3 consult items found along the way (see PR body)
- Blockers: —
