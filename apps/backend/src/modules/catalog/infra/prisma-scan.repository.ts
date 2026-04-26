/**
 * WHY this file exists:
 * Prisma adapter that implements the ScanRepository port. The only place in the
 * Catalog bounded context that knows about Prisma scan/scan_error/discovered_file
 * tables. All other layers depend only on the ScanRepository interface.
 *
 * Save strategy: full upsert in a transaction — Scan row is upserted, then
 * ScanErrorRecord + DiscoveredFile rows are deleted-and-recreated. This is safe
 * because the walk accumulates all errors/files in-memory and persists them in
 * two shots: (1) status=running immediately, (2) terminal status after the walk.
 *
 * P2002 on (scanId, path) unique: theoretically impossible because we control
 * the iteration, but we wrap it defensively as ScanInternalError.
 */
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { DomainError } from '../../../shared/domain-error';
import { Scan } from '../domain/scan/scan';

import type { ScanRepository } from '../domain/scan/scan.repository';
import type { ScanId, ScanStatusValue } from '../domain/scan/scan';

/** Defensive wrapper for the impossible P2002 on (scanId, path). */
class ScanInternalError extends DomainError {
  constructor(detail: string) {
    super({ code: 'scan-internal-error', status: 500, title: 'Scan internal error', detail });
    this.name = 'ScanInternalError';
  }
}

@Injectable()
export class PrismaScanRepository implements ScanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(scan: Scan): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Upsert the scan row.
        await tx.scan.upsert({
          where: { id: scan.id },
          create: {
            id: scan.id,
            libraryId: scan.libraryId,
            status: scan.status,
            startedAt: scan.startedAt,
            finishedAt: scan.finishedAt ?? null,
            filesScanned: scan.filesScanned,
            filesAdded: scan.filesAdded,
            filesUpdated: scan.filesUpdated,
            coursesDiscovered: scan.coursesDiscovered,
          },
          update: {
            status: scan.status,
            finishedAt: scan.finishedAt ?? null,
            filesScanned: scan.filesScanned,
            filesAdded: scan.filesAdded,
            filesUpdated: scan.filesUpdated,
            coursesDiscovered: scan.coursesDiscovered,
          },
        });

        // Errors: delete existing rows, then recreate from aggregate state.
        await tx.scanErrorRecord.deleteMany({ where: { scanId: scan.id } });
        if (scan.errors.length > 0) {
          await tx.scanErrorRecord.createMany({
            data: scan.errors.map((e) => ({
              scanId: scan.id,
              path: e.path,
              message: e.message,
              code: e.code ?? null,
            })),
          });
        }

        // Discovered files: delete existing rows, then recreate.
        await tx.discoveredFile.deleteMany({ where: { scanId: scan.id } });
        if (scan.discoveredFiles.length > 0) {
          await tx.discoveredFile.createMany({
            data: scan.discoveredFiles.map((f) => ({
              scanId: scan.id,
              path: f.path,
              mtime: f.mtime,
              size: f.size,
            })),
          });
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ScanInternalError(
          'Duplicate (scanId, path) detected — this should never happen.',
        );
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Scan | null> {
    const row = await this.prisma.scan.findUnique({
      where: { id },
      select: {
        id: true,
        libraryId: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        filesScanned: true,
        filesAdded: true,
        filesUpdated: true,
        coursesDiscovered: true,
        errors: {
          select: { path: true, message: true, code: true },
        },
        discoveredFiles: {
          select: { path: true, mtime: true, size: true },
        },
      },
    });

    if (!row) return null;
    return this.rowToAggregate(row);
  }

  async findLatestByLibrary(libraryId: string): Promise<Scan | null> {
    const row = await this.prisma.scan.findFirst({
      where: { libraryId },
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        libraryId: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        filesScanned: true,
        filesAdded: true,
        filesUpdated: true,
        coursesDiscovered: true,
        errors: {
          select: { path: true, message: true, code: true },
        },
        discoveredFiles: {
          select: { path: true, mtime: true, size: true },
        },
      },
    });

    if (!row) return null;
    return this.rowToAggregate(row);
  }

  async findRunningByLibrary(libraryId: string): Promise<Scan | null> {
    const row = await this.prisma.scan.findFirst({
      where: { libraryId, status: 'running' },
      select: {
        id: true,
        libraryId: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        filesScanned: true,
        filesAdded: true,
        filesUpdated: true,
        coursesDiscovered: true,
        errors: {
          select: { path: true, message: true, code: true },
        },
        discoveredFiles: {
          select: { path: true, mtime: true, size: true },
        },
      },
    });

    if (!row) return null;
    return this.rowToAggregate(row);
  }

  // ---------------------------------------------------------------------------
  // Private mapper — row shape → domain aggregate
  // ---------------------------------------------------------------------------
  private rowToAggregate(row: {
    id: string;
    libraryId: string;
    status: string;
    startedAt: Date;
    finishedAt: Date | null;
    filesScanned: number;
    filesAdded: number;
    filesUpdated: number;
    coursesDiscovered: number;
    errors: { path: string; message: string; code: string | null }[];
    discoveredFiles: { path: string; mtime: Date; size: number }[];
  }): Scan {
    return Scan.reconstitute({
      id: row.id as ScanId,
      libraryId: row.libraryId,
      status: row.status as ScanStatusValue,
      startedAt: row.startedAt,
      finishedAt: row.finishedAt ?? undefined,
      filesScanned: row.filesScanned,
      filesAdded: row.filesAdded,
      filesUpdated: row.filesUpdated,
      coursesDiscovered: row.coursesDiscovered,
      errors: row.errors.map((e) => ({
        path: e.path,
        message: e.message,
        ...(e.code === null ? {} : { code: e.code }),
      })),
      discoveredFiles: row.discoveredFiles.map((f) => ({
        path: f.path,
        mtime: f.mtime,
        size: f.size,
      })),
    });
  }
}
