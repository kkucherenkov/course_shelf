import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    tsconfigPaths({ ignoreConfigErrors: true }),
    swc.vite({ module: { type: 'es6' } }),
  ],
  // Vite 8 introduced a built-in oxc TS transform (`vite:oxc`) that fails
  // to resolve `extends` via workspace package names (e.g. @app/tsconfig).
  // We transform via unplugin-swc instead — disable oxc to avoid the clash.
  oxc: false,
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts', 'test/**/*.spec.ts'],
    exclude: ['**/*.e2e-spec.ts', 'node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
