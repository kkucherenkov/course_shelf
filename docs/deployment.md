# Self-hosted deployment

> **On a NAS with Dockge?** There is a step-by-step for that path —
> pre-built images only, every variable and mount spelled out:
> [`deploy-ugreen-nas-dockge.md`](./deploy-ugreen-nas-dockge.md).

Two deployment paths are supported:

1. **Pull a tagged release** (recommended). Download the artefact bundle
   from the GitHub Releases page, fill in `.env`, run
   `docker compose pull && up -d`. No clone, no build — you only need a
   host with Docker.
2. **Build from source**. Clone the repo, build images locally with
   `docker/compose.prod.yml`. Useful when the registry is unreachable or
   when you want a fork to ship its own images.

If you're cutting a new release rather than deploying an existing one,
see [`release.md`](./release.md) for the runbook.

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
                 ┌───────────────┬──────────┼──────────┬───────────┘
                 │               │          │          │
                 ▼               ▼          ▼          ▼
            postgres        centrifugo  $COURSES_PATH  $DERIVED_PATH
        (named volume)                  (RO bind mount) (RW bind mount)
```

`$COURSES_PATH` is mounted read-only; `$DERIVED_PATH` is mounted read-write —
see [Derived artefacts and transcription](#derived-artefacts-and-transcription)
below for why they are two separate mounts with two different access modes.

## Path 1 — pull a tagged release

Release images live on **GitHub Container Registry**
(`ghcr.io/kkucherenkov/courseshelf-{backend,web}`) and are public — they
pull over HTTPS with no `docker login` and no daemon configuration on the
deploy host.

They are built for **`linux/amd64` only**. Run `uname -m` on the deploy host
first: anything other than `x86_64` will pull the images fine and then fail at
container start with `exec format error`, which does not say why. Building from
source ([Path 2](#path-2--build-from-source)) is the option on other
architectures.

### Manual (docker compose)

Open `https://github.com/kkucherenkov/course_shelf/releases`, pick the
release you want, and grab `courseshelf-release-vX.Y.Z.tar.gz`.

```sh
curl -LO https://github.com/kkucherenkov/course_shelf/releases/download/vX.Y.Z-release/courseshelf-release-vX.Y.Z.tar.gz
tar xzf courseshelf-release-vX.Y.Z.tar.gz
# The bundle contains compose.yml + nginx-prod.conf (bind-mounted by the
# proxy service) + .env.example + CHANGELOG.md + README.md. Don't move
# compose.yml out of the directory — the bind-mount uses ./nginx-prod.conf.
cd courseshelf-release-vX.Y.Z

cp .env.example .env
$EDITOR .env    # fill in the secrets

docker compose --env-file .env -f compose.yml pull
docker compose --env-file .env -f compose.yml up -d
```

Browse to `http://<your-host>:${PROXY_PORT}` (default `:8080`).

Upgrades: download the next release's tarball, point your existing `.env`
at it, run `pull && up -d`. Migrations apply on backend boot — see the
"Database migrations" section below.

### Via Dockge

