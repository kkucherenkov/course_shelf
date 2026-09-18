## T-2026-09-18-repo-lane-cleanups — five cheap repo-hygiene fixes (lane 'repo')

- Created: 2026-09-18
- Owner: claude
- Spec: none — bookkeeping/config fixes, no contract change
- Goal: close five small drift/hygiene defects in ignore files, the visual-test
  port collision, and the NAS deploy docs, without touching any owned surface
  of the other two parallel lanes.
- Acceptance:
  - `docs/roadmap/tools/__pycache__/` no longer shows as untracked
  - a local `derived/` bind-mount directory is not sent to the Docker build context
  - `packages/ui`'s `test:visual:ci` and Storybook dev no longer fight over port 6006
  - `docs/deploy-ugreen-nas-dockge.md`'s "Updating to a new release" section
    matches the procedure in `.claude/skills/deploy-nas/SKILL.md`
  - the NAS's live `compose.yaml` no longer promises a `deploy-nas.sh` that
    does not exist — **not landed by this PR**, see blocker below
- Spec diff: none
- Codegen impact: no
- Design impact: none
- Tests: none (config/docs only); verified `pnpm --filter @app/ui test:visual:ci`
  still passes with the default port and that CI workflows set no override
- Sub-steps:
  - [x] (169) `.gitignore`: ignore `docs/roadmap/tools/__pycache__/`
  - [x] (211) `.dockerignore`: ignore `/derived`
  - [x] (238) `packages/ui/package.json`: parameterise the visual-test port
        (`STORYBOOK_TEST_PORT`, default 6006 — checked `.github/workflows/*`
        for anything assuming 6006 literally; `quality.yml` and
        `regen-snapshots.yml` call `test:visual:ci` with no port override, so
        the default keeps CI unchanged. `docker/compose.yml` maps
        `${CS_STORYBOOK_PORT:-6006}:6006` for the storybook **dev container**,
        unrelated to this script and out of this lane's owned files anyway.)
  - [x] (176) rewrite `docs/deploy-ugreen-nas-dockge.md` § Updating to a new
        release to match `.claude/skills/deploy-nas/SKILL.md` (literal tags in
        `compose.yaml`, sed in place, verify via `/api/v1/health`'s `version`)
  - [x] (177) decided: delete the phantom-script promise, not write the script.
        The sed-in-place tag bump in the real procedure (rewritten in 176)
        never touches the `postgres.volumes` line, so a bind-mounted `pgdata`
        already survives every ordinary update with no script involved — a
        script would exist to solve a case the procedure itself doesn't
        create. Only copying in a fresh `compose.yaml` (a release that
        changed it) drops the bind mount, and the deploy doc already tells
        the reader to re-apply it by hand then.
  - [ ] (177) **not applied** — confirmed by SSH that the NAS's live
        `compose.yaml` carries the exact comment quoted in the brief, at
        the `postgres.volumes:` line. Writing the fix back over SSH was
        denied by this session's auto-mode guard (`Remote Shell Writes`) —
        reads were allowed, the write was not. Replacement text below.
- Status: blocked
- Blockers: (177)'s live-NAS edit needs the maintainer — remote-write to the
  NAS is outside what this session's auto-mode guard allows. Everything else
  is done; open a task or apply the patch below by hand.

Patch for the maintainer — on the NAS, replace the 4-line comment above
`- /volume2/docker/courseshelf/pgdata:/var/lib/postgresql` in
`/volume1/docker/dockge/stacks/courseshelf/compose.yaml`:

```
# Bind mount instead of the shipped named volume: the Docker root sits
# on /volume1, which is 95% full. Manual, not scripted — deploy-nas
# (.claude/skills/deploy-nas/SKILL.md) sed-edits only the two image
# tags in this same file in place, so this line survives every
# ordinary update untouched. Re-apply it by hand only if a release
# ever ships a changed compose.yml that gets copied in fresh.
```
