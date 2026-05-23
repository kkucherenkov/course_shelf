/**
 * Unit tests for CatalogEntitiesController.
 *
 * Covers all six read endpoints:
 *   listInstructors, getInstructor,
 *   listStudios, getStudio,
 *   listTags, getTag
 *
 * For each endpoint:
 *   - happy path returns the DTO from the query bus
 *   - pagination defaults applied when offset/limit absent
 *   - limit is clamped to maxLimit (100) when it exceeds the cap
 *   - negative offset returns BadRequestException (400)
 *   - non-integer offset returns BadRequestException (400)
 *   - not-found from query bus propagates unchanged (domain error, no HTTP transform here)
 *
 * Guard behaviour is not tested here — integration tests cover that.
 */
import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CatalogEntitiesController } from './catalog-entities.controller';
import { ListInstructorsQuery } from './application/queries/list-instructors.query';
import { GetInstructorQuery } from './application/queries/get-instructor.query';
import { ListStudiosQuery } from './application/queries/list-studios.query';
import { GetStudioQuery } from './application/queries/get-studio.query';
import { ListTagsQuery } from './application/queries/list-tags.query';
import { GetTagQuery } from './application/queries/get-tag.query';
import { InstructorNotFoundError } from './domain/instructor/instructor.errors';
import { StudioNotFoundError } from './domain/studio/studio.errors';
import { TagNotFoundError } from './domain/tag/tag.errors';

import type { QueryBus } from '@nestjs/cqrs';
import type {
  InstructorListDto,
  InstructorDetailDto,
  StudioListDto,
  StudioDetailDto,
  TagListDto,
  TagDetailDto,
} from '@app/api-client-ts';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeQueryBus(result: unknown): QueryBus {
  return {
    execute: vi.fn().mockResolvedValue(result),
  } as unknown as QueryBus;
}

function makeQueryBusRejecting(error: unknown): QueryBus {
  return {
    execute: vi.fn().mockRejectedValue(error),
  } as unknown as QueryBus;
}

const stubInstructorList: InstructorListDto = {
  items: [],
  total: 0,
  offset: 0,
  limit: 20,
};

const stubInstructorDetail: InstructorDetailDto = {
  instructor: {
    id: 'i1',
    slug: 'john-doe',
    displayName: 'John Doe',
    externalIds: [],
    coursesTotal: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  courses: [],
  coursesTotal: 3,
};

const stubStudioList: StudioListDto = { items: [], total: 0, offset: 0, limit: 20 };

const stubStudioDetail: StudioDetailDto = {
  studio: {
    id: 's1',
    slug: 'acme-studio',
    displayName: 'Acme Studio',
    externalIds: [],
    coursesTotal: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  courses: [],
  coursesTotal: 2,
};

const stubTagList: TagListDto = { items: [], total: 0, offset: 0, limit: 20 };

const stubTagDetail: TagDetailDto = {
  tag: {
    id: 't1',
    slug: 'typescript',
    displayName: 'TypeScript',
    category: 'language',
    externalIds: [],
    coursesTotal: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  courses: [],
  coursesTotal: 5,
};

// ── listInstructors ───────────────────────────────────────────────────────────

describe('CatalogEntitiesController › listInstructors', () => {
  let queryBus: QueryBus;
  let controller: CatalogEntitiesController;

  beforeEach(() => {
    queryBus = makeQueryBus(stubInstructorList);
    controller = new CatalogEntitiesController(queryBus);
  });

  it('returns the result from the query bus', async () => {
    const result = await controller.listInstructors(undefined, undefined, undefined);
    expect(result).toEqual(stubInstructorList);
  });

  it('dispatches ListInstructorsQuery with default offset=0 and limit=20 when params absent', async () => {
    await controller.listInstructors(undefined, undefined, undefined);
    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 0, limit: 20 }),
    );
  });

  it('dispatches a ListInstructorsQuery instance', async () => {
    await controller.listInstructors(undefined, undefined, undefined);
    const call = vi.mocked(queryBus.execute).mock.calls[0]?.[0];
    expect(call).toBeInstanceOf(ListInstructorsQuery);
  });

  it('threads search param into the query', async () => {
    await controller.listInstructors(undefined, undefined, 'alice');
    expect(queryBus.execute).toHaveBeenCalledWith(expect.objectContaining({ search: 'alice' }));
  });

  it('clamps limit to 100 when it exceeds the max', async () => {
    await controller.listInstructors(undefined, '500', undefined);
    expect(queryBus.execute).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
  });

  it('parses offset and limit strings to integers', async () => {
    await controller.listInstructors('10', '50', undefined);
    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 10, limit: 50 }),
    );
  });

  it('throws BadRequestException for negative offset', () => {
    expect(() => controller.listInstructors('-1', undefined, undefined)).toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException for non-integer offset', () => {
    expect(() => controller.listInstructors('abc', undefined, undefined)).toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException for non-integer limit', () => {
    expect(() => controller.listInstructors(undefined, 'abc', undefined)).toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException for zero limit', () => {
    expect(() => controller.listInstructors(undefined, '0', undefined)).toThrow(
      BadRequestException,
    );
  });
});

