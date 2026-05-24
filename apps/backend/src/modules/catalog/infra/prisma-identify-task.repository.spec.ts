import { describe, expect, it } from 'vitest';

import { identifyTaskRowToDomain } from './prisma-identify-task.repository';
import { defaultMergePolicy } from '../domain/identify/merge-policy';

describe('identifyTaskRowToDomain', () => {
  it('reconstitutes an aggregate from a row, preserving jsonb fields', () => {
    const task = identifyTaskRowToDomain({
      id: 'task-1',
      courseId: 'course-1',
      status: 'proposed',
      source: 'youtube',
      sourceUrl: null,
      scrapedFragment: { title: 'X', tags: ['a'] },
      mergePolicy: defaultMergePolicy(),
      createdAt: new Date('2026-05-24T00:00:00.000Z'),
      completedAt: null,
    });
    expect(task.id).toBe('task-1');
    expect(task.status).toBe('proposed');
    expect(task.scrapedFragment.title).toBe('X');
    expect(task.sourceUrl).toBeUndefined();
    expect(task.completedAt).toBeUndefined();
  });
});
