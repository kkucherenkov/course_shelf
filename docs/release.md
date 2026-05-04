# Cutting a release

Pushing a tag matching `vMAJOR.MINOR.PATCH-release` triggers
`.forgejo/workflows/release.yml`. The workflow builds and pushes four
release images (backend, web, proxy, centrifugo) to the Forgejo OCI
registry, generates a Conventional-Commits-derived changelog, and
creates a Forgejo Release with the changelog and a deploy-ready
artefact bundle.

## Prerequisites

- Working tree on `main`, all PRs for this release merged.
- `cliff.toml` is committed (it is) — no per-release config edits needed.
- The Forgejo runner has access to the `code.homelab.local` registry.
  This is implicit when the runner lives on the same network; verify
  once on the first release.
- Repository secret `GITEA_TOKEN` exists. Forgejo Actions exposes this
  automatically for every workflow; if the registry login step fails,
  check repo Settings → Secrets.

## Cutting the release

```sh
# 1. Bump version in the root package.json.
npm version 0.2.0 --no-git-tag-version

# 2. Commit the bump.
git add package.json
git commit -m "chore(root): bump version to 0.2.0"
git push origin main

# 3. Tag and push.
git tag v0.2.0-release
git push origin v0.2.0-release
```

The push to `v0.2.0-release` triggers the workflow. Watch the run at
`http://code.homelab.local/<owner>/course_shelf/actions`. End-to-end
takes ~5–7 min for amd64-only builds.

## What gets published

For every release tag, four images are pushed under four tags each:

| Image                                            | Source                         |
| ------------------------------------------------ | ------------------------------ |
| `code.homelab.local/<ns>/courseshelf-backend`    | `apps/backend/Dockerfile`      |
| `code.homelab.local/<ns>/courseshelf-web`        | `apps/web/Dockerfile`          |
| `code.homelab.local/<ns>/courseshelf-proxy`      | `docker/nginx/Dockerfile`      |
| `code.homelab.local/<ns>/courseshelf-centrifugo` | `docker/centrifugo/Dockerfile` |

Each image is tagged `:0.2.0`, `:0.2`, `:0`, and `:latest` — pin to the
exact patch in production, use the floating tags for dev/staging if you
want to follow a major or minor lane.

The Forgejo Release page also gets:

- `courseshelf-release-v0.2.0.tar.gz` — bundle with `compose.yml`,
  `.env.example`, `CHANGELOG.md`, and a one-page README.
- `compose-release-v0.2.0.yml` — standalone compose file with
  `RELEASE_TAG`, `REGISTRY`, and `REGISTRY_NAMESPACE` already pinned.
- `.env.release.example` — env contract template.
- `release-notes.md` — the changelog as a standalone file.

## Re-running a failed release

If the workflow fails halfway (e.g. `docker push` 503), delete the
remote tag and any partially-uploaded images, then re-tag:

```sh
git push origin :refs/tags/v0.2.0-release
git tag -d v0.2.0-release
# … fix the underlying issue …
git tag v0.2.0-release
git push origin v0.2.0-release
```

**Don't** reuse a tag whose images are already published: the registry
will reject overwrites, and the workflow will fail at push.

## Versioning policy

- `MAJOR` — incompatible API change (OpenAPI breaking change, Postgres
  schema requires manual migration, breaking change to env contract).
- `MINOR` — backward-compatible feature (new endpoint, new env var with
  a default).
- `PATCH` — backward-compatible fix.

The `-release` suffix exists only to keep this tag namespace distinct
from in-flight tags like `v0.2.0-rc.1` (currently rejected — pre-release
support is a deliberate future story).

## Future work

- **Multi-arch (arm64)**: add `setup-buildx` + `setup-qemu` steps and
  `--platform linux/amd64,linux/arm64` to the build commands.
- **Image signing (cosign)**: harden the supply chain.
- **Mirror to Docker Hub / GHCR**: when those credentials are available.
- **Pre-release lane**: a parallel `prerelease.yml` for `vX.Y.Z-rc.N-release`.
