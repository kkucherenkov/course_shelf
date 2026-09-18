import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The Dart SDK bundled with a Flutter version determines what
// `dart fix --apply` (below) decides is an unused import — its behaviour
// comes from the analyzer shipped inside the SDK, not from openapi-generator
// (which is pinned and jar-cached identically everywhere). CI runs
// `flutter-version: 3.44.4` (`.github/actions/setup-cs/action.yml`), which
// ships Dart SDK 3.12.2 (source: releases_linux.json for that version). A
// machine with a newer Dart strips a different set of imports than CI does,
// producing a plausible 33-line diff that CI's regeneration reverts — this
// already cost a revert on PR #707. Bump this alongside the other two spots
// action.yml names when Flutter's pin moves.
const EXPECTED_DART_VERSION = '3.12.2';

const here = path.dirname(fileURLToPath(import.meta.url));
const specsRoot = path.resolve(here, '..');
const packagesRoot = path.resolve(specsRoot, '..');

const bundle = path.resolve(specsRoot, 'dist/openapi.json');
const tsOut = path.resolve(packagesRoot, 'api-client-ts/src/generated');
// dart-dio emits a *complete* package (its own pubspec.yaml + lib/src/). Every
// generated file self-imports `package:app_api_client/src/…`, which Dart's
// package resolver maps to `<pkgRoot>/lib/src/…`. So the generated `lib/` MUST
// be the package's real `lib/` — generate straight into the package root, not a
// nested `lib/generated/` (that produced an unimportable double-nested package;
// see #168). The hand-authored `pubspec.yaml` is preserved via
// `.openapi-generator-ignore`.
const dartOut = path.resolve(packagesRoot, 'api-client-dart');
const openapiTypesOut = path.resolve(specsRoot, 'src/openapi-types.ts');

if (!existsSync(bundle)) {
  throw new Error(`Missing ${bundle}. Run \`pnpm --filter @app/specs bundle\` first.`);
}

for (const dir of [tsOut, dartOut, path.dirname(openapiTypesOut)]) {
  mkdirSync(dir, { recursive: true });
}

function run(cmd: string, cwd = specsRoot): void {
  console.warn(`\n$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd });
}

// Guard, not toolchain provisioning: fail loudly instead of silently emitting
// a diff `dart fix --apply` would strip on CI's SDK. Provisioning (fvm/asdf,
// pinning the SDK itself) was considered and rejected — it buys nothing over
// what CI already gives, at the cost of per-machine setup.
function assertDartVersion(): void {
  const output = execFileSync('dart', ['--version'], { encoding: 'utf8' });
  const found = /Dart SDK version: (\d+\.\d+\.\d+)/.exec(output)?.[1];
  if (found !== EXPECTED_DART_VERSION) {
    throw new Error(
      `[codegen] Dart SDK mismatch: found ${found ?? 'unparseable (' + output.trim() + ')'}, ` +
        `expected ${EXPECTED_DART_VERSION} — the SDK bundled with the Flutter version pinned in ` +
        `.github/actions/setup-cs/action.yml (flutter-version). dart fix --apply strips unused ` +
        `imports per-analyzer-version, so a mismatched SDK produces a plausible diff that CI's own ` +
        `regeneration reverts (see PR #707). Install the matching Flutter/Dart locally, or skip this ` +
        `script and let CI regenerate — its codegen-drift-guard job runs the same steps end to end.`,
    );
  }
}

console.warn('[codegen] 1/3 openapi-typescript → @app/specs/openapi-types.ts');
run(`pnpm exec openapi-typescript "${bundle}" --output "${openapiTypesOut}"`);

console.warn('[codegen] 2/3 @hey-api/openapi-ts → @app/api-client-ts');
run(`pnpm exec openapi-ts --input "${bundle}" --output "${tsOut}" --client @hey-api/client-fetch`);

console.warn('[codegen] 3/3 openapi-generator-cli (dart-dio) → @app/api-client-dart');
run(
  [
    'pnpm exec openapi-generator-cli generate',
    `-i "${bundle}"`,
    '-g dart-dio',
    `-o "${dartOut}"`,
    '--additional-properties=pubName=app_api_client,pubLibrary=app_api_client.api,nullableFields=true',
    // `name` is a valid ScraperKind wire value, but as a Dart enum member it
    // collides with built_value's reserved `EnumClass.name`, so build_runner
    // can't compile the enum. Remap ONLY the Dart identifier — the wire value
    // stays `name` via `@BuiltValueEnumConst(wireName: r'name')`, so this is
    // NOT a wire-contract change. Applied globally, but ScraperKind is the only
    // enum with a `name` member (verified against the bundle).
    '--enum-name-mappings=name=nameKind',
  ].join(' '),
);

// The client uses built_value, which relies on generated `.g.dart` part
// files (one per model + the serializers). openapi-generator does NOT run
// build_runner, so without this step every `part '*.g.dart'` is missing and
// the package won't compile. Generate the parts and commit them as artifacts.
console.warn('[codegen] post: dart pub get + build_runner (emit built_value .g.dart parts)');
assertDartVersion();
run('dart pub get', dartOut);
// `--delete-conflicting-outputs` was removed by build_runner and is now a
// no-op the tool warns about ("These options have been removed and were
// ignored") — dropped rather than carried as dead ceremony.
run('dart run build_runner build', dartOut);

// The dart-dio template emits a fixed import block per *_api.dart
// (Problem, built_value/json_object) regardless of whether the operations
// actually reference them, producing analyzer `unused_import` hints. Run
// `dart fix --apply` against the generated package so Dart itself strips
// the unused directives — the source of truth stays the analyzer, no
// in-repo suppressions, no template forks.
console.warn('[codegen] post: dart fix --apply (strip generator-induced unused imports)');
run('dart fix --apply', dartOut);

console.warn('[codegen] post: prettier on openapi-types.ts (stable diff across versions)');
run(`pnpm exec prettier --write "${openapiTypesOut}"`, packagesRoot);

console.warn('[codegen] 4/4 asyncapi → @app/api-client-ts/realtime/channels.ts');
run(`node --experimental-strip-types ${path.join(here, 'codegen-asyncapi.ts')}`);

console.warn('[codegen] post: prettier on generated realtime channels');
run(
  `pnpm exec prettier --write "${path.join(packagesRoot, 'api-client-ts/src/realtime/channels.ts')}"`,
  packagesRoot,
);

console.warn('\n✓ Codegen complete.');
