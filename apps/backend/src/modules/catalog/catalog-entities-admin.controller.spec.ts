/**
 * Unit tests for CatalogEntitiesAdminController.
 *
 * Covers:
 *   - upsertInstructor: happy path returns InstructorDto with coursesTotal from repo
 *   - upsertStudio: happy path returns StudioDto with coursesTotal from repo
 *   - upsertTag: happy path returns TagDto with coursesTotal from repo; category
 *     forwarded correctly; null category forwarded as null
 *   - startBackfillMetadata: returns 202 + jobId; CommandBus dispatched once with
 *     correct shape; fire-and-forget (controller returns even when bus throws)
 *
 * AdminGuard is not tested here — it requires AuthService + i18n which are
 * integration concerns. The guard is bypassed by instantiating the controller
 * directly without a Nest application context. Guard rejection is covered by
 * integration/E2E tests.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CatalogEntitiesAdminController } from './catalog-entities-admin.controller';
import { UpsertInstructorCommand } from './application/commands/upsert-instructor.command';
import { UpsertStudioCommand } from './application/commands/upsert-studio.command';
import { UpsertTagCommand } from './application/commands/upsert-tag.command';
import { BackfillCourseMetadataCommand } from './application/commands/backfill-course-metadata.command';

import type { CommandBus } from '@nestjs/cqrs';
import type { InstructorRepository } from './domain/instructor/instructor.repository';
import type { StudioRepository } from './domain/studio/studio.repository';
import type { TagRepository } from './domain/tag/tag.repository';
import type { Instructor } from './domain/instructor/instructor';
import type { Studio } from './domain/studio/studio';
import type { Tag } from './domain/tag/tag';

// ── Aggregate stubs ──────────────────────────────────────────────────────────

const now = new Date();

const stubInstructor = {
  id: 'i1',
  slug: 'john-doe',
  displayName: 'John Doe',
  externalIds: [],
  createdAt: now,
  updatedAt: now,
} as unknown as Instructor;

const stubStudio = {
  id: 's1',
  slug: 'acme-studio',
  displayName: 'Acme Studio',
  externalIds: [],
  createdAt: now,
  updatedAt: now,
} as unknown as Studio;

const stubTag = {
  id: 't1',
  slug: 'typescript',
  displayName: 'TypeScript',
  category: 'language',
  externalIds: [],
  createdAt: now,
  updatedAt: now,
} as unknown as Tag;

// ── Factory helpers ──────────────────────────────────────────────────────────

function makeCommandBus(result: unknown): CommandBus {
  return { execute: vi.fn().mockResolvedValue(result) } as unknown as CommandBus;
}

function makeInstructorRepo(coursesTotal: number): InstructorRepository {
  return {
    findCoursesForInstructor: vi.fn().mockResolvedValue({ courseIds: [], total: coursesTotal }),
  } as unknown as InstructorRepository;
}

function makeStudioRepo(coursesTotal: number): StudioRepository {
  return {
    findCoursesForStudio: vi.fn().mockResolvedValue({ courseIds: [], total: coursesTotal }),
  } as unknown as StudioRepository;
}

function makeTagRepo(coursesTotal: number): TagRepository {
  return {
    findCoursesForTag: vi.fn().mockResolvedValue({ courseIds: [], total: coursesTotal }),
  } as unknown as TagRepository;
}

function makeController(
  commandBus: CommandBus,
  instructorRepo: InstructorRepository,
  studioRepo: StudioRepository,
  tagRepo: TagRepository,
): CatalogEntitiesAdminController {
  return new CatalogEntitiesAdminController(commandBus, instructorRepo, studioRepo, tagRepo);
}

// ── upsertInstructor ─────────────────────────────────────────────────────────

describe('CatalogEntitiesAdminController › upsertInstructor', () => {
  let commandBus: CommandBus;
  let instructorRepo: InstructorRepository;
  let controller: CatalogEntitiesAdminController;

  beforeEach(() => {
    commandBus = makeCommandBus(stubInstructor);
    instructorRepo = makeInstructorRepo(7);
    controller = makeController(commandBus, instructorRepo, makeStudioRepo(0), makeTagRepo(0));
  });

  it('dispatches UpsertInstructorCommand with body fields', async () => {
    await controller.upsertInstructor({
      displayName: 'John Doe',
      slug: 'john-doe',
      externalIds: [{ source: 'udemy', externalId: 'u123' }],
    });

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'John Doe',
        slug: 'john-doe',
        externalIds: [{ source: 'udemy', externalId: 'u123' }],
      }),
    );
  });

  it('dispatches a UpsertInstructorCommand instance', async () => {
    await controller.upsertInstructor({ displayName: 'John Doe' });
    const call = vi.mocked(commandBus.execute).mock.calls[0]?.[0];
    expect(call).toBeInstanceOf(UpsertInstructorCommand);
  });

  it('fetches coursesTotal from instructorRepo after the upsert', async () => {
    await controller.upsertInstructor({ displayName: 'John Doe' });
    expect(instructorRepo.findCoursesForInstructor).toHaveBeenCalledWith(stubInstructor.id, {
      offset: 0,
      limit: 0,
    });
  });

  it('returns InstructorDto with coursesTotal from the repo read', async () => {
    const result = await controller.upsertInstructor({ displayName: 'John Doe' });
    expect(result.coursesTotal).toBe(7);
    expect(result.id).toBe('i1');
    expect(result.slug).toBe('john-doe');
  });

  it('forwards undefined slug when body.slug is omitted', async () => {
    await controller.upsertInstructor({ displayName: 'John Doe' });
    expect(commandBus.execute).toHaveBeenCalledWith(expect.objectContaining({ slug: undefined }));
  });
});

// ── upsertStudio ─────────────────────────────────────────────────────────────

describe('CatalogEntitiesAdminController › upsertStudio', () => {
  let commandBus: CommandBus;
  let studioRepo: StudioRepository;
  let controller: CatalogEntitiesAdminController;

  beforeEach(() => {
    commandBus = makeCommandBus(stubStudio);
    studioRepo = makeStudioRepo(4);
    controller = makeController(commandBus, makeInstructorRepo(0), studioRepo, makeTagRepo(0));
  });

  it('dispatches UpsertStudioCommand with body fields', async () => {
    await controller.upsertStudio({ displayName: 'Acme Studio', slug: 'acme-studio' });
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: 'Acme Studio', slug: 'acme-studio' }),
    );
  });

  it('dispatches a UpsertStudioCommand instance', async () => {
    await controller.upsertStudio({ displayName: 'Acme Studio' });
    const call = vi.mocked(commandBus.execute).mock.calls[0]?.[0];
    expect(call).toBeInstanceOf(UpsertStudioCommand);
  });

  it('fetches coursesTotal from studioRepo after the upsert', async () => {
    await controller.upsertStudio({ displayName: 'Acme Studio' });
    expect(studioRepo.findCoursesForStudio).toHaveBeenCalledWith(stubStudio.id, {
      offset: 0,
      limit: 0,
    });
  });

  it('returns StudioDto with coursesTotal from the repo read', async () => {
    const result = await controller.upsertStudio({ displayName: 'Acme Studio' });
    expect(result.coursesTotal).toBe(4);
    expect(result.id).toBe('s1');
  });
});

// ── upsertTag ─────────────────────────────────────────────────────────────────

describe('CatalogEntitiesAdminController › upsertTag', () => {
  let commandBus: CommandBus;
  let tagRepo: TagRepository;
  let controller: CatalogEntitiesAdminController;

  beforeEach(() => {
    commandBus = makeCommandBus(stubTag);
    tagRepo = makeTagRepo(5);
    controller = makeController(commandBus, makeInstructorRepo(0), makeStudioRepo(0), tagRepo);
  });

  it('dispatches UpsertTagCommand with body fields including category', async () => {
    await controller.upsertTag({
      displayName: 'TypeScript',
      slug: 'typescript',
      category: 'language',
    });
    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        displayName: 'TypeScript',
        slug: 'typescript',
        category: 'language',
      }),
    );
  });

  it('dispatches a UpsertTagCommand instance', async () => {
    await controller.upsertTag({ displayName: 'TypeScript' });
    const call = vi.mocked(commandBus.execute).mock.calls[0]?.[0];
    expect(call).toBeInstanceOf(UpsertTagCommand);
  });

  it('forwards null when category is absent (undefined → null via ?? null)', async () => {
    await controller.upsertTag({ displayName: 'TypeScript' });
    expect(commandBus.execute).toHaveBeenCalledWith(expect.objectContaining({ category: null }));
  });

  it('forwards null when category is explicitly null', async () => {
    await controller.upsertTag({ displayName: 'TypeScript', category: null });
    expect(commandBus.execute).toHaveBeenCalledWith(expect.objectContaining({ category: null }));
  });

  it('fetches coursesTotal from tagRepo after the upsert', async () => {
    await controller.upsertTag({ displayName: 'TypeScript' });
    expect(tagRepo.findCoursesForTag).toHaveBeenCalledWith(stubTag.id, { offset: 0, limit: 0 });
  });

  it('returns TagDto with coursesTotal from the repo read', async () => {
    const result = await controller.upsertTag({ displayName: 'TypeScript' });
    expect(result.coursesTotal).toBe(5);
    expect(result.id).toBe('t1');
  });
});

// ── startBackfillMetadata ─────────────────────────────────────────────────────

describe('CatalogEntitiesAdminController › startBackfillMetadata', () => {
  let commandBus: ReturnType<typeof makeCommandBus>;
  let controller: CatalogEntitiesAdminController;

  beforeEach(() => {
    commandBus = makeCommandBus(undefined);
    controller = makeController(
      commandBus,
      makeInstructorRepo(0),
      makeStudioRepo(0),
      makeTagRepo(0),
    );
  });

  it('returns an object with a string jobId', () => {
    const result = controller.startBackfillMetadata({});
    expect(typeof result.jobId).toBe('string');
    expect(result.jobId.length).toBeGreaterThan(0);
  });

  it('dispatches BackfillCourseMetadataCommand exactly once', async () => {
    controller.startBackfillMetadata({ libraryId: 'lib-123' });
    // Allow the micro-task (void .execute) to settle.
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
  });

  it('dispatches a BackfillCourseMetadataCommand instance', async () => {
    controller.startBackfillMetadata({});
    await new Promise<void>((resolve) => setImmediate(resolve));
    const call = vi.mocked(commandBus.execute).mock.calls[0]?.[0];
    expect(call).toBeInstanceOf(BackfillCourseMetadataCommand);
  });

  it('passes libraryId from body to the command', async () => {
    controller.startBackfillMetadata({ libraryId: 'lib-xyz' });
    await new Promise<void>((resolve) => setImmediate(resolve));
    const cmd = vi.mocked(commandBus.execute).mock.calls[0]?.[0] as BackfillCourseMetadataCommand;
    expect(cmd.libraryId).toBe('lib-xyz');
  });

  it('passes a channel matching maintenance:backfill:{jobId}', async () => {
    const { jobId } = controller.startBackfillMetadata({});
    await new Promise<void>((resolve) => setImmediate(resolve));
    const cmd = vi.mocked(commandBus.execute).mock.calls[0]?.[0] as BackfillCourseMetadataCommand;
    expect(cmd.progressChannel).toBe(`maintenance:backfill:${jobId}`);
  });

  it('returns 202 even when CommandBus.execute rejects (fire-and-forget)', async () => {
    const failingBus = {
      execute: vi.fn().mockRejectedValue(new Error('unexpected crash')),
    } as unknown as ReturnType<typeof makeCommandBus>;
    const ctrl = makeController(
      failingBus,
      makeInstructorRepo(0),
      makeStudioRepo(0),
      makeTagRepo(0),
    );

    // The controller must not throw — it returns immediately.
    expect(() => ctrl.startBackfillMetadata({})).not.toThrow();
    const result = ctrl.startBackfillMetadata({});
    expect(typeof result.jobId).toBe('string');
  });
});
