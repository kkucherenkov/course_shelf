/**
 * Unit tests for useSectionHeaderLabels.
 *
 * The branch under test is which duration key the formatter picks — `t()` is
 * stubbed to echo the key and its payload so the assertion is about the
 * choice, not about the English wording.
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, ...rest: unknown[]) => `${key}(${JSON.stringify(rest)})`,
  }),
}));

const { useSectionHeaderLabels } = await import('../useSectionHeaderLabels');

describe('useSectionHeaderLabels', () => {
  it('passes the count to vue-i18n both as the plural choice and as a named arg', () => {
    const { formatLessons } = useSectionHeaderLabels();
    expect(formatLessons(1)).toBe('ui.sectionHeader.lessons([1,{"named":{"n":1}}])');
    expect(formatLessons(5)).toBe('ui.sectionHeader.lessons([5,{"named":{"n":5}}])');
  });

  it('picks the hours+minutes key when the section runs over an hour', () => {
    const { formatDuration } = useSectionHeaderLabels();
    expect(formatDuration(4500)).toBe('ui.sectionHeader.durationHm([{"h":1,"m":15}])');
  });

  it('drops the minutes when they are zero', () => {
    const { formatDuration } = useSectionHeaderLabels();
    expect(formatDuration(7200)).toBe('ui.sectionHeader.durationH([{"h":2}])');
  });

  it('uses the minutes-only key below an hour, flooring negatives to zero', () => {
    const { formatDuration } = useSectionHeaderLabels();
    expect(formatDuration(540)).toBe('ui.sectionHeader.durationM([{"m":9}])');
    expect(formatDuration(-10)).toBe('ui.sectionHeader.durationM([{"m":0}])');
  });
});
