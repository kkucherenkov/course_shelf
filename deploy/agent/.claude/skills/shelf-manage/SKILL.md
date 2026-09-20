---
name: shelf-manage
description: Use for day-to-day operations on an installed CourseShelf — starting and stopping it, reading logs, taking a database backup, and uninstalling. Also covers what an uninstall is allowed to delete.
---

# Running an installed CourseShelf

```bash
bash .claude/skills/shelf-manage/scripts/manage.sh status
bash .claude/skills/shelf-manage/scripts/manage.sh start | stop
bash .claude/skills/shelf-manage/scripts/manage.sh restart [service]
bash .claude/skills/shelf-manage/scripts/manage.sh logs [service] [lines]
bash .claude/skills/shelf-manage/scripts/manage.sh backup
bash .claude/skills/shelf-manage/scripts/manage.sh uninstall [--yes]
```

`status` is read-only — run it without asking. Everything else changes the
instance: show the command, say what it does in one sentence, wait for a
yes.

## Restart means backend and web

With no service named, `restart` bounces `backend` and `web`. Postgres,
Centrifugo and the proxy hold state or connections and are unaffected by an
application change, so restarting them costs uptime for nothing. Name a
service explicitly when there is a reason to.

## Reading logs

`logs backend` is the right first move for almost everything: the backend
runs the migrations, serves the API, and drives scanning and transcription.
Quote the actual lines back to the user rather than summarising them into
"there was an error" — and when the fix is not obvious from the log, say
that, instead of inventing a plausible cause.

## Backups

`backup` runs `pg_dump -Fc` inside the postgres container and writes to
`.courseshelf/backups/`. It refuses an empty dump rather than leaving a
zero-byte file that looks like insurance.

Two things it does **not** cover, and both are worth saying out loud when
the user asks about backing up:

- The course library. It is theirs and it is mounted read-only; CourseShelf
  never had a copy to give back.
- Generated artefacts under `DERIVED_PATH` — transcripts and thumbnails.
  They can be regenerated from the media, slowly.

## Uninstall

The manifest at `.courseshelf/.courseshelf_owned` lists what the installer
created, and the command removes nothing outside it. The course library is
never recorded there, so an uninstall cannot reach it.

Without `--yes` the command prints what would go and removes nothing. Show
that list to the user and let them read it before you pass `--yes`. Say
explicitly, from the output, which path is being kept.

The state directory survives an uninstall: it holds the database dumps and
the generated secrets. Tell the user it is still there and that deleting it
is theirs to do, once they are sure they want the dumps gone.
