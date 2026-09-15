import { describe, expect, it, vi } from 'vitest';

import { DiscardIdentifyTaskCommand } from './discard-identify-task.command';
import { DiscardIdentifyTaskHandler } from './discard-identify-task.handler';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { IdentifyTask } from '../../domain/identify/identify-task';
import { IdentifyTaskNotFoundError } from '../../domain/identify/identify-task.errors';
import { defaultMergePolicy } from '../../domain/identify/merge-policy';

import type { CourseRepository } from '../../domain/course/course.repository';
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

function makeDeps() {
  const taskRepo = {
    save: vi.fn(),
    findById: vi.fn(),
    findMany: vi.fn(),
  } as IdentifyTaskRepository;
  const courseRepo = { findById: vi.fn() } as unknown as CourseRepository;
  return { taskRepo, courseRepo };
}

describe('DiscardIdentifyTaskHandler', () => {
  it('throws when the task is missing', async () => {
    const { taskRepo, courseRepo } = makeDeps();
    vi.mocked(taskRepo.findById).mockResolvedValue(null);
    const handler = new DiscardIdentifyTaskHandler(taskRepo, courseRepo);
    await expect(handler.execute(new DiscardIdentifyTaskCommand('x'))).rejects.toBeInstanceOf(
      IdentifyTaskNotFoundError,
    );
  });

  it('throws CourseNotFoundError when the task’s course is gone', async () => {
    const { taskRepo, courseRepo } = makeDeps();
    vi.mocked(taskRepo.findById).mockResolvedValue(makeTask());
    vi.mocked(courseRepo.findById).mockResolvedValue(null);
    const handler = new DiscardIdentifyTaskHandler(taskRepo, courseRepo);
    await expect(handler.execute(new DiscardIdentifyTaskCommand('task-1'))).rejects.toBeInstanceOf(
      CourseNotFoundError,
    );
  });

  it('marks the task discarded, saves, and returns the course title', async () => {
    const { taskRepo, courseRepo } = makeDeps();
    vi.mocked(taskRepo.findById).mockResolvedValue(makeTask());
    vi.mocked(courseRepo.findById).mockResolvedValue({ title: 'Rust Course' } as never);
    const handler = new DiscardIdentifyTaskHandler(taskRepo, courseRepo);
    const dto = await handler.execute(new DiscardIdentifyTaskCommand('task-1'));
    expect(dto.status).toBe('discarded');
    expect(dto.courseTitle).toBe('Rust Course');
    expect(taskRepo.save).toHaveBeenCalledOnce();
  });
});
