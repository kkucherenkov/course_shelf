import { execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
run('dart pub get', dartOut);
run('dart run build_runner build --delete-conflicting-outputs', dartOut);

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
