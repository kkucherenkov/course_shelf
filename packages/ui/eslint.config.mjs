import vueLib from '@app/eslint-config/vue-lib.mjs';

export default [
  ...vueLib,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'storybook-static/**',
      'auto-imports.d.ts',
      'components.d.ts',
      'eslint.config.mjs',
      'vite.config.ts',
      'vitest.config.ts',
      '.storybook/**',
      'src/design-tokens.generated.ts',
      'src/tokens.generated.css',
    ],
  },
  {
    // IconCS uses an all-caps acronym (CS = CourseShelf) — exempt the whole directory
    // from the filename-case rule rather than silently rename the public API.
    files: ['src/components/IconCS/**'],
    rules: {
      'unicorn/filename-case': 'off',
    },
  },
  {
    files: ['src/**/*.stories.ts', 'src/**/*.story.vue', '.storybook/**/*.{ts,vue}'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      // Storybook stories / demo widgets render tokens directly — inline style is OK here.
      'vue/no-static-inline-styles': 'off',
      'vue/no-restricted-static-attribute': 'off',
    },
  },
];
