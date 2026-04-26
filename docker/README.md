# docker/

Local dev stack. Launch from the repo root:

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
| backend    | `apps/backend/Dockerfile.dev` | 3000 | Mounts repo, runs `nest start --watch`                         |
| web        | `apps/web/Dockerfile.dev`     | 3001 | Mounts repo, runs `nuxt dev`                                   |

## Customising for your project

1. Replace `course-shelf` in `compose.yml` with your project name (e.g. `myapp`).
2. Update `centrifugo/config.json` with your channel namespaces.
3. Change `BETTER_AUTH_SECRET` and other secrets before deploying.
