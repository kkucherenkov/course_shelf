export default defineAppConfig({
  ui: {
    // Nuxt UI consumes named color scales (50…950). `accent` is defined in
    // `assets/css/main.css` via `@theme` and ultimately sourced from the
    // design tokens in `docs/design/shared/tokens.json` → `color.brand.accent*`.
    //
    // `neutral` is deliberately absent. This file is a Nuxt build artefact and
    // Storybook never runs it, so anything set here only ever reached the app —
    // the sandbox kept Nuxt UI's stock `slate`. The neutral ramp is wired in
    // `assets/css/main.css` instead (mirrored into `packages/ui/src/styles.css`),
    // where both consumers see the same values.
    colors: {
      primary: 'accent',
    },
  },
});
