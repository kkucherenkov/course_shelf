# Thin Docker Wrappers Removal — Design

**Date:** 2026-05-05
**Status:** Approved (brainstorm)
**Owner:** claude
**Related task:** specs/tasks/active.md → T-2026-05-05-001

## Goal

Eliminate two near-empty Docker images (`courseshelf-proxy`, `courseshelf-centrifugo`) from the release pipeline. They wrap `nginxinc/nginx-unprivileged:1.27-alpine` and `centrifugo/centrifugo:v6` respectively, each adding only one tiny config artefact. The release workflow rebuilds and pushes them on every tag, despite their contents being almost static.

After this change, the release pipeline builds and publishes only `courseshelf-backend` and `courseshelf-web`. The proxy and centrifugo containers run from upstream images, configured via bind-mount (proxy) and environment variables (centrifugo).

## Why

- **CI cost:** four `docker build` + `docker push` steps drop to two — release wall-time falls by ~5 minutes.
- **Surface reduction:** two fewer Dockerfiles, one fewer entrypoint script, one fewer config template — fewer files to maintain, less attack surface for CVE/Trivy.
- **Pattern alignment:** the development compose (`docker/compose.yml`) already uses upstream `centrifugo/centrifugo:v6` and `nginx:1.27-alpine` with bind-mounts. Production currently diverges. After this change, dev and prod follow the same shape.
- **Centrifugo v6 supports env-driven configuration natively** (verified via context7 against `/centrifugal/centrifugal.dev` docs). Space-separated arrays for simple lists, JSON-string for complex maps/arrays-of-objects. The wrapper's envsubst+template machinery is now redundant.

## Non-goals

