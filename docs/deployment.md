# Self-hosted deployment

This guide covers the **production deployment path** — building the bundled
Docker images, wiring them up with `docker/compose.prod.yml`, and pointing the
backend at a host directory full of course folders.

For the dev stack (where the repo is mounted read-write into the containers
and watch-mode rebuilds on save) see `docker/compose.yml` and the local-dev
table in `.claude/CLAUDE.md`.

## Architecture

```
                                ┌─────────────────────────────┐
                                │         host:PROXY_PORT     │
                                │      (nginx reverse proxy)  │
                                └──────────┬──────────────────┘
                                           │
                       ┌───────────────────┼───────────────────────┐
                       │                   │                       │
                       ▼                   ▼                       │
              ┌────────────────┐   ┌─────────────────┐             │
              │      web       │   │     backend     │             │
              │ (nginx + SPA)  │   │ (NestJS + node) │             │
              └────────────────┘   └────────┬────────┘             │
                                            │                      │
                                            ▼                      │
                              ┌──────────────────────────┐         │
                              │   $COURSES_PATH (RO)     │ ◀───────┘
                              │   /data/courses inside   │   bind-mount
                              │   the backend container  │
                              └──────────────────────────┘
                                            │
                       ┌────────────────────┼─────────────────────┐
                       │                    │                     │
                       ▼                    ▼                     ▼
                  postgres              redis              centrifugo
              (named volume)       (named volume)
```

## Quick start

```sh
git clone …            # whatever your origin is
cd courseShelf
cp .env.production.example .env.production
$EDITOR .env.production    # fill in the marked secrets

docker compose \
  --env-file .env.production \
  -f docker/compose.prod.yml \
  up -d --build
```

Browse to `http://<your-host>:${PROXY_PORT}` (default `:8080`).

## Required environment

`compose.prod.yml` fails fast if any of these are missing — there's no silent
default for secrets. Generate them with `openssl rand -hex 32` unless noted.

| Variable                       | Why                                                     |
|--------------------------------|---------------------------------------------------------|
| `PUBLIC_BASE_URL`              | The single origin browsers hit (proxy URL).             |
| `PROXY_PORT`                   | Host port for the nginx proxy (default `8080`).         |
| `COURSES_PATH`                 | Host directory holding your course folders, mounted RO. |
| `POSTGRES_PASSWORD`            | Postgres superuser password.                            |
| `BETTER_AUTH_SECRET`           | Session signing key.                                    |
| `CENTRIFUGO_API_KEY`           | Backend → Centrifugo publishing key.                    |
| `CENTRIFUGO_TOKEN_HMAC_SECRET` | Centrifugo client-token signing key.                    |

Optional toggles (sensible defaults shipped):

- `AUTH_SELF_REGISTRATION=false` — when `true`, the SPA exposes `/sign-up`.
  When `false`, only existing admins can add users from the Users page.
- `CENTRIFUGO_TOKEN_TTL_SECONDS=300`
- `POSTGRES_DB=courseshelf` / `POSTGRES_USER=courseshelf`

## Course data layout

Point `COURSES_PATH` at any host directory. The backend mounts it
**read-only** at `/data/courses`. Inside that mount, drop one folder per
library:

```
$COURSES_PATH/
├── computer-science/
│   ├── 01-intro/
│   │   ├── 01-welcome.mp4
│   │   └── 02-setup.mp4
│   └── …
└── design/
    └── …
```

After the stack is up, sign in as the first admin and register libraries
pointing at `/data/courses/computer-science`, `/data/courses/design`, etc.
The scanner walks each library, persists Course/Section/Lesson/Material
rows, and the SPA picks them up.

To swap content: stop the stack, change `COURSES_PATH`, restart. No
image rebuild needed.

## Per-deployment URL

The SPA is built **once** (in the `apps/web/Dockerfile` build stage) and
configured per-deployment via `/_app-config.js` — a tiny script the web
container generates at boot from `APP_API_BASE_URL` / `APP_AUTH_BASE_URL`.
Both are derived from `PUBLIC_BASE_URL` in `compose.prod.yml`:

```yaml
APP_API_BASE_URL:  ${PUBLIC_BASE_URL}/api/v1
APP_AUTH_BASE_URL: ${PUBLIC_BASE_URL}
```

Change `PUBLIC_BASE_URL` and run `docker compose … up -d` — the web
container regenerates its config script on the next start; no rebuild.

## Database migrations

`prisma migrate deploy` runs in the backend container's entrypoint
**before** the Nest app starts (`apps/backend/Dockerfile:CMD`). On a
fresh stack the schema is created on first boot; on upgrades, any new
migrations under `apps/backend/prisma/migrations/` apply automatically
when you redeploy.

Backups: snapshot the `pgdata` named volume (`docker compose -f
docker/compose.prod.yml exec postgres pg_dump -Fc -U courseshelf >
backup.dump`).

## Upgrading

1. `git pull` the new release.
2. `docker compose --env-file .env.production -f docker/compose.prod.yml build`.
3. `docker compose --env-file .env.production -f docker/compose.prod.yml up -d`.

The first user request after the backend container restarts will block
briefly while migrations apply.

## Troubleshooting

**"relation does not exist" 500s right after upgrade.** A migration is
still running. Wait ~10s; the backend healthcheck will flip back to
healthy once `migrate deploy` finishes and `node dist/main.js` boots.

**SPA loads but every API call 404s.** Check `/_app-config.js` is
served by the web container with the right `apiBaseUrl`. Most often
`PUBLIC_BASE_URL` doesn't match how the user is reaching the proxy
(e.g. set to `http://localhost:8080` but accessed via
`http://192.168.1.10:8080`). Update `PUBLIC_BASE_URL` and `up -d` again.

**`Cross-Origin-Resource-Policy` errors on `<video>`.** Should not happen
in this deployment — everything goes through the proxy on a single
origin. If it does, you're hitting the backend directly (port 3000 is
not published in `compose.prod.yml`); browse via the proxy URL.
