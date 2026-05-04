import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { TestRunnerConfig } from '@storybook/test-runner';
import { waitForPageReady } from '@storybook/test-runner';
import { toMatchImageSnapshot } from 'jest-image-snapshot';

/**
 * Storybook test-runner config for self-hosted visual regression.
 *
 * For every story, after the play function (if any) completes:
 *  1. wait for the preview iframe to settle,
 *  2. screenshot the preview root,
 *  3. compare with `__snapshots__/<story-id>.png` — OR, when the
 *     `STORYBOOK_REGEN` env var is set, **write** the screenshot as the
 *     new baseline and skip the diff.
 *
 * Baseline images are committed under `packages/ui/test/__snapshots__/`.
 * To refresh: trigger the `Regenerate Storybook visual snapshots`
 * workflow from Forgejo's Actions tab — it sets STORYBOOK_REGEN=1, runs
 * this config in capture-only mode, and pushes a single
 * `chore(ui): regenerate Storybook visual snapshots from CI` commit
 * back to the branch. Capturing baselines outside the Linux CI runner
 * leads to a few-pixel font-metric drift that fails every story.
 */
const SNAPSHOTS_DIR = `${process.cwd()}/test/__snapshots__`;
const REGEN_MODE = process.env['STORYBOOK_REGEN'] === '1';

const config: TestRunnerConfig = {
  setup() {
    expect.extend({ toMatchImageSnapshot });
    if (REGEN_MODE) {
      mkdirSync(SNAPSHOTS_DIR, { recursive: true });
    }
  },

  async postVisit(page, context) {
    await waitForPageReady(page);

    // Find the element that wraps the story (Storybook 10 preview iframe).
    const elementHandle = await page.$('#storybook-root');
    if (!elementHandle) return;

    const image = await elementHandle.screenshot({
      animations: 'disabled',
      caret: 'hide',
    });

    if (REGEN_MODE) {
      // Capture-only: overwrite the baseline. jest-image-snapshot's CI
      // mode would otherwise fail on missing baselines instead of
      // creating them, so we sidestep it entirely.
      writeFileSync(join(SNAPSHOTS_DIR, `${context.id}.png`), image);
      return;
    }

    // @ts-expect-error — extended via setup()
    expect(image).toMatchImageSnapshot({
      customSnapshotsDir: SNAPSHOTS_DIR,
      customSnapshotIdentifier: context.id,
      failureThreshold: 0.01,
      failureThresholdType: 'percent',
    });
  },
};

export default config;
