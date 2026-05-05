# Thin Docker Wrappers Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drop `courseshelf-proxy` and `courseshelf-centrifugo` from the release pipeline. Run upstream `nginxinc/nginx-unprivileged:1.27-alpine` directly with `nginx-prod.conf` bind-mounted from the release bundle, and `centrifugo/centrifugo:v6` directly with all configuration driven by `CENTRIFUGO_*` environment variables.

**Architecture:** Replace two thin docker wrappers (one config artefact each) with upstream images. Centrifugo's wrapper exists only to envsubst a JSON template — that need disappears now that v6 supports complex config via env vars natively (verified through context7 against `/centrifugal/centrifugal.dev`). The proxy wrapper exists only to bake `prod.conf` into the image — replaced with a bind-mount from `STAGE/nginx-prod.conf` in the release bundle. Net effect: 2 fewer image builds per release tag, 4 fewer files in `docker/`, dev/prod compose patterns aligned.

**Tech Stack:** Docker Compose v2, `nginxinc/nginx-unprivileged:1.27-alpine`, `centrifugo/centrifugo:v6`, Forgejo Actions, GHCR.

**Spec:** [`docs/superpowers/specs/2026-05-05-thin-docker-wrappers-removal-design.md`](../specs/2026-05-05-thin-docker-wrappers-removal-design.md)

---

## File Structure

### Modified

| Path | Responsibility | Change |
|---|---|---|
| `docker/compose.prod.yml` | Build-locally production stack | `centrifugo` and `proxy` services switch to upstream images |
| `docker/compose.release.yml` | Image-pulling production stack (rendered into release bundle) | Same as above; reference `./nginx-prod.conf` for proxy config |
| `.forgejo/workflows/release.yml` | Tag-triggered release pipeline | Drop two `publish` calls; merge `render compose` + `bundle artefacts` into one staging step |
| `.env.release.example` | Operator env contract template for releases | Remove now-unused `CENTRIFUGO_ALLOWED_ORIGINS` comment line; add note that namespaces live in compose, not env |
| `docs/release.md` | Release runbook | Image table drops two rows; bundle layout shows new `nginx-prod.conf` file; UPGRADE NOTE |
| `docs/deployment.md` | Operator deployment guide | Bundle layout description + extraction note about `nginx-prod.conf` |
| `specs/tasks/active.md` | Project task stack (per `.claude/CLAUDE.md` rules) | Sub-step boxes ticked as work lands |

### Deleted

| Path | Was responsible for |
|---|---|
| `docker/centrifugo/Dockerfile` | Wrapper image: `centrifugo/centrifugo:v6` + envsubst entrypoint |
| `docker/centrifugo/entrypoint.sh` | Render template via envsubst then exec centrifugo |
| `docker/centrifugo/config.template.json` | Centrifugo config with `${VAR}` placeholders |
| `docker/nginx/Dockerfile` | Wrapper image: `nginx-unprivileged` + baked `prod.conf` |

### Preserved (no changes)

| Path | Stays because |
|---|---|
| `docker/compose.yml` | Dev compose; already on upstream images |
| `docker/compose.override.yml` | Dev-only `CENTRIFUGO_LOG_LEVEL=debug` override |
| `docker/centrifugo/config.json` | Dev bind-mount target |
| `docker/nginx/default.conf` | Dev nginx config (different `web` upstream port) |
| `docker/nginx/prod.conf` | Prod nginx config — release workflow copies it into the bundle as `nginx-prod.conf` |
| `apps/backend/`, `apps/web/` Dockerfiles | Real builds; out of scope |

---

## Task 1: Smoke-test centrifugo upstream image with env-only config

**Why this is first:** Spec risk R1 — centrifugo's env-parsing of `CENTRIFUGO_CHANNEL_NAMESPACES` (array of objects) might have undocumented edge cases. Validating before touching any compose file means we don't have to revert work.

**Files:**
- Create: `/tmp/centrifugo-env-smoketest.sh` (throwaway script — not committed)

- [ ] **Step 1: Write the smoke-test script**

Create `/tmp/centrifugo-env-smoketest.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Pulls centrifugo:v6 and starts it with the exact env set the spec uses.
# Verifies: /health responds 200, namespaces are loaded, HMAC token issued
# by us is accepted on a publish call.

cleanup() { docker rm -f centrifugo-smoketest 2>/dev/null || true; }
trap cleanup EXIT

NS_JSON='[{"name":"system","presence":true,"history_size":10,"history_ttl":"60s"},{"name":"library","presence":false,"history_size":0},{"name":"notes","presence":false,"history_size":0},{"name":"progress","presence":false,"history_size":0},{"name":"notifications","presence":false,"history_size":0}]'

docker run -d --name centrifugo-smoketest \
  -p 18000:8000 \
  -e CENTRIFUGO_CLIENT_ALLOWED_ORIGINS="http://localhost:8080" \
  -e CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY="smoketest-hmac" \
  -e CENTRIFUGO_HTTP_API_KEY="smoketest-api-key" \
  -e CENTRIFUGO_ADMIN_ENABLED="false" \
  -e CENTRIFUGO_HEALTH_ENABLED="true" \
  -e CENTRIFUGO_LOG_LEVEL="info" \
  -e CENTRIFUGO_CHANNEL_NAMESPACES="$NS_JSON" \
  centrifugo/centrifugo:v6

# Give it a moment to start.
for _ in $(seq 1 20); do
  if curl -sSf http://localhost:18000/health >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

echo "─── /health ───"
curl -sSf http://localhost:18000/health && echo

echo "─── log dump (looking for namespace registrations) ───"
docker logs centrifugo-smoketest 2>&1 | tail -40

echo "─── publish via HTTP API ───"
curl -sSfX POST \
  -H "X-API-Key: smoketest-api-key" \
  -H "Content-Type: application/json" \
  -d '{"channel":"system","data":{"hello":"smoketest"}}' \
  http://localhost:18000/api/publish && echo

echo "─── presence on system namespace (should be allowed) ───"
curl -sSfX POST \
  -H "X-API-Key: smoketest-api-key" \
  -H "Content-Type: application/json" \
  -d '{"channel":"system"}' \
  http://localhost:18000/api/presence && echo

echo "─── publish to undeclared namespace (should fail) ───"
curl -sSX POST \
  -H "X-API-Key: smoketest-api-key" \
  -H "Content-Type: application/json" \
  -d '{"channel":"unknown:foo","data":{}}' \
  http://localhost:18000/api/publish && echo

echo "smoketest OK"
```

```bash
chmod +x /tmp/centrifugo-env-smoketest.sh
```

- [ ] **Step 2: Run smoke test, observe output**

Run: `/tmp/centrifugo-env-smoketest.sh`

Expected:
- `/health` returns `{"status":"ok"}` or similar non-error JSON.
- Log dump shows centrifugo started without parse errors and lists 5 namespaces (`system`, `library`, `notes`, `progress`, `notifications`).
- Publish to `system` channel returns `{"result":{}}` or similar success body — confirms `CENTRIFUGO_HTTP_API_KEY` is honoured AND the namespace is registered.
- Presence on `system` returns presence info (empty `{"result":{...}}` is fine — namespace declared `presence: true`).
- Publish to `unknown:foo` returns an error (e.g. `{"error":{"code":102,"message":"unknown channel"}}`) — confirms namespaces are an allowlist, our 5 are the only ones allowed.

