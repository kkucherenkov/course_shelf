# Production image for the NestJS backend.
#
# Layout:
#   Stage 1 (build) installs every workspace dep, bundles the OpenAPI spec,
#   regenerates the TS client, generates the Prisma client, and compiles the
#   Nest app to `apps/backend/dist`.
#
#   Stage 2 (deploy) uses `pnpm deploy --prod` to materialise a self-
#   contained directory tree at `/app` with workspace symlinks inlined and
#   devDependencies stripped.
#
#   Stage 3 (runtime) is a slim alpine with node + ffmpeg + pg_dump + the
#   deployed tree. Entrypoint runs `prisma migrate deploy` then
#   `node dist/main.js`.
#
# Build:    docker build -f apps/backend/Dockerfile -t courseshelf/backend:latest .
# (build context = repo root so the Dockerfile can see every workspace package)

# ─── Stage 1 — install + build ────────────────────────────────────────────
FROM node:24-alpine AS build

# openssl + libc6-compat are required by Prisma's alpine query engine.
RUN apk add --no-cache openssl libc6-compat \
    && corepack enable

WORKDIR /workspace

ENV CI=1 \
    PNPM_HOME=/root/.local/share/pnpm \
    PATH=/root/.local/share/pnpm:$PATH

# Lockfile + workspace manifests for a cache-friendly install layer.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/web/package.json apps/web/
COPY packages/api-client-ts/package.json packages/api-client-ts/
COPY packages/design-tokens/package.json packages/design-tokens/
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/specs/package.json packages/specs/
COPY packages/tsconfig/package.json packages/tsconfig/
COPY packages/ui/package.json packages/ui/

# `--ignore-scripts` skips lifecycle hooks at install time. We run them
# explicitly below once the source is available — without this the root
# `prepare` (`husky && pnpm --filter @app/api-client-ts build`) trips
# because the TS client source hasn't been copied yet.
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy the rest of the source. .dockerignore strips node_modules, .nuxt,
# .turbo, apps/mobile, packages/api-client-dart, etc.
COPY . .

# Bundle the spec, build the TS client (the backend imports it for
# DTOs), generate the Prisma client, compile Nest.
RUN pnpm --filter @app/specs bundle \
    && pnpm --filter @app/api-client-ts build \
    && pnpm --filter @app/backend prisma:generate \
    && pnpm --filter @app/backend build

# ─── Stage 2 — deploy ─────────────────────────────────────────────────────
FROM build AS deploy

# `pnpm deploy --prod` resolves the @app/backend workspace graph and emits
# a self-contained tree at /app: backend source files + flattened
# node_modules with workspace deps inlined, devDeps pruned.
RUN pnpm deploy --filter=@app/backend --prod --legacy /app

# Prisma's CLI is needed at runtime for `migrate deploy`. The schema +
# migrations live under apps/backend/prisma; pnpm deploy already copied
# them into /app/prisma but be defensive and re-copy the schema dir.
RUN cp -r apps/backend/prisma /app/prisma

# Regenerate the Prisma client INSIDE the deploy tree. The earlier
# `prisma generate` ran against the workspace's content-addressed
# pnpm store; pnpm deploy copies node_modules but the generated
# `.prisma/client/default.js` artifact lives inside the store and
# doesn't always survive the copy. Re-running `generate` in the
# deploy tree writes the artifact to the right `node_modules/.prisma/`
# so `require('.prisma/client/default')` resolves at runtime.
WORKDIR /app
RUN node ./node_modules/prisma/build/index.js generate --schema=./prisma/schema.prisma
WORKDIR /workspace

# ─── Stage 3 — runtime ────────────────────────────────────────────────────
FROM node:24-alpine AS runtime

# ffmpeg ships ffprobe — the catalog scanner uses it to read video metadata.
# openssl + libc6-compat are required by Prisma's alpine query engine.
# tini forwards signals so SIGTERM stops the Nest app cleanly.
#
# postgresql18-client ships pg_dump for POST /api/v1/admin/backups. The major
# is pinned deliberately: pg_dump refuses to dump a server newer than itself,
# and compose runs postgres 18.1. `postgresql-client` (unversioned) would
# float to whatever major the base image's alpine release carries and would
# start failing at some future base bump, in a way that only shows up when an
# admin tries to take a backup. The endpoint compares the two majors at
# request time and answers 503 rather than writing a partial archive, so a
# mismatch is loud — but the pin is what stops it happening.
RUN apk add --no-cache ffmpeg openssl libc6-compat tini postgresql18-client

WORKDIR /app

# APP_VERSION is baked at build time so AppConfig (apps/backend/src/common/
# config/app-config.ts) reports the correct version on /api/v1/health and
# in observability metadata. Default keeps `0.0.0-dev` for local builds;
# the release workflow overrides via `--build-arg APP_VERSION=<semver>`.
ARG APP_VERSION=0.0.0-dev

ENV NODE_ENV=production \
    PORT=3000 \
    APP_VERSION=${APP_VERSION} \
    # AppConfig's default is an os.tmpdir() path so the endpoint works on a bare
    # dev host. In the image the directory below is created and owned by `node`,
    # so point at it — and mount a volume there if archives should outlive the
    # container.
    BACKUP_DIR=/data/backups

COPY --from=deploy /app/ ./

# Default mount point for course data. Admins point libraries here from
# the SPA. Override via the `COURSES_PATH` host bind in compose. The
# chown lets the non-root `node` user write thumbnails next to videos
# when the host bind doesn't override ownership.
RUN mkdir -p /data/courses /data/backups \
    && chown -R node:node /app /data/courses /data/backups

EXPOSE 3000

# Drop privileges before the app boots. The `node` user (uid 1000) ships
# with the official node:24-alpine image — no useradd needed.
USER node

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "node ./node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma && exec node ./dist/main.js"]
