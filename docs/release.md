# Cutting a release

Pushing a tag matching `vMAJOR.MINOR.PATCH-release` triggers
`.forgejo/workflows/release.yml`. The workflow builds and pushes four
release images (backend, web, proxy, centrifugo) to **GitHub Container
Registry** (ghcr.io), generates a Conventional-Commits-derived
changelog, and creates a **Forgejo Release** (on `code.homelab.local`)
with the changelog and a deploy-ready artefact bundle.

> **Why GHCR, not the homelab Forgejo registry**: the homelab Forgejo
> doesn't terminate TLS on its registry endpoint. Docker requires HTTPS
> by default and the only workaround (insecure-registries via
> daemon.json) needs systemd, which the act_runner's container init
> isn't. GHCR has proper TLS and the runner has internet access.

## One-time setup: GHCR credentials

Before the first release run, both secrets below must exist in
`Settings → Actions → Secrets` of this repository on Forgejo.

### 1. Create a GitHub Personal Access Token

1. Open <https://github.com/settings/tokens/new> (Classic PAT).
2. Fields:
   - **Note**: `forgejo-courseshelf-release`
   - **Expiration**: 90 days or 1 year (avoid "no expiration" — security risk).
   - **Scopes**: tick `write:packages` and `read:packages` only. The
     `repo` scope is **not** required if you publish to your own
     user-namespaced packages and don't link them to a private repo.
3. Click **Generate token**. Copy the `ghp_…` value — GitHub shows it
   once.

### 2. Add the secrets to Forgejo

`http://code.homelab.local/<owner>/course_shelf/settings/actions/secrets`
→ **Add Secret** twice:

| Name         | Value                                      |
| ------------ | ------------------------------------------ |
| `GHCR_USER`  | your GitHub username (e.g. `kkucherenkov`) |
| `GHCR_TOKEN` | the `ghp_…` value from step 1              |

The release workflow pre-flights both before doing anything expensive,
so a missing/empty secret fails fast with a clear error.

### 3. (Optional) Make the published packages public

After the first successful release run, packages appear at
`https://github.com/users/<USER>/packages`. Open each one →
**Package settings** → **Change visibility** → **Public** if you want
operators to pull them anonymously. Otherwise the deploy host needs
its own GHCR PAT for `docker pull`.

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
takes ~10–15 min for amd64-only builds (the GHCR push of four images
is the long part).

## What gets published

### Images on GHCR

For every release tag, four images are pushed under four tags each:

| Image                                   | Source                         |
| --------------------------------------- | ------------------------------ |
| `ghcr.io/<user>/courseshelf-backend`    | `apps/backend/Dockerfile`      |
| `ghcr.io/<user>/courseshelf-web`        | `apps/web/Dockerfile`          |
| `ghcr.io/<user>/courseshelf-proxy`      | `docker/nginx/Dockerfile`      |
| `ghcr.io/<user>/courseshelf-centrifugo` | `docker/centrifugo/Dockerfile` |

Each image is tagged `:0.2.0`, `:0.2`, `:0`, and `:latest` — pin to the
exact patch in production, use the floating tags for dev/staging if you
want to follow a major or minor lane.

### Release page on Forgejo

`http://code.homelab.local/<owner>/course_shelf/releases/tag/v0.2.0-release`
gets:

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

**Don't** reuse a tag whose images are already published: GHCR rejects
overwrites for immutable tags, and the workflow will fail at push. If
the run partially pushed (some of the four images), delete those
versions from GHCR via the package settings page, or bump the patch
number.

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
