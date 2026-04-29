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
#   Stage 3 (runtime) is a slim alpine with node + ffmpeg + the deployed
#   tree. Entrypoint runs `prisma migrate deploy` then `node dist/main.js`.
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

# ─── Stage 3 — runtime ────────────────────────────────────────────────────
FROM node:24-alpine AS runtime

# ffmpeg ships ffprobe — the catalog scanner uses it to read video metadata.
# openssl + libc6-compat are required by Prisma's alpine query engine.
# tini forwards signals so SIGTERM stops the Nest app cleanly.
RUN apk add --no-cache ffmpeg openssl libc6-compat tini

WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

COPY --from=deploy /app/ ./

# Default mount point for course data. Admins point libraries here from
# the SPA. Override via the `COURSES_PATH` host bind in compose.
RUN mkdir -p /data/courses

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "node ./node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma && exec node ./dist/main.js"]
