---
name: shelf-upgrade
description: Use when the user wants to move an installed CourseShelf to a newer release, to a specific version, or back to the one they were on. Covers the pre-upgrade dump, the compose swap, and verifying by version rather than by container status.
---

# Upgrading a CourseShelf instance

Run `shelf-diagnose` first. `installed_version` and `latest_version` are the
two numbers this conversation is about; say both before proposing anything.

```bash
bash .claude/skills/shelf-upgrade/scripts/upgrade.sh --to latest
bash .claude/skills/shelf-upgrade/scripts/upgrade.sh --to v1.8.0
bash .claude/skills/shelf-upgrade/scripts/upgrade.sh --rollback
```

## What the script does, in order

1. **Dumps the database** with `pg_dump -Fc` into `.courseshelf/backups/`.
   Unconditional. Whether the target release carries a migration is not
   knowable from the host, and a dump is cheap next to the alternative.
2. **Backs up `compose.yml`**, verified with `cmp`, and records where.
3. **Downloads the target release's compose file** and refuses it unless it
   actually pins the version requested.
4. **Pulls and restarts `backend` and `web` only.** Postgres, Centrifugo and
   the proxy are unchanged by a release; restarting them costs uptime for
   nothing.
5. **Waits for the new version to answer**, prints the migration line from
   the backend log, and runs `verify-install.sh <version>`.

## Migrations belong to the container, not to this script

The backend image's command is `prisma migrate deploy && node dist/main.js`.
The schema moves when the new container starts, and Prisma's
`_prisma_migrations` table is the record of it. Never run `migrate deploy`
by hand alongside that: a second runner is a second opinion about the same
state.

What the log line tells you afterwards:

- `No pending migrations to apply.` — this release carried none. Expected
  for a patch release; **suspicious** if the user was told the upgrade
  contains a schema change, because it means the image is older than
  believed.
- An applied-migration line — the schema moved. Say so, and say plainly that
  a rollback from here is no longer just an image swap.

## Rollback

`--rollback` restores the saved compose file and restarts. It undoes the
**images**. It does not undo a migration.

If the release that was just installed applied one, say this before doing
anything: going back means restoring the pre-upgrade dump too, and every
change made since the upgrade will be lost with it. Let the user decide with
that in front of them.

## Verify with the version

`Up (healthy)` says the process answers, not which build it is. A pull that
quietly kept the old image comes up healthy. `verify-install.sh <version>`
fails when the reported version is not the one deployed — that is the check
worth reporting, and the one to quote when you say the upgrade landed.
