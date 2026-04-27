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

`compose.yml` is the base; `compose.override.yml` is picked up automatically. Replace `course-shelf` in `compose.yml` with your actual project slug before first run.

## Services

| Service    | Image                         | Port | Notes                                                          |
| ---------- | ----------------------------- | ---- | -------------------------------------------------------------- |
| postgres   | `postgres:18.1-alpine`        | 5432 | PGDATA is `/var/lib/postgresql/18/docker` (Postgres 18 layout) |
| redis      | `redis:8.6-alpine`            | 6379 | `--appendonly yes`                                             |
| centrifugo | `centrifugo/centrifugo:v6`    | 8000 | HMAC secret + API key from `centrifugo/config.json`            |
| otel-lgtm  | `grafana/otel-lgtm:0.8.1`     | 3200 | Grafana UI + OTLP gRPC :4317 / HTTP :4318                      |
| backend    | `apps/backend/Dockerfile.dev` | 3000 | Mounts repo, runs `nest start --watch`                         |
| web        | `apps/web/Dockerfile.dev`     | 3001 | Mounts repo, runs `nuxt dev`                                   |
| storybook  | `packages/ui/Dockerfile.dev`  | 6006 | Mounts repo, runs `storybook dev --host 0.0.0.0`               |

After `pnpm dev:up`, point your browser at:

- Backend API — http://localhost:3000/api/v1/health
- Web SPA — http://localhost:3001
- Storybook — http://localhost:6006
- Grafana (OTel) — http://localhost:3200

## Customising for your project

1. Replace `course-shelf` in `compose.yml` with your project name (e.g. `myapp`).
2. Update `centrifugo/config.json` with your channel namespaces.
3. Change `BETTER_AUTH_SECRET` and other secrets before deploying.
