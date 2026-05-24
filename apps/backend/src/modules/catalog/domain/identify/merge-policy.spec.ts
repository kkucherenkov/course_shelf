import { describe, expect, it } from 'vitest';

import { defaultMergePolicy, parseMergePolicy, MERGE_POLICY_FIELDS } from './merge-policy';

describe('merge-policy', () => {
  it('defaultMergePolicy sets every field to "merge"', () => {
    const policy = defaultMergePolicy();
    for (const field of MERGE_POLICY_FIELDS) {
      expect(policy[field]).toBe('merge');
    }
  });

  it('parseMergePolicy fills missing fields with "merge" and keeps valid overrides', () => {
    const policy = parseMergePolicy({ title: 'overwrite', tags: 'ignore' });
    expect(policy.title).toBe('overwrite');
    expect(policy.tags).toBe('ignore');
    expect(policy.description).toBe('merge');
  });

  it('parseMergePolicy rejects an invalid mode', () => {
    expect(() => parseMergePolicy({ title: 'bogus' })).toThrow(/invalid merge mode/i);
  });

  it('parseMergePolicy returns the default when given undefined', () => {
    expect(parseMergePolicy(undefined)).toEqual(defaultMergePolicy());
  });
});
