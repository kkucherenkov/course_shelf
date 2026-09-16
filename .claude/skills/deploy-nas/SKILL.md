---
name: deploy-nas
description: Use when deploying a released version to the NAS, rolling one back, or checking which version the NAS is actually running. Covers finding the stack, moving the pinned image tags, verifying the deploy landed, and the traps that make a deploy look successful when it did nothing.
---

# Deploying a release to the NAS

The NAS runs the release images from ghcr under Dockge. A deploy moves two
pinned image tags, pulls, and restarts two services. It takes about a minute.

Deploy only a tag the release workflow published — `gh release view
v<x.y.z>-release` must list `courseshelf-release-<x.y.z>.tar.gz`. Deploying a
tag whose images were never pushed leaves the stack pulling forever.

## Find the stack — never type its path from memory

```sh
ssh nas 'docker inspect courseshelf-release-web-1 --format \
  "{{index .Config.Labels \"com.docker.compose.project.config_files\"}}"'
```

The same command tells you what is running right now:

```sh
ssh nas 'docker ps --format "{{.Names}} {{.Image}} {{.Status}}" \
  | grep courseshelf'
```

## The tags are literal

`compose.yaml` pins them as `ghcr.io/kkucherenkov/courseshelf-backend:1.6.0`,
not `${RELEASE_TAG}`. **Editing `RELEASE_TAG` in `.env` does nothing** — the
rendered bundle inlines the version. A deploy that edits `.env` and reports
success has deployed nothing.

Keep a copy named after the version you are leaving, so a rollback needs no
git and no memory:

```sh
ssh nas 'cd <stack> && cp compose.yaml compose.yaml.<old> && \
  sed -i "s#courseshelf-backend:<old>#courseshelf-backend:<new>#; \
          s#courseshelf-web:<old>#courseshelf-web:<new>#" compose.yaml && \
  grep -n "courseshelf-\(backend\|web\):" compose.yaml'
```

Read that `grep` before pulling. It is the only place the change is visible.

## Pull and restart

```sh
ssh nas 'cd <stack> && docker compose pull backend web'
ssh nas 'cd <stack> && docker compose up -d backend web'
```

Only those two services. Postgres, Centrifugo and the proxy are unchanged by a
release and restarting them costs uptime for nothing.

## Verify with the version, not the container status

`Up (healthy)` is the container's own check — it says the process answers, not
which build it is:

```sh
ssh nas 'curl -s http://<host>:<port>/api/v1/health'
# {"status":"ok","version":"1.6.1","dependencies":{"db":"ok","centrifugo":"ok"}}
```

The host and port come from `PUBLIC_BASE_URL` in the stack's `.env`, not from
this file.

Then read the backend log for the migration line:

```sh
ssh nas 'docker logs courseshelf-release-backend-1 --since 2m | grep -i migrat'
```

`No pending migrations to apply.` on a release that carries none. A release
**with** a migration should say it applied one — if it says "no pending" when
you expected a schema change, the image is older than you think.

## Rollback

Restore the copy and restart. No migration means no data step:

```sh
ssh nas 'cd <stack> && cp compose.yaml.<old> compose.yaml && \
  docker compose up -d backend web'
```

A release **with** a migration is not rollable this way — check
`prisma/migrations` between the two tags before promising a rollback.

## Traps

**`scp` fails against this NAS; `ssh … cat` works.** Pipe rather than copy.

**`compose.yaml` declares its own `name: courseshelf-release`.** A `docker
compose` command run without `-p` from a different directory creates a
_parallel empty stack_ instead of touching the real one — and reports success.

**Do not mix `tar cf -` with anything else that writes to stdout** in the same
ssh command; the archive arrives corrupt.

**The post-quantum key exchange warning on every `ssh nas` is noise**, not a
failure. It appears before real output.

**A backup before deploy is only cheap insurance when there is no migration.**
With one, dump first:

```sh
ssh nas 'docker exec courseshelf-release-postgres-1 \
  pg_dump -U courseshelf -Fc courseshelf > /tmp/pre-<new>.dump'
```

## Afterwards

Say which version is live and what verified it — the health endpoint's
`version` field, not "the containers came up". If anything in the procedure
turned out wrong, fix this file in the same pass: a deploy document that
describes a procedure nobody can follow is how `deploy-nas.sh` came to be
referenced in a comment for months without ever existing.
