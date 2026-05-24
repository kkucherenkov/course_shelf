import { describe, expect, it, vi } from 'vitest';

import { RunIdentifyTaskCommand } from './run-identify-task.command';
import { RunIdentifyTaskHandler } from './run-identify-task.handler';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { IdentifyTaskProposed } from '../../domain/identify/identify-task.events';
import { defaultMergePolicy } from '../../domain/identify/merge-policy';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';
import type { EventBus } from '@nestjs/cqrs';

function makeDeps() {
  const courseRepo = { findById: vi.fn() } as unknown as CourseRepository;
  const taskRepo = {
    save: vi.fn(),
    findById: vi.fn(),
    findMany: vi.fn(),
  } as IdentifyTaskRepository;
  const eventBus = { publish: vi.fn() } as unknown as EventBus;
  return { courseRepo, taskRepo, eventBus };
}

describe('RunIdentifyTaskHandler', () => {
  it('throws CourseNotFoundError when the course does not exist', async () => {
    const { courseRepo, taskRepo, eventBus } = makeDeps();
    vi.mocked(courseRepo.findById).mockResolvedValue(null);
    const handler = new RunIdentifyTaskHandler(courseRepo, taskRepo, eventBus);

    await expect(
      handler.execute(
        new RunIdentifyTaskCommand(
          'missing',
          'youtube',
          undefined,
          { title: 'X' },
          defaultMergePolicy(),
        ),
      ),
    ).rejects.toBeInstanceOf(CourseNotFoundError);
    expect(taskRepo.save).not.toHaveBeenCalled();
  });

  it('persists a proposed task and publishes IdentifyTaskProposed', async () => {
    const { courseRepo, taskRepo, eventBus } = makeDeps();
    vi.mocked(courseRepo.findById).mockResolvedValue({ id: 'c1' } as never);
    const handler = new RunIdentifyTaskHandler(courseRepo, taskRepo, eventBus);

    const dto = await handler.execute(
      new RunIdentifyTaskCommand(
        'c1',
        'youtube',
        'https://x.test',
        { title: 'X' },
        defaultMergePolicy(),
      ),
    );

    expect(taskRepo.save).toHaveBeenCalledOnce();
    expect(eventBus.publish).toHaveBeenCalledWith(expect.any(IdentifyTaskProposed));
    expect(dto.status).toBe('proposed');
    expect(dto.courseId).toBe('c1');
  });
});