[Dockge](https://github.com/louislam/dockge) is a compose-stack manager —
it stores each stack under `/opt/stacks/<name>/` and runs
`docker compose` against the **host** daemon. It does not clone git or
build images, so it consumes the pre-built release images exactly like
the manual path above.

1. In Dockge, **+ Compose** → name the stack `courseshelf`. Paste the
   contents of `docker/compose.release.yml` (or the pinned
   `compose-release-vX.Y.Z.yml` from the release bundle) into the editor.
2. Add the bind-mounted proxy config as a second file in the stack:
   create `nginx-prod.conf` next to `compose.yml` (copy of
   `docker/nginx/prod.conf`) — the `proxy` service mounts it via
   `./nginx-prod.conf`.
3. Fill the stack's **`.env`** from `.env.release.example`. Key values:

   | Variable             | Value                                                                                           |
   | -------------------- | ----------------------------------------------------------------------------------------------- |
   | `REGISTRY`           | `ghcr.io`                                                                                       |
   | `REGISTRY_NAMESPACE` | `<owner>` (e.g. `kkucherenkov`)                                                                 |
   | `RELEASE_TAG`        | the version to run, e.g. `0.2.0`                                                                |
   | `PUBLIC_BASE_URL`    | how browsers reach the proxy, e.g. `http://<nas-ip>:8080`                                       |
   | `COURSES_PATH`       | host directory with your courses                                                                |
   | secrets              | `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`, `CENTRIFUGO_API_KEY`, `CENTRIFUGO_TOKEN_HMAC_SECRET` |

4. **Deploy**. Dockge runs `docker compose pull && up -d`; Prisma
   migrations apply automatically in the backend entrypoint.
5. **Update to a new release**: edit `RELEASE_TAG` in the stack's `.env`
   → **Pull** → **Up** (or the restart action) in the Dockge UI. Roll
   back by setting the previous tag and pulling again — image tags are
   immutable, so `0.2.0` always resolves to the same build.

## Path 2 — build from source

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
| ------------------------------ | ------------------------------------------------------- |
| `PUBLIC_BASE_URL`              | The single origin browsers hit (proxy URL).             |
| `PROXY_PORT`                   | Host port for the nginx proxy (default `8080`).         |
| `COURSES_PATH`                 | Host directory holding your course folders, mounted RO. |
| `DERIVED_PATH`                 | Host directory for generated artefacts (whisper transcripts, scan thumbnails) plus hand-authored scraper definitions, mounted RW. |
| `POSTGRES_PASSWORD`            | Postgres superuser password.                            |
| `BETTER_AUTH_SECRET`           | Session signing key.                                    |
| `CENTRIFUGO_API_KEY`           | Backend → Centrifugo publishing key.                    |
| `CENTRIFUGO_TOKEN_HMAC_SECRET` | Centrifugo client-token signing key.                    |

Optional toggles (sensible defaults shipped):

- `AUTH_SELF_REGISTRATION=false` — when `true`, the SPA exposes `/sign-up`.
  When `false`, only existing admins can add users from the Users page, and
  `POST /api/v1/auth/sign-up/*` answers 403. The owner account on a fresh
  instance is exempt, so first-run setup works with the toggle off.
- `CENTRIFUGO_TOKEN_TTL_SECONDS=300`
- `POSTGRES_DB=courseshelf` / `POSTGRES_USER=courseshelf`
- `WHISPER_MODEL_DIR=../models` — host directory of model weights: whisper's
  ggml files AND llama's gguf files, side by side (mounted read-write — see
  [Quiz generation](#quiz-generation-local-llamacpp) for why it is no longer
  read-only).
- `WHISPER_MODEL_PATH=` (empty) — set to switch transcription on. See
  [Derived artefacts and transcription](#derived-artefacts-and-transcription).
- `WHISPER_THREADS=4`, `WHISPER_LANGUAGE=auto`, `WHISPER_TIMEOUT_MS=21600000`
- `LLAMA_DEFAULT_MODEL=` (empty) — set to a `.gguf` filename in
  `WHISPER_MODEL_DIR` to switch quiz generation on. See
  [Quiz generation](#quiz-generation-local-llamacpp).
- `LLAMA_THREADS=4`, `LLAMA_TIMEOUT_MS=600000`, `LLAMA_CONTEXT_SIZE=4096`

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

## Derived artefacts and transcription

`DERIVED_PATH` is a second, separate host directory — mounted **read-write**
at `/data/derived` — for everything CourseShelf generates from your media
(whisper transcripts today, scan thumbnails later) plus one thing you author
yourself: declarative scraper definitions under `DERIVED_PATH/scrapers/*.json`
(see [Authoring a scraper definition](./user-guide.md#authoring-a-scraper-definition)).
It is not part of `COURSES_PATH` on purpose: that mount is read-only, and both
generated artefacts and hand-authored definitions have to survive a container
restart and an image upgrade, so they live on their own bind mount rather than
inside the image or in an anonymous volume that `docker compose down -v`
would happily delete.

Transcription itself stays off until you point `WHISPER_MODEL_PATH` at a
ggml model — the model is deliberately **not** baked into either backend
image. Baking one in would add the model's full size to every pull for every
deployment, including the majority that never transcribes anything; a model
you already have on disk should not be re-downloaded on every upgrade either.

Fetch a model into the host directory bound at `WHISPER_MODEL_DIR` (default
`../models`, read-only in the container):

```sh
WHISPER_MODEL_DIR=../models pnpm whisper:model        # fetches ggml-base.bin
```

Pass a size (`pnpm whisper:model medium`) for one of the alternatives below.
The script is idempotent — it exits without touching the network if the file
is already there, so it is safe to run on every deploy.

Real sizes, so you can budget disk and bandwidth before choosing:

| Model | Size (approx.) | Use it when |
| --- | --- | --- |
| `ggml-base.bin` | ~148 MB | Default. Good accuracy-for-cost trade-off on modest CPUs. |
| `ggml-small.bin` | ~488 MB | Better accuracy, proportionally more CPU time per lesson. |
| `ggml-medium.bin` | ~1.5 GB | Workstation-class hardware, not a NAS. |
| `ggml-large-v3.bin` | ~3.1 GB | Best accuracy; multi-hour runs are the norm even off a NAS. |

Set `WHISPER_MODEL_PATH=/models/ggml-base.bin` (or whichever you downloaded)
and redeploy — no rebuild needed. `AppConfig.transcription.configured` is
`true` once that path points at a file that actually exists in
`$WHISPER_MODEL_DIR`; the env var alone is not enough, so a path set before
the download finishes still refuses. Left empty (or dangling), `POST
/libraries/{id}/transcriptions` refuses the request instead of starting a run
that can only fail.

`WHISPER_THREADS` (default 4) is the only dial that matters in practice: the
run is sequential by design (one lesson at a time), so this is CPU cores per
whisper invocation, not overall concurrency. This is CPU inference, not GPU —
on modest hardware a lesson can take well over its own runtime to transcribe;
see [`deploy-ugreen-nas-dockge.md`](./deploy-ugreen-nas-dockge.md#transcription-optional)
for the NAS-specific throughput expectations.

## Quiz generation (local llama.cpp)

Quiz generation is **on-demand only** — `POST /lessons/{id}/quizzes` or
`POST /courses/{id}/quizzes`, never triggered by a scan or an import. Nothing
leaves the machine: a local llama.cpp build (`llama-completion`, spawned as
its own process per call, exactly like `whisper-cli` — no resident model, no
server) reads a lesson's transcript cues and proposes questions for a human
to review before they count as real (`GET /quizzes`, `POST
/quizzes/{id}/apply|discard`). See
[ADR 0011](./adr/0011-local-llm-quiz-generation.md) for the full decision.

Weights live in the **same** `$WHISPER_MODEL_DIR` directory whisper's ggml
files already use — not a second volume. Create that host directory yourself
before the first `up` (`mkdir -p` it, owned by your own user): if Docker
creates it for you on first mount, it comes out `root`-owned, and the admin
delete endpoint (below) then fails with `EACCES` the first time anyone tries
to use it.

Drop a `.gguf` file into `$WHISPER_MODEL_DIR` and name it in
`LLAMA_DEFAULT_MODEL` to switch the feature on — left empty, every generation
request answers 503 `quiz-generation-not-configured`, the same "refuse rather
than start something that can only fail" posture as transcription. A request
can also name a different model for that one call
(`GenerateQuizRequest.modelId`) — several `.gguf` files can sit in the
directory at once; `GET /api/v1/admin/model-weights` lists every weight on
the volume (both engines, with size) and is what a model picker would read
from, and `DELETE /api/v1/admin/model-weights/{filename}` removes one (it
refuses to remove whichever file is currently the active default for either
engine).

| Model | Size | Source | Use it when |
| --- | --- | --- | --- |
| `Qwen3.5-4B-Q4_K_M.gguf` | 2,740,937,888 B (~2.74 GB) | `unsloth/Qwen3.5-4B-GGUF` | Default. |
| `Qwen3.5-9B-Q4_K_M.gguf` | 5,680,522,464 B (~5.68 GB) | `unsloth/Qwen3.5-9B-GGUF` | Noticeably better questions, ~3x slower per the maintainer's own NAS benchmark — opt in per request via `modelId`, don't make it the default on modest hardware. |

**Do not go below Q4** (no `Q3_K_M`/`Q2_K` variant of either size). At 4B–9B
parameters a lower quant drops output quality far more than the disk/RAM it
saves — a full model already fits comfortably in 16 GB RAM at Q4, so there is
nothing to gain by quantizing further.

Weights are **never fetched by any script or workflow** — `pnpm whisper:model`
has no llama equivalent. Download the `.gguf` yourself from the HuggingFace
repo above and place it in `$WHISPER_MODEL_DIR`; nothing here automates that,
by design (E29-F02-S01 clarification #5 — no CI job, no image, no test ever
touches a real weight file).

A lesson's transcript is never sent to the model in one shot — it is windowed
into bounded chunks first, so a hard-cap context stays small (bounds
KV-cache; a full hour-long transcript's ~8-10k tokens would cost an extra
~1-1.5 GB of KV-cache on top of the model's own weights). Each window also
gets an ASR-typo cleanup pass through the same model before questions are
generated from it — whisper's Russian output in particular carries
recognition errors that otherwise turn into garbled questions. The cleanup
pass is **ephemeral**: it never writes back to `TranscriptCue` (the
transcript also backs player subtitles, trigram search and `?t=` deep
links), and it roughly **doubles** generation time. `GenerateQuizRequest.
cleanupEnabled` (default `true`) turns it off per request — reasonable for
already-clean, English, author-provided subtitles, where there is nothing to
clean and the extra pass buys nothing.

**Benchmark on one lesson before running a whole course.** Published tok/s
figures for these models are almost always measured on a desktop with
dual-channel DDR5 (e.g. a Ryzen 7 8845HS) — this workload is memory-bandwidth
bound, and a NAS-class CPU (the maintainer's own Pentium Gold 8505) will be
noticeably slower than any number you find online. `POST
/lessons/{id}/quizzes` on a single lesson is cheap insurance before pointing
`POST /courses/{id}/quizzes` at a 30-lesson course.

If you build the image yourself (Path 2 below) rather than pulling the
published one, the ggml build flags matter as much here as they do for
whisper — see `apps/backend/Dockerfile`'s stage L comment. A build with only
`-DCMAKE_BUILD_TYPE=Release` and no explicit `GGML_AVX*` flags does not fail
or crash; it just measured **0.91 tokens/sec** on generation (vs. 49 tok/s
prompt processing) on a 16-thread, AVX-512-capable machine, because this
version of ggml defaults every SIMD flag to `OFF`. Twenty times slower,
silently — the Dockerfile's build stage now proves AVX2 landed in the binary
before the image is considered built.

## Per-deployment URL

The SPA is built **once** (in the `apps/web/Dockerfile` build stage) and
configured per-deployment via `/_app-config.js` — a tiny script the web
container generates at boot from `APP_API_BASE_URL` / `APP_AUTH_BASE_URL`.
Both are derived from `PUBLIC_BASE_URL` in `compose.prod.yml`:

```yaml
APP_API_BASE_URL: ${PUBLIC_BASE_URL}/api/v1
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

**Path 1 (release bundle):** download the new release's tarball, swap
the compose file (or override `RELEASE_TAG` in `.env`), then
`docker compose pull && up -d`.

**Path 2 (source build):**

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
