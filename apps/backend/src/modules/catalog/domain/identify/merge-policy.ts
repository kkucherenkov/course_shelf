/**
 * WHY this file exists:
 * MergePolicy declares, per scraped field, how Stage 4 reconciles the scraped
 * value with the existing course value: `merge` (fill-if-empty for scalars,
 * union for arrays), `overwrite` (replace), or `ignore` (no-op). The default is
 * `merge` everywhere — the safest choice, never destroying curated data.
 *
 * parseMergePolicy validates an untrusted partial (from the HTTP request body
 * or a persisted jsonb column) and fills any absent field with `merge`.
 */
import { InvariantViolation } from '../../../../shared/domain-error';

export type MergeMode = 'merge' | 'overwrite' | 'ignore';

export const MERGE_POLICY_FIELDS = [
  'title',
  'description',
  'level',
  'language',
  'posterUrl',
  'releaseDate',
  'ratingAverage',
  'ratingCount',
  'instructors',
  'studios',
  'tags',
  'externalIds',
] as const;

export type MergePolicyField = (typeof MERGE_POLICY_FIELDS)[number];

export type MergePolicy = Record<MergePolicyField, MergeMode>;

const VALID_MODES: ReadonlySet<string> = new Set<MergeMode>(['merge', 'overwrite', 'ignore']);

/** All fields default to `merge` — never destroys existing data. */
export function defaultMergePolicy(): MergePolicy {
  return Object.fromEntries(MERGE_POLICY_FIELDS.map((f) => [f, 'merge'])) as MergePolicy;
}

/**
 * Validate an untrusted partial policy. Unknown keys are ignored; absent fields
 * fall back to `merge`. Throws InvariantViolation (422) on an invalid mode.
 */
export function parseMergePolicy(raw: Partial<Record<string, unknown>> | undefined): MergePolicy {
  const policy = defaultMergePolicy();
  if (raw === undefined) return policy;
  for (const field of MERGE_POLICY_FIELDS) {
    const value = raw[field];
    if (value === undefined) continue;
    if (typeof value !== 'string' || !VALID_MODES.has(value)) {
      throw new InvariantViolation(
        `invalid merge mode for "${field}": ${JSON.stringify(value)}`,
        'identify-invalid-merge-mode',
      );
    }
    policy[field] = value as MergeMode;
  }
  return policy;
}
