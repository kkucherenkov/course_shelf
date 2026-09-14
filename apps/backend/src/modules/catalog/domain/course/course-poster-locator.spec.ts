/**
 * Unit tests for CoursePosterLocator (#496).
 *
 * Scenarios:
 *   1. Happy path — returns absolutePath + sizeBytes for a course with a stored poster.
 *   2. CourseNotFoundError — no course with that id.
 *   3. CoursePosterNotFoundError — course exists but posterStoragePath is unset.
 *   4. CoursePosterNotFoundError — posterStoragePath set but the file is missing on disk.
 *   5. CoursePosterNotFoundError — posterStoragePath escapes DERIVED_PATH (defensive guard).
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { Course } from './course';
import { CourseNotFoundError, CoursePosterNotFoundError } from './course.errors';
import { CoursePosterLocator } from './course-poster-locator';

import type { CourseRepository } from './course.repository';
import type { AppConfig } from '../../../../common/config/app-config';

let FIXTURE_DIR: string;
let FIXTURE_PATH: string;
const FIXTURE_BYTES = Buffer.from('fake-jpeg-bytes');

beforeAll(() => {
  FIXTURE_DIR = mkdtempSync(path.join(os.tmpdir(), 'poster-locator-fixtures-'));
  FIXTURE_PATH = path.join(FIXTURE_DIR, 'course-1.jpg');
  writeFileSync(FIXTURE_PATH, FIXTURE_BYTES);
});

afterAll(() => {
  rmSync(FIXTURE_DIR, { recursive: true, force: true });
});

function makeCourse(posterStoragePath?: string): Course {
  const course = Course.create({
    id: 'course-1',
    libraryId: 'lib-1',
    slug: 'my-course',
    title: 'My Course',
    now: new Date('2026-01-01T00:00:00.000Z'),
  });
  if (posterStoragePath) course.setPosterStoragePath(posterStoragePath);
  return course;
}

function makeRepo(course: Course | null): CourseRepository {
  return { findById: vi.fn(async () => course) } as unknown as CourseRepository;
}

function makeAppConfig(): AppConfig {
  return { derivedPath: FIXTURE_DIR } as unknown as AppConfig;
}

describe('CoursePosterLocator', () => {
  it('returns absolutePath and sizeBytes for a course with a stored, on-disk poster', async () => {
    const course = makeCourse(FIXTURE_PATH);
    const locator = new CoursePosterLocator(makeRepo(course), makeAppConfig());

    const result = await locator.locate('course-1');

    expect(result.absolutePath).toBe(FIXTURE_PATH);
    expect(result.sizeBytes).toBe(FIXTURE_BYTES.length);
  });

  it('throws CourseNotFoundError when no course matches the id', async () => {
    const locator = new CoursePosterLocator(makeRepo(null), makeAppConfig());

    await expect(locator.locate('missing')).rejects.toBeInstanceOf(CourseNotFoundError);
  });

  it('throws CoursePosterNotFoundError when posterStoragePath is unset', async () => {
    const course = makeCourse();
    const locator = new CoursePosterLocator(makeRepo(course), makeAppConfig());

    await expect(locator.locate('course-1')).rejects.toBeInstanceOf(CoursePosterNotFoundError);
  });

  it('throws CoursePosterNotFoundError when the stored path is missing on disk', async () => {
    const course = makeCourse(path.join(FIXTURE_DIR, 'does-not-exist.jpg'));
    const locator = new CoursePosterLocator(makeRepo(course), makeAppConfig());

    await expect(locator.locate('course-1')).rejects.toBeInstanceOf(CoursePosterNotFoundError);
  });

  it('throws CoursePosterNotFoundError when the stored path escapes DERIVED_PATH', async () => {
    const course = makeCourse('/etc/passwd');
    const locator = new CoursePosterLocator(makeRepo(course), makeAppConfig());

    await expect(locator.locate('course-1')).rejects.toBeInstanceOf(CoursePosterNotFoundError);
  });
});
