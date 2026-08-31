import nest from '@app/eslint-config/nest.mjs';

export default [
  ...nest,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'prisma/generated/**',
      'test/fixtures/**',
      'eslint.config.mjs',
      'vitest.config.ts',
      'prisma.config.ts',
    ],
  },
  {
    // main.ts uses CommonJS (module: CommonJS in tsconfig) so top-level await
    // is not available, and process.exit is the only way to signal a fatal
    // bootstrap failure. The glob also matches when lint-staged invokes ESLint
    // from the repo root with an absolute / workspace-relative path.
    files: ['src/main.ts', '**/backend/src/main.ts'],
    rules: {
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/no-process-exit': 'off',
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
    },
  },
  {
    // `__dirname` under `module: CommonJS` — the i18n loader path and the
    // OpenAPI bundle lookup both resolve relative to the compiled file.
    files: ['src/common/openapi/**/*.ts', 'src/app.module.ts', 'test/e2e-app.ts'],
    rules: {
      'unicorn/prefer-module': 'off',
    },
  },
  {
    // Application, domain, and service layers must throw DomainError subclasses.
    // NestJS exceptions bypass HttpExceptionFilter and produce non-RFC-9457 responses.
    // Allowed: controllers (presentation layer) may import NestJS exceptions for guard/auth flows.
    files: [
      'src/modules/*/application/**/*.ts',
      'src/modules/*/domain/**/*.ts',
      'src/modules/**/*.service.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@nestjs/common',
              importNames: [
                'BadRequestException',
                'ConflictException',
                'ForbiddenException',
                'GoneException',
                'InternalServerErrorException',
                'NotFoundException',
                'UnauthorizedException',
                'UnprocessableEntityException',
              ],
              message:
                'Throw a DomainError subclass from domain/<module>.errors.ts — not a NestJS HTTP exception. See .claude/docs/handbook.md → Errors.',
            },
          ],
        },
      ],
      // PrismaService must never be injected directly in application, domain, or service layers —
      // only infrastructure (*.repo.ts) may depend on it. The AST selector catches any relative
      // or absolute import path depth, unlike `no-restricted-imports` path strings.
      'no-restricted-syntax': [
        'error',
        {
          selector: String.raw`ImportDeclaration[source.value=/prisma\.service$/]`,
          message:
            'Inject a port interface via @Inject(SYMBOL) instead of PrismaService directly. See .claude/docs/handbook.md → Inversion of control.',
        },
      ],
    },
  },
  {
    files: ['test/**/*.ts', 'src/**/*.spec.ts'],
    rules: {
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      // vi.mocked(repo.fn) is a common vitest pattern — unbound-method is a false positive here
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
];
