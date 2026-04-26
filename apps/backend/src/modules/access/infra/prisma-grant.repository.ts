/**
 * WHY this file exists:
 * Prisma adapter that implements the GrantRepository port. It is the only place
 * in the Access bounded context that depends on PrismaService. All other layers
 * (domain, application, controller) depend only on the port interface, keeping
 * them infrastructure-agnostic and easily testable.
 *
 * Row ↔ aggregate mapping is co-located here. The mapper function reads the
 * DB's flat targetKind / libraryId / courseId columns and reconstructs the
 * discriminated GrantTarget union expected by the aggregate.
 *
 * P2002 translation: Prisma raises a PrismaClientKnownRequestError with code
 * P2002 when the composite unique constraint is violated. We catch it here and
 * rethrow as GrantAlreadyExistsError so the application layer stays free of
 * Prisma types.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { AccessGrant } from '../domain/grant/grant';
import { GrantAlreadyExistsError } from '../domain/grant/grant.errors';

import type { GrantRepository } from '../domain/grant/grant.repository';
import type { GrantId } from '../domain/grant/grant';
import type { GrantTarget } from '@app/api-client-ts';

// Prisma-generated row shape for the accessGrant table (select projection).
interface GrantRow {
  id: string;
  userId: string;
  targetKind: 'library' | 'course';
  libraryId: string | null;
  courseId: string | null;
  level: 'READ';
  createdAt: Date;
}

function rowToTarget(row: GrantRow): GrantTarget {
  if (row.targetKind === 'library') {
    // WHY non-null: libraryId is always set when targetKind === 'library';
    // the DB-level unique constraint and the domain aggregate together
    // guarantee this invariant — validated on write via AccessGrant.register().
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return { kind: 'library', libraryId: row.libraryId! };
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return { kind: 'course', courseId: row.courseId! };
}

function rowToAggregate(row: GrantRow): AccessGrant {
  return AccessGrant.reconstitute({
    id: row.id as GrantId,
    userId: row.userId,
    target: rowToTarget(row),
    level: row.level,
    createdAt: row.createdAt,
  });
}

@Injectable()
export class PrismaGrantRepository implements GrantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(grant: AccessGrant): Promise<void> {
    const targetKind = grant.target.kind;
    const libraryId = grant.target.kind === 'library' ? grant.target.libraryId : null;
    const courseId = grant.target.kind === 'course' ? grant.target.courseId : null;

    try {
      await this.prisma.accessGrant.create({
        data: {
          id: grant.id,
          userId: grant.userId,
          targetKind,
          libraryId,
          courseId,
          level: grant.level,
          createdAt: grant.createdAt,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new GrantAlreadyExistsError();
      }
      throw error;
    }
  }

  async findById(id: string): Promise<AccessGrant | null> {
    const row = await this.prisma.accessGrant.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        targetKind: true,
        libraryId: true,
        courseId: true,
        level: true,
        createdAt: true,
      },
    });

    if (!row) return null;

    return rowToAggregate(row);
  }

  async findManyByUser(userId: string): Promise<AccessGrant[]> {
    const rows = await this.prisma.accessGrant.findMany({
      where: { userId },
      select: {
        id: true,
        userId: true,
        targetKind: true,
        libraryId: true,
        courseId: true,
        level: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return (rows as GrantRow[]).map((row) => rowToAggregate(row));
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.prisma.accessGrant.delete({ where: { id } });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return false;
      }
      throw error;
    }
  }
}
