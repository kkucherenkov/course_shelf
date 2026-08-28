import uiPlugin from '@nuxt/ui/vite';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue(), uiPlugin()],
  test: {
    environment: 'happy-dom',
    globals: true,
    // `.storybook/` is included for visual-report.spec.ts — the drift-report
    // helpers are CI plumbing, so they live beside the test-runner config they
    // serve rather than in the published `src/` surface.
    include: ['src/**/*.spec.ts', '.storybook/**/*.spec.ts'],
  },
});
