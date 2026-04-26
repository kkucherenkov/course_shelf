import boundaries from 'eslint-plugin-boundaries';

import base from './base.mjs';

// Bounded-context layering for the NestJS backend. Each subdirectory under
// src/modules/* is its own bounded context and may not import from a sibling
// module — communication between contexts goes through a public command/event
// or via a shared port. Plumbing under src/common, the app entry points, and
// i18n bundles are explicitly outside this rule.
//
// Globs match relative to the consuming project's eslint cwd (apps/backend),
// not the workspace root, because ESLint resolves `files:` patterns
// against the directory where the user invokes it.
const BACKEND_SRC_GLOBS = ['src/**/*.{ts,mts,cts}'];

export default [
  ...base,
  {
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      'unicorn/filename-case': [
        'error',
        {
          cases: { kebabCase: true },
          ignore: [/\.e2e-spec\.ts$/],
        },
      ],
    },
  },
  {
    files: BACKEND_SRC_GLOBS,
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['apps/backend/tsconfig.json', 'apps/backend/tsconfig.build.json'],
        },
      },
      'boundaries/include': BACKEND_SRC_GLOBS,
      'boundaries/elements': [
        {
          type: 'module',
          pattern: 'src/modules/*/**',
          capture: ['name'],
        },
        { type: 'common', pattern: 'src/common/**' },
        { type: 'i18n', pattern: 'src/i18n/**' },
        {
          // Top-level entry / bootstrap files live directly under src/ — main.ts,
          // app.module.ts, instrument.ts, telemetry.ts. Any new bootstrap-only
          // file added at this level is covered automatically. `mode: 'file'`
          // because the default 'folder' mode matches the parent directory and
          // would not pick up siblings of src/.
          type: 'app',
          pattern: 'src/*.ts',
          mode: 'file',
        },
      ],
    },
    rules: {
      'boundaries/no-unknown': 'error',
      'boundaries/no-unknown-files': 'warn',
      // Keeping `boundaries/element-types` (v5 syntax) until the v6
      // `boundaries/dependencies` schema is verified — the v6 rule rejected
      // the migrated config at runtime. v6 deprecation warnings are
      // surfaced to console but do not break the lint.
      'boundaries/element-types': [
        'error',
        {
          default: 'allow',
          rules: [
            {
              from: [['module', { name: '*' }]],
              disallow: [['module', { name: '!${from.name}' }]],
              message:
                'Cross-context import: module "${from.name}" cannot import from module "${target.name}". Use a public command/event/query interface or move the shared piece into src/common (or a shared kernel module).',
            },
          ],
        },
      ],
    },
  },
];
