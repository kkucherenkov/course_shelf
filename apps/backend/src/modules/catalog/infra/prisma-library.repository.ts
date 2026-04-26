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
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { Library } from '../domain/library/library';
import { LibraryAlreadyExistsError } from '../domain/library/library.errors';

import type { LibraryRepository } from '../domain/library/library.repository';
import type { LibraryId } from '../domain/library/library';

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
}
