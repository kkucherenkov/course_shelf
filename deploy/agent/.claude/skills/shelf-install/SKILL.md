---
name: shelf-install
description: Use when the user wants to install CourseShelf on this machine, or to finish an install that stopped part way. Covers the questions to ask, the step machine that does the work, and the traps that make an install look finished when nobody can sign in.
---

# Installing CourseShelf

Run `shelf-diagnose` first. If it reports `stack_running: true`, this is not
an install — ask whether they meant to upgrade (`shelf-upgrade`) or to start
a second instance (possible, but it needs its own port and its own
directory).

## Where the install happens

The script works inside one directory — the **stack directory** — which
holds `compose.yml`, `.env`, and a `.courseshelf/` state directory. When the
agent ships inside an unpacked release bundle, that directory is the bundle
itself and there is nothing to download.

## What to ask, before running anything

Four answers, in this order. Ask them together, in plain language, and say
what each one is for.

| Answer                   | Flag                                     | What to say                                                                                                                                                                                                                        |
| ------------------------ | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Where the courses live   | `--courses`                              | "The folder that already holds your course folders. It is mounted read-only — CourseShelf never writes into it." Must exist; a typo here gives an install that starts and finds nothing.                                           |
| The URL people will open | `--public-url`                           | "The address you will type in the browser, with the port: `http://nas.local:8080`." It is baked into the SPA's config and used for CORS and session cookies, so `localhost` on a machine you reach over the network will not work. |
| The port                 | `--port` (default 8080)                  | Only ask if 8080 is taken — `port_owner: other` in the probe.                                                                                                                                                                      |
| Where generated files go | `--derived` (default: next to the stack) | "Transcripts and thumbnails. Needs to be writable, and separate from the course folder."                                                                                                                                           |

Do not ask about secrets. The script generates four of them and writes them
to `.courseshelf/secrets.env` with mode 600.

## The step machine

```bash
bash .claude/skills/shelf-install/scripts/install.sh --check
bash .claude/skills/shelf-install/scripts/install.sh \
  --courses /srv/courses --public-url http://nas.local:8080
bash .claude/skills/shelf-install/scripts/install.sh --resume
bash .claude/skills/shelf-install/scripts/install.sh --fresh --courses ... --public-url ...
```

Eight steps, each with a marker file in `.courseshelf/`. A run with no mode
flag resumes by itself. Show the user `--check`'s output as a table before
and after — it is the only place the state of a half-finished install is
visible.

| Step | What it does     | Why it can fail                                                                                         |
| ---- | ---------------- | ------------------------------------------------------------------------------------------------------- |
| 1    | Preflight        | No docker, no compose v2, wrong architecture, under 4 GB free, port held by someone else                |
| 2    | Release bundle   | Only downloads when `compose.yml` is absent; needs GitHub reachable                                     |
| 3    | Secrets          | Generated once and reused — a regenerated Postgres password would not match the existing volume         |
| 4    | Data directories | `--courses` must already exist; the script creates `derived` and `models`, never the library            |
| 5    | `.env`           | Rendered from `.env.example`, then validated with `docker compose config -q`                            |
| 6    | Pull             | The slow one. A dead connection here costs only this step on the next run                               |
| 7    | Start            | `up -d`, then waits up to 180s for `/api/v1/health` — the backend runs its migrations before it answers |
| 8    | Verify           | Health, dependencies, **and an admin account**. Fails, deliberately, while there is none                |

### Step 8 is not a formality

It exits non-zero and leaves its marker unset when the instance has no
account. Do not work around that. A stack nobody can sign in to is not an
installed product. Tell the user to open `<PUBLIC_BASE_URL>` and register —
**the first account created becomes the administrator** — then re-run with
`--resume`.

They do not need to find the sign-up page: while no account exists, the web
app redirects every route to the three-step wizard, and the backend allows
that one sign-up even with `AUTH_SELF_REGISTRATION=false`. After it, the
toggle applies normally and nobody else can self-register.

## Before each command that changes something

Show the exact command, say in one sentence what it does, and wait for an
explicit yes. `--check` and the diagnose probe are exempt: they change
nothing.

## What the installer owns

Everything it creates is recorded in `.courseshelf/.courseshelf_owned`, and
uninstall removes only what is listed there. The course library is never
recorded, so it can never be removed by an uninstall — "the path is in
`.env`" is not proof that CourseShelf created it.

## Traps

**`RELEASE_TAG` in `.env` does not choose the version.** The release
workflow rewrites `${RELEASE_TAG:-latest}` to a literal version before
shipping the compose file, so a released bundle pins its images in the file
itself. Changing the variable deploys nothing and reports success. Version
changes go through `shelf-upgrade`, which swaps the compose file.

**`Up (healthy)` is not a verified install.** It is the container's opinion
of its own process. The version in `/api/v1/health` and the presence of an
account are the two facts worth reporting.

**Never create the courses directory to make an error go away.** An absent
library path is a typo nine times out of ten, and creating an empty one
turns a clear failure into a working install that finds no courses.
