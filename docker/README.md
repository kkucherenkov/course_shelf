# docker/

Local dev stack. One command to bring it all up from the repo root:

```sh
pnpm dev:up      # docker compose -f docker/compose.yml up -d --build
pnpm dev:logs    # tail combined logs
pnpm dev:ps      # show running services + health
pnpm dev:down    # stop + remove
```

Or call docker compose directly:

```sh
docker compose -f docker/compose.yml up -d
```

`compose.yml` is the base; `compose.override.yml` is picked up automatically.

## Ports and project name

Every published host port and the project name are environment variables with
the defaults in the table below, so a second worktree can run its own stack
side by side and a host process already holding `:3000` does not block the
first one. Compose reads `docker/.env` (gitignored), or take them from the
shell:

```sh
COMPOSE_PROJECT_NAME=cs-wt2 CS_BACKEND_PORT=3100 CS_WEB_PORT=3101 CS_PROXY_PORT=8180 \
  docker compose -f docker/compose.yml up -d
```

`BETTER_AUTH_URL`, `CORS_ORIGINS` and the two `NUXT_PUBLIC_*` URLs are derived
from the same variables, so moving a port does not silently break auth or CORS.
The centrifugo image tag is namespaced by `COMPOSE_PROJECT_NAME` too — two
worktrees building at once would otherwise fight over one tag.

## Services

| Service    | Image                         | Default port | Variable             | Notes                                                                |
| ---------- | ----------------------------- | ------------ | -------------------- | -------------------------------------------------------------------- |
| postgres   | `postgres:18.1-alpine`        | 5432         | `CS_POSTGRES_PORT`   | PGDATA is `/var/lib/postgresql/18/docker` (Postgres 18 layout)       |
| redis      | `redis:8.6-alpine`            | 6379         | `CS_REDIS_PORT`      | `--appendonly yes`                                                   |
| centrifugo | `centrifugo/centrifugo:v6`    | 8000         | `CS_CENTRIFUGO_PORT` | HMAC secret + API key from `centrifugo/config.json`                  |
| otel-lgtm  | `grafana/otel-lgtm:0.8.1`     | 3200         | `CS_GRAFANA_PORT`    | Grafana UI; OTLP gRPC `CS_OTLP_GRPC_PORT` / HTTP `CS_OTLP_HTTP_PORT` |
| backend    | `apps/backend/Dockerfile.dev` | 3000         | `CS_BACKEND_PORT`    | Mounts repo, runs `nest start --watch`                               |
| web        | `apps/web/Dockerfile.dev`     | 3001         | `CS_WEB_PORT`        | Mounts repo, runs `nuxt dev`                                         |
| proxy      | `nginx:1.27-alpine`           | 8080         | `CS_PROXY_PORT`      | Single origin for the browser — web + backend behind one host        |
| storybook  | `packages/ui/Dockerfile.dev`  | 6006         | `CS_STORYBOOK_PORT`  | Mounts repo, runs `storybook dev --host 0.0.0.0`                     |

After `pnpm dev:up`, point your browser at:

- Web SPA (through the proxy, the canonical origin) — http://localhost:8080
- Backend API — http://localhost:3000/api/v1/health
- Web SPA direct (bypasses the proxy) — http://localhost:3001
- Storybook — http://localhost:6006
- Grafana (OTel) — http://localhost:3200

Those are the defaults; substitute your own ports if you overrode them.

## Customising for your project

1. Set `COMPOSE_PROJECT_NAME` in `docker/.env` (e.g. `myapp`) — nothing in
   `compose.yml` needs hand-editing.
2. Update `centrifugo/config.json` with your channel namespaces.
3. Change `BETTER_AUTH_SECRET` and other secrets before deploying.
