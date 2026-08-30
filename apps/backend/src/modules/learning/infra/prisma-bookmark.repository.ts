/**
 * WHY this file exists:
 * Prisma adapter that implements the BookmarkRepository port. It is the only
 * file in the Learning bounded context's bookmark slice that depends on
 * PrismaService. All other layers depend only on the port interface.
 *
 * label boundary: the aggregate stores undefined when absent; Prisma requires
 * null in the DB. The mapper converts in both directions. idempotencyKey
 * follows the same undefined ↔ null convention (#285).
 *
 * findManyByUserAndLesson orders by positionSeconds ASC — the contract
 * documented on the port interface.
 *
 * P2002 translation: `uq_bookmark_idempotency` (userId, lessonId,
 * idempotencyKey) is the only unique constraint besides the id PK, so any
 * P2002 from `create` unambiguously means a concurrent create won the race
 * on that key — translated to BookmarkIdempotencyConflictError so the
 * application layer stays free of Prisma types.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { Bookmark } from '../domain/bookmark/bookmark';
import { BookmarkIdempotencyConflictError } from '../domain/bookmark/bookmark.errors';

import type { BookmarkRepository } from '../domain/bookmark/bookmark.repository';

// Minimal row shape for the bookmark table (select projection).
interface BookmarkRow {
  id: string;
  userId: string;
  lessonId: string;
  positionSeconds: number;
  label: string | null;
  idempotencyKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SELECT = {
  id: true,
  userId: true,
  lessonId: true,
  positionSeconds: true,
  label: true,
  idempotencyKey: true,
  createdAt: true,
  updatedAt: true,
} as const;

function rowToAggregate(row: BookmarkRow): Bookmark {
  return Bookmark.reconstitute({
    id: row.id,
    userId: row.userId,
    lessonId: row.lessonId,
    positionSeconds: row.positionSeconds,
    // null → undefined at the domain boundary
    label: row.label ?? undefined,
    idempotencyKey: row.idempotencyKey ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

@Injectable()
export class PrismaBookmarkRepository implements BookmarkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(bookmark: Bookmark): Promise<void> {
    // undefined → null at the Prisma boundary
    const label = bookmark.label ?? null;
    const idempotencyKey = bookmark.idempotencyKey ?? null;

    try {
      await this.prisma.bookmark.upsert({
        where: { id: bookmark.id },
        create: {
          id: bookmark.id,
          userId: bookmark.userId,
          lessonId: bookmark.lessonId,
          positionSeconds: bookmark.positionSeconds,
          label,
          idempotencyKey,
        },
        update: {
          positionSeconds: bookmark.positionSeconds,
          label,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new BookmarkIdempotencyConflictError();
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Bookmark | null> {
    const row = await this.prisma.bookmark.findUnique({
      where: { id },
      select: SELECT,
    });
    if (!row) return null;
    return rowToAggregate(row);
  }

  async findByIdempotencyKey(
    userId: string,
    lessonId: string,
    idempotencyKey: string,
  ): Promise<Bookmark | null> {
    const row = await this.prisma.bookmark.findUnique({
      where: { uq_bookmark_idempotency: { userId, lessonId, idempotencyKey } },
      select: SELECT,
    });
    if (!row) return null;
    return rowToAggregate(row);
  }

  async findManyByUserAndLesson(userId: string, lessonId: string): Promise<Bookmark[]> {
    const rows = await this.prisma.bookmark.findMany({
      where: { userId, lessonId },
      select: SELECT,
      orderBy: { positionSeconds: 'asc' },
    });
    return rows.map((row) => rowToAggregate(row));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.bookmark.delete({ where: { id } });
  }
}
