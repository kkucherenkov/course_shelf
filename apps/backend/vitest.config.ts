import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths({ ignoreConfigErrors: true }), swc.vite({ module: { type: 'es6' } })],
  // Vite 8 introduced a built-in oxc TS transform (`vite:oxc`) that fails
  // to resolve `extends` via workspace package names (e.g. @app/tsconfig).
  // We transform via unplugin-swc instead — disable oxc to avoid the clash.
  oxc: false,
  test: {
    globals: true,
    environment: 'node',
    // `test/**/*.e2e-spec.ts` is the documented home of the backend e2e layer
    // (see .claude/docs/testing.md), and it used to be excluded here — so the
    // one location the handbook names was the one location vitest ignored.
    // The suite boots Nest in-process with supertest and fakes every external
    // system (see test/e2e-app.ts), so it needs no services and belongs in the
    // default run.
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts', 'test/**/*.e2e-spec.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
