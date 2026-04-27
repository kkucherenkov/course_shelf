export default defineAppConfig({
  ui: {
    // Nuxt UI consumes named color scales (50…950). `accent` is defined in
    // `assets/css/main.css` via `@theme` and ultimately sourced from the
    // design tokens in `docs/design/shared/tokens.json` → `color.brand.accent*`.
    colors: {
      primary: 'accent',
      neutral: 'zinc',
    },
  },
});
