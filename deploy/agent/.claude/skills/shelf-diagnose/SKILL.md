---
name: shelf-diagnose
description: Use before every other action on a CourseShelf host, and whenever the user asks "what is wrong", "is it working", "check my install", or reports that something broke. Runs the read-only state probe and turns its JSON into a status table plus a recommendation.
---

# Diagnosing a CourseShelf host

## Run this first, always

```bash
bash .claude/skills/shelf-diagnose/scripts/detect-state.sh
```

Read-only, no root, no prompts — run it without asking permission. It prints
one JSON object and nothing else.

Never guess at the host's state and never assemble your own checks out of
`docker ps` and `curl`. Every fact you act on comes from this JSON. If a
fact you need is not in it, add a field to the probe rather than improvising
a command: an improvised check is untested and disagrees with the probe the
next time someone runs it.

## Field → what it means → what to do

Work down the table. The first three rows are blockers: do not move past one
that fires.

| Field                             | Value                                      | What to do                                                                                                                                                                                                                                                                                                                                     |
| --------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docker_ok`                       | `false` with `docker_permission_ok: false` | The user is not in the `docker` group. Show `sudo usermod -aG docker $USER`, and say the session has to be logged out and back in for it to take effect. Do not offer to run everything with `sudo` instead.                                                                                                                                   |
| `docker_ok`                       | `false`, docker present                    | The daemon is not running. On systemd: `sudo systemctl start docker`. On a NAS: start the Docker/Container Manager package from its web UI.                                                                                                                                                                                                    |
| `compose_ok`                      | `false`                                    | Compose v2 is missing. The old standalone `docker-compose` binary is not a substitute — the stack uses `depends_on.condition`, which v1 ignores. Point at the Docker Compose plugin for their distro.                                                                                                                                          |
| `arch_supported`                  | `false`                                    | **Say this before anything else:** the published images are `linux/amd64` only, so on `aarch64` (most ARM NAS boxes, Raspberry Pi, Apple Silicon) there is nothing to pull. Their options are building the images themselves from the repo, or using an x86-64 host. Emulation is not a recommendation: it appears to work until whisper runs. |
| `disk_free_mb`                    | `< 4096`                                   | The images alone need roughly 4 GB. Say the number you found, not "low disk space".                                                                                                                                                                                                                                                            |
| `env_missing`                     | non-empty                                  | These variables are required by **their own compose file** and absent from `.env`; compose will refuse to start. Name each one and what it is for. This is derived from the compose file, so it is right even for a variable added after this document was written.                                                                            |
| `env_placeholders`                | non-empty                                  | Secrets still on their `change-me` default. Generate real ones — `openssl rand -hex 32` — rather than letting them ship a public instance signed with a value printed in a README.                                                                                                                                                             |
| `port_owner`                      | `other`                                    | Something that is not this stack holds the port. Offer to move CourseShelf to another port rather than to kill whatever is there.                                                                                                                                                                                                              |
| `stack_running`                   | `false`, `.env` complete                   | Installed but stopped. Offer `shelf-manage`'s `start`.                                                                                                                                                                                                                                                                                         |
| `health_reachable`                | `false` while `stack_running: true`        | The containers are up and the app is not answering. Read the backend log (`manage.sh logs backend`) before saying anything about a cause.                                                                                                                                                                                                      |
| `db_status` / `centrifugo_status` | not `ok`                                   | Name which dependency, then read that service's log. A `degraded` database is usually a migration still running on a large library.                                                                                                                                                                                                            |
| `has_users`                       | `false`                                    | The install is not finished. Tell them to open `<PUBLIC_BASE_URL>` and register: while no account exists every route redirects to the sign-up wizard, and that first account becomes the administrator. It works even with `AUTH_SELF_REGISTRATION=false`, which is the recommended default.                                                   |
| `courses_readable`                | `false`                                    | The library path is wrong or unreadable by the user running docker. A typo here produces a stack that starts and finds nothing — which looks like a broken scanner.                                                                                                                                                                            |
| `derived_writable`                | `false`                                    | Transcripts and thumbnails have nowhere to go. Fix the permissions on `derived_path`; do not point `DERIVED_PATH` at the library, which is mounted read-only on purpose.                                                                                                                                                                       |
| `model_files`                     | `0`                                        | Only worth mentioning if they ask about transcription or quizzes. Both features stay off until a model file exists **and** the matching variable names it.                                                                                                                                                                                     |
| `update_available`                | `true`                                     | Mention the version they are on and the version available. Do not upgrade as a side effect of a diagnosis.                                                                                                                                                                                                                                     |

## How to present it

A table, then the recommendation. Same shape every time:

```
| Check              | Value                | Status      |
|--------------------|----------------------|-------------|
| OS                 | Ubuntu 24.04.1 LTS   | OK          |
| Architecture       | x86_64               | OK          |
| Docker             | 27.3.1               | OK          |
| Compose            | 2.29.7               | OK          |
| Free disk          | 41 GB                | OK          |
| Stack              | running (5 services) | OK          |
| Version            | 1.7.0                | ⚠️ 1.8.0 available |
| Database           | ok                   | OK          |
| Admin account      | none                 | ❗ not finished |
| Library            | /srv/courses         | OK          |
```

Statuses: `OK` / `⚠️` / `❗`. Then one short paragraph: what is wrong and what
you propose to do about it. Ask before doing it.

## Why there is no health-check.sh

The obvious second script — one that reads the probe and prints
`overall: warning` with a list of issues — would be a second copy of the
table above, in bash, where it cannot be read or adjusted in context. The
probe reports facts; this file holds the judgement. Adding a script that
judges would give the two of them room to disagree.
