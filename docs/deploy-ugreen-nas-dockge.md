# Deploying CourseShelf to a UGREEN NAS with Dockge

A step-by-step for running a published CourseShelf release on a UGREEN NAS
(UGOS) that already has Docker and [Dockge](https://github.com/louislam/dockge)
installed. **Nothing is built here** — every image is pulled from GitHub
Container Registry.

If you are deploying somewhere else, or building from source, read
[`deployment.md`](./deployment.md) instead. This document is the NAS-specific
path and repeats what it needs to stand alone.

---

## Contents

- [Before you start](#before-you-start)
- [1 — Decide the two things that are hard to change later](#1--decide-the-two-things-that-are-hard-to-change-later)
- [2 — Get the release files](#2--get-the-release-files)
- [3 — Put the files in the stack directory](#3--put-the-files-in-the-stack-directory)
- [4 — Fill in the environment](#4--fill-in-the-environment)
- [5 — Check the mounts and permissions](#5--check-the-mounts-and-permissions)
- [6 — Deploy in Dockge](#6--deploy-in-dockge)
- [7 — First run](#7--first-run)
- [Every variable, in one table](#every-variable-in-one-table)
- [Every mount and volume, in one table](#every-mount-and-volume-in-one-table)
- [Updating to a new release](#updating-to-a-new-release)
- [Backups and where your data lives](#backups-and-where-your-data-lives)
- [Troubleshooting](#troubleshooting)

---

## Before you start

You need:

- **A UGREEN NAS with Docker and Dockge running.** This guide assumes Dockge
  manages your stacks and that you can reach its web UI.
- **SSH access to the NAS**, or the UGOS File Station. Dockge's editor handles
  `compose.yaml` and `.env`; the stack also needs a third file
  (`nginx-prod.conf`) that you must place next to them yourself.
- **A folder of courses** already on the NAS — see
  [the user guide](./user-guide.md#how-courseshelf-reads-a-folder) for the
  layout the scanner expects. It is mounted **read-only**; CourseShelf never
  writes to it.
- **Roughly 2 GB of RAM free.** Six containers: Postgres, Redis, Centrifugo,
  the API, the SPA, and an nginx proxy.

Find your Dockge stacks directory before anything else — everything below goes
in a subfolder of it:

```sh
docker inspect dockge --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{"\n"}}{{end}}'
```

Look for the mount whose destination is `/opt/stacks`. Its **source** is the
host path you will use. On UGREEN this is usually somewhere under
`/volume1/docker/...`; it is whatever you set when you installed Dockge, so
read it rather than assuming. This document calls it `$STACKS`.

---

## 1 — Decide the two things that are hard to change later

### The URL browsers will use

`PUBLIC_BASE_URL` is baked into the SPA at container start and used by the API
for CORS and for signing auth cookies. **Get it right the first time** —
changing it later means recreating the `web` container and signing everyone
out.

It must be the address you actually type in the browser, scheme and port
included:

| How you reach the NAS | `PUBLIC_BASE_URL` |
| --- | --- |
| LAN, by IP | `http://192.168.1.50:8080` |
| LAN, by hostname | `http://ugreen.local:8080` |
| Behind a reverse proxy with TLS | `https://courseshelf.example.com` |

Not `localhost` — that would only ever work from a browser running on the NAS
itself.

### The host port

The stack publishes **one** port: the nginx proxy. Everything else talks over
an internal Docker network and is not reachable from your LAN.

`8080` is the default and is frequently taken on a NAS. Check before you commit
to it:

```sh
ss -ltnp | grep -E ':(8080|8081|8090)\b'
```

If something answers, pick a free port and set `PROXY_PORT` to it — then make
`PUBLIC_BASE_URL` use the same number. These two must agree, and forgetting
that is the single most common way this deployment fails silently: the page
loads, and every API call is refused by CORS.

---

## 2 — Get the release files

Open the release you want:

<https://github.com/kkucherenkov/course_shelf/releases>

Download **`courseshelf-release-vX.Y.Z.tar.gz`** and unpack it. It contains
exactly what you need:

| File | What it is |
| --- | --- |
| `compose.yml` | The stack, with image tags already pinned to this release |
| `nginx-prod.conf` | The proxy config the stack bind-mounts |
| `.env.example` | Every variable, commented |
| `CHANGELOG.md` | What changed in this release |
| `README.md` | The short version of this document |

You can do that on the NAS directly:

```sh
cd /tmp
curl -fsSL -o cs.tar.gz \
  https://github.com/kkucherenkov/course_shelf/releases/download/v1.0.0-release/courseshelf-release-v1.0.0.tar.gz
tar xzf cs.tar.gz
ls courseshelf-release-v1.0.0/
```

> **The images are public.** No `docker login`, no token, no registry
> configuration. If a pull ever asks for credentials, you have mistyped the
> image name.

---

## 3 — Put the files in the stack directory

Dockge runs `docker compose` **inside the stack's own folder**, which is what
makes the `./nginx-prod.conf` bind mount in `compose.yml` resolve. So all three
files must sit together:

```sh
mkdir -p "$STACKS/courseshelf"
cd /tmp/courseshelf-release-v1.0.0
cp compose.yml       "$STACKS/courseshelf/compose.yaml"
cp nginx-prod.conf   "$STACKS/courseshelf/nginx-prod.conf"
cp .env.example      "$STACKS/courseshelf/.env"
```

Two details worth not skipping:

- **`compose.yml` → `compose.yaml`.** Dockge looks for `compose.yaml`. Copy it
  under that name or Dockge will not see the stack.
- **`nginx-prod.conf` must be a real file here.** Dockge's editor will not
  create it for you — that is why this step uses SSH or File Station. If it is
  missing, Docker silently creates a *directory* with that name and the proxy
  container starts and immediately serves nothing.

After copying, `$STACKS/courseshelf/` holds exactly `compose.yaml`,
`nginx-prod.conf`, and `.env`.

> **A cosmetic mismatch to expect.** `compose.yml` sets
> `name: "courseshelf-release"`, so Docker names the project that regardless of
> your folder name, while Dockge lists the stack by folder. Containers appear as
> `courseshelf-release-backend-1` under a Dockge stack called `courseshelf`.
> That is fine — do not "fix" it by renaming, or you will orphan the volumes.

---

## 4 — Fill in the environment

Edit `.env` — in Dockge's UI once the stack is visible, or over SSH now.
Four secrets have `change-me` markers. Generate real ones:

```sh
openssl rand -hex 32   # BETTER_AUTH_SECRET
openssl rand -hex 32   # CENTRIFUGO_TOKEN_HMAC_SECRET
openssl rand -hex 24   # CENTRIFUGO_API_KEY
openssl rand -hex 24   # POSTGRES_PASSWORD
```

A filled-in `.env` for a LAN deployment at `192.168.1.50:8080`:

```ini
# ── Image source ──────────────────────────────────────────────────────────
RELEASE_TAG=1.0.0
REGISTRY=ghcr.io
REGISTRY_NAMESPACE=kkucherenkov

# ── Public URL and port — these two must agree ────────────────────────────
PUBLIC_BASE_URL=http://192.168.1.50:8080
PROXY_PORT=8080

# ── Your courses on the NAS ───────────────────────────────────────────────
COURSES_PATH=/volume1/media/courses

# ── Postgres ──────────────────────────────────────────────────────────────
POSTGRES_DB=courseshelf
POSTGRES_USER=courseshelf
POSTGRES_PASSWORD=<openssl rand -hex 24>

# ── Auth ──────────────────────────────────────────────────────────────────
BETTER_AUTH_SECRET=<openssl rand -hex 32>
AUTH_SELF_REGISTRATION=false
AUTH_EMAIL_VERIFICATION=false

# ── Realtime ──────────────────────────────────────────────────────────────
CENTRIFUGO_API_KEY=<openssl rand -hex 24>
CENTRIFUGO_TOKEN_HMAC_SECRET=<openssl rand -hex 32>
CENTRIFUGO_TOKEN_TTL_SECONDS=300
CENTRIFUGO_LOG_LEVEL=info
```

Compose refuses to start if `POSTGRES_PASSWORD`, `BETTER_AUTH_SECRET`,
`CENTRIFUGO_API_KEY`, `CENTRIFUGO_TOKEN_HMAC_SECRET`, `PUBLIC_BASE_URL` or
`COURSES_PATH` is missing — you get a named error, not a broken stack.

> **`AUTH_SELF_REGISTRATION=false` is a UI setting, not a lock.** It hides the
> sign-up link and is reported to the apps; the API still accepts a direct
> sign-up call. Treat it as tidiness, not as access control, and do not expose
> this stack to the internet without a reverse proxy that authenticates in
> front of it.
>
> It does **not** block first-run setup — creating the owner account works
> either way, because that path keys off "this instance has no users yet".

---

## 5 — Check the mounts and permissions

### Your courses must be readable by the container

This is the one that bites on a NAS. The API container runs as an
**unprivileged user, uid 1000** — not root. Your media share is typically owned
by a NAS account with a different uid, and a directory that is not
world-readable will make every scan find nothing while the stack looks
perfectly healthy.

Check what you have:

```sh
ls -ldn /volume1/media/courses
# drwxrwx--- 5 1001 100 4096 Aug 29 21:00 /volume1/media/courses
#            ^^^^ ^^^ owner uid / gid       ^ no "other" bits — uid 1000 cannot read
```

Two ways to fix it. Pick one:

**A. Let the container run as the owning user.** Cleanest — no permission
changes on your data. Add a `user:` line to the `backend` service in
`compose.yaml`, using the uid and gid from the listing above:

```yaml
  backend:
    image: "ghcr.io/kkucherenkov/courseshelf-backend:1.0.0"
    user: "1001:100"
    restart: unless-stopped
```

**B. Make the tree readable by everyone.** Simpler, coarser:

```sh
chmod -R o+rX /volume1/media/courses
```

Either way, verify after the stack is up — this command should list your course
folders, and it is the fastest way to know the mount is genuinely working:

```sh
docker exec courseshelf-release-backend-1 ls /data/courses
```

### The mount is read-only — and that costs you thumbnails

`COURSES_PATH` is mounted `:ro`. CourseShelf reads your files and never
modifies, moves or deletes them: losing the database costs you metadata and
progress, never your media. That is the right default for a NAS, where the
share is usually your only copy.

It has two consequences the release compose does not spell out.

**Subtitles are fine.** `.srt` files are converted to WebVTT per request. The
converter tries to cache the result beside the video and explicitly ignores the
failure on a read-only mount, so subtitles work — they are just recomputed each
time. They are small; this is not worth solving.

**Thumbnails do not get written.** The scanner generates a `*.thumb.jpg` next
to each video, and that write is *not* best-effort — it records a per-file scan
error. So on a read-only mount every video with readable metadata produces one
`ffmpeg-thumbnail-failed` entry under **Admin → Scans**. Durations, titles and
the whole catalog are still correct; only poster images are missing, and the
scan still reports success.

Pick deliberately:

| | Read-only (default) | Read-write |
| --- | --- | --- |
| Your media | can never be touched | the app writes `*.thumb.jpg` beside each video |
| Thumbnails | none, and one scan error per video | generated once, then reused |

To take the read-write option, drop the `:ro` from the backend's volume line in
`compose.yaml`:

```yaml
  backend:
    volumes:
      - "${COURSES_PATH}:/data/courses"
```

The container must then also be *able* to write there — the same uid question
as above, and option B's `chmod o+rX` is not enough on its own.

---

## 6 — Deploy in Dockge

1. Open Dockge. The `courseshelf` stack appears in the list — Dockge scans the
   stacks directory. If it does not, confirm the file is named `compose.yaml`.
2. Open the stack. Check the **compose** and **.env** tabs show what you copied.
3. Press **Deploy**.

Dockge pulls six images (about 400 MB) and starts them in dependency order:
Postgres, Redis and Centrifugo first, then the API once all three are healthy,
then the SPA and the proxy.

**The first start takes a couple of minutes.** The API runs database migrations
before it answers, and its healthcheck allows a 60-second grace period. Watch
the logs in Dockge until you see the API reporting it is listening.

Then confirm the whole chain end to end:

```sh
curl -s http://192.168.1.50:8080/api/v1/health
# {"status":"ok","dependencies":{"db":"ok","redis":"ok","centrifugo":"ok"}}
```

Three `ok`s means the proxy reaches the API, the API reaches Postgres and
Redis, and Centrifugo is alive. If any says otherwise, go to
[Troubleshooting](#troubleshooting).

---

## 7 — First run

1. Browse to your `PUBLIC_BASE_URL`. Because the instance has no users yet,
   every route redirects to a three-step setup wizard.
2. **The account you create is the administrator.** Once it exists, the wizard
   locks itself permanently — there is no second chance to mint an owner this
   way, so use an address you control.
3. Go to **Admin → Libraries → Add library** and give it a name plus a path
   **as the container sees it**: `/data/courses`, or a subfolder like
   `/data/courses/programming`. Not the host path from `COURSES_PATH` — inside
   the container, that directory is `/data/courses`.
4. Press **Scan**. Progress streams live. When it finishes you get counts and
   any per-file warnings.
5. Add other people under **Admin → Users**, then grant them access under
   **Admin → Permissions**. A new user with no grants signs in successfully and
   sees an empty catalog — that is correct, not a bug.

---

## Every variable, in one table

Everything the stack reads. Only the six marked **required** have no usable
default.

| Variable | Required | Default | What it does |
| --- | --- | --- | --- |
| `PUBLIC_BASE_URL` | **yes** | — | The origin browsers use. Baked into the SPA, and used for CORS, Better Auth and the Centrifugo origin allow-list. Must match `PROXY_PORT`. |
| `COURSES_PATH` | **yes** | — | Host directory holding your courses. Mounted read-only at `/data/courses`. |
| `POSTGRES_PASSWORD` | **yes** | — | Database password. Any strong string. |
| `BETTER_AUTH_SECRET` | **yes** | — | Signs sessions. `openssl rand -hex 32`. Changing it signs everyone out. |
| `CENTRIFUGO_API_KEY` | **yes** | — | Lets the API publish realtime events. |
| `CENTRIFUGO_TOKEN_HMAC_SECRET` | **yes** | — | Signs the browser's realtime tokens. Must differ from the API key. |
| `PROXY_PORT` | no | `8080` | Host port for the proxy. The only port published. |
| `RELEASE_TAG` | no | pinned | Image tag. The bundled compose pins the exact version; set `latest` to float. |
| `REGISTRY` | no | `ghcr.io` | Change only if you host the images yourself. |
| `REGISTRY_NAMESPACE` | no | `kkucherenkov` | Same. |
| `POSTGRES_DB` | no | `courseshelf` | Database name. |
| `POSTGRES_USER` | no | `courseshelf` | Database user. |
| `AUTH_SELF_REGISTRATION` | no | `false` | Shows or hides the sign-up link. **Not** an access control — see the note in step 4. |
| `AUTH_EMAIL_VERIFICATION` | no | `false` | Adds a code step to sign-up. Needs SMTP, which this release does not configure — leave `false`. |
| `CENTRIFUGO_TOKEN_TTL_SECONDS` | no | `300` | Realtime token lifetime. Clients re-issue automatically. |
| `CENTRIFUGO_LOG_LEVEL` | no | `info` | Set `debug` when triaging realtime. |

Set by `compose.yaml`, **not** by you: `DATABASE_URL`, `REDIS_URL`,
`CENTRIFUGO_API_URL`, `CORS_ORIGINS`, `APP_API_BASE_URL`, `APP_AUTH_BASE_URL`,
`APP_CENTRIFUGO_URL`, `NODE_ENV`, `BETTER_AUTH_BASE_PATH`, and the Centrifugo
channel namespaces. They are derived from the variables above or are part of
the application contract. Editing them by hand is how you get a stack that
starts and does not work.

---

## Every mount and volume, in one table

| What | Host | Container | Mode | Why |
| --- | --- | --- | --- | --- |
| Your courses | `$COURSES_PATH` | `backend:/data/courses` | **read-only** | The library the scanner indexes. Never written to. |
| Proxy config | `./nginx-prod.conf` | `proxy:/etc/nginx/conf.d/default.conf` | read-only | Folds the SPA, the API and the realtime socket onto one origin. Must exist as a **file** in the stack folder. |
| Database | Docker volume `pgdata` | `postgres:/var/lib/postgresql` | read-write | **All your metadata, users, progress, notes and bookmarks.** The one thing worth backing up. |
| Redis | Docker volume `redisdata` | `redis:/data` | read-write | Realtime broker state. Disposable. |

The two named volumes are created by Docker as
`courseshelf-release_pgdata` and `courseshelf-release_redisdata`. Find where
they actually live on the NAS with:

```sh
docker volume inspect courseshelf-release_pgdata --format '{{.Mountpoint}}'
```

If you would rather keep the database on a specific share — a mirrored volume,
say — replace the volume with a bind mount in `compose.yaml`:

```yaml
  postgres:
    volumes:
      - /volume1/docker/courseshelf/pgdata:/var/lib/postgresql
```

Do that **before the first start**. Switching afterwards leaves the old volume
holding your data and starts you on an empty database.

---

## Updating to a new release

```sh
cd "$STACKS/courseshelf"
```

1. Edit `RELEASE_TAG` in `.env` to the new version.
2. In Dockge, press **Update** on the stack (this is `pull` then `up -d`).

Database migrations run automatically when the new API container starts. Only
the containers whose image changed are recreated; your volumes are untouched.

If a release changes `compose.yml` or `nginx-prod.conf` — the changelog says so
— download the new bundle and copy those two files over before updating.

**Rolling back** is setting `RELEASE_TAG` to the previous version and pressing
Update again. That works for the application; it does **not** undo a database
migration, so take a backup first (below) if you are moving across a release
that changed the schema.

---

## Backups and where your data lives

Everything that cannot be rebuilt is in Postgres: your users, access grants,
progress, notes, bookmarks, and all the scanned metadata. Your media files are
not in the backup, because CourseShelf never owned them — back those up the way
you already back up that share.

There are two ways to take one.

**From the API**, which produces a compressed dump and a signed download link
valid for five minutes:

```sh
curl -X POST http://192.168.1.50:8080/api/v1/admin/backups \
  -H "Authorization: Bearer <your-token>"
```

**Or straight from the container**, which needs no auth and is easier to put in
a cron job:

```sh
docker exec courseshelf-release-postgres-1 \
  pg_dump -U courseshelf courseshelf | gzip > courseshelf-$(date +%F).sql.gz
```

Restore into a stopped stack:

```sh
gunzip -c courseshelf-2026-08-29.sql.gz | \
  docker exec -i courseshelf-release-postgres-1 psql -U courseshelf courseshelf
```

---

## Troubleshooting

**The page loads but nothing works — the browser console shows CORS errors.**
`PUBLIC_BASE_URL` does not match the address you typed. It must include the
same scheme, host and port. Fix `.env`, then **recreate** the `web` container —
a restart is not enough, because the SPA config is generated at container
start.

**`/api/v1/health` says `"db":"error"`.** Postgres did not come up, or the
password changed after the volume was created. Check `docker logs
courseshelf-release-postgres-1`. If you changed `POSTGRES_PASSWORD` after the
first start, the existing volume still has the old one — either set the
variable back, or delete the volume and restore from a backup.

**A scan reports zero courses, and no errors.** The mount cannot be read.
Run `docker exec courseshelf-release-backend-1 ls /data/courses`. Empty output
means permissions — go back to [step 5](#5--check-the-mounts-and-permissions).
Output that lists your folders means the *library path* is wrong: it must be
`/data/courses`, the path inside the container, not the host path.

**Every video has an `ffmpeg-thumbnail-failed` scan error.** Expected on the
default read-only mount — see
[step 5](#the-mount-is-read-only--and-that-costs-you-thumbnails). The catalog is
fine; only posters are missing.

**Lessons have no duration either.** Duration comes from ffprobe, which the
released image ships, so this is not a missing binary. Either the file is
unreadable (permissions — check `docker exec … ls /data/courses`) or it is in a
container CourseShelf does not index: `.mp4`, `.m4v`, `.mkv`, `.webm`, `.wmv`
are the five it reads. **Admin → Scans** names the file and the reason.

**Video will not play, or stalls.** Stream links are signed and expire after 15
minutes; a link copied out of the network tab and reused later returns 401 —
reload the lesson page. If playback stalls part-way instead, the proxy config
is missing or wrong: it disables buffering for `/api/v1/stream/` specifically so
byte ranges pass through. Confirm `nginx-prod.conf` is a file and not an
accidentally-created directory:

```sh
ls -l "$STACKS/courseshelf/nginx-prod.conf"
```

**Scan progress does not update live.** Centrifugo. Check
`/api/v1/health` reports `"centrifugo":"ok"`, and that
`CENTRIFUGO_TOKEN_HMAC_SECRET` is identical in the `.env` — it is read by both
the API and Centrifugo, and a mismatch produces a silent failure to subscribe
rather than an error. Everything else keeps working; only live updates stop.

**The stack starts, then the proxy exits.** Almost always the missing
`nginx-prod.conf`. See the note in [step 3](#3--put-the-files-in-the-stack-directory).

---

## Related

| | |
| --- | --- |
| Using the app once it runs | [`user-guide.md`](./user-guide.md) |
| Other deployment targets, building from source | [`deployment.md`](./deployment.md) |
| How releases are cut | [`release.md`](./release.md) |
| Toolchain problems | [`troubleshooting.md`](./troubleshooting.md) |
