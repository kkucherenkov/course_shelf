# T-2026-09-20-deploy-agent-installer — Ship an agent-as-installer in the release bundle

- Created: 2026-09-20
- Owner: claude
- Spec: none — pattern lifted from [Zapret2agent](https://github.com/howdeploy/Zapret2agent)
  (a skill layer over a read-only state probe) and
  [Xrayebator](https://github.com/howdeploy/Xrayebator) (`install.sh` step
  markers, an ownership manifest for what the installer may remove).
- Goal: a person who wants their own CourseShelf and does not know Docker can
  stand one up, upgrade it, and keep it running by talking to an agent that
  ships inside the release bundle.
- Acceptance:
  - `detect-state.sh` prints valid JSON on a host with no Docker, no stack and
    no `.env`, exit code 0.
  - `env_missing[]` is derived from the compose file's own `${VAR:?}` markers,
    so a newly-required variable appears without editing the probe.
  - `install.sh --check` prints `[OK]`/`[TODO]` per step and names the next
    one; `--resume` continues from it; `--fresh` clears the markers after a
    `cmp`-verified backup of the existing `.env`.
  - Uninstall removes only paths listed in `.courseshelf_owned`; a
    pre-existing `COURSES_PATH` survives it.
  - `courseshelf-release-vX.Y.Z.tar.gz` contains `CLAUDE.md`, `AGENTS.md` and
    `.claude/skills/` at its root, and the probe finds the stack from there
    with no environment variable set.
  - An `.env` copied from `.env.release.example` with only the `change-me`
    markers filled passes `docker compose config -q`.
- Spec diff: none — no HTTP route or channel changed.
- Codegen impact: no.
- Design impact: none.
- Tests: `deploy/agent/tests/run.sh` — 39 assertions, plain bash with fake
  `docker`/`curl` on `PATH`. Deliberately not bats: the repo has no shell test
  runner, and bats would add a host install plus a CI job for four scripts.
  Wired into `ci.yml` behind a `deploy/agent/**` path filter.
- Sub-steps:
  - [x] `.env.release.example` + `.env.production.example`: add `DERIVED_PATH`
        and `WHISPER_MODEL_DIR`. Both compose files require `DERIVED_PATH` via
        `:?` and neither example listed it, so every install following the
        bundle README failed on `up -d`. Verified before/after with
        `docker compose config -q`.
  - [x] `deploy/agent/CLAUDE.md` + `AGENTS.md` (a pointer, not a copy) —
        audience, tone, first-run behaviour, blocking confirmation protocol.
  - [x] `shelf-diagnose` — `detect-state.sh` (37 fields) + `SKILL.md` with the
        field→reaction table and the `OK / ⚠️ / ❗` output format.
  - [x] `shelf-install` — `install.sh` (8 steps, markers,
        `--check/--resume/--fresh`, ownership manifest) + `verify-install.sh` + `SKILL.md`.
  - [x] `shelf-upgrade` — `upgrade.sh` (dump → swap compose → pull → verify by
        version, `--rollback`) + `SKILL.md`. Migrations stay the backend
        container's job (`apps/backend/Dockerfile:256`); the script only reads
        the migration line out of the log.
  - [x] `shelf-manage` — `manage.sh` (status/start/stop/restart/logs/backup/
        uninstall) + `SKILL.md`.
  - [x] `deploy/agent/tests/run.sh` + an `installer` job in `ci.yml`.
  - [x] `release.yml`: copy the agent into `$STAGE`, and rewrite the bundle
        README around it.
  - [x] Docs: `README.md`, `README.ru.md`, `docs/deployment.md`,
        `deploy/agent/README.md`.
- Deviations from the plan, and why:
  - **No `health-check.sh`.** It would have been a second copy of the
    diagnose table, in bash, free to disagree with the first. The probe
    reports facts; `SKILL.md` holds the judgement.
  - **No `check-install-ready.sh`.** `detect-state.sh` already answers every
    question it would have asked.
  - **`manage.sh` is one file, not three.** Every subcommand is the same two
    facts — the stack directory and the env file — around one docker command.
  - **Eight steps, not nine.** "Create the first admin" cannot be verified
    from bash as a step, so it is the dialogue in `SKILL.md` and a check
    inside step 8 instead of a marker that would have to be set on trust.
  - **bash 3.2, not 4.** `declare -A` for the step labels would have excluded
    macOS's `/bin/bash` and some NAS firmware; a `case` costs nothing.
- Corrected in passing: the first draft of the docs claimed a fresh instance
  needs `/sign-up` typed by hand because `AUTH_SELF_REGISTRATION=false` hides
  the link. `apps/web/app/middleware/auth.global.ts:84-88` redirects every
  route to the wizard while `hasUsers === false`, so opening the base URL is
  enough. Fixed in all six places before commit.
- Status: done
- Blockers: —
- Completed: 2026-09-20
- Result: https://github.com/kkucherenkov/course_shelf/pull/754
