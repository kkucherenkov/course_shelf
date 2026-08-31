import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import type { TestContext, TestRunnerConfig } from '@storybook/test-runner';
import { getStoryContext, waitForPageReady } from '@storybook/test-runner';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import type { Page } from 'playwright';

import { parseDiffPercent, recordA11y, recordDrift } from './visual-report';

/**
 * Storybook test-runner config for self-hosted visual regression.
 *
 * For every story, after the play function (if any) completes:
 *  1. wait for the preview iframe to settle,
 *  2. screenshot the preview root,
 *  3. compare with `__snapshots__/<story-id>.png` — OR, when the
 *     `STORYBOOK_REGEN` env var is set, **write** the screenshot as the
 *     new baseline and skip the diff,
 *  4. re-run axe against the **dark** theme (see below).
 *
 * Baseline images are committed under `packages/ui/test/__snapshots__/`.
 * To refresh: run the `Regenerate visual snapshots` workflow from the
 * GitHub Actions tab (suite: `storybook`) — it sets STORYBOOK_REGEN=1, runs
 * this config in capture-only mode, and pushes a single
 * `chore(ui): regenerate Storybook visual snapshots from CI` commit
 * back to the branch. Capturing baselines outside the
 * `mcr.microsoft.com/playwright:v1.59.1-jammy` image leads to a few-pixel
 * font-metric drift that fails every story.
 *
 * Note: the a11y addon runs at `error`, so a story with an axe violation
 * throws *before* `postVisit` and never gets a baseline written. That is
 * intended — fix the violation rather than reaching for an override; the one
 * that used to exist is why 75 stories could fail unnoticed.
 */
const SNAPSHOTS_DIR = `${process.cwd()}/test/__snapshots__`;
const REGEN_MODE = process.env['STORYBOOK_REGEN'] === '1';

/**
 * The addon renders every story in its default theme, which is `light`. That
 * left the dark ramp completely unaudited: 28 `color-contrast` violations
 * across 21 stories sat on `main` while the light theme was gated at `error`.
 *
 * So: after the screenshot, flip the document to dark and run axe again.
 *
 * Only `color-contrast` runs in the second pass. Theme changes nothing about
 * roles, names, focus order or landmarks — those are already asserted by the
 * addon's light-theme run, and re-running them would double the runtime to
 * re-check identical DOM.
 *
 * axe is injected from `axe-core` (a direct devDependency) rather than reusing
 * the copy the addon lazy-loads into the page. `window.axe` is an
 * implementation detail of the addon's chunk-splitting; a gate that silently
 * stops running when an upstream chunk name changes is not a gate.
 */
const AXE_SOURCE = readFileSync(
  createRequire(`${process.cwd()}/`).resolve('axe-core/axe.min.js'),
  'utf8',
);
const A11Y_THEME = 'dark';

interface A11yParameters {
  disable?: boolean;
  test?: 'off' | 'todo' | 'error';
  element?: string;
  config?: { rules?: { id?: string; enabled?: boolean }[] };
  options?: Record<string, unknown>;
}

interface AxeResult {
  violations: { id: string; nodes: { failureSummary?: string }[] }[];
}

/**
 * Run axe inside the page, retrying while the addon's own run holds the lock.
 * axe refuses concurrent runs ("Axe is already running"), and the addon's
 * light-theme pass can still be in flight when `postVisit` starts.
 */
async function runAxe(
  page: Page,
  root: string,
  options: Record<string, unknown>,
): Promise<AxeResult> {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    try {
      return await page.evaluate(
        async ([selector, runOptions]) =>
          (
            globalThis as unknown as {
              axe: { run: (c: unknown, o: unknown) => Promise<AxeResult> };
            }
          ).axe.run(document.querySelector(selector as string) ?? document.body, runOptions),
        [root, options] as const,
      );
    } catch (error) {
      if (!String(error).includes('already running')) throw error;
      await page.waitForTimeout(200);
    }
  }
  throw new Error('axe never released its run lock');
}

