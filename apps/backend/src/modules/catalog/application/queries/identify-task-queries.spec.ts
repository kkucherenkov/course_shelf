import { describe, expect, it, vi } from 'vitest';

import { ListIdentifyTasksQuery } from './list-identify-tasks.query';
import { ListIdentifyTasksHandler } from './list-identify-tasks.handler';
import { GetIdentifyTaskQuery } from './get-identify-task.query';
import { GetIdentifyTaskHandler } from './get-identify-task.handler';
import { IdentifyTask } from '../../domain/identify/identify-task';
import { IdentifyTaskNotFoundError } from '../../domain/identify/identify-task.errors';
import { defaultMergePolicy } from '../../domain/identify/merge-policy';

import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';

function makeTask(id = 'task-1'): IdentifyTask {
  return IdentifyTask.create({
    id,
    courseId: 'c1',
    source: 'youtube',
    scrapedFragment: { title: 'X' },
    mergePolicy: defaultMergePolicy(),
  });
}

function makeRepo(): IdentifyTaskRepository {
  return { save: vi.fn(), findById: vi.fn(), findMany: vi.fn() };
}

describe('identify-task queries', () => {
  it('list maps repo results to a list DTO and forwards filters', async () => {
    const repo = makeRepo();
    vi.mocked(repo.findMany).mockResolvedValue([makeTask()]);
    const handler = new ListIdentifyTasksHandler(repo);
    const dto = await handler.execute(new ListIdentifyTasksQuery('proposed', 'c1'));
    expect(repo.findMany).toHaveBeenCalledWith({ status: 'proposed', courseId: 'c1' });
    expect(dto.tasks).toHaveLength(1);
    expect(dto.tasks[0]!.id).toBe('task-1');
  });

  it('get returns the DTO when found', async () => {
    const repo = makeRepo();
    vi.mocked(repo.findById).mockResolvedValue(makeTask('task-9'));
    const handler = new GetIdentifyTaskHandler(repo);
    const dto = await handler.execute(new GetIdentifyTaskQuery('task-9'));
    expect(dto.id).toBe('task-9');
  });

  it('get throws IdentifyTaskNotFoundError when missing', async () => {
    const repo = makeRepo();
    vi.mocked(repo.findById).mockResolvedValue(null);
    const handler = new GetIdentifyTaskHandler(repo);
    await expect(handler.execute(new GetIdentifyTaskQuery('nope'))).rejects.toBeInstanceOf(
      IdentifyTaskNotFoundError,
    );
  });
});
