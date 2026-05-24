import { describe, expect, it } from 'vitest';

import { IdentifyTask } from './identify-task';
import { IdentifyTaskNotPendingError } from './identify-task.errors';
import { defaultMergePolicy } from './merge-policy';

function make(): IdentifyTask {
  return IdentifyTask.create({
    id: 'task-1',
    courseId: 'course-1',
    source: 'youtube',
    scrapedFragment: { title: 'X' },
    mergePolicy: defaultMergePolicy(),
    now: new Date('2026-05-24T00:00:00.000Z'),
  });
}

describe('IdentifyTask', () => {
  it('create starts in proposed with no completedAt', () => {
    const task = make();
    expect(task.status).toBe('proposed');
    expect(task.completedAt).toBeUndefined();
  });

  it('markApplied transitions to applied, records policy + completedAt', () => {
    const task = make();
    const policy = { ...defaultMergePolicy(), title: 'overwrite' as const };
    const at = new Date('2026-05-25T00:00:00.000Z');
    task.markApplied(policy, at);
    expect(task.status).toBe('applied');
    expect(task.completedAt).toBe(at);
    expect(task.mergePolicy.title).toBe('overwrite');
  });

  it('markDiscarded transitions to discarded', () => {
    const task = make();
    task.markDiscarded(new Date());
    expect(task.status).toBe('discarded');
  });

  it('throws IdentifyTaskNotPendingError when applying twice', () => {
    const task = make();
    task.markApplied(defaultMergePolicy(), new Date());
    expect(() => task.markApplied(defaultMergePolicy(), new Date())).toThrow(
      IdentifyTaskNotPendingError,
    );
  });

  it('throws IdentifyTaskNotPendingError when discarding an applied task', () => {
    const task = make();
    task.markApplied(defaultMergePolicy(), new Date());
    expect(() => task.markDiscarded(new Date())).toThrow(IdentifyTaskNotPendingError);
  });
});