const DARK_RULES = ['color-contrast'] as const;

/** Assert `color-contrast` in the dark theme; throws on any violation. */
async function assertDarkContrast(page: Page, context: TestContext): Promise<void> {
  const storyId = context.id;
  const storyContext = await getStoryContext(page, context);
  const a11y = (storyContext.parameters?.['a11y'] ?? {}) as A11yParameters;
  if (a11y.disable === true || a11y.test === 'off') return;

  // Honour per-story rule exemptions exactly as the addon does — the three
  // disabled-control stories switch `color-contrast` off for a documented WCAG
  // reason, and the dark pass must not re-raise what light already excused.
  //
  // Filtering `runOnly` rather than passing `rules: { id: { enabled: false } }`:
  // axe resolves `runOnly` first, so an explicitly named rule runs even when the
  // `rules` option disables it. And not `axe.configure()` either — the
  // test-runner reuses one page across stories, and `configure` is global,
  // sticky state that would leak one story's exemption into the next.
  const exempt = new Set(
    (a11y.config?.rules ?? []).filter((r) => r.id && r.enabled === false).map((r) => r.id),
  );
  const rulesToRun = DARK_RULES.filter((id) => !exempt.has(id));
  if (rulesToRun.length === 0) return;

  const previous = await page.evaluate((theme) => {
    const html = document.documentElement;
    const before = {
      theme: html.getAttribute('data-theme'),
      dark: html.classList.contains('dark'),
    };
    html.setAttribute('data-theme', theme);
    html.classList.add('dark');
    return before;
  }, A11Y_THEME);

  try {
    await page.addScriptTag({ content: AXE_SOURCE });
    const results = await runAxe(page, a11y.element ?? '#storybook-root', {
      ...a11y.options,
      runOnly: { type: 'rule', values: rulesToRun },
      resultTypes: ['violations'],
    });

    for (const violation of results.violations) {
      recordA11y({
        story: storyId,
        theme: A11Y_THEME,
        rule: violation.id,
        nodes: violation.nodes.length,
        detail: violation.nodes[0]?.failureSummary?.replaceAll('\n', ' ') ?? null,
      });
    }
    if (results.violations.length > 0) {
      const summary = results.violations
        .map((v) => `${v.id} (${v.nodes.length} node(s)): ${v.nodes[0]?.failureSummary ?? ''}`)
        .join('\n');
      throw new Error(`axe found ${A11Y_THEME}-theme violations in ${storyId}:\n${summary}`);
    }
  } finally {
    await page.evaluate((before) => {
      const html = document.documentElement;
      if (before.theme === null) html.removeAttribute('data-theme');
      else html.setAttribute('data-theme', before.theme);
      html.classList.toggle('dark', before.dark);
    }, previous);
  }
}

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
    } else {
      try {
        // @ts-expect-error — extended via setup()
        expect(image).toMatchImageSnapshot({
          customSnapshotsDir: SNAPSHOTS_DIR,
          customSnapshotIdentifier: context.id,
          // 2 % accommodates headless-Chromium anti-aliasing jitter on
          // SVG icons (the IconCS grid story regularly drifts 1.0–1.7 %
          // between identical runs on the same runner). A real visual
          // regression on a 232×376 component is typically >5 % — we'd
          // still catch those.
          failureThreshold: 0.02,
          failureThresholdType: 'percent',
        });
      } catch (error) {
        // Record, then re-throw. The job still fails on drift exactly as before —
        // this only makes the failure legible to the workflow that builds the PR
        // comment. Swallowing it here would turn a gate into a report.
        const message = error instanceof Error ? error.message : String(error);
        recordDrift({ story: context.id, diffPercent: parseDiffPercent(message) });
        throw error;
      }
    }

    // Runs in regen mode too: re-recording baselines must not be a way to skip
    // the a11y gate.
    await assertDarkContrast(page, context);
  },
};

export default config;
