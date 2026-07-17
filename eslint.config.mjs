import nuxtConfig from '@app/eslint-config/nuxt.mjs';
import nestConfig from '@app/eslint-config/nest.mjs';

const BACKEND_FILES = ['apps/backend/**/*.{ts,tsx,mts,cts}'];

export default [
  ...nuxtConfig,
  ...nestConfig.map((c) => ({ ...c, files: BACKEND_FILES })),
  {
    // Nuxt composables follow the `use<Name>.ts` camelCase convention — allow it
    // for apps/web so lint-staged (running from the repo root) doesn't reject them.
    files: ['apps/web/app/**/*.ts', 'apps/web/app/**/*.vue'],
    rules: {
      'unicorn/filename-case': [
        'error',
        { cases: { camelCase: true, kebabCase: true, pascalCase: true } },
      ],
    },
  },
  {
    files: ['apps/backend/src/common/openapi/**/*.ts', 'apps/backend/src/app.module.ts'],
    rules: {
      'unicorn/prefer-module': 'off',
    },
  },
  {
    // main.ts uses CommonJS (module: CommonJS in tsconfig) so top-level await
    // is not available, and process.exit is the only way to signal a fatal
    // bootstrap failure.
    files: ['apps/backend/src/main.ts'],
    rules: {
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/no-process-exit': 'off',
    },
  },
  {
    files: ['apps/backend/test/**/*.ts', 'apps/backend/src/**/*.spec.ts'],
    rules: {
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.output/**',
      '**/.nuxt/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/storybook-static/**',
      'packages/api-client-ts/src/generated/**',
      'packages/api-client-dart/**',
      'packages/specs/dist/**',
      'apps/mobile/**',
      'specs/design/source-bundle/**',
      'specs/architecture/**',
      'docs/design/**',
      'apps/backend/prisma/seed.ts',
      'scripts/**',
    ],
  },
];
