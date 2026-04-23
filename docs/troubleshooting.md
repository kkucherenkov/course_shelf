# Troubleshooting

Known gotchas for the toolchain this boilerplate pins. Every entry lists the
symptom, the actual cause, and the fix. Updated as we hit new ones.

## Prisma 7 — `P1012: datasource url argument` on `prisma generate`

**Symptom:**
```
error: Error validating datasource `db`: the url argument is required, but it was not set.
```

**Cause:** Prisma 7 moved `datasource.url` out of `schema.prisma`. It now
lives in `prisma.config.ts`.

**Fix:** Ensure `apps/backend/prisma.config.ts` contains:
```ts
export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: { path: path.join('prisma', 'migrations') },
  datasource: { url: process.env.DATABASE_URL },
});
```
Remove any `url = env("DATABASE_URL")` line from `schema.prisma`.

## Prisma 7 — `--skip-generate` rejected

**Symptom:** `prisma db push --skip-generate --accept-data-loss` fails with
`unknown flag --skip-generate`.

**Cause:** Prisma 7 removed the flag; `prisma generate` no longer runs as part
of `db push`.

**Fix:** Drop `--skip-generate` from scripts. Run `prisma generate` as a
separate step when needed.

## Vite 8 — `TSCONFIG_ERROR` on `vitest` or build

**Symptom:**
```
[vite:oxc] TSCONFIG_ERROR: cannot resolve extends "@app/tsconfig/..."
```

**Cause:** Vite 8 ships a built-in oxc TS transform that can't resolve
`extends` via workspace package names.

**Fix:** In every Vite/Vitest config that loads workspace tsconfigs:
```ts
export default defineConfig({
  plugins: [tsconfigPaths({ ignoreConfigErrors: true }), swc.vite({ module: { type: 'es6' } })],
  oxc: false,
  // …
});
```

## `@nuxtjs/i18n` — `optimizeTranslationDirective` does not exist

**Symptom:** `nuxt typecheck` fails on `nuxt.config.ts` with
`'optimizeTranslationDirective' does not exist in type`.

**Cause:** The option was removed in a recent `@nuxtjs/i18n` release. Dependabot
bumped past the removal.

**Fix:** Delete the `bundle.optimizeTranslationDirective: false` block from
`nuxt.config.ts`.

## Vitest 4 — coverage drops to single digits

**Symptom:** `pnpm test:coverage` passes tests but fails thresholds; coverage
shows e.g. 14% lines where it used to be 60%+.

**Cause:** Vitest 4 / `@vitest/coverage-v8` widened the denominator to include
every file matched by `coverage.include`, not only files imported by a test.

**Fix:** Lower thresholds to the new reality or narrow `coverage.include` to
files you actually test. Don't add `coverage.all: false` — it's gone.

## `pnpm/action-setup@v6` — `Multiple versions of pnpm specified`

**Symptom:** CI step fails immediately with
`Multiple versions of pnpm specified: - version X in the GitHub Action config
with the key "version" - version Y in the package.json with the key
"packageManager"`.

**Cause:** v6 refuses to pick a version when both sources declare one.

**Fix:** Remove `with: { version: … }` from every `pnpm/action-setup@v6` step
and let `packageManager` in root `package.json` be the single source.

## Trufflehog — `BASE and HEAD commits are the same`

**Symptom:** Secret-scanning CI step exits 1 on push-to-main with
`BASE and HEAD commits are the same. TruffleHog won't scan anything`.

**Cause:** The action was configured with `base: default_branch, head: HEAD`.
On a push-to-default-branch, those refs resolve to the same commit.

**Fix:**
```yaml
base: ${{ github.event.pull_request.base.sha || github.event.before }}
head: ${{ github.event.pull_request.head.sha || github.sha }}
```

## `license-checker` — `UNLICENSED which is not permitted`

**Symptom:** CI security-audit step fails on a workspace package like
`@app/eslint-config` with `licensed under "UNLICENSED"`.

**Cause:** Private workspace packages inherit no license; `license-checker`
counts them anyway.

**Fix:** Add `--excludePrivatePackages` to the invocation.

## Codegen drift CI — `Missing .../dist/openapi.json`

**Symptom:** `codegen-drift` CI job fails with `Missing /…/packages/specs/dist/openapi.json. Run pnpm ...bundle first.`

**Cause:** `spec:codegen` needs `dist/openapi.json` from `spec:bundle`. A CI
job that runs only `pnpm spec:codegen` on a fresh runner has no bundle.

**Fix:** The root script now goes through turbo
(`turbo run codegen --filter=@app/specs`), which chains
`validate → bundle → codegen` automatically. If you forked before this change,
either update to the turbo-based script or add an explicit `pnpm spec:bundle`
step before codegen in your CI.

## Docker compose — backend container unhealthy on first boot

**Symptom:** `docker compose up -d` — backend stays `starting` forever, logs
show `P3005: The database schema is not empty`.

**Cause:** Greenfield repos have no migrations, but the backend was trying to
run `prisma migrate deploy` against an empty history.

**Fix:** `Dockerfile.dev` CMD uses `prisma db push` (declarative apply), not
`migrate deploy`. If you fork and add real migrations later, switch back to
`migrate deploy` in CMD.

## Flutter — SDK version mismatch after upgrading macOS or Xcode

**Symptom:** `flutter analyze` or `flutter pub get` complains about Dart SDK
range.

**Cause:** The repo pins Flutter 3.41 in CI (`.github/workflows/ci.yml`) and
in `.devcontainer/devcontainer.json`. Local `fvm` or brew-installed Flutter
may drift.

**Fix:** Use `fvm` with `.fvmrc` pointing at `3.41.0`, or install via
`flutter-action` in a devcontainer. Don't bump the pin ad-hoc — it ripples
into generated code via `dart run build_runner`.
