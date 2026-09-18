## T-2026-09-15-release-image-smoke — release gate proves the image builds, never that it runs

- Created: 2026-09-15
- Owner: claude
- Spec: none — `.github/workflows/release.yml` only. Closes #507.
- Goal: a non-portable whisper.cpp build (implicit `-march=native`, the exact
  1.3.0 defect — every gate green, backend unit tests run
  `WHISPER_MODE=mock` so the real binary never executes, only found on the
  target NAS as `Illegal instruction (core dumped)`) fails the release job,
  before the image is pushed to ghcr and before the GitHub release is
  created — not after, on deploy.
- Measured before writing the step (this repo, this Dockerfile, this shell):
  - `docker/compose.ci.yml`'s own comment confirms even the e2e job's
    production-shaped backend image sets `WHISPER_MODE: mock` — so no
    existing gate (unit, e2e) ever executes real `whisper-cli`, PR or
    release.
  - Built `apps/backend/Dockerfile`'s whisper stage standalone (pinned
    `v1.9.3`, identical `GGML_NATIVE=OFF` + explicit AVX2/FMA/F16C flags),
    ran it against a real `ggml-tiny.bin` (huggingface, ~74 MB, ~4s to
    fetch) and a 1s silent wav generated in-container via
    `ffmpeg -f lavfi -i anullsrc`: exit 0, transcribes in ~290ms.
  - Confirmed the failure signature independently: `sh -c "kill -ILL \$\$"`
    inside `node:24-alpine` prints `Illegal instruction (core dumped)` to
    stderr and exits 132 — busybox ash reports SIGILL the same way bash
    does, so checking exit code alone would already catch it, but the step
    also greps the captured output per the issue's explicit ask.
  - `workflow_dispatch` (render+validate against HEAD, no build/push) already
    exists on this file — landed with #487, not something this task adds.
- Design: split the single "Build and push release images" step into build →
  smoke → push, so a step in between can run the just-built backend image
  before anything leaves the runner. Steps downstream (`if:` conditions
  without `always()`) default to `success()`, so a failed smoke step already
  stops push/bundle/release without an extra guard.
- Sub-steps:
  - [x] measure (see above)
  - [x] split build/push, insert whisper smoke step in between
  - [x] `actionlint` on the changed file
  - [x] open PR with `Closes #507` —
        [#550](https://github.com/kkucherenkov/course_shelf/pull/550); asked
        the maintainer about extending `workflow_dispatch` to also
        build+smoke the backend image (currently render+validate only), not
        decided unilaterally
- Status: done
- Completed: 2026-09-15
- Blockers: — (file only runs on a real release tag or manual dispatch;
  cannot be exercised by this PR's own CI)
