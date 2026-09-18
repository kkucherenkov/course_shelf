## T-2026-09-13-fix-prod-headers — Helmet HSTS/CSP leak on HTTP + dead realtime WS scheme in prod

- Created: 2026-09-13
- Completed: 2026-09-13
- Result: https://github.com/kkucherenkov/course_shelf/pull/459
- Owner: claude
- Spec: none — `tuxedo` 115, 117
- Goal: plain-HTTP deployments stay reachable (Helmet stops emitting
  `upgrade-insecure-requests` + HSTS over HTTP), and Centrifugo actually
  connects in prod/release (browser gets `ws(s)://`, not the pasted-through
  `PUBLIC_BASE_URL` scheme).
- Acceptance:
  - [x] `bootstrap.ts`: `useDefaults: false` on Helmet, `strictTransportSecurity: false` in both nodeEnvs, directives enumerated explicitly
  - [x] e2e: no `upgrade-insecure-requests` in CSP, no `Strict-Transport-Security` header
  - [x] `docker-entrypoint.sh` rewrites `APP_CENTRIFUGO_URL` scheme http(s)→ws(s) before emitting `_app-config.js`
  - [x] web healthcheck in both compose.prod.yml and compose.release.yml asserts emitted `centrifugoUrl` starts with `ws`
  - [x] confirmed via GitHub API: CodeQL `js/insecure-helmet-configuration` dismissal flags the dev branch's `contentSecurityPolicy: false`, unrelated to either bug, stays accurate
  - [x] PR notes the NAS's local `nginx-prod.conf` stopgap should be removed after this ships
  - [x] tuxedo 115, 117 closed; dnote CHANGELOG entry
