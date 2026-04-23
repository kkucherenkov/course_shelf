# Troubleshooting

Known gotchas for the toolchain this boilerplate pins. Every entry lists the
symptom, the actual cause, and the fix. Updated as we hit new ones.

**Rule of thumb:** if a workaround can be replaced by a structural fix (change
the config, change the layout, pin a different version), fix it and delete the
entry. This file is for genuinely upstream-recurring issues — not a graveyard
of one-off bumps.

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

## Flutter — SDK version mismatch after upgrading macOS or Xcode

**Symptom:** `flutter analyze` or `flutter pub get` complains about Dart SDK
range.

**Cause:** The repo pins Flutter 3.41 in CI (`.github/workflows/ci.yml`) and
in `.devcontainer/devcontainer.json`. Local `fvm` or brew-installed Flutter
may drift.

**Fix:** Use `fvm` with `.fvmrc` pointing at `3.41.0`, or install via
`flutter-action` in a devcontainer. Don't bump the pin ad-hoc — it ripples
into generated code via `dart run build_runner`.