- Touching `compose.yml` (development). Already on upstream images, no changes.
- Changing `prod.conf` semantics. Kept verbatim, only delivery method changes.
- Touching backend/web Dockerfiles. They are real builds, out of scope here.
- Multi-arch images, BuildKit cache mounts, or any other build-speed optimisations. Those belong to a separate spec (#1: CI consolidation).

## Architecture changes

| Surface                        | Before                                                                                                                          | After                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `courseshelf-centrifugo` image | wrapper over `centrifugo/centrifugo:v6` (template + envsubst entrypoint)                                                        | **removed**; use `centrifugo/centrifugo:v6` directly          |
| `courseshelf-proxy` image      | wrapper over `nginxinc/nginx-unprivileged:1.27-alpine` (baked `prod.conf`)                                                      | **removed**; bind-mount `nginx-prod.conf` from release bundle |
| Centrifugo config delivery     | template file + envsubst at boot                                                                                                | `CENTRIFUGO_*` environment variables                          |
| Files in repo (deleted)        | `docker/centrifugo/{Dockerfile, entrypoint.sh, config.template.json}`, `docker/nginx/Dockerfile`                                | —                                                             |
| Files unchanged                | `docker/centrifugo/config.json` (dev bind-mount), `docker/nginx/default.conf` (dev), `docker/nginx/prod.conf` (prod bind-mount) | —                                                             |
| Release bundle                 | 4 files (`compose.yml`, `.env.example`, `README.md`, `CHANGELOG.md`)                                                            | 5 files (+ `nginx-prod.conf`)                                 |
| Release workflow build steps   | 4 image builds + pushes                                                                                                         | 2 image builds + pushes                                       |

## Centrifugo: env-driven configuration

`centrifugo/centrifugo:v6` reads `CENTRIFUGO_*` environment variables natively. Mapping current template fields to env vars:

```yaml
# compose.{prod,release}.yml — service: centrifugo
image: centrifugo/centrifugo:v6
restart: unless-stopped
environment:
  # client.allowed_origins — space-separated list of strings
  CENTRIFUGO_CLIENT_ALLOWED_ORIGINS: '${PUBLIC_BASE_URL}'

  # client.token.hmac_secret_key
  CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY: '${CENTRIFUGO_TOKEN_HMAC_SECRET}'

  # http_api.key
  CENTRIFUGO_HTTP_API_KEY: '${CENTRIFUGO_API_KEY}'

  # admin.enabled / health.enabled
  CENTRIFUGO_ADMIN_ENABLED: 'false'
  CENTRIFUGO_HEALTH_ENABLED: 'true'

  # log.level
  CENTRIFUGO_LOG_LEVEL: '${CENTRIFUGO_LOG_LEVEL:-info}'

  # channel.namespaces — JSON string (complex array of objects)
  # Hardcoded in compose, NOT in .env (this is application code, not deploy config).
  CENTRIFUGO_CHANNEL_NAMESPACES: >
    [
      {"name":"system","presence":true,"history_size":10,"history_ttl":"60s"},
      {"name":"library","presence":false,"history_size":0},
      {"name":"notes","presence":false,"history_size":0},
      {"name":"progress","presence":false,"history_size":0},
      {"name":"notifications","presence":false,"history_size":0}
    ]
ulimits:
  nofile: { soft: 65536, hard: 65536 }
healthcheck:
  test: ['CMD', 'wget', '-qO-', 'http://localhost:8000/health']
  interval: 5s
  timeout: 3s
  retries: 20
networks: [cs-net]
```

**Decisions:**

- Namespaces are baked into the compose file, not the `.env`. Reason: namespaces are part of the application contract (backend code uses them); operator's `.env` should hold deploy-specific secrets and URLs only.
- Backend env vars (`CENTRIFUGO_API_KEY`, `CENTRIFUGO_TOKEN_HMAC_SECRET`) keep their current names — `apps/backend/src/common/config/app-config.ts` reads them. The compose file's centrifugo-service `environment:` block manually maps these operator-facing names to centrifugo's prefixed names (`CENTRIFUGO_HTTP_API_KEY: "${CENTRIFUGO_API_KEY}"`, `CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY: "${CENTRIFUGO_TOKEN_HMAC_SECRET}"`). Both services thus share the same secret values without exposing the centrifugo-internal naming to operators in `.env`.

## Proxy: bind-mount, no templating

`docker/nginx/prod.conf` is fully static — no `${VAR}` placeholders, all upstreams hardcoded by service name (`backend:3000`, `web:8080`, `centrifugo:8000`). Templating is unnecessary.

```yaml
# compose.{prod,release}.yml — service: proxy
image: nginxinc/nginx-unprivileged:1.27-alpine
restart: unless-stopped
depends_on:
  backend: { condition: service_started }
  web: { condition: service_started }
volumes:
  - ./nginx-prod.conf:/etc/nginx/conf.d/default.conf:ro
ports:
  - '${PROXY_PORT:-8080}:8080'
healthcheck:
  test: ['CMD', 'wget', '-qO-', 'http://127.0.0.1:8080/api/v1/health']
  interval: 10s
  timeout: 5s
  retries: 12
  start_period: 30s
networks: [cs-net]
```

`nginxinc/nginx-unprivileged` already declares `USER nginx` upstream — Trivy DS-0002 stays green without explicit re-declaration in our layer.

## Release workflow changes

**`.forgejo/workflows/release.yml` — image builds:**

```diff
   publish courseshelf-backend     apps/backend/Dockerfile
   publish courseshelf-web         apps/web/Dockerfile
-  publish courseshelf-proxy       docker/nginx/Dockerfile
-  publish courseshelf-centrifugo  docker/centrifugo/Dockerfile
```

**Bundle staging:** the new bundle layout adds one file (`nginx-prod.conf`); the rest is unchanged. Full step shown below in §Render-and-validate, since the render and bundle steps merge into one.

**Render-and-validate step ordering.** Currently the workflow renders `compose-release-vX.Y.Z.yml` in the repo root, validates it via `docker compose config --quiet`, then copies the rendered file into `STAGE/` in a separate bundle step. After this change, `compose.release.yml` references `./nginx-prod.conf` — the validate must see that file at the relative path next to the compose. We restructure the workflow so all bundle inputs land in `STAGE/` first, then validate from there:

```bash
# Render compose into STAGE directory, copy nginx-prod.conf alongside, validate.
STAGE="courseshelf-release-v${SEMVER}"
mkdir -p "$STAGE"
sed ... docker/compose.release.yml > "$STAGE/compose.yml"
cp docker/nginx/prod.conf "$STAGE/nginx-prod.conf"
cp .env.release.example "$STAGE/.env.example"

# Validate from inside STAGE so ./nginx-prod.conf resolves.
( cd "$STAGE" && \
  PUBLIC_BASE_URL=http://placeholder.local \
  POSTGRES_PASSWORD=placeholder \
  BETTER_AUTH_SECRET=placeholder \
  CENTRIFUGO_API_KEY=placeholder \
  CENTRIFUGO_TOKEN_HMAC_SECRET=placeholder \
  COURSES_PATH=/tmp \
    docker compose -f compose.yml config --quiet )

# Then continue with README, CHANGELOG, tarball as before.
```

This collapses the previous `render compose` + separate `bundle artefacts` steps into one staging step. The standalone `compose-release-vX.Y.Z.yml` artefact (uploaded as a release asset) is produced by copying `STAGE/compose.yml` to that filename after validation.

## `compose.prod.yml` (build-locally variant)

Mirror the same upstream-image + bind-mount/env approach:

```diff
   centrifugo:
-    build:
-      context: ..
-      dockerfile: docker/centrifugo/Dockerfile
+    image: centrifugo/centrifugo:v6
     restart: unless-stopped
     environment:
+      CENTRIFUGO_CLIENT_ALLOWED_ORIGINS: "${PUBLIC_BASE_URL}"
+      CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY: "${CENTRIFUGO_TOKEN_HMAC_SECRET}"
+      ... (full set as in §Centrifugo)

   proxy:
-    build:
-      context: ..
-      dockerfile: docker/nginx/Dockerfile
+    image: nginxinc/nginx-unprivileged:1.27-alpine
     restart: unless-stopped
+    volumes:
+      - ./nginx/prod.conf:/etc/nginx/conf.d/default.conf:ro
```

After this change, `compose.prod.yml` and `compose.release.yml` differ **only** in how backend/web are delivered (`build:` vs `image:`). The centrifugo and proxy services are identical between them.

## Files removed

- `docker/centrifugo/Dockerfile`
- `docker/centrifugo/entrypoint.sh`
- `docker/centrifugo/config.template.json`
- `docker/nginx/Dockerfile`

## Files preserved

- `docker/centrifugo/config.json` — dev bind-mount via `compose.yml`. Dev intentionally takes a different configuration path (file bind-mount) than prod (env vars): the file is simpler to read and edit during local debugging, and dev has no secrets in it. Both paths declare the same five namespaces; dev's `compose.override.yml` adds `CENTRIFUGO_LOG_LEVEL=debug`.
- `docker/nginx/default.conf` — dev bind-mount (different `web` upstream port `:3001` since dev runs Nuxt directly).
- `docker/nginx/prod.conf` — prod bind-mount (kept in place; release workflow copies it into the bundle as `nginx-prod.conf`).

## Verification plan

Each phase verified locally before merging:

1. **Centrifugo migration** — bring up `centrifugo/centrifugo:v6` with new env set:
   - `GET /health` → 200
   - WebSocket handshake from browser within `PUBLIC_BASE_URL` succeeds; from a foreign origin → blocked
   - HMAC token issued by backend is accepted by centrifugo
   - `POST /api/publish` with `CENTRIFUGO_HTTP_API_KEY` works
   - All five namespaces (`system`, `library`, `notes`, `progress`, `notifications`) are addressable
2. **Proxy migration** — bring up `nginxinc/nginx-unprivileged:1.27-alpine` with bind-mount:
   - `GET /api/v1/health` → backend
   - `GET /api/v1/stream/...` with `Range` header → backend, no buffering (verify via `proxy_buffering off` headers)
   - `WS /centrifugo/connection/websocket` → centrifugo, upgrade succeeds
   - `GET /` → web SPA
3. **Release bundle** — simulate locally:
   ```bash
   mkdir -p /tmp/release-bundle
   cp compose-release-v0.0.0-test.yml /tmp/release-bundle/compose.yml
   cp docker/nginx/prod.conf /tmp/release-bundle/nginx-prod.conf
   cp .env.release.example /tmp/release-bundle/.env
   # fill .env with test values
   (cd /tmp/release-bundle && docker compose --env-file .env -f compose.yml up -d)
   curl http://localhost:8080/api/v1/health
   ```
4. **Trivy scan** (CI `trivy.yml` job) — green against the two remaining custom images (backend, web) plus the pulled upstream images.

## Risks and mitigations

- **R1: Centrifugo's env-parsing of `CENTRIFUGO_CHANNEL_NAMESPACES` (array of objects) might have undocumented edge cases.**
  Mitigation: smoke-test centrifugo locally with the exact JSON string before changing any compose file. If it fails, fall back to bind-mounting a static `centrifugo.json` (config without secrets) plus env-overrides for the secret fields. Centrifugo allows mixing file + env, with env taking precedence.

- **R2: Bundle's `./nginx-prod.conf` path must resolve relative to the rendered compose file.**
  Mitigation: render compose into a working directory, `cp nginx-prod.conf` next to it, validate with `docker compose config --quiet` from that directory. Catches the path mismatch at CI time, not at operator deploy time.

- **R3: Operators with existing v0.x deployments who upgrade to v0.y will pull a `compose.yml` that bind-mounts `nginx-prod.conf`. If they don't extract the new bundle fully, the proxy fails to start.**
  Mitigation: add an UPGRADE NOTE to release notes for the version that introduces this change. The bundle README.md already instructs `tar xf` first.

## Implementation phases

1. **Phase 1 — Centrifugo wrapper removal**
   - Update `compose.prod.yml` and `compose.release.yml`: replace `build:` with `image: centrifugo/centrifugo:v6`, add full `CENTRIFUGO_*` env set
   - Smoke-test locally via `compose.prod.yml`
2. **Phase 2 — Proxy wrapper removal**
   - Update `compose.prod.yml` and `compose.release.yml`: replace `build:` with `image: nginxinc/nginx-unprivileged:1.27-alpine`, add bind-mount volume
   - Smoke-test locally via `compose.prod.yml`
3. **Phase 3 — Release workflow cleanup**
   - Remove `publish courseshelf-proxy` and `publish courseshelf-centrifugo` from `.forgejo/workflows/release.yml`
   - Add `cp docker/nginx/prod.conf "$STAGE/nginx-prod.conf"` to the bundle staging step
   - Move the `docker compose config --quiet` validation to run with `nginx-prod.conf` adjacent
   - Delete `docker/centrifugo/{Dockerfile, entrypoint.sh, config.template.json}` and `docker/nginx/Dockerfile`
4. **Phase 4 — Documentation**
   - `docs/release.md`: update bundle layout (5 files), note removed images
   - `docs/deployment.md`: same — describe the new bind-mount step for operators
   - Add UPGRADE NOTE to the next release-notes generation flow

**PR strategy:** single PR. The compose files, release workflow, and removed Dockerfiles are interlocked — the pipeline must remain green on every commit, so all changes land together.
