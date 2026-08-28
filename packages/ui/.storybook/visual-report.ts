/**
 * Drift-report plumbing for the Storybook visual-regression run.
 *
 * Split out of `test-runner.ts` so it can be unit-tested without importing
 * `@storybook/test-runner` (and, through it, Playwright).
 */
import { appendFileSync, rmSync } from 'node:fs';

/**
 * NDJSON drift log, one `{ story, diffPercent }` per line.
 *
 * WHY a file and not stdout: the CI job needs a machine-readable list to build
 * the PR comment, and test-runner interleaves worker output, so scraping the
 * log is unreliable. NDJSON is appended per failure, which is what makes it
 * safe under parallel workers — each line is one small write.
 *
 * Lives outside `__diff_output__` so the uploaded artifact stays pure images.
 */
export const REPORT_FILE = `${process.cwd()}/visual-report.ndjson`;

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

/** Start a run from an empty report — stale entries would name healthy stories. */
export function resetReport(file = REPORT_FILE): void {
  rmSync(file, { force: true });
}

export function recordDrift(entry: DriftEntry, file = REPORT_FILE): void {
  appendFileSync(file, `${JSON.stringify(entry)}\n`);
}
