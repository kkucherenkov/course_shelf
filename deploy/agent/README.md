# `deploy/agent` — the installer that ships with a release

An agent-driven installer for people who want to run CourseShelf on their
own machine and do not know Docker. It ships inside
`courseshelf-release-vX.Y.Z.tar.gz`: the user unpacks the bundle, runs
`claude` (or `codex`) in that directory, and says what they want.

```
deploy/agent/
├── CLAUDE.md                     role, tone, first-run behaviour, safety protocol
├── AGENTS.md                     pointer to CLAUDE.md, for Codex
├── .claude/skills/
│   ├── shelf-diagnose/           detect-state.sh + the field→reaction table
│   ├── shelf-install/            install.sh (step machine), verify-install.sh
│   ├── shelf-upgrade/            upgrade.sh (dump → swap → pull → verify)
│   └── shelf-manage/             manage.sh (status/start/stop/logs/backup/uninstall)
└── tests/run.sh                  the whole thing, against mocked docker and curl
```

## The split this is built on

`scripts/` collect **facts**; `SKILL.md` holds **judgement**.

`detect-state.sh` has no opinion about what any of its 37 fields means: it
is read-only, needs no root, exits 0 on a host with nothing installed, and
prints JSON. What to do about `has_users: false` lives in
`shelf-diagnose/SKILL.md`, in a table the agent reads in context. Facts can
then be tested; policy can be changed by editing prose.

So the agent never assembles its own `docker ps`/`curl` checks. When a fact
is missing, it becomes a new field in the probe. An improvised command is
untested, and it disagrees with the probe the next time someone runs both.

## The step machine

`install.sh` marks each finished step with a file in `.courseshelf/`, so
`--resume` continues from the first unfinished one and a pull that dies at
80% costs only that step. `--check` prints `[OK]`/`[TODO]` per step, which
is the only view of a half-finished install. `--fresh` clears the markers,
after a `cmp`-verified backup of the existing `.env`.

Step 8 exits non-zero while the instance has no account: a stack nobody can
sign in to is not an installed product. A marker goes down only after the
step passes its own check.

## Ownership

Everything the installer creates is appended to
`.courseshelf/.courseshelf_owned`, and `manage.sh uninstall` removes nothing
else. The course library is never recorded — "the path is in `.env`" is not
proof that CourseShelf created it, and that directory is the one thing here
that cannot be downloaded again.

## Tests

```sh
bash deploy/agent/tests/run.sh
```

Plain bash, no framework: fake `docker` and `curl` at the front of `PATH`,
temporary stack directories, assertions on stdout and on files. Covers the
JSON contract, the compose-derived `env_missing`, the resume/fresh marker
logic, secret stability across a resume, the architecture refusal, the
verification failures, and the uninstall guard. Runs in CI on every change
under `deploy/agent/`.

The scripts stay bash 3.2-compatible — that is `/bin/bash` on macOS and the
shell on some NAS firmware. It is the reason the step labels are a `case`
and not an associative array.
