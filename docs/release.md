# Cutting a release

Pushing a tag matching `vMAJOR.MINOR.PATCH-release` triggers
`.forgejo/workflows/release.yml`. The workflow builds and pushes two
release images (backend, web) to the **homelab Forgejo container
registry** (`code.homelab.local`), generates a
Conventional-Commits-derived changelog, and creates a **Forgejo
Release** (on the same host) with the changelog and a deploy-ready
artefact bundle. The proxy and centrifugo services run upstream images
directly and are not built by this pipeline.

> **Why the local registry**: the homelab is fully self-hosted — images
> should never leave the LAN just to be pulled back onto it. The
> act_runner's dind daemon is already started with
> `--insecure-registry=code.homelab.local` (and resolves the host via
> `extra_hosts`), so the push works over plain HTTP without any systemd
> restart. The host daemon that runs the deploy (Dockge) needs the same
> trust to pull — see [`deployment.md`](./deployment.md).

## One-time setup: registry credentials

The registry lives on the **same Forgejo instance** the runner belongs
to, so the auto-provided `GITEA_TOKEN` authenticates the package push —
**no manual secret is required** for the default path.

If your Forgejo instance scopes package writes separately from the
Actions token, create a PAT and wire it in:

1. `http://code.homelab.local/<owner>/-/user/settings/applications` →
   generate a token with the **`write:package`** scope.
2. Add it as a secret at
   `http://code.homelab.local/<owner>/course_shelf/settings/actions/secrets`
   named `FORGEJO_PKG_TOKEN`. The workflow's login step prefers it over
   `GITEA_TOKEN` when present.

Packages published by the workflow appear under the owner's **Packages**
tab on Forgejo. Whether the deploy host can pull them anonymously
depends on the repo/package visibility on your instance — if private,
the host runs `docker login code.homelab.local` once (see
[`deployment.md`](./deployment.md)).

## Cutting the release

```sh
# 1. Bump version in the root package.json (skip if already at target).
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
takes ~10–15 min for amd64-only builds (the image build is the long
part; the push stays on the LAN).

## What gets published

### Images on the Forgejo registry

For every release tag, two images are pushed under four tags each:

| Image                                            | Source                    |
| ------------------------------------------------ | ------------------------- |
| `code.homelab.local/<owner>/courseshelf-backend` | `apps/backend/Dockerfile` |
| `code.homelab.local/<owner>/courseshelf-web`     | `apps/web/Dockerfile`     |

Each image is tagged `:0.2.0`, `:0.2`, `:0`, and `:latest` — pin to the
exact patch in production, use the floating tags for dev/staging if you
want to follow a major or minor lane.

The proxy and centrifugo services in `compose.release.yml` run upstream
images directly (`nginxinc/nginx-unprivileged:1.27-alpine` and
`centrifugo/centrifugo:v6`) and are not part of the release-pipeline
artefacts. They are pulled by `docker compose pull` like any other
upstream image.

### Release page on Forgejo

`http://code.homelab.local/<owner>/course_shelf/releases/tag/v0.2.0-release`
gets:

- `courseshelf-release-v0.2.0.tar.gz` — bundle with `compose.yml`,
  `nginx-prod.conf` (bind-mounted by the proxy service), `.env.example`,
  `CHANGELOG.md`, and a one-page README.
- `compose-release-v0.2.0.yml` — standalone compose file with
  `RELEASE_TAG`, `REGISTRY`, and `REGISTRY_NAMESPACE` already pinned.
- `.env.release.example` — env contract template.
- `release-notes.md` — the changelog as a standalone file.

## Upgrade note for the release that drops wrapper images

The release that introduces this change removes two images from GHCR:

- `ghcr.io/<user>/courseshelf-proxy`
- `ghcr.io/<user>/courseshelf-centrifugo`

Operators upgrading across this version must extract the new bundle
**fully** — `compose.yml` now bind-mounts `nginx-prod.conf` from the
bundle, so `tar xzf courseshelf-release-vX.Y.Z.tar.gz` is mandatory. A
partial extraction (or copying just `compose.yml` out of the tarball)
will fail at proxy start with `no such file or directory`.

Existing GHCR packages for the two retired images can be left in place
or deleted via the package settings page. They will not be referenced
by any future release.

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
rejects overwrites for immutable tags, and the workflow will fail at
push. If the run partially pushed (only one of the two images), delete
those versions from the owner's **Packages** page on Forgejo, or bump
the patch number.

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
- **Image signing (cosign)**: harden the supply chain once there's a
  real distribution audience.
- **Mirror to Docker Hub**: when (if) those credentials are available.
- **Pre-release lane**: a parallel `prerelease.yml` for
  `vX.Y.Z-rc.N-release`.
