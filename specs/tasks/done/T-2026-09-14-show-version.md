## T-2026-09-14-show-version — the running version is nowhere in the UI

- Created: 2026-09-14
- Owner: claude
- Spec: `InstanceConfigDto.version` — `#537`
- Goal: the settings page names the version this instance is running, so a bug
  report can quote it and a stale cached SPA is distinguishable from a stale
  server.
- Sub-steps:
  - [x] spec + codegen
  - [x] `AdminPublicController` returns `AppConfig.runtime.version`
  - [x] About section on the settings page, en/ru copy
  - [x] tests: backend controller, web rows (version and the unreachable case)
- Status: done
- Completed: 2026-09-14
- Blockers: —