If any of the above fails, **stop**: revisit the spec's R1 mitigation (bind-mount static config + env-overrides).

- [ ] **Step 3: Verify centrifugo container ran as non-root**

Run: `docker exec centrifugo-smoketest id`

Expected: `uid=1000(centrifugo) gid=1000(centrifugo) groups=1000(centrifugo)` — confirms upstream image already drops privileges; Trivy DS-0002 stays green without our wrapper's `USER centrifugo` directive.

- [ ] **Step 4: Stop and clean up smoke-test container**

Run: `docker rm -f centrifugo-smoketest`

Expected: container removed. (The script's trap also does this, but be explicit.)

No commit — `/tmp/...` is throwaway.

---

## Task 2: Migrate centrifugo service in `compose.prod.yml`

**Files:**
- Modify: `docker/compose.prod.yml` (centrifugo service block)

- [ ] **Step 1: Verify current centrifugo service block**

Run: `grep -A 16 "^  centrifugo:" docker/compose.prod.yml`

Expected (current state):
```yaml
  centrifugo:
    build:
      context: ..
      dockerfile: docker/centrifugo/Dockerfile
    restart: unless-stopped
    environment:
      CENTRIFUGO_ALLOWED_ORIGINS: '${CENTRIFUGO_ALLOWED_ORIGINS:-["${PUBLIC_BASE_URL}"]}'
      CENTRIFUGO_API_KEY: "${CENTRIFUGO_API_KEY}"
      CENTRIFUGO_TOKEN_HMAC_SECRET: "${CENTRIFUGO_TOKEN_HMAC_SECRET}"
      CENTRIFUGO_LOG_LEVEL: "${CENTRIFUGO_LOG_LEVEL:-info}"
    ulimits:
      nofile: { soft: 65536, hard: 65536 }
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8000/health"]
      interval: 5s
      timeout: 3s
      retries: 20
    networks: [cs-net]
```

- [ ] **Step 2: Replace centrifugo service block with upstream image + native env config**

Edit `docker/compose.prod.yml`. Replace the current centrifugo service block with:

```yaml
  centrifugo:
    image: centrifugo/centrifugo:v6
    restart: unless-stopped
    environment:
      # client.allowed_origins — space-separated list (centrifugo v6 native)
      CENTRIFUGO_CLIENT_ALLOWED_ORIGINS: "${PUBLIC_BASE_URL}"
      # client.token.hmac_secret_key — used to verify connection tokens issued by the backend
      CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY: "${CENTRIFUGO_TOKEN_HMAC_SECRET}"
      # http_api.key — backend → centrifugo publish authorization
      CENTRIFUGO_HTTP_API_KEY: "${CENTRIFUGO_API_KEY}"
      CENTRIFUGO_ADMIN_ENABLED: "false"
      CENTRIFUGO_HEALTH_ENABLED: "true"
      CENTRIFUGO_LOG_LEVEL: "${CENTRIFUGO_LOG_LEVEL:-info}"
      # channel.namespaces — JSON array of objects. Hardcoded here, not in
      # .env: namespaces are part of the application contract (backend
      # publishes to these names), so they live with the compose file, not
      # with operator-facing secrets.
      CENTRIFUGO_CHANNEL_NAMESPACES: '[{"name":"system","presence":true,"history_size":10,"history_ttl":"60s"},{"name":"library","presence":false,"history_size":0},{"name":"notes","presence":false,"history_size":0},{"name":"progress","presence":false,"history_size":0},{"name":"notifications","presence":false,"history_size":0}]'
    ulimits:
      nofile: { soft: 65536, hard: 65536 }
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8000/health"]
      interval: 5s
      timeout: 3s
      retries: 20
    networks: [cs-net]
```

- [ ] **Step 3: Validate compose.prod.yml parses**

Run:
```bash
PUBLIC_BASE_URL=http://placeholder.local \
POSTGRES_PASSWORD=placeholder \
BETTER_AUTH_SECRET=placeholder \
CENTRIFUGO_API_KEY=placeholder \
CENTRIFUGO_TOKEN_HMAC_SECRET=placeholder \
COURSES_PATH=/tmp \
  docker compose -f docker/compose.prod.yml config --quiet
```

Expected: exit code 0, no output. Any YAML/syntax/substitution error fails this step.

- [ ] **Step 4: Verify env mapping in rendered output**

Run:
```bash
PUBLIC_BASE_URL=https://example.local \
POSTGRES_PASSWORD=p \
BETTER_AUTH_SECRET=s \
CENTRIFUGO_API_KEY=test-api-key \
CENTRIFUGO_TOKEN_HMAC_SECRET=test-hmac \
COURSES_PATH=/tmp \
  docker compose -f docker/compose.prod.yml config | \
  awk '/^  centrifugo:/,/^  [a-z]/' | head -40
```

Expected output contains:
- `image: centrifugo/centrifugo:v6` (no `build:` block)
- `CENTRIFUGO_CLIENT_ALLOWED_ORIGINS: https://example.local`
- `CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY: test-hmac`
- `CENTRIFUGO_HTTP_API_KEY: test-api-key`
- `CENTRIFUGO_CHANNEL_NAMESPACES: '[{"name":"system",...}]'`

- [ ] **Step 5: Commit**

```bash
git add docker/compose.prod.yml
git commit -m "$(cat <<'EOF'
refactor(compose): centrifugo runs upstream image with env-only config in compose.prod.yml

Replace the courseshelf-centrifugo wrapper build with
centrifugo/centrifugo:v6 directly. All template fields move to
CENTRIFUGO_* environment variables (v6 native support), including
channel.namespaces as a JSON-string env (verified via smoke test).

Refs T-2026-05-05-001.
EOF
)"
```

---

## Task 3: Migrate proxy service in `compose.prod.yml`

**Files:**
- Modify: `docker/compose.prod.yml` (proxy service block)

- [ ] **Step 1: Verify current proxy service block**

Run: `grep -A 14 "^  proxy:" docker/compose.prod.yml`

Expected (current state):
```yaml
  proxy:
    build:
      context: ..
      dockerfile: docker/nginx/Dockerfile
    restart: unless-stopped
    depends_on:
      backend: { condition: service_started }
      web: { condition: service_started }
    ports:
      - "${PROXY_PORT:-8080}:8080"
    healthcheck:
      ...
```

- [ ] **Step 2: Replace proxy service block with upstream image + bind-mount**

Edit `docker/compose.prod.yml`. Replace the current proxy block with:

```yaml
  proxy:
    image: nginxinc/nginx-unprivileged:1.27-alpine
    restart: unless-stopped
    depends_on:
      backend: { condition: service_started }
      web: { condition: service_started }
    volumes:
      # Read-only bind-mount: prod.conf is the same file the wrapper
      # used to bake into its image. nginxinc/nginx-unprivileged already
      # runs as the `nginx` user (uid 101), so Trivy DS-0002 stays green
      # without an explicit USER directive in our layer.
      - ./nginx/prod.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "${PROXY_PORT:-8080}:8080"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:8080/api/v1/health"]
      interval: 10s
      timeout: 5s
      retries: 12
      start_period: 30s
    networks: [cs-net]
```

Note the bind-mount path `./nginx/prod.conf` — this is relative to the compose file's directory (`docker/`), so it resolves to `docker/nginx/prod.conf`.

- [ ] **Step 3: Validate compose.prod.yml parses**

Run:
```bash
PUBLIC_BASE_URL=http://placeholder.local \
POSTGRES_PASSWORD=placeholder \
BETTER_AUTH_SECRET=placeholder \
CENTRIFUGO_API_KEY=placeholder \
CENTRIFUGO_TOKEN_HMAC_SECRET=placeholder \
COURSES_PATH=/tmp \
  docker compose -f docker/compose.prod.yml config --quiet
```

Expected: exit 0, no output.

- [ ] **Step 4: Verify rendered proxy block uses upstream image + bind-mount**

Run:
```bash
PUBLIC_BASE_URL=http://placeholder.local \
POSTGRES_PASSWORD=p \
BETTER_AUTH_SECRET=s \
CENTRIFUGO_API_KEY=k \
CENTRIFUGO_TOKEN_HMAC_SECRET=h \
COURSES_PATH=/tmp \
  docker compose -f docker/compose.prod.yml config | \
  awk '/^  proxy:/,/^[a-z]/' | head -30
```

Expected output contains:
- `image: nginxinc/nginx-unprivileged:1.27-alpine` (no `build:` block)
- A volumes entry resolving to an absolute path ending in `/docker/nginx/prod.conf:/etc/nginx/conf.d/default.conf:ro`

- [ ] **Step 5: Commit**

```bash
git add docker/compose.prod.yml
git commit -m "$(cat <<'EOF'
refactor(compose): proxy runs upstream nginx-unprivileged with bind-mounted prod.conf

Replace the courseshelf-proxy wrapper build with
nginxinc/nginx-unprivileged:1.27-alpine and bind-mount
docker/nginx/prod.conf into /etc/nginx/conf.d/default.conf. The
upstream image already declares USER nginx, so Trivy DS-0002 stays
green without explicit re-assertion in our layer.

Refs T-2026-05-05-001.
EOF
)"
```

---

## Task 4: End-to-end smoke test of `compose.prod.yml`

**Why:** Validate that the two refactored services compose correctly with backend, web, postgres, redis. Catch any cross-service issue (e.g. backend can't reach centrifugo on the new env-driven config) before touching the release path.

**Files:** None modified — local-only verification.

- [ ] **Step 1: Stop the dev stack if running**

Run: `docker compose -f docker/compose.yml down 2>/dev/null || true`

Expected: dev stack stopped (or already down). The prod stack uses different network/volume names but freeing the host ports is safer.

- [ ] **Step 2: Create a throwaway `.env` for the smoke test**

Run:
```bash
cat > /tmp/courseshelf-prod-smoketest.env <<'EOF'
PUBLIC_BASE_URL=http://localhost:8080
PROXY_PORT=8080
POSTGRES_PASSWORD=smoketest-pg
BETTER_AUTH_SECRET=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
CENTRIFUGO_API_KEY=smoketest-api-key
CENTRIFUGO_TOKEN_HMAC_SECRET=smoketest-hmac-secret
COURSES_PATH=/tmp
EOF
```

Expected: file created.

- [ ] **Step 3: Bring the prod stack up**

Run:
```bash
docker compose --env-file /tmp/courseshelf-prod-smoketest.env \
  -f docker/compose.prod.yml \
  up -d --build
```

Expected: all six services start (postgres, redis, centrifugo, backend, web, proxy). The `--build` flag forces a fresh backend/web build; centrifugo and proxy now pull upstream images.

If any service fails to start, run `docker compose --env-file /tmp/courseshelf-prod-smoketest.env -f docker/compose.prod.yml logs <service>` and resolve before continuing.

- [ ] **Step 4: Wait for healthchecks and confirm all healthy**

Run (poll until all show `(healthy)`):
```bash
for i in $(seq 1 60); do
  STATUS=$(docker compose --env-file /tmp/courseshelf-prod-smoketest.env -f docker/compose.prod.yml ps --format '{{.Service}} {{.Status}}')
  echo "$STATUS"
  if echo "$STATUS" | grep -qE "centrifugo.*healthy" && \
     echo "$STATUS" | grep -qE "backend.*healthy" && \
     echo "$STATUS" | grep -qE "web.*healthy" && \
     echo "$STATUS" | grep -qE "proxy.*healthy"; then
    echo "all healthy"
    break
  fi
  sleep 5
done
```

Expected: within ~5 minutes, all four (centrifugo, backend, web, proxy) report `healthy`.

- [ ] **Step 5: Probe each route through the proxy**

Run:
```bash
echo "─── backend health ───"
curl -fsS http://localhost:8080/api/v1/health | head -c 200; echo
echo "─── web SPA ───"
curl -fsSI http://localhost:8080/ | head -1
echo "─── runtime config script ───"
curl -fsS http://localhost:8080/_app-config.js | head -3
echo "─── centrifugo via proxy (should fail handshake without token but reachable) ───"
curl -fsSI -H "Connection: upgrade" -H "Upgrade: websocket" \
  http://localhost:8080/centrifugo/connection/websocket || true
```

Expected:
- backend health returns JSON with `"status":"ok"` (or `"status":"degraded"` if optional services like sentry are off — both are 200/503 acceptable per the existing healthcheck).
- web SPA returns `HTTP/1.1 200 OK`.
- runtime config script returns JS like `window.__APP_CONFIG__ = {...}`.
- centrifugo route is reachable through the proxy — even an HTTP-only probe should reach centrifugo's WS endpoint and produce a 400/426 (the route resolves; the upgrade just fails without a valid token, which is fine).

- [ ] **Step 6: Confirm centrifugo accepts a backend-issued token**

Run:
```bash
docker compose --env-file /tmp/courseshelf-prod-smoketest.env -f docker/compose.prod.yml \
  logs centrifugo 2>&1 | grep -iE "(namespace|allowed_origins|started)" | head -10
```

Expected: log lines confirm centrifugo started, allowed_origins is set to `[http://localhost:8080]`, and the 5 namespaces are loaded.

- [ ] **Step 7: Tear the stack down**

Run:
```bash
docker compose --env-file /tmp/courseshelf-prod-smoketest.env -f docker/compose.prod.yml down -v
rm /tmp/courseshelf-prod-smoketest.env
```

Expected: all containers + volumes removed; the env file deleted.

No commit — verification step only. If something failed, return to Task 2 or Task 3 and fix before proceeding.

---

## Task 5: Migrate centrifugo service in `compose.release.yml`

**Files:**
- Modify: `docker/compose.release.yml` (centrifugo service block)

- [ ] **Step 1: Verify current centrifugo service block in compose.release.yml**

Run: `grep -A 16 "^  centrifugo:" docker/compose.release.yml`

Expected: a block referencing `${REGISTRY:-ghcr.io}/${REGISTRY_NAMESPACE:-kkucherenkov}/courseshelf-centrifugo:${RELEASE_TAG:-latest}`.

- [ ] **Step 2: Replace centrifugo service block**

Edit `docker/compose.release.yml`. Replace the current centrifugo block with:

```yaml
  centrifugo:
    image: centrifugo/centrifugo:v6
    restart: unless-stopped
    environment:
      CENTRIFUGO_CLIENT_ALLOWED_ORIGINS: "${PUBLIC_BASE_URL}"
      CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY: "${CENTRIFUGO_TOKEN_HMAC_SECRET:?CENTRIFUGO_TOKEN_HMAC_SECRET is required}"
      CENTRIFUGO_HTTP_API_KEY: "${CENTRIFUGO_API_KEY:?CENTRIFUGO_API_KEY is required}"
      CENTRIFUGO_ADMIN_ENABLED: "false"
      CENTRIFUGO_HEALTH_ENABLED: "true"
      CENTRIFUGO_LOG_LEVEL: "${CENTRIFUGO_LOG_LEVEL:-info}"
      # Application contract: hardcoded namespaces, NOT in operator's .env.
      CENTRIFUGO_CHANNEL_NAMESPACES: '[{"name":"system","presence":true,"history_size":10,"history_ttl":"60s"},{"name":"library","presence":false,"history_size":0},{"name":"notes","presence":false,"history_size":0},{"name":"progress","presence":false,"history_size":0},{"name":"notifications","presence":false,"history_size":0}]'
    ulimits:
      nofile: { soft: 65536, hard: 65536 }
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:8000/health"]
      interval: 5s
      timeout: 3s
      retries: 20
    networks: [cs-net]
```

Note differences from compose.prod.yml: `CENTRIFUGO_TOKEN_HMAC_SECRET` and `CENTRIFUGO_API_KEY` use `:?...` substitution to fail loudly if unset (operator's `.env` should have them; release context wants explicit failures, not silent empty strings).

- [ ] **Step 3: Validate compose.release.yml parses**

Run:
```bash
PUBLIC_BASE_URL=http://placeholder.local \
POSTGRES_PASSWORD=placeholder \
BETTER_AUTH_SECRET=placeholder \
CENTRIFUGO_API_KEY=placeholder \
CENTRIFUGO_TOKEN_HMAC_SECRET=placeholder \
COURSES_PATH=/tmp \
  docker compose -f docker/compose.release.yml config --quiet
```

Expected: exit 0.

- [ ] **Step 4: Confirm `:?` substitutions trigger when secrets are missing**

Run (deliberately missing `CENTRIFUGO_API_KEY`):
```bash
PUBLIC_BASE_URL=http://placeholder.local \
POSTGRES_PASSWORD=p \
BETTER_AUTH_SECRET=s \
CENTRIFUGO_TOKEN_HMAC_SECRET=h \
COURSES_PATH=/tmp \
  docker compose -f docker/compose.release.yml config --quiet 2>&1 | head -5
```

Expected: stderr contains `CENTRIFUGO_API_KEY is required` (exit code non-zero). Confirms operator-facing failure path is wired up.

- [ ] **Step 5: Commit**

```bash
git add docker/compose.release.yml
git commit -m "$(cat <<'EOF'
refactor(compose): centrifugo runs upstream image with env-only config in compose.release.yml

Mirror the change made in compose.prod.yml. The image-pulling release
variant now references centrifugo/centrifugo:v6 directly, with all
config (allowed_origins, hmac_secret, api_key, namespaces, etc.)
delivered via CENTRIFUGO_* env vars.

Refs T-2026-05-05-001.
EOF
)"
```

---

## Task 6: Migrate proxy service in `compose.release.yml`

**Files:**
- Modify: `docker/compose.release.yml` (proxy service block)

- [ ] **Step 1: Verify current proxy service block in compose.release.yml**

Run: `grep -A 14 "^  proxy:" docker/compose.release.yml`

Expected: block referencing `${REGISTRY:-ghcr.io}/${REGISTRY_NAMESPACE:-kkucherenkov}/courseshelf-proxy:${RELEASE_TAG:-latest}`.

- [ ] **Step 2: Replace proxy service block**

Edit `docker/compose.release.yml`. Replace the current proxy block with:

```yaml
  proxy:
    image: nginxinc/nginx-unprivileged:1.27-alpine
    restart: unless-stopped
    depends_on:
      backend: { condition: service_started }
      web: { condition: service_started }
    volumes:
      # Bind-mount the prod nginx config from the release bundle.
      # The release workflow stages compose.yml + nginx-prod.conf side
      # by side in STAGE/, so this relative path resolves whether you
      # run the rendered compose from the workflow or from an extracted
      # release bundle.
      - ./nginx-prod.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "${PROXY_PORT:-8080}:8080"
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://127.0.0.1:8080/api/v1/health"]
      interval: 10s
      timeout: 5s
      retries: 12
      start_period: 30s
    networks: [cs-net]
```

Note path differs from compose.prod.yml (`./nginx-prod.conf` vs `./nginx/prod.conf`). In release-bundle mode the compose file lives next to `nginx-prod.conf` directly in the bundle root.

- [ ] **Step 3: Validate compose.release.yml parses (without nginx-prod.conf yet — config-time only)**

Run:
```bash
PUBLIC_BASE_URL=http://placeholder.local \
POSTGRES_PASSWORD=placeholder \
BETTER_AUTH_SECRET=placeholder \
CENTRIFUGO_API_KEY=placeholder \
CENTRIFUGO_TOKEN_HMAC_SECRET=placeholder \
COURSES_PATH=/tmp \
  docker compose -f docker/compose.release.yml config --quiet
```

Expected: exit 0. Compose validates references syntactically; the bind-mount source file existence is checked at runtime, not at `config` time. Runtime check happens in Task 8.

- [ ] **Step 4: Commit**

```bash
git add docker/compose.release.yml
git commit -m "$(cat <<'EOF'
refactor(compose): proxy runs upstream nginx-unprivileged with bundle bind-mount in compose.release.yml

Mirror the compose.prod.yml change. Bind-mount target is
./nginx-prod.conf — the release workflow will stage that file
alongside compose.yml inside the bundle. compose.prod.yml uses
./nginx/prod.conf because its compose file lives one level above the
docker/ subdirectory, while the rendered release compose lives in
STAGE/ next to nginx-prod.conf directly.

Refs T-2026-05-05-001.
EOF
)"
```

---

## Task 7: Drop `courseshelf-proxy` and `courseshelf-centrifugo` from release.yml publish steps

**Files:**
- Modify: `.forgejo/workflows/release.yml` (publish call list)

- [ ] **Step 1: Verify current publish list**

Run: `grep -A 4 "publish courseshelf-backend" .forgejo/workflows/release.yml`

Expected (current state):
```bash
          publish courseshelf-backend     apps/backend/Dockerfile
          publish courseshelf-web         apps/web/Dockerfile
          publish courseshelf-proxy       docker/nginx/Dockerfile
          publish courseshelf-centrifugo  docker/centrifugo/Dockerfile
```

- [ ] **Step 2: Remove the two wrapper publish lines**

Edit `.forgejo/workflows/release.yml`. Find and remove these two lines from the "Build and push release images" step:

```diff
           publish courseshelf-backend     apps/backend/Dockerfile
           publish courseshelf-web         apps/web/Dockerfile
-          publish courseshelf-proxy       docker/nginx/Dockerfile
-          publish courseshelf-centrifugo  docker/centrifugo/Dockerfile
```

- [ ] **Step 3: Verify only two publish lines remain**

Run: `grep -E "^\s*publish " .forgejo/workflows/release.yml`

Expected output (only two lines):
```
          publish courseshelf-backend     apps/backend/Dockerfile
          publish courseshelf-web         apps/web/Dockerfile
```

- [ ] **Step 4: Update the workflow comment that references "four release images"**

The workflow header currently says:

```
#   2. Build the four release images:
#        courseshelf-backend, courseshelf-web, courseshelf-proxy, courseshelf-centrifugo
#      with `--build-arg APP_VERSION=<semver>` (the first two carry it; the
#      others ignore it).
```

Replace with:

```
#   2. Build the two release images:
#        courseshelf-backend, courseshelf-web
#      with `--build-arg APP_VERSION=<semver>`. The proxy and centrifugo
#      services in compose.release.yml run upstream images directly
#      (nginxinc/nginx-unprivileged and centrifugo/centrifugo:v6) and
#      need no per-release rebuilds.
```

Run to verify: `grep -B 1 -A 4 "release images" .forgejo/workflows/release.yml | head -10`

Expected: the new comment is in place; no remaining mentions of `courseshelf-proxy` or `courseshelf-centrifugo` in the workflow header.

- [ ] **Step 5: Commit**

```bash
git add .forgejo/workflows/release.yml
git commit -m "$(cat <<'EOF'
ci(release): drop publish of courseshelf-proxy and courseshelf-centrifugo

The release pipeline no longer rebuilds two thin docker wrappers on
every tag. compose.release.yml now references upstream
nginxinc/nginx-unprivileged:1.27-alpine and centrifugo/centrifugo:v6
directly. Two image builds + four image pushes per release tag are
removed; release wall-time drops by ~5 minutes.

Refs T-2026-05-05-001.
EOF
)"
```

---

## Task 8: Restructure render+bundle into a single STAGE step in release.yml

**Why:** With `compose.release.yml` referencing `./nginx-prod.conf`, the `docker compose config --quiet` validation needs that file adjacent to the compose. Currently render runs in repo root, then bundle copies into STAGE/ separately. We collapse into one staging step that prepares STAGE/, then validates from inside STAGE/.

**Files:**
- Modify: `.forgejo/workflows/release.yml` (the "Render compose-release file" step + the "Bundle release artefacts" step)

- [ ] **Step 1: Find the current "Render compose-release file" step and the "Bundle release artefacts" step**

Run:
```bash
grep -n "Render compose-release file\|Bundle release artefacts" .forgejo/workflows/release.yml
```

Expected: two line numbers — the start of the render step and the start of the bundle step.

- [ ] **Step 2: Read the existing rendered+validate logic and the bundle-staging logic**

Open `.forgejo/workflows/release.yml`. The current "Render compose-release file with pinned tag" step ends with `id: render`. The current "Bundle release artefacts" step starts with `mkdir -p "$STAGE"`.

Confirm these two steps are adjacent (modulo whitespace) by reading the file.

- [ ] **Step 3: Replace both steps with one combined staging-and-validate step**

Edit `.forgejo/workflows/release.yml`. Replace the "Render compose-release file with pinned tag" step AND the "Bundle release artefacts" step with this single step:

```yaml
      # ─── Stage release bundle (render + validate + assemble) ────────────
      # All bundle inputs land in STAGE/ before validation. Validating
      # from inside STAGE ensures relative paths in compose.yml — like
      # ./nginx-prod.conf — resolve at workflow time, not at operator
      # deploy time.
      - name: Stage release bundle
        env:
          SEMVER: ${{ steps.version.outputs.semver }}
          GHCR_USER: ${{ secrets.GHCR_USER }}
        run: |
          set -euo pipefail
          STAGE="courseshelf-release-v${SEMVER}"
          NS="$(echo "$GHCR_USER" | tr '[:upper:]' '[:lower:]')"
          mkdir -p "$STAGE"

          # Render compose with RELEASE_TAG / REGISTRY / REGISTRY_NAMESPACE pinned.
          sed \
            -e "s|\${RELEASE_TAG:-latest}|${SEMVER}|g" \
            -e "s|\${REGISTRY:-ghcr.io}|${REGISTRY}|g" \
            -e "s|\${REGISTRY_NAMESPACE:-kkucherenkov}|${NS}|g" \
            docker/compose.release.yml > "$STAGE/compose.yml"

          # nginx-prod.conf is bind-mounted by the proxy service. Stage it
          # next to compose.yml so the relative path ./nginx-prod.conf
          # resolves both during validation and at operator deploy time.
          cp docker/nginx/prod.conf "$STAGE/nginx-prod.conf"

          # Operator-facing artefacts.
          cp .env.release.example "$STAGE/.env.example"
          cp release-notes.md "$STAGE/CHANGELOG.md"
          cat > "$STAGE/README.md" <<EOF
          # CourseShelf $SEMVER — release bundle

          1. Copy \`.env.example\` to \`.env\` and fill in the secrets.
          2. \`docker compose --env-file .env -f compose.yml pull\`
          3. \`docker compose --env-file .env -f compose.yml up -d\`
          4. Browse to http://<your-host>:\${PROXY_PORT:-8080}

          See CHANGELOG.md for what changed in this release.
          EOF

          # Validate the rendered compose from inside STAGE so relative
          # paths (./nginx-prod.conf) resolve. compose interpolates ALL
          # \`\${VAR:?...}\` placeholders during validation, so we feed
          # dummy values — this only checks YAML/syntax + that referenced
          # files exist, not that any secret is real.
          ( cd "$STAGE" && \
            PUBLIC_BASE_URL=http://placeholder.local \
            POSTGRES_PASSWORD=placeholder \
            BETTER_AUTH_SECRET=placeholder \
            CENTRIFUGO_API_KEY=placeholder \
            CENTRIFUGO_TOKEN_HMAC_SECRET=placeholder \
            COURSES_PATH=/tmp \
              docker compose -f compose.yml config --quiet )

          # Standalone compose file uploaded as a release asset (also
          # available inside the tarball as compose.yml).
          cp "$STAGE/compose.yml" "compose-release-v${SEMVER}.yml"

          # Bundle the staged tree.
          tar czf "${STAGE}.tar.gz" "$STAGE"
          ls -la "${STAGE}.tar.gz" "compose-release-v${SEMVER}.yml"
```

- [ ] **Step 4: Verify the asset-upload step still finds the right files**

The "Create Forgejo release with assets" step at the end of the workflow uploads:
- `courseshelf-release-v${SEMVER}.tar.gz`
- `compose-release-v${SEMVER}.yml`
- `.env.release.example`
- `release-notes.md`

All four are still produced by the new combined step (the first two by `tar` and `cp`, the last two are the original files at repo root).

Run: `grep -A 10 "upload_asset" .forgejo/workflows/release.yml | head -20`

Expected: the four `upload_asset` calls reference the same filenames as before. No changes needed to the upload step.

- [ ] **Step 5: Verify there is no remaining reference to the old separate steps**

Run:
```bash
grep -E "name: Render compose-release file|name: Bundle release artefacts|id: render" .forgejo/workflows/release.yml
```

Expected: no matches. Both old step names and the `id: render` output handle are gone.

- [ ] **Step 6: Validate the workflow YAML is syntactically valid**

Run:
```bash
python3 -c "import yaml; yaml.safe_load(open('.forgejo/workflows/release.yml'))" && echo OK
```

Expected: `OK`. Any YAML error fails this step.

- [ ] **Step 7: Commit**

```bash
git add .forgejo/workflows/release.yml
git commit -m "$(cat <<'EOF'
ci(release): merge render+bundle into one stage step; validate compose from STAGE

The proxy service in compose.release.yml now bind-mounts
./nginx-prod.conf, so the docker-compose-config validation must see
that file at the relative path next to compose.yml. Stage all bundle
inputs (compose.yml, nginx-prod.conf, .env.example, CHANGELOG.md,
README.md) in STAGE/ first, then validate from inside STAGE.

The standalone compose-release-vX.Y.Z.yml release asset is still
produced — copied out of STAGE/compose.yml after validation so the
asset-upload step is unchanged.

Refs T-2026-05-05-001.
EOF
)"
```

---

## Task 9: Delete the four wrapper files

**Files:**
- Delete: `docker/centrifugo/Dockerfile`
- Delete: `docker/centrifugo/entrypoint.sh`
- Delete: `docker/centrifugo/config.template.json`
- Delete: `docker/nginx/Dockerfile`

- [ ] **Step 1: Confirm no other path references these files**

Run:
```bash
grep -rn "docker/centrifugo/Dockerfile\|docker/centrifugo/entrypoint\|docker/centrifugo/config.template\|docker/nginx/Dockerfile" \
  --include='*.yml' --include='*.yaml' --include='*.md' --include='*.sh' \
  --exclude-dir=node_modules --exclude-dir=.git \
  .
```

Expected: only matches inside `docs/superpowers/specs/2026-05-05-thin-docker-wrappers-removal-design.md` and `docs/superpowers/plans/2026-05-05-thin-docker-wrappers-removal.md` (this plan and its spec). If there are matches elsewhere — for example a forgotten reference in `docs/release.md` — handle them before continuing. Tasks 11 and 12 update the docs explicitly, so a single match in `docs/release.md` is acceptable here as long as that match describes what the removed file used to do (Task 11 will rewrite that section).

- [ ] **Step 2: Delete the four files**

Run:
```bash
git rm \
  docker/centrifugo/Dockerfile \
  docker/centrifugo/entrypoint.sh \
  docker/centrifugo/config.template.json \
  docker/nginx/Dockerfile
```

Expected: all four files removed; `git status` shows them as deleted in the index.

- [ ] **Step 3: Confirm `docker/centrifugo/` and `docker/nginx/` still exist**

Run: `ls docker/centrifugo/ docker/nginx/`

Expected:
- `docker/centrifugo/`: `config.json` (dev bind-mount target).
- `docker/nginx/`: `default.conf` (dev), `prod.conf` (prod, source for bundle staging).

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
chore(docker): remove centrifugo + nginx wrapper Dockerfiles and entrypoints

The compose files now reference upstream centrifugo/centrifugo:v6 and
nginxinc/nginx-unprivileged:1.27-alpine directly. The wrapper images
(courseshelf-centrifugo, courseshelf-proxy) are no longer built, so
their source files are dead code:

- docker/centrifugo/Dockerfile
- docker/centrifugo/entrypoint.sh
- docker/centrifugo/config.template.json
- docker/nginx/Dockerfile

Preserved: docker/centrifugo/config.json (dev bind-mount),
docker/nginx/{default.conf, prod.conf} (dev + prod bind-mounts).

Refs T-2026-05-05-001.
EOF
)"
```

---

## Task 10: Update `.env.release.example` (drop unused comment, document namespace placement)

**Files:**
- Modify: `.env.release.example`

- [ ] **Step 1: Verify the unused `CENTRIFUGO_ALLOWED_ORIGINS` block**

Run: `grep -B 2 -A 2 "CENTRIFUGO_ALLOWED_ORIGINS" .env.release.example`

Expected (current state):
```
# JSON-array of allowed browser origins. Defaults to `["${PUBLIC_BASE_URL}"]`
# when unset; override only if you serve the SPA from multiple origins.
# CENTRIFUGO_ALLOWED_ORIGINS=["https://courseshelf.example.com"]
```

- [ ] **Step 2: Replace the `CENTRIFUGO_ALLOWED_ORIGINS` block**

Edit `.env.release.example`. Replace the three lines above with:

```
# Centrifugo's allowed browser origins are derived from PUBLIC_BASE_URL
# automatically (compose maps it into CENTRIFUGO_CLIENT_ALLOWED_ORIGINS).
# If you serve the SPA from multiple origins, edit the centrifugo
# service's environment block in compose.yml directly.
#
# Channel namespaces (`system`, `library`, `notes`, `progress`,
# `notifications`) are part of the application contract and live in
# compose.yml — they are NOT operator-tunable from this env file.
```

- [ ] **Step 3: Verify the file still parses as a valid env file**

Run: `set -a; . ./.env.release.example; set +a; echo "PUBLIC_BASE_URL=$PUBLIC_BASE_URL"`

Expected: `PUBLIC_BASE_URL=http://localhost:8080` (no parse error from the new comments).

- [ ] **Step 4: Commit**

```bash
git add .env.release.example
git commit -m "$(cat <<'EOF'
docs(env): clarify centrifugo origin/namespace handling in .env.release.example

CENTRIFUGO_ALLOWED_ORIGINS is no longer a tunable: compose maps
PUBLIC_BASE_URL to CENTRIFUGO_CLIENT_ALLOWED_ORIGINS. Namespaces are
part of the application contract and live in compose.yml. Update the
inline guidance accordingly.

Refs T-2026-05-05-001.
EOF
)"
```

---

## Task 11: Update `docs/release.md` (image table + bundle layout + UPGRADE NOTE)

**Files:**
- Modify: `docs/release.md`

- [ ] **Step 1: Update the "Images on GHCR" table**

Edit `docs/release.md`. Find the section "What gets published" → "Images on GHCR" → the four-row table, and replace it with:

```markdown
For every release tag, two images are pushed under four tags each:

| Image                                | Source                    |
| ------------------------------------ | ------------------------- |
| `ghcr.io/<user>/courseshelf-backend` | `apps/backend/Dockerfile` |
| `ghcr.io/<user>/courseshelf-web`     | `apps/web/Dockerfile`     |

Each image is tagged `:0.2.0`, `:0.2`, `:0`, and `:latest` — pin to the
exact patch in production, use the floating tags for dev/staging if you
want to follow a major or minor lane.

The proxy and centrifugo services in `compose.release.yml` run upstream
images directly (`nginxinc/nginx-unprivileged:1.27-alpine` and
`centrifugo/centrifugo:v6`) and are not part of the release-pipeline
artefacts. They are pulled by `docker compose pull` like any other
upstream image.
```

- [ ] **Step 2: Update the workflow-overview paragraph in the file header**

Find the opening paragraph of `docs/release.md` that reads:

```
Pushing a tag matching `vMAJOR.MINOR.PATCH-release` triggers
`.forgejo/workflows/release.yml`. The workflow builds and pushes four
release images (backend, web, proxy, centrifugo) to **GitHub Container
Registry** (ghcr.io), generates a Conventional-Commits-derived
changelog, and creates a **Forgejo Release** (on `code.homelab.local`)
with the changelog and a deploy-ready artefact bundle.
```

Replace with:

```
Pushing a tag matching `vMAJOR.MINOR.PATCH-release` triggers
`.forgejo/workflows/release.yml`. The workflow builds and pushes two
release images (backend, web) to **GitHub Container Registry**
(ghcr.io), generates a Conventional-Commits-derived changelog, and
creates a **Forgejo Release** (on `code.homelab.local`) with the
changelog and a deploy-ready artefact bundle. The proxy and centrifugo
services run upstream images directly and are not built by this
pipeline.
```

- [ ] **Step 3: Update the bundle-contents section**

Find the section "Release page on Forgejo" → the bullet starting with `courseshelf-release-vX.Y.Z.tar.gz`. Update the description:

```diff
-- `courseshelf-release-v0.2.0.tar.gz` — bundle with `compose.yml`,
-  `.env.example`, `CHANGELOG.md`, and a one-page README.
+- `courseshelf-release-v0.2.0.tar.gz` — bundle with `compose.yml`,
+  `nginx-prod.conf` (bind-mounted by the proxy service), `.env.example`,
+  `CHANGELOG.md`, and a one-page README.
```

- [ ] **Step 4: Add an UPGRADE NOTE section**

After the "What gets published" section and before "Re-running a failed release", add:

```markdown
## Upgrade note for the release that drops wrapper images

The release that introduces this change removes two images from GHCR:

- `ghcr.io/<user>/courseshelf-proxy`
- `ghcr.io/<user>/courseshelf-centrifugo`

Operators upgrading across this version must extract the new bundle
**fully** — `compose.yml` now bind-mounts `nginx-prod.conf` from the
bundle, so `tar xzf courseshelf-release-vX.Y.Z.tar.gz` is mandatory. A
partial extraction (or copying just `compose.yml` out of the tarball)
will fail at proxy start with `no such file or directory`.

Existing GHCR packages for the two retired images can be left in place
or deleted via the package settings page. They will not be referenced
by any future release.
```

- [ ] **Step 5: Verify the file renders coherently**

Run: `head -120 docs/release.md`

Expected: opening paragraph mentions two images; "Images on GHCR" table has two rows; the wrapper-removal upgrade note is present.

- [ ] **Step 6: Commit**

```bash
git add docs/release.md
git commit -m "$(cat <<'EOF'
docs(release): drop wrapper images from runbook; add upgrade note

The release pipeline now publishes only courseshelf-backend and
courseshelf-web. The proxy and centrifugo services in
compose.release.yml run upstream images directly. Update the image
table, the workflow overview, and the bundle-contents section.

Add an upgrade note for operators crossing this version: nginx-prod.conf
is now bind-mounted from the bundle, so the tarball MUST be fully
extracted (not just compose.yml).

Refs T-2026-05-05-001.
EOF
)"
```

---

## Task 12: Update `docs/deployment.md` (bundle layout note)

**Files:**
- Modify: `docs/deployment.md`

- [ ] **Step 1: Find the "Path 1 — pull a tagged release" section**

Run: `grep -n "Path 1" docs/deployment.md`

Expected: a single line number for the section header.

- [ ] **Step 2: Augment the extraction snippet with a note about `nginx-prod.conf`**

Edit `docs/deployment.md`. Find the snippet:

```sh
curl -LO http://code.homelab.local/<owner>/course_shelf/releases/download/vX.Y.Z-release/courseshelf-release-vX.Y.Z.tar.gz
tar xzf courseshelf-release-vX.Y.Z.tar.gz
cd courseshelf-release-vX.Y.Z

cp .env.example .env
$EDITOR .env    # fill in the secrets

docker compose --env-file .env -f compose.yml pull
docker compose --env-file .env -f compose.yml up -d
```

After the `tar xzf` line, add a comment line:

```diff
 curl -LO http://code.homelab.local/<owner>/course_shelf/releases/download/vX.Y.Z-release/courseshelf-release-vX.Y.Z.tar.gz
 tar xzf courseshelf-release-vX.Y.Z.tar.gz
+# The bundle contains compose.yml + nginx-prod.conf (bind-mounted by the
+# proxy service) + .env.example + CHANGELOG.md + README.md. Don't move
+# compose.yml out of the directory — the bind-mount uses ./nginx-prod.conf.
 cd courseshelf-release-vX.Y.Z
```

- [ ] **Step 3: Update the architecture diagram blurb (if it mentions wrappers)**

Run: `grep -n "courseshelf-proxy\|courseshelf-centrifugo" docs/deployment.md`

Expected: no matches. If matches exist (the existing file has none beyond the diagram, which uses generic names), update them to use upstream image names. (The current diagram uses `nginx reverse proxy` and `centrifugo` — already generic. No edit needed.)

- [ ] **Step 4: Verify the file renders coherently**

Run: `head -60 docs/deployment.md`

Expected: Path 1 instructions read cleanly; the new note about not moving `compose.yml` is in place.

- [ ] **Step 5: Commit**

```bash
git add docs/deployment.md
git commit -m "$(cat <<'EOF'
docs(deployment): note nginx-prod.conf bind-mount in release extraction

Add an inline comment in the Path 1 extraction snippet warning
operators not to move compose.yml out of the extracted directory —
the proxy service bind-mounts ./nginx-prod.conf from beside the
compose file.

Refs T-2026-05-05-001.
EOF
)"
```

---

## Task 13: Tick off all sub-steps in `specs/tasks/active.md`

**Files:**
- Modify: `specs/tasks/active.md`

- [ ] **Step 1: Tick all five sub-step checkboxes**

Edit `specs/tasks/active.md`. Find the T-2026-05-05-001 entry and flip all `- [ ]` to `- [x]` in its sub-steps list:

```diff
   - Sub-steps:
-    - [ ] Phase 1 — centrifugo wrapper removal (compose.prod.yml + compose.release.yml: image + full `CENTRIFUGO_*` env set; smoke-test locally)
-    - [ ] Phase 2 — proxy wrapper removal (compose.{prod,release}.yml: image + `nginx-prod.conf` bind-mount; smoke-test locally)
-    - [ ] Phase 3 — release.yml cleanup (drop two `publish` calls; merge render+bundle steps; cp `nginx-prod.conf` into STAGE; validate from STAGE)
-    - [ ] Phase 3 — delete `docker/centrifugo/{Dockerfile, entrypoint.sh, config.template.json}` and `docker/nginx/Dockerfile`
-    - [ ] Phase 4 — update `docs/release.md` + `docs/deployment.md`; add UPGRADE NOTE
+    - [x] Phase 1 — centrifugo wrapper removal (compose.prod.yml + compose.release.yml: image + full `CENTRIFUGO_*` env set; smoke-test locally)
+    - [x] Phase 2 — proxy wrapper removal (compose.{prod,release}.yml: image + `nginx-prod.conf` bind-mount; smoke-test locally)
+    - [x] Phase 3 — release.yml cleanup (drop two `publish` calls; merge render+bundle steps; cp `nginx-prod.conf` into STAGE; validate from STAGE)
+    - [x] Phase 3 — delete `docker/centrifugo/{Dockerfile, entrypoint.sh, config.template.json}` and `docker/nginx/Dockerfile`
+    - [x] Phase 4 — update `docs/release.md` + `docs/deployment.md`; add UPGRADE NOTE
```

- [ ] **Step 2: Leave Status as `in-progress` until the PR merges**

Per `.claude/CLAUDE.md` Task stack rule 3, the entry stays in `active.md` with `Status: in-progress` until shipped. Move-to-`done.md` happens **after** the PR merges, not at PR-open time.

- [ ] **Step 3: Commit**

```bash
git add specs/tasks/active.md
git commit -m "$(cat <<'EOF'
chore(tasks): tick T-2026-05-05-001 sub-steps as the PR is ready

All implementation phases complete. Entry stays in active.md with
status in-progress until the PR merges, per the task-stack rules.

Refs T-2026-05-05-001.
EOF
)"
```

---

## Task 14: Open the PR

**Files:** None modified — PR-open step.

- [ ] **Step 1: Push the branch**

Assuming work happened on a feature branch (per `.claude/CLAUDE.md` "PRs go through main — never push directly"):

Run:
```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Pushing branch: $BRANCH"
git push -u origin "$BRANCH"
```

Expected: branch pushed; tracking set up.

If the work happened directly on `main` by mistake, **stop and create a feature branch**: `git checkout -b chore/remove-thin-docker-wrappers`, then `git push -u origin chore/remove-thin-docker-wrappers`.

- [ ] **Step 2: Look up the Forgejo issue number for this card**

The roadmap card may not exist in Forgejo (this is an opportunistic refactor, not from `docs/roadmap/tasks/`). If there's no matching card, skip the `Closes #N` line. Otherwise:

```bash
pnpm issues:lookup -- E22-F01-S06 2>/dev/null || echo "no card mapping"
```

Expected: a number like `109` (the existing release-pipeline card) or `no card mapping`. If there is no card for this specific refactor, omit the `Closes` line in the PR body.

- [ ] **Step 3: Open the PR via gh / forgejo**

This repo uses Forgejo, not GitHub. Use `tea` (Forgejo CLI) if installed, or open in browser. With `tea`:

```bash
tea pulls create --title "refactor(docker): remove thin wrappers (proxy + centrifugo)" \
  --description "$(cat <<'EOF'
## Summary

Drop `courseshelf-proxy` and `courseshelf-centrifugo` from the release
pipeline. `compose.{prod,release}.yml` now reference upstream
`nginxinc/nginx-unprivileged:1.27-alpine` and `centrifugo/centrifugo:v6`
directly. The proxy bind-mounts `nginx-prod.conf` from the release
bundle; centrifugo's full configuration moves to `CENTRIFUGO_*` env
vars (v6 native).

- Spec: [`docs/superpowers/specs/2026-05-05-thin-docker-wrappers-removal-design.md`](docs/superpowers/specs/2026-05-05-thin-docker-wrappers-removal-design.md)
- Plan: [`docs/superpowers/plans/2026-05-05-thin-docker-wrappers-removal.md`](docs/superpowers/plans/2026-05-05-thin-docker-wrappers-removal.md)

## What changes

- `docker/compose.prod.yml`, `docker/compose.release.yml` — `centrifugo` and `proxy` services switch to upstream images.
- `.forgejo/workflows/release.yml` — drops two `publish` calls; merges `render` + `bundle` into one `STAGE` step that validates the rendered compose with `nginx-prod.conf` adjacent.
- Deleted: `docker/centrifugo/{Dockerfile, entrypoint.sh, config.template.json}`, `docker/nginx/Dockerfile`.
- Docs: `docs/release.md` (image table from 4 → 2 rows + UPGRADE NOTE), `docs/deployment.md` (bundle-extraction note), `.env.release.example` (centrifugo origin/namespace clarification).

## Why

- Two `docker build` + `docker push` steps drop from the release pipeline → ~5 min wall-time saved per release.
- Surface area shrinks: 4 fewer files in `docker/`.
- Dev compose (`docker/compose.yml`) already used upstream images with bind-mounts. Production now matches the same pattern.

## Test plan

- [x] Centrifugo upstream image smoke-tested with the exact env set (Task 1)
- [x] `docker compose -f docker/compose.prod.yml config --quiet` passes
- [x] `docker compose -f docker/compose.release.yml config --quiet` passes
- [x] Local `compose.prod.yml up -d --build` reaches all-healthy; routes through proxy work (Task 4)
- [x] Workflow YAML parses (`yaml.safe_load`)
- [ ] Forgejo CI green on this PR
- [ ] Post-merge: cut a smoke release tag (`v0.0.0-smoketest-release` or similar) and verify the new pipeline produces a working bundle

## Upgrade note

Operators upgrading across this version must extract the bundle fully: `compose.yml` now bind-mounts `./nginx-prod.conf`, so `tar xzf` is mandatory. The two retired GHCR packages (`courseshelf-proxy`, `courseshelf-centrifugo`) can be left in place or deleted via the package settings page.
EOF
)"
```

If `tea` is not installed, open the PR via the Forgejo web UI at `http://code.homelab.local/<owner>/course_shelf/compare/main...$BRANCH` and paste the same body.

- [ ] **Step 4: After PR merges, move T-2026-05-05-001 from active.md to done.md**

This step happens **after** review + merge, not at PR-open time. When the PR is merged:

1. Edit `specs/tasks/active.md` — remove the T-2026-05-05-001 block.
2. Edit `specs/tasks/done.md` — paste the block at the top with two extra lines:
   ```
   - Completed: 2026-MM-DD
   - Result: <PR link>
   ```
3. Commit:
   ```bash
   git add specs/tasks/active.md specs/tasks/done.md
   git commit -m "chore(tasks): T-2026-05-05-001 shipped"
   git push
   ```

---

## Self-review notes

**Spec coverage:**
- Centrifugo env-only config → Tasks 2, 5
- Proxy bind-mount → Tasks 3, 6
- Release workflow drops publish → Task 7
- Render+bundle restructured → Task 8
- Wrapper files deleted → Task 9
- `compose.prod.yml` mirroring → Tasks 2, 3
- Bundle layout (5 files) → Task 8 (workflow), Tasks 11–12 (docs)
- `docs/release.md` updated → Task 11
- `docs/deployment.md` updated → Task 12
- UPGRADE NOTE → Task 11
- Single PR strategy → Task 14
- Risks R1 (centrifugo env) → Task 1 mitigation
- Risk R2 (./nginx-prod.conf path) → Task 8 (validate from STAGE)
- Risk R3 (operator upgrade) → Task 11 (UPGRADE NOTE)

**Type/name consistency check:**
- Centrifugo env names used identically in Tasks 2 and 5: `CENTRIFUGO_CLIENT_ALLOWED_ORIGINS`, `CENTRIFUGO_CLIENT_TOKEN_HMAC_SECRET_KEY`, `CENTRIFUGO_HTTP_API_KEY`, `CENTRIFUGO_ADMIN_ENABLED`, `CENTRIFUGO_HEALTH_ENABLED`, `CENTRIFUGO_LOG_LEVEL`, `CENTRIFUGO_CHANNEL_NAMESPACES`. ✓
- The JSON-string for `CENTRIFUGO_CHANNEL_NAMESPACES` is identical between Tasks 1, 2, 5. ✓
- Bind-mount paths intentionally differ: `./nginx/prod.conf` in compose.prod.yml (Task 3) vs `./nginx-prod.conf` in compose.release.yml (Task 6). Reason documented in Task 6 Step 2.
- Image references identical: `centrifugo/centrifugo:v6`, `nginxinc/nginx-unprivileged:1.27-alpine`. ✓

**Placeholder scan:** None remaining. All commands, code blocks, and commit messages are concrete.
