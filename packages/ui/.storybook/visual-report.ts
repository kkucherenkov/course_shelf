/**
 * Drift-report plumbing for the Storybook visual-regression run.
 *
 * Split out of `test-runner.ts` so it can be unit-tested without importing
 * `@storybook/test-runner` (and, through it, Playwright).
 */
import { appendFileSync } from 'node:fs';

/**
 * NDJSON drift log, one `{ story, diffPercent }` per line.
 *
 * WHY a file and not stdout: the CI job needs a machine-readable list to build
 * the PR comment, and test-runner interleaves worker output, so scraping the
 * log is unreliable. NDJSON is appended per failure, which is what makes it
 * safe under parallel workers — each line is one small write.
 *
 * Both report files are truncated by the `test:visual` npm script, not from
 * `setup()`: jest runs `setup()` once per *worker*, so a worker starting late
 * used to delete what an earlier worker had already recorded. The run finished
 * with no report at all and CI called that "no drift".
 *
 * Lives outside `__diff_output__` so the uploaded artifact stays pure images.
 */
export const REPORT_FILE = `${process.cwd()}/visual-report.ndjson`;

/**
 * NDJSON log of accessibility violations found by the second, dark-theme axe
 * pass in `test-runner.ts`.
 *
 * WHY a separate file from the drift report: the `visual-approved` label waves
 * past pixel drift, and drift and an a11y regression can land in the same
 * push. Sharing one report would let the label wave the a11y failure past too.
 * The workflow fails on a non-empty file here unconditionally.
 */
export const A11Y_REPORT_FILE = `${process.cwd()}/a11y-report.ndjson`;

export interface A11yEntry {
  story: string;
  theme: string;
  rule: string;
  /** Number of failing DOM nodes. */
  nodes: number;
  /** First failure summary from axe, for the PR log. `null` when axe gave none. */
  detail: string | null;
}

export function recordA11y(entry: A11yEntry, file = A11Y_REPORT_FILE): void {
  appendFileSync(file, `${JSON.stringify(entry)}\n`);
}

export interface DriftEntry {
  story: string;
  /** `null` when the percentage could not be read out of the failure message. */
  diffPercent: number | null;
}

/**
 * jest-image-snapshot puts the number in its message, e.g.
 *   "Expected image to match or be a close match to snapshot but was
 *    7.4047619047619045% different from snapshot"
 *
 * There is no structured result to read instead, so this parses it — and
 * returns `null` rather than throwing if the wording ever changes, because a
 * missing percentage must not turn a visual failure into a crash.
 */
export function parseDiffPercent(message: string): number | null {
  const match = /was\s+([\d.]+)%\s+different/.exec(message);
  if (!match?.[1]) return null;
  const value = Number.parseFloat(match[1]);
  return Number.isFinite(value) ? value : null;
}

export function recordDrift(entry: DriftEntry, file = REPORT_FILE): void {
  appendFileSync(file, `${JSON.stringify(entry)}\n`);
}
