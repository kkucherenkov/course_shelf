# Troubleshooting

Known gotchas for the toolchain this boilerplate pins. Every entry lists the
symptom, the actual cause, and the fix. Updated as we hit new ones.

**Rule of thumb:** if a workaround can be replaced by a structural fix (change
the config, change the layout, pin a different version), fix it and delete the
entry. This file is for genuinely upstream-recurring issues — not a graveyard
of one-off bumps.

## openapi-generator-cli — `Unable to locate a Java Runtime` on `pnpm spec:codegen`

**Symptom:**

```
[codegen] 3/3 openapi-generator-cli (dart-dio) → @app/api-client-dart
The operation couldn't be completed. Unable to locate a Java Runtime.
Please visit http://www.java.com for information on installing Java.
```

`pnpm spec:codegen` makes it through the `openapi-typescript` and
`@hey-api/openapi-ts` legs, then fails on the Dart leg.

**Cause:** `@openapitools/openapi-generator-cli` is a thin Node wrapper around
the upstream Java `openapi-generator` JAR. It needs a real JVM on the host.
On a stock macOS install, `/usr/bin/java` is just a shim that prints the
"Unable to locate a Java Runtime" message — no JDK is present.

**Fix:** install OpenJDK 21 (the closest LTS to the one Homebrew ships):

```sh
brew install openjdk@21
# Either symlink it system-wide (sudo, optional):
sudo ln -sfn /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk \
  /Library/Java/JavaVirtualMachines/openjdk-21.jdk
# … or set JAVA_HOME in your shell rc:
export JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"
```

`java -version` should then print `openjdk version "21.x"` and
`pnpm spec:codegen` runs end-to-end. Linux + Windows: install OpenJDK 21
through your package manager (`apt install openjdk-21-jre-headless`,
`choco install openjdk21`, etc.). CI: add
`actions/setup-java@v4` with `distribution: temurin, java-version: '21'`
to any workflow that calls `pnpm spec:codegen`.

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

## ffmpeg/ffprobe — Unable to extract video metadata or thumbnails

**Symptom:**

Scan completes with status `succeeded` but `LessonDto.durationSeconds` stays
`null` and no `*.thumb.jpg` files appear next to the video files. The scan
response may include `ScanError` entries with `code: "ffmpeg-probe-failed"` or
`code: "ffmpeg-thumbnail-failed"`.

**Cause:** The scanner shells out to `ffprobe` and `ffmpeg` via
`child_process.execFile`. If neither binary is on `PATH` (or the configured
absolute path is wrong), the call fails, the error is recorded as a `ScanError`,
and the walk continues — no metadata is extracted and no poster is written.

**Fix (local dev):**

```sh
# macOS
brew install ffmpeg    # installs both ffmpeg and ffprobe

# Ubuntu / Debian
apt install -y ffmpeg
```

If the binaries live outside `PATH`, point to them explicitly:

```sh
export FFPROBE_PATH=/opt/ffmpeg/bin/ffprobe
export FFMPEG_PATH=/opt/ffmpeg/bin/ffmpeg
```

These env vars are read by `AppConfig.ffprobePath` / `AppConfig.ffmpegPath`.

**CI:** already handled — `ci.yml`'s `checks` job installs ffmpeg before the
backend tests. This entry used to carry a "Fix (CI)" section telling the reader
to add that step; the step now exists, so the instruction belongs in the config
and not here.

**Test isolation:** `local-ffmpeg.adapter.integration.spec.ts` probes for the
binary at suite startup (`spawnSync('which', ['ffmpeg'])`) and skips itself when
it is absent, so a contributor without ffmpeg still gets a green local run. That
guard is why the suite went unexecuted for months — it was never installed
anywhere, and a skipped suite reads exactly like a passing one.

## Flutter — SDK version mismatch after upgrading macOS or Xcode

**Symptom:** `flutter analyze` or `flutter pub get` complains about Dart SDK
range.

**Cause:** A locally installed Flutter older than the floor in
`apps/mobile/pubspec.yaml` (`>=3.44.0`) and `packages/ui_flutter/pubspec.yaml`.
CI pins the exact version in `.github/actions/setup-cs/action.yml`
(`flutter-version`, currently `3.44.4`) — that composite action is the single
pin every workflow reads, not the individual workflow files.

**Fix:** Match CI: `fvm use 3.44.4` (no `.fvmrc` is committed — a fourth copy
of the version would be one more thing to drift), or reopen in the
devcontainer, which pins the same version. Golden tests are the reason the pin
is exact rather than a range: golden PNGs are rendering-engine artefacts, so a
version skew fails them for reasons unrelated to the code.

When bumping, move all four together — `setup-cs/action.yml`,
`.devcontainer/devcontainer.json`, and both pubspec floors.
