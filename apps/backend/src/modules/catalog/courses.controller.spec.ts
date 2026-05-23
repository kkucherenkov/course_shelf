/**
 * Unit tests for CoursesController.
 *
 * Focuses on the controller-layer concerns that are not covered by handler
 * specs — specifically the rating-fields-must-be-paired validation that lives
 * at the HTTP boundary because it is a cross-field input constraint rather than
 * a business rule.
 *
 * Full PATCH integration is exercised in update-course-metadata.handler.spec.ts.
 * GET and progress endpoints are straightforward bus dispatches with no extra
 * logic, so they are not duplicated here.
 */
import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CoursesController } from './courses.controller';

import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { SessionContext } from '../../common/auth/decorators';
import type { CourseDto } from '@app/api-client-ts';

// ── Helpers ───────────────────────────────────────────────────────────────────

const session: SessionContext = { user: { id: 'u1', role: 'admin' }, sessionId: 'sess-1' };

const stubCourse = {
  id: 'c1',
  libraryId: 'lib-1',
  title: 'Test Course',
  slug: 'test-course',
  sections: [],
  progress: { status: 'not-started', lessonsCompleted: 0, lessonsTotal: 0 },
} as unknown as CourseDto;

function makeCommandBus(result: unknown): CommandBus {
  return { execute: vi.fn().mockResolvedValue(result) } as unknown as CommandBus;
}

function makeQueryBus(result: unknown): QueryBus {
  return { execute: vi.fn().mockResolvedValue(result) } as unknown as QueryBus;
}

// ── PATCH /courses/:id — rating pair validation ───────────────────────────────

describe('CoursesController › updateCourse — rating-fields-must-be-paired', () => {
  let commandBus: CommandBus;
  let controller: CoursesController;

  beforeEach(() => {
    commandBus = makeCommandBus(stubCourse);
    controller = new CoursesController(commandBus, makeQueryBus(stubCourse));
  });

  it('throws BadRequestException when ratingAverage is provided but ratingCount is absent', async () => {
    await expect(controller.updateCourse('c1', { ratingAverage: 4.5 }, session)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when ratingCount is provided but ratingAverage is absent', async () => {
    await expect(controller.updateCourse('c1', { ratingCount: 100 }, session)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('includes rating-fields-must-be-paired code in exception response', async () => {
    try {
      await controller.updateCourse('c1', { ratingAverage: 4.5 }, session);
      expect(true).toBe(false); // should not reach here
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as Record<string, unknown>;
      expect(response['code']).toBe('rating-fields-must-be-paired');
    }
  });

  it('dispatches the command when both ratingAverage and ratingCount are provided', async () => {
    const result = await controller.updateCourse(
      'c1',
      { ratingAverage: 4.5, ratingCount: 200 },
      session,
    );
    expect(commandBus.execute).toHaveBeenCalledOnce();
    expect(result).toEqual(stubCourse);
  });

  it('dispatches the command when neither rating field is provided', async () => {
    const result = await controller.updateCourse('c1', { title: 'New Title' }, session);
    expect(commandBus.execute).toHaveBeenCalledOnce();
    expect(result).toEqual(stubCourse);
  });

  it('dispatches the command when both rating fields are null (clear both)', async () => {
    // null means clear; both null together is valid (both present → paired)
    const result = await controller.updateCourse(
      'c1',
      { ratingAverage: null, ratingCount: null },
      session,
    );
    expect(commandBus.execute).toHaveBeenCalledOnce();
    expect(result).toEqual(stubCourse);
  });
});

// ── PATCH /courses/:id — new enrichment fields are forwarded ──────────────────

describe('CoursesController › updateCourse — enrichment patch fields', () => {
  let commandBus: CommandBus;
  let controller: CoursesController;

  beforeEach(() => {
    commandBus = makeCommandBus(stubCourse);
    controller = new CoursesController(commandBus, makeQueryBus(stubCourse));
  });

  it('passes instructorIds, studioIds, tagIds to the command patch', async () => {
    await controller.updateCourse(
      'c1',
      { instructorIds: ['i1'], studioIds: ['s1'], tagIds: ['t1'] },
      session,
    );

    const patch = (
      vi.mocked(commandBus.execute).mock.calls[0]?.[0] as { patch: Record<string, unknown> }
    ).patch;
    expect(patch['instructorIds']).toEqual(['i1']);
    expect(patch['studioIds']).toEqual(['s1']);
    expect(patch['tagIds']).toEqual(['t1']);
  });

  it('parses releaseDate ISO string to a Date in the patch', async () => {
    const iso = '2024-01-15T00:00:00.000Z';
    await controller.updateCourse('c1', { releaseDate: iso }, session);

    const patch = (
      vi.mocked(commandBus.execute).mock.calls[0]?.[0] as { patch: Record<string, unknown> }
    ).patch;
    expect(patch['releaseDate']).toBeInstanceOf(Date);
    expect((patch['releaseDate'] as Date).toISOString()).toBe(iso);
  });

  it('passes null releaseDate as null in the patch', async () => {
    await controller.updateCourse('c1', { releaseDate: null }, session);

    const patch = (
      vi.mocked(commandBus.execute).mock.calls[0]?.[0] as { patch: Record<string, unknown> }
    ).patch;
    expect(patch['releaseDate']).toBeNull();
  });

  it('passes level and language through to the patch', async () => {
    await controller.updateCourse('c1', { level: 'advanced', language: 'en' }, session);

    const patch = (
      vi.mocked(commandBus.execute).mock.calls[0]?.[0] as { patch: Record<string, unknown> }
    ).patch;
    expect(patch['level']).toBe('advanced');
    expect(patch['language']).toBe('en');
  });
});