// ── getInstructor ─────────────────────────────────────────────────────────────

describe('CatalogEntitiesController › getInstructor', () => {
  let queryBus: QueryBus;
  let controller: CatalogEntitiesController;

  beforeEach(() => {
    queryBus = makeQueryBus(stubInstructorDetail);
    controller = new CatalogEntitiesController(queryBus);
  });

  it('returns the result from the query bus', async () => {
    const result = await controller.getInstructor('john-doe', undefined, undefined);
    expect(result).toEqual(stubInstructorDetail);
  });

  it('dispatches GetInstructorQuery with the slug and defaults', async () => {
    await controller.getInstructor('john-doe', undefined, undefined);
    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'john-doe', coursesOffset: 0, coursesLimit: 20 }),
    );
  });

  it('dispatches a GetInstructorQuery instance', async () => {
    await controller.getInstructor('john-doe', undefined, undefined);
    const call = vi.mocked(queryBus.execute).mock.calls[0]?.[0];
    expect(call).toBeInstanceOf(GetInstructorQuery);
  });

  it('propagates InstructorNotFoundError from the query bus', async () => {
    const err = new InstructorNotFoundError('bad-slug');
    queryBus = makeQueryBusRejecting(err);
    controller = new CatalogEntitiesController(queryBus);

    await expect(controller.getInstructor('bad-slug', undefined, undefined)).rejects.toThrow(err);
  });

  it('threads coursesOffset and coursesLimit params', async () => {
    await controller.getInstructor('john-doe', '5', '10');
    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ coursesOffset: 5, coursesLimit: 10 }),
    );
  });

  it('clamps coursesLimit to 100', async () => {
    await controller.getInstructor('john-doe', undefined, '999');
    expect(queryBus.execute).toHaveBeenCalledWith(expect.objectContaining({ coursesLimit: 100 }));
  });

  it('throws BadRequestException for negative coursesOffset', () => {
    expect(() => controller.getInstructor('john-doe', '-5', undefined)).toThrow(
      BadRequestException,
    );
  });
});

// ── listStudios ───────────────────────────────────────────────────────────────

describe('CatalogEntitiesController › listStudios', () => {
  let queryBus: QueryBus;
  let controller: CatalogEntitiesController;

  beforeEach(() => {
    queryBus = makeQueryBus(stubStudioList);
    controller = new CatalogEntitiesController(queryBus);
  });

  it('returns the result from the query bus', async () => {
    const result = await controller.listStudios(undefined, undefined, undefined);
    expect(result).toEqual(stubStudioList);
  });

  it('dispatches ListStudiosQuery with defaults', async () => {
    await controller.listStudios(undefined, undefined, undefined);
    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 0, limit: 20 }),
    );
  });

  it('dispatches a ListStudiosQuery instance', async () => {
    await controller.listStudios(undefined, undefined, undefined);
    const call = vi.mocked(queryBus.execute).mock.calls[0]?.[0];
    expect(call).toBeInstanceOf(ListStudiosQuery);
  });

  it('clamps limit to 100', async () => {
    await controller.listStudios(undefined, '200', undefined);
    expect(queryBus.execute).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
  });

  it('throws BadRequestException for negative offset', () => {
    expect(() => controller.listStudios('-1', undefined, undefined)).toThrow(BadRequestException);
  });
});

// ── getStudio ─────────────────────────────────────────────────────────────────

