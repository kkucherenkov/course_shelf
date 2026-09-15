import { describe, expect, it, vi } from 'vitest';

import { ListIdentifyTasksQuery } from './list-identify-tasks.query';
import { ListIdentifyTasksHandler } from './list-identify-tasks.handler';
import { GetIdentifyTaskQuery } from './get-identify-task.query';
import { GetIdentifyTaskHandler } from './get-identify-task.handler';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { IdentifyTask } from '../../domain/identify/identify-task';
import { IdentifyTaskNotFoundError } from '../../domain/identify/identify-task.errors';
import { defaultMergePolicy } from '../../domain/identify/merge-policy';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';

function makeTask(id = 'task-1', courseId = 'c1'): IdentifyTask {
  return IdentifyTask.create({
    id,
    courseId,
    source: 'youtube',
    scrapedFragment: { title: 'X' },
    mergePolicy: defaultMergePolicy(),
  });
}

function makeRepo(): IdentifyTaskRepository {
  return { save: vi.fn(), findById: vi.fn(), findMany: vi.fn() };
}

function makeCourseRepo(): CourseRepository {
  return { findById: vi.fn(), findByIds: vi.fn() } as unknown as CourseRepository;
}

describe('identify-task queries', () => {
  it('list maps repo results to a list DTO, forwards filters, and attaches course titles', async () => {
    const repo = makeRepo();
    const courseRepo = makeCourseRepo();
    vi.mocked(repo.findMany).mockResolvedValue([makeTask()]);
    vi.mocked(courseRepo.findByIds).mockResolvedValue([
      { id: 'c1', title: 'Rust Course' } as never,
    ]);
    const handler = new ListIdentifyTasksHandler(repo, courseRepo);
    const dto = await handler.execute(new ListIdentifyTasksQuery('proposed', 'c1'));
    expect(repo.findMany).toHaveBeenCalledWith({ status: 'proposed', courseId: 'c1' });
    expect(courseRepo.findByIds).toHaveBeenCalledWith(['c1']);
    expect(dto.tasks).toHaveLength(1);
    expect(dto.tasks[0]!.id).toBe('task-1');
    expect(dto.tasks[0]!.courseTitle).toBe('Rust Course');
  });

  it('list returns an empty list without querying courses when there are no tasks', async () => {
    const repo = makeRepo();
    const courseRepo = makeCourseRepo();
    vi.mocked(repo.findMany).mockResolvedValue([]);
    const handler = new ListIdentifyTasksHandler(repo, courseRepo);
    const dto = await handler.execute(new ListIdentifyTasksQuery(undefined, undefined));
    expect(dto.tasks).toEqual([]);
    expect(courseRepo.findByIds).not.toHaveBeenCalled();
  });

  it('get returns the DTO with the course title when found', async () => {
    const repo = makeRepo();
    const courseRepo = makeCourseRepo();
    vi.mocked(repo.findById).mockResolvedValue(makeTask('task-9'));
    vi.mocked(courseRepo.findById).mockResolvedValue({ title: 'Rust Course' } as never);
    const handler = new GetIdentifyTaskHandler(repo, courseRepo);
    const dto = await handler.execute(new GetIdentifyTaskQuery('task-9'));
    expect(dto.id).toBe('task-9');
    expect(dto.courseTitle).toBe('Rust Course');
  });

  it('get throws IdentifyTaskNotFoundError when missing', async () => {
    const repo = makeRepo();
    const courseRepo = makeCourseRepo();
    vi.mocked(repo.findById).mockResolvedValue(null);
    const handler = new GetIdentifyTaskHandler(repo, courseRepo);
    await expect(handler.execute(new GetIdentifyTaskQuery('nope'))).rejects.toBeInstanceOf(
      IdentifyTaskNotFoundError,
    );
  });

  it('get throws CourseNotFoundError when the task’s course is gone', async () => {
    const repo = makeRepo();
    const courseRepo = makeCourseRepo();
    vi.mocked(repo.findById).mockResolvedValue(makeTask('task-9'));
    vi.mocked(courseRepo.findById).mockResolvedValue(null);
    const handler = new GetIdentifyTaskHandler(repo, courseRepo);
    await expect(handler.execute(new GetIdentifyTaskQuery('task-9'))).rejects.toBeInstanceOf(
      CourseNotFoundError,
    );
  });
});
