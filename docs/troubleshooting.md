# Troubleshooting

Known gotchas for the toolchain this boilerplate pins. Every entry lists the
symptom, the actual cause, and the fix. Updated as we hit new ones.

**Rule of thumb:** if a workaround can be replaced by a structural fix (change
the config, change the layout, pin a different version), fix it and delete the
entry. This file is for genuinely upstream-recurring issues — not a graveyard
of one-off bumps.

Concretely, an entry earns its place only if a contributor on a clean checkout
of `main` can still hit the symptom. Anything whose fix now lives in this
repository's own config is not a gotcha, it is history — read `git log`.

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
`choco install openjdk21`, etc.). CI needs no step for it: the one job that
runs codegen (`codegen-drift` in `ci.yml`) is on `ubuntu-latest`, whose runner
image ships a JDK. This is a host-machine prerequisite only.

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

Only `apps/backend/vitest.config.ts` needs it today — it is the one config that
resolves `extends` through a workspace package name. The entry stays because it
is a constraint on the **next** config you add, not a one-off bump.

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
Both docker images install ffmpeg, and `ci.yml`'s `checks` job installs it
before the backend tests — this is a bare-host prerequisite only.

**Test isolation:** `local-ffmpeg.adapter.integration.spec.ts` probes for the
binary at suite startup (`spawnSync('which', ['ffmpeg'])`) and skips itself when
it is absent, so a contributor without ffmpeg still gets a green local run. That
guard is why the suite went unexecuted for months — it was never installed
anywhere, and a skipped suite reads exactly like a passing one.