describe('CatalogEntitiesController › getStudio', () => {
  let queryBus: QueryBus;
  let controller: CatalogEntitiesController;

  beforeEach(() => {
    queryBus = makeQueryBus(stubStudioDetail);
    controller = new CatalogEntitiesController(queryBus);
  });

  it('returns the result from the query bus', async () => {
    const result = await controller.getStudio('acme-studio', undefined, undefined);
    expect(result).toEqual(stubStudioDetail);
  });

  it('dispatches GetStudioQuery with slug and defaults', async () => {
    await controller.getStudio('acme-studio', undefined, undefined);
    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'acme-studio', coursesOffset: 0, coursesLimit: 20 }),
    );
  });

  it('dispatches a GetStudioQuery instance', async () => {
    await controller.getStudio('acme-studio', undefined, undefined);
    const call = vi.mocked(queryBus.execute).mock.calls[0]?.[0];
    expect(call).toBeInstanceOf(GetStudioQuery);
  });

  it('propagates StudioNotFoundError from the query bus', async () => {
    const err = new StudioNotFoundError('bad-slug');
    queryBus = makeQueryBusRejecting(err);
    controller = new CatalogEntitiesController(queryBus);

    await expect(controller.getStudio('bad-slug', undefined, undefined)).rejects.toThrow(err);
  });

  it('throws BadRequestException for non-integer coursesOffset', () => {
    expect(() => controller.getStudio('acme-studio', 'nope', undefined)).toThrow(
      BadRequestException,
    );
  });
});

// ── listTags ──────────────────────────────────────────────────────────────────

describe('CatalogEntitiesController › listTags', () => {
  let queryBus: QueryBus;
  let controller: CatalogEntitiesController;

  beforeEach(() => {
    queryBus = makeQueryBus(stubTagList);
    controller = new CatalogEntitiesController(queryBus);
  });

  it('returns the result from the query bus', async () => {
    const result = await controller.listTags(undefined, undefined, undefined, undefined);
    expect(result).toEqual(stubTagList);
  });

  it('dispatches ListTagsQuery with defaults and no category filter', async () => {
    await controller.listTags(undefined, undefined, undefined, undefined);
    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 0, limit: 20, category: undefined }),
    );
  });

  it('dispatches a ListTagsQuery instance', async () => {
    await controller.listTags(undefined, undefined, undefined, undefined);
    const call = vi.mocked(queryBus.execute).mock.calls[0]?.[0];
    expect(call).toBeInstanceOf(ListTagsQuery);
  });

  it('threads category filter into the query', async () => {
    await controller.listTags(undefined, undefined, undefined, 'language');
    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'language' }),
    );
  });

  it('clamps limit to 100', async () => {
    await controller.listTags(undefined, '150', undefined, undefined);
    expect(queryBus.execute).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
  });

  it('throws BadRequestException for negative offset', () => {
    expect(() => controller.listTags('-1', undefined, undefined, undefined)).toThrow(
      BadRequestException,
    );
  });
});

// ── getTag ────────────────────────────────────────────────────────────────────

describe('CatalogEntitiesController › getTag', () => {
  let queryBus: QueryBus;
  let controller: CatalogEntitiesController;

  beforeEach(() => {
    queryBus = makeQueryBus(stubTagDetail);
    controller = new CatalogEntitiesController(queryBus);
  });

  it('returns the result from the query bus', async () => {
    const result = await controller.getTag('typescript', undefined, undefined);
    expect(result).toEqual(stubTagDetail);
  });

  it('dispatches GetTagQuery with slug and defaults', async () => {
    await controller.getTag('typescript', undefined, undefined);
    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'typescript', coursesOffset: 0, coursesLimit: 20 }),
    );
  });

  it('dispatches a GetTagQuery instance', async () => {
    await controller.getTag('typescript', undefined, undefined);
    const call = vi.mocked(queryBus.execute).mock.calls[0]?.[0];
    expect(call).toBeInstanceOf(GetTagQuery);
  });

  it('propagates TagNotFoundError from the query bus', async () => {
    const err = new TagNotFoundError('bad-slug');
    queryBus = makeQueryBusRejecting(err);
    controller = new CatalogEntitiesController(queryBus);

    await expect(controller.getTag('bad-slug', undefined, undefined)).rejects.toThrow(err);
  });

  it('threads coursesOffset and coursesLimit params', async () => {
    await controller.getTag('typescript', '2', '15');
    expect(queryBus.execute).toHaveBeenCalledWith(
      expect.objectContaining({ coursesOffset: 2, coursesLimit: 15 }),
    );
  });

  it('throws BadRequestException for non-integer coursesLimit', () => {
    expect(() => controller.getTag('typescript', undefined, 'bad')).toThrow(BadRequestException);
  });
});
