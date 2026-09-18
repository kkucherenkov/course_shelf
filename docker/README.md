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

## Volumes and transcription

The backend reads course media and writes artefacts it generates from that
media. The two never share a mount — in `compose.prod.yml` and
`compose.release.yml` the course mount is `:ro`, so generated files need a
writable root of their own.

| Variable            | Default (dev) | Mounted at      | Mode | What it holds                                    |
| ------------------- | ------------- | --------------- | ---- | ------------------------------------------------ |
| `COURSES_PATH`      | — (prod only) | `/data/courses` | ro   | Your course library                              |
| `DERIVED_PATH`      | `../derived`  | `/data/derived` | rw   | Whisper transcripts, later scan thumbnails       |
| `WHISPER_MODEL_DIR` | `../models`   | `/models`       | ro   | ggml whisper models — never baked into the image |

`LIBRARY_ROOT_ALLOWLIST` (comma-separated absolute path prefixes) restricts
which `rootPath` an admin can register a library under — `POST /libraries`
422s a path outside it. `compose.prod.yml` / `compose.release.yml` default it
to `/data/courses`, the same directory `COURSES_PATH` is mounted at. Unset
(the default here in dev), every absolute path is accepted, since dev has no
single fixed course mount to anchor the check to.

`DERIVED_PATH` is required in `compose.prod.yml` / `compose.release.yml` and
defaults to `<repo>/derived` in dev (gitignored). Docker creates a missing
host directory for either bind, so the model mount is inert until you use it.

Both backend images ship a **pinned whisper.cpp** build (`whisper-cli` on
`PATH`, `WHISPER_CPP_VERSION` build arg, currently `v1.9.3`). The model is not
in the image: `ggml-medium` is ~1.5 GB and has no business in a registry push.

Transcription stays **off** until the file named by `WHISPER_MODEL_PATH`
actually exists on disk — `AppConfig.transcription.configured` now stats it,
so a path alone is not enough. Empty or missing, it is `false` and the run
endpoint refuses instead of starting a run that can only fail:

```sh
pnpm whisper:model                # fetches ggml-base.bin into ./models
docker compose -f docker/compose.yml up -d backend
```

`compose.yml` already points `WHISPER_MODEL_PATH` at `/models/ggml-base.bin`
by default, so the file landing is what switches transcription on. Pass a
size — `pnpm whisper:model tiny|small|medium|large-v3` — for a different
model; the script is idempotent, exiting without touching the network if the
file is already there.

`WHISPER_MODE=mock` swaps `LocalWhisperAdapter` for a fixture that writes a
deterministic SRT with no child process and no model file — used by
`compose.ci.yml`, never here.

`WHISPER_THREADS` (default `4`) and `WHISPER_LANGUAGE` (default `auto`) are
passed through too; `WHISPER_TIMEOUT_MS` (default six hours) is read straight
from the environment by `AppConfig`.

## Services

| Service    | Image                         | Default port | Variable             | Notes                                                                 |
| ---------- | ----------------------------- | ------------ | -------------------- | --------------------------------------------------------------------- |
| postgres   | `postgres:18.1-alpine`        | 5432         | `CS_POSTGRES_PORT`   | PGDATA is `/var/lib/postgresql/18/docker` (Postgres 18 layout)        |
| centrifugo | `centrifugo/centrifugo:v6`    | 8000         | `CS_CENTRIFUGO_PORT` | HMAC secret + API key from `centrifugo/config.json`, in-memory engine |
| backend    | `apps/backend/Dockerfile.dev` | 3000         | `CS_BACKEND_PORT`    | Mounts repo, runs `nest start --watch`                                |
| web        | `apps/web/Dockerfile.dev`     | 3001         | `CS_WEB_PORT`        | Mounts repo, runs `nuxt dev`                                          |
| proxy      | `nginx:1.27-alpine`           | 8080         | `CS_PROXY_PORT`      | Single origin for the browser — web + backend behind one host         |
| storybook  | `packages/ui/Dockerfile.dev`  | 6006         | `CS_STORYBOOK_PORT`  | Mounts repo, runs `storybook dev --host 0.0.0.0`                      |

After `pnpm dev:up`, point your browser at:

- Web SPA (through the proxy, the canonical origin) — http://localhost:8080
- Backend API — http://localhost:3000/api/v1/health
- Web SPA direct (bypasses the proxy) — http://localhost:3001
- Storybook — http://localhost:6006

Those are the defaults; substitute your own ports if you overrode them.

## Customising for your project

1. Set `COMPOSE_PROJECT_NAME` in `docker/.env` (e.g. `myapp`) — nothing in
   `compose.yml` needs hand-editing.
2. Update `centrifugo/config.json` with your channel namespaces.
3. Change `BETTER_AUTH_SECRET` and other secrets before deploying.
