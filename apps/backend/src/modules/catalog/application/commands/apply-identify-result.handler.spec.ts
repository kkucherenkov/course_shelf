import { describe, expect, it, vi } from 'vitest';

import { ApplyIdentifyResultCommand } from './apply-identify-result.command';
import { ApplyIdentifyResultHandler } from './apply-identify-result.handler';
import { UpdateCourseMetadataCommand } from './update-course-metadata.command';
import { IdentifyTask } from '../../domain/identify/identify-task';
import {
  IdentifyTaskNotFoundError,
  IdentifyTaskNotPendingError,
} from '../../domain/identify/identify-task.errors';
import { IdentifyTaskApplied } from '../../domain/identify/identify-task.events';
import { defaultMergePolicy } from '../../domain/identify/merge-policy';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';
import type { MetadataLinker } from '../scan/metadata-linker';
import type { CommandBus, EventBus } from '@nestjs/cqrs';

const ACTOR = { id: 'admin-1', role: 'admin' };

const DEFAULT_FRAGMENT = { instructorNames: ['Jane Doe'], description: 'Scraped' };

function makeTask(fragment: Record<string, unknown> = DEFAULT_FRAGMENT): IdentifyTask {
  return IdentifyTask.create({
    id: 'task-1',
    courseId: 'c1',
    source: 'youtube',
    scrapedFragment: fragment,
    mergePolicy: defaultMergePolicy(),
    now: new Date('2026-05-24T00:00:00.000Z'),
  });
}

/** A current course with no description and no instructors (so merge fills them). */
function makeCourse() {
  return {
    title: 'Existing',
    description: undefined,
    level: undefined,
    language: undefined,
    posterUrl: undefined,
    releaseDate: undefined,
    ratingAverage: undefined,
    ratingCount: undefined,
    instructors: [],
    studios: [],
    tags: [],
    externalIds: [],
  };
}

function makeDeps() {
  const taskRepo = {
    save: vi.fn(),
    findById: vi.fn(),
    findMany: vi.fn(),
  } as IdentifyTaskRepository;
  const courseRepo = { findById: vi.fn() } as unknown as CourseRepository;
  const linker = {
    upsertInstructorsByName: vi.fn(async () => [
      { id: 'i1', slug: 'jane-doe', displayName: 'Jane Doe' },
    ]),
    upsertStudioByName: vi.fn(async () => null),
    upsertTagsByName: vi.fn(async () => []),
  } as unknown as MetadataLinker;
  const commandBus = { execute: vi.fn(async () => ({})) } as unknown as CommandBus;
  const eventBus = { publish: vi.fn() } as unknown as EventBus;
  return { taskRepo, courseRepo, linker, commandBus, eventBus };
}

