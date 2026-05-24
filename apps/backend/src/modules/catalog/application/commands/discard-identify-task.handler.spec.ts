import { describe, expect, it, vi } from 'vitest';

import { DiscardIdentifyTaskCommand } from './discard-identify-task.command';
import { DiscardIdentifyTaskHandler } from './discard-identify-task.handler';
import { IdentifyTask } from '../../domain/identify/identify-task';
import { IdentifyTaskNotFoundError } from '../../domain/identify/identify-task.errors';
import { defaultMergePolicy } from '../../domain/identify/merge-policy';

import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';

function makeTask(): IdentifyTask {
  return IdentifyTask.create({
    id: 'task-1',
    courseId: 'c1',
    source: 'youtube',
    scrapedFragment: { title: 'X' },
    mergePolicy: defaultMergePolicy(),
  });
}

describe('DiscardIdentifyTaskHandler', () => {
  it('throws when the task is missing', async () => {
    const repo = { save: vi.fn(), findById: vi.fn(), findMany: vi.fn() } as IdentifyTaskRepository;
    vi.mocked(repo.findById).mockResolvedValue(null);
    const handler = new DiscardIdentifyTaskHandler(repo);
    await expect(handler.execute(new DiscardIdentifyTaskCommand('x'))).rejects.toBeInstanceOf(
      IdentifyTaskNotFoundError,
    );
  });

  it('marks the task discarded and saves', async () => {
    const repo = { save: vi.fn(), findById: vi.fn(), findMany: vi.fn() } as IdentifyTaskRepository;
    vi.mocked(repo.findById).mockResolvedValue(makeTask());
    const handler = new DiscardIdentifyTaskHandler(repo);
    const dto = await handler.execute(new DiscardIdentifyTaskCommand('task-1'));
    expect(dto.status).toBe('discarded');
    expect(repo.save).toHaveBeenCalledOnce();
  });
});
