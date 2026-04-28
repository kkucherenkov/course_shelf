/**
 * WHY this file exists:
 * Prisma adapter that implements the LessonRepository port. It is the only place
 * in the Catalog bounded context that knows about the `lesson`, `material`, and
 * `subtitle` tables. All other layers depend only on the LessonRepository interface.
 *
 * Save strategy: delete-and-recreate materials + subtitles inside a transaction
 * (same pattern as PrismaCourseRepository for sections). The lesson row itself is
 * upserted so both create and update paths share one code path.
 *
 * P2002 translation: Prisma raises PrismaClientKnownRequestError with code P2002
 * on the (sectionId, position) unique constraint. We catch it here and rethrow as
 * LessonPositionConflictError so the application layer stays free of Prisma types.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { Lesson } from '../domain/lesson/lesson';
import { LessonPositionConflictError } from '../domain/lesson/lesson.errors';
import { Material } from '../domain/lesson/material';
import { Subtitle } from '../domain/lesson/subtitle';

import type { LessonRepository } from '../domain/lesson/lesson.repository';
import type { LessonId } from '../domain/lesson/lesson';

/** Shape of a lesson row returned by Prisma with nested materials + subtitles. */
interface LessonRow {
  id: string;
  courseId: string;
  sectionId: string;
  position: number;
  title: string;
  videoPath: string;
  mtime: Date;
  sizeBytes: number;
  duration: number | null;
  createdAt: Date;
  updatedAt: Date;
  materials: {
    id: string;
    kind: string;
    label: string;
    path: string;
    sizeBytes: number;
  }[];
  subtitles: {
    id: string;
    language: string;
    label: string;
    path: string;
  }[];
}

const LESSON_WITH_CHILDREN_SELECT = {
  id: true,
  courseId: true,
  sectionId: true,
  position: true,
  title: true,
  videoPath: true,
  mtime: true,
  sizeBytes: true,
  duration: true,
  createdAt: true,
  updatedAt: true,
  materials: {
    select: { id: true, kind: true, label: true, path: true, sizeBytes: true },
  },
  subtitles: {
    select: { id: true, language: true, label: true, path: true },
  },
} as const;

@Injectable()
export class PrismaLessonRepository implements LessonRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(lesson: Lesson): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await tx.lesson.upsert({
          where: { id: lesson.id },
          create: {
            id: lesson.id,
            courseId: lesson.courseId,
            sectionId: lesson.sectionId,
            position: lesson.position,
            title: lesson.title,
            videoPath: lesson.videoPath,
            mtime: lesson.mtime,
            sizeBytes: lesson.sizeBytes,
            duration: lesson.duration ?? null,
            createdAt: lesson.createdAt,
            updatedAt: lesson.updatedAt,
          },
          update: {
            position: lesson.position,
            title: lesson.title,
            videoPath: lesson.videoPath,
            mtime: lesson.mtime,
            sizeBytes: lesson.sizeBytes,
            duration: lesson.duration ?? null,
            updatedAt: lesson.updatedAt,
          },
        });

        // Materials: delete all existing, then recreate from aggregate state.
        await tx.material.deleteMany({ where: { lessonId: lesson.id } });
        if (lesson.materials.length > 0) {
          await tx.material.createMany({
            data: lesson.materials.map((m) => ({
              id: m.id,
              lessonId: lesson.id,
              kind: m.kind,
              label: m.label,
              path: m.path,
              sizeBytes: m.sizeBytes,
            })),
          });
        }

        // Subtitles: delete all existing, then recreate from aggregate state.
        await tx.subtitle.deleteMany({ where: { lessonId: lesson.id } });
        if (lesson.subtitles.length > 0) {
          await tx.subtitle.createMany({
            data: lesson.subtitles.map((s) => ({
              id: s.id,
              lessonId: lesson.id,
              language: s.language,
              label: s.label,
              path: s.path,
            })),
          });
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new LessonPositionConflictError(
          `Lesson at position ${String(lesson.position)} already exists in section "${lesson.sectionId}".`,
        );
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Lesson | null> {
    const row = await this.prisma.lesson.findUnique({
      where: { id },
      select: LESSON_WITH_CHILDREN_SELECT,
    });

    if (!row) return null;
    return this.rowToAggregate(row);
  }

  async findByCourse(courseId: string): Promise<Lesson[]> {
    const rows = await this.prisma.lesson.findMany({
      where: { courseId },
      select: LESSON_WITH_CHILDREN_SELECT,
      orderBy: [{ sectionId: 'asc' }, { position: 'asc' }],
    });

    return rows.map((r: LessonRow) => this.rowToAggregate(r));
  }

  async findBySection(sectionId: string): Promise<Lesson[]> {
    const rows = await this.prisma.lesson.findMany({
      where: { sectionId },
      select: LESSON_WITH_CHILDREN_SELECT,
      orderBy: { position: 'asc' },
    });

    return rows.map((r: LessonRow) => this.rowToAggregate(r));
  }

  /**
   * Return aggregate lesson stats per course in a single Prisma groupBy query.
   * Null duration values are treated as 0 (COALESCE-like logic applied in the
   * mapper). Courses with no lessons are absent from the returned Map — callers
   * must handle missing entries as { lessonCount: 0, totalDurationSeconds: 0 }.
   */
  async getLessonStatsByCourseIds(
    courseIds: string[],
  ): Promise<Map<string, { lessonCount: number; totalDurationSeconds: number }>> {
    if (courseIds.length === 0) return new Map();

    const rows = await this.prisma.lesson.groupBy({
      by: ['courseId'],
      where: { courseId: { in: courseIds } },
      _count: { id: true },
      _sum: { duration: true },
    });

    const result = new Map<string, { lessonCount: number; totalDurationSeconds: number }>();
    for (const row of rows) {
      result.set(row.courseId, {
        lessonCount: row._count.id,
        // null sum (all durations null) is treated as 0
        totalDurationSeconds: row._sum.duration ?? 0,
      });
    }
    return result;
  }

  // ---------------------------------------------------------------------------
  // Private mapper — row shape → domain aggregate
  // ---------------------------------------------------------------------------
  private rowToAggregate(row: LessonRow): Lesson {
    return Lesson.reconstitute({
      id: row.id as LessonId,
      courseId: row.courseId,
      sectionId: row.sectionId,
      position: row.position,
      title: row.title,
      videoPath: row.videoPath,
      mtime: row.mtime,
      sizeBytes: row.sizeBytes,
      duration: row.duration ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      materials: row.materials.map((m) =>
        Material.reconstitute({
          id: m.id,
          kind: m.kind as import('../domain/lesson/material').MaterialKindValue,
          label: m.label,
          path: m.path,
          sizeBytes: m.sizeBytes,
        }),
      ),
      subtitles: row.subtitles.map((s) =>
        Subtitle.reconstitute({
          id: s.id,
          language: s.language,
          label: s.label,
          path: s.path,
        }),
      ),
    });
  }
}