describe('ApplyIdentifyResultHandler', () => {
  it('throws IdentifyTaskNotFoundError when the task is missing', async () => {
    const d = makeDeps();
    vi.mocked(d.taskRepo.findById).mockResolvedValue(null);
    const handler = new ApplyIdentifyResultHandler(
      d.taskRepo,
      d.courseRepo,
      d.linker,
      d.commandBus,
      d.eventBus,
    );
    await expect(
      handler.execute(new ApplyIdentifyResultCommand('nope', ACTOR, undefined)),
    ).rejects.toBeInstanceOf(IdentifyTaskNotFoundError);
  });

  it('rejects an already-applied task', async () => {
    const d = makeDeps();
    const task = makeTask();
    task.markApplied(defaultMergePolicy(), new Date());
    vi.mocked(d.taskRepo.findById).mockResolvedValue(task);
    const handler = new ApplyIdentifyResultHandler(
      d.taskRepo,
      d.courseRepo,
      d.linker,
      d.commandBus,
      d.eventBus,
    );
    await expect(
      handler.execute(new ApplyIdentifyResultCommand('task-1', ACTOR, undefined)),
    ).rejects.toBeInstanceOf(IdentifyTaskNotPendingError);
    expect(d.courseRepo.findById).not.toHaveBeenCalled();
  });

  it('merges, resolves names, dispatches UpdateCourseMetadataCommand, marks applied, emits event', async () => {
    const d = makeDeps();
    vi.mocked(d.taskRepo.findById).mockResolvedValue(makeTask());
    vi.mocked(d.courseRepo.findById).mockResolvedValue(makeCourse() as never);
    const handler = new ApplyIdentifyResultHandler(
      d.taskRepo,
      d.courseRepo,
      d.linker,
      d.commandBus,
      d.eventBus,
    );

    const dto = await handler.execute(new ApplyIdentifyResultCommand('task-1', ACTOR, undefined));

    // resolved instructor names → ids in the dispatched command
    const dispatched = vi.mocked(d.commandBus.execute).mock
      .calls[0]![0] as UpdateCourseMetadataCommand;
    expect(dispatched).toBeInstanceOf(UpdateCourseMetadataCommand);
    expect(dispatched.patch.instructorIds).toEqual(['i1']);
    expect(dispatched.patch.description).toBe('Scraped'); // filled (was empty)
    expect(d.linker.upsertInstructorsByName).toHaveBeenCalledWith(['Jane Doe']);
    expect(d.eventBus.publish).toHaveBeenCalledWith(expect.any(IdentifyTaskApplied));
    expect(d.taskRepo.save).toHaveBeenCalledOnce();
    expect(dto.status).toBe('applied');
  });

  // ── Rating split-policy tests ────────────────────────────────────────────────

  it('split policy avg=overwrite / count=ignore: patch keeps course count', async () => {
    const d = makeDeps();
    const task = IdentifyTask.create({
      id: 'task-1',
      courseId: 'c1',
      source: 'youtube',
      scrapedFragment: { ratingAverage: 4.8, ratingCount: 9999 },
      mergePolicy: { ...defaultMergePolicy(), ratingAverage: 'overwrite', ratingCount: 'ignore' },
      now: new Date('2026-05-24T00:00:00.000Z'),
    });
    const course = { ...makeCourse(), ratingAverage: 4.2, ratingCount: 100 };
    vi.mocked(d.taskRepo.findById).mockResolvedValue(task);
    vi.mocked(d.courseRepo.findById).mockResolvedValue(course as never);
    const handler = new ApplyIdentifyResultHandler(
      d.taskRepo,
      d.courseRepo,
      d.linker,
      d.commandBus,
      d.eventBus,
    );

    await handler.execute(new ApplyIdentifyResultCommand('task-1', ACTOR, undefined));

    const dispatched = vi.mocked(d.commandBus.execute).mock
      .calls[0]![0] as UpdateCourseMetadataCommand;
    // avg takes scraped value; count falls back to course's stored value (ignored side preserved)
    expect(dispatched.patch.ratingAverage).toBe(4.8);
    expect(dispatched.patch.ratingCount).toBe(100);
  });

  it('split policy avg=ignore / count=overwrite: patch keeps course avg', async () => {
    const d = makeDeps();
    const task = IdentifyTask.create({
      id: 'task-1',
      courseId: 'c1',
      source: 'youtube',
      scrapedFragment: { ratingAverage: 4.8, ratingCount: 9999 },
      mergePolicy: { ...defaultMergePolicy(), ratingAverage: 'ignore', ratingCount: 'overwrite' },
      now: new Date('2026-05-24T00:00:00.000Z'),
    });
    const course = { ...makeCourse(), ratingAverage: 4.2, ratingCount: 100 };
    vi.mocked(d.taskRepo.findById).mockResolvedValue(task);
    vi.mocked(d.courseRepo.findById).mockResolvedValue(course as never);
    const handler = new ApplyIdentifyResultHandler(
      d.taskRepo,
      d.courseRepo,
      d.linker,
      d.commandBus,
      d.eventBus,
    );

    await handler.execute(new ApplyIdentifyResultCommand('task-1', ACTOR, undefined));

    const dispatched = vi.mocked(d.commandBus.execute).mock
      .calls[0]![0] as UpdateCourseMetadataCommand;
    // count takes scraped value; avg falls back to course's stored value (ignored side preserved)
    expect(dispatched.patch.ratingCount).toBe(9999);
    expect(dispatched.patch.ratingAverage).toBe(4.2);
  });

  it('no count anywhere: pair cannot form, neither ratingAverage nor ratingCount written', async () => {
    const d = makeDeps();
    const task = IdentifyTask.create({
      id: 'task-1',
      courseId: 'c1',
      source: 'youtube',
      scrapedFragment: { ratingAverage: 4.8 }, // no ratingCount in fragment
      mergePolicy: {
        ...defaultMergePolicy(),
        ratingAverage: 'overwrite',
        ratingCount: 'overwrite',
      },
      now: new Date('2026-05-24T00:00:00.000Z'),
    });
    // course also has no rating
    vi.mocked(d.taskRepo.findById).mockResolvedValue(task);
    vi.mocked(d.courseRepo.findById).mockResolvedValue(makeCourse() as never);
    const handler = new ApplyIdentifyResultHandler(
      d.taskRepo,
      d.courseRepo,
      d.linker,
      d.commandBus,
      d.eventBus,
    );

    await handler.execute(new ApplyIdentifyResultCommand('task-1', ACTOR, undefined));

    const dispatched = vi.mocked(d.commandBus.execute).mock
      .calls[0]![0] as UpdateCourseMetadataCommand;
    // count is undefined both in fragment and course → pair cannot form → neither field written
    expect(dispatched.patch.ratingAverage).toBeUndefined();
    expect(dispatched.patch.ratingCount).toBeUndefined();
  });
});
