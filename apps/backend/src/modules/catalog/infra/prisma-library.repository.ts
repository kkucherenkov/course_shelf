/**
 * WHY this file exists:
 * Prisma adapter that implements the LibraryRepository port. It is the only
 * place in the Catalog bounded context that depends on PrismaService. All
 * other layers (domain, application, controller) depend only on the port
 * interface, keeping them infrastructure-agnostic and easily testable.
 *
 * Row ↔ aggregate mapping is co-located here rather than in a separate mapper
 * class to avoid over-engineering a single-model context. If the mapping grows
 * (computed fields, nested relations), extract it to infra/library.mapper.ts.
 *
 * P2002 translation: Prisma raises a PrismaClientKnownRequestError with code
 * P2002 when a unique constraint is violated. We catch it here and rethrow as
 * LibraryAlreadyExistsError so the application layer stays free of Prisma types.
 */
import { unlink } from 'node:fs/promises';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { Library } from '../domain/library/library';
import { LibraryAlreadyExistsError } from '../domain/library/library.errors';

import type { LibraryRepository } from '../domain/library/library.repository';
import type { LibraryId } from '../domain/library/library';

/** Prisma P2025 — record not found. */
const P2025 = 'P2025';

@Injectable()
export class PrismaLibraryRepository implements LibraryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(library: Library): Promise<void> {
    try {
      await this.prisma.library.upsert({
        where: { id: library.id },
        create: {
          id: library.id,
          name: library.name,
          rootPath: library.rootPath,
          createdAt: library.createdAt,
          updatedAt: library.updatedAt,
        },
        update: {
          name: library.name,
          rootPath: library.rootPath,
          updatedAt: library.updatedAt,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new LibraryAlreadyExistsError(library.rootPath);
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Library | null> {
    const row = await this.prisma.library.findUnique({ where: { id } });

    if (!row) return null;

    return Library.reconstitute({
      id: row.id as LibraryId,
      name: row.name,
      rootPath: row.rootPath,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findByRootPath(rootPath: string): Promise<Library | null> {
    const row = await this.prisma.library.findUnique({ where: { rootPath } });

    if (!row) return null;

    return Library.reconstitute({
      id: row.id as LibraryId,
      name: row.name,
      rootPath: row.rootPath,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findAll(): Promise<Library[]> {
    const rows = await this.prisma.library.findMany({
      select: {
        id: true,
        name: true,
        rootPath: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return rows.map((row) =>
      Library.reconstitute({
        id: row.id as LibraryId,
        name: row.name,
        rootPath: row.rootPath,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    );
  }

  async findByIds(ids: string[]): Promise<Library[]> {
    if (ids.length === 0) return [];

    const rows = await this.prisma.library.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        rootPath: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return rows.map((row) =>
      Library.reconstitute({
        id: row.id as LibraryId,
        name: row.name,
        rootPath: row.rootPath,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    );
  }

  /**
   * Apply a partial update to a library row.
   * Returns the updated aggregate, or null when the id is not found (P2025).
   */
  async update(id: string, patch: { name?: string }): Promise<Library | null> {
    // WHY: exactOptionalPropertyTypes requires we omit the key entirely when
    // the value is undefined so Prisma does not interpret it as "set to NULL".
    const data: { name?: string } = {};
    if (patch.name !== undefined) data.name = patch.name;

    try {
      const row = await this.prisma.library.update({
        where: { id },
        data,
      });

      return Library.reconstitute({
        id: row.id as LibraryId,
        name: row.name,
        rootPath: row.rootPath,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === P2025) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Delete the library and all dependent rows inside a single transaction.
   *
   * Cascade graph (executed in child-first order so FK constraints are never
   * violated even when the DB has no ON DELETE CASCADE on bare foreign key
   * columns):
   *
   *   1. Collect courseIds for this library.
   *   2. Collect lessonIds for those courses.
   *   3. lessonProgress.deleteMany  where lessonId in lessonIds
   *   4. bookmark.deleteMany        where lessonId in lessonIds
   *   5. note.deleteMany            where lessonId in lessonIds
   *   6. transcript.deleteMany      where lessonId in lessonIds
   *      (TranscriptCue cascades via FK; derivedPath files unlinked
   *      best-effort after the transaction commits — see below)
   *   7. courseProgressReadModel.deleteMany  where courseId in courseIds
   *   8. accessGrant.deleteMany     where libraryId=id OR courseId in courseIds
   *   9. scan.deleteMany            where libraryId=id
   *      (ScanErrorRecord + DiscoveredFile cascade via FK)
   *  10. course.deleteMany          where libraryId=id
   *      (Section / Lesson / Material / Subtitle cascade via FK)
   *  11. library.delete             where id=id  → P2025 if missing → return false
   *
   * Step 6 exists because #502: `Transcript`/`TranscriptCue` carry no foreign
   * key to `Lesson` (docs/architecture.md:491 — saving a lesson recreates its
   * subtitle rows, so anything cascading from either would be erased by the
   * next ordinary scan). Nothing deletes them for us; wiping a library by hand
   * before this fix left 1761 orphan transcripts and 216442 orphan cues behind,
   * surfacing as E27 search hits for lessons that no longer exist.
   *
   * Returns true on success, false when the library was not found.
   */
  async removeWithCascade(id: string): Promise<boolean> {
    // Filled in during the transaction (step 6), unlinked best-effort after
    // it commits — same DB-first, unlink-after order as
    // TranscriptRepository.deleteForLesson.
    let derivedPaths: string[] = [];

    try {
      await this.prisma.$transaction(async (tx) => {
        // Step 1 — collect course ids.
        const courseRows = await tx.course.findMany({
          where: { libraryId: id },
          select: { id: true },
        });
        const courseIds = courseRows.map((c) => c.id);

        // Steps 2–5 — collect lesson ids then delete leaf progress rows.
        if (courseIds.length > 0) {
          const lessonRows = await tx.lesson.findMany({
            where: { courseId: { in: courseIds } },
            select: { id: true },
          });
          const lessonIds = lessonRows.map((l) => l.id);

          if (lessonIds.length > 0) {
            // Step 3
            await tx.lessonProgress.deleteMany({ where: { lessonId: { in: lessonIds } } });
            // Step 4
            await tx.bookmark.deleteMany({ where: { lessonId: { in: lessonIds } } });
            // Step 5
            await tx.note.deleteMany({ where: { lessonId: { in: lessonIds } } });

            // Step 6 — transcripts (+cues, cascading via FK). No FK to Lesson
            // exists, so this is the only thing that ever deletes them.
            const transcriptRows = await tx.transcript.findMany({
              where: { lessonId: { in: lessonIds } },
              select: { derivedPath: true },
            });
            derivedPaths = transcriptRows
              .map((t) => t.derivedPath)
              .filter((p): p is string => p !== null);
            await tx.transcript.deleteMany({ where: { lessonId: { in: lessonIds } } });
          }

          // Step 7
          await tx.courseProgressReadModel.deleteMany({ where: { courseId: { in: courseIds } } });
        }

        // Step 8 — access grants targeting the library itself, or any of its courses.
        const grantWhere: Prisma.AccessGrantWhereInput =
          courseIds.length > 0
            ? { OR: [{ libraryId: id }, { courseId: { in: courseIds } }] }
            : { libraryId: id };
        await tx.accessGrant.deleteMany({ where: grantWhere });

        // Step 9 — scans (ScanErrorRecord + DiscoveredFile cascade automatically).
        await tx.scan.deleteMany({ where: { libraryId: id } });

        // Step 10 — courses (Section / Lesson / Material / Subtitle cascade automatically).
        await tx.course.deleteMany({ where: { libraryId: id } });

        // Step 11 — the library itself; throws P2025 if already gone.
        await tx.library.delete({ where: { id } });
      });

      // Best-effort: the DB rows are already gone, which is the source of
      // truth the rest of the app reads. A file left behind here is a disk
      // leak, not a correctness bug.
      await Promise.all(
        derivedPaths.map((p) =>
          unlink(p).catch(() => {
            // Best-effort: the file may already be gone, or the derived volume
            // may be temporarily unavailable. The DB rows are already deleted.
          }),
        ),
      );

      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === P2025) {
        return false;
      }
      throw error;
    }
  }
}
