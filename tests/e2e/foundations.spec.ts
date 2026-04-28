import { test, expect } from '@playwright/test';

/**
 * Visual-regression snapshot for `/dev/foundations`.
 *
 * Single full-page screenshot in the default theme — Nuxt's color-mode
 * preference is `dark` (see `apps/web/nuxt.config.ts`). One baseline is
 * sufficient to catch component-level regressions; dual light/dark
 * snapshots would be brittle without a stable way to override Nuxt
 * color-mode from a Playwright init script (the plugin restores its
 * preference after `addInitScript` runs).
 *
 * On the FIRST run Playwright generates the baseline PNG under
 * `tests/e2e/foundations.spec.ts-snapshots/`; commit it. Subsequent
 * runs diff against the baseline (`maxDiffPixelRatio: 0.02`).
 */
test.use({ viewport: { width: 1440, height: 900 } });

const SECTION_HEADINGS = [
  'Color',
  'Typography',
  'Spacing',
  'Radius',
  'Motion',
  'Buttons',
  'Inputs',
  'Cards',
  'List rows',
  'Tabs',
  'Feedback',
  'Overlays',
  'Progress',
  'Empty States',
  'Loading Skeleton',
  'Avatar',
  'Tag / Chip',
];

test('foundations page renders all sections', async ({ page }) => {
  await page.goto('/dev/foundations');

  await page.waitForSelector('.page-foundations__title', { timeout: 10_000 });

  // Assert each of the 17 section headings is visible.
  for (const heading of SECTION_HEADINGS) {
    await expect(
      page.locator('.page-foundations__section-title', { hasText: heading }).first(),
    ).toBeVisible({ timeout: 5_000 });
  }

  // Allow CSS animations (the AppSkeleton pulse, the spinner, etc.) to settle
  // visually — running animations are clamped to their first frame by
  // Playwright's `animations: 'disabled'` option, but waiting one extra paint
  // catches any lingering layout shift.
  await page.waitForTimeout(200);

  await expect(page).toHaveScreenshot('foundations.png', {
    maxDiffPixelRatio: 0.02,
    fullPage: true,
    animations: 'disabled',
  });
});
