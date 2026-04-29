import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';

import type { DashboardPort, DashboardSnapshot } from '../domain/dashboard.port';
import type { AdminDashboardLatestScan, AdminScanListItem } from '@app/api-client-ts';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PrismaDashboardAdapter implements DashboardPort {
  constructor(private readonly prisma: PrismaService) {}

  async hasAnyUser(): Promise<boolean> {
    const count = await this.prisma.user.count({ take: 1 });
    return count > 0;
  }

  async getSnapshot(): Promise<DashboardSnapshot> {
    const cutoff = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);

    const [librariesCount, usersCount, coursesCount, lessonsCount, latestScanRow, errorsLast24h] =
      await Promise.all([
        this.prisma.library.count(),
        this.prisma.user.count(),
        this.prisma.course.count(),
        this.prisma.lesson.count(),
        this.prisma.scan.findFirst({
          orderBy: { startedAt: 'desc' },
          include: { _count: { select: { errors: true } } },
        }),
        // ScanErrorRecord has no own timestamp; use parent scan's startedAt as
        // the proxy. Works because no scan is expected to outlive a single
        // 24-hour window — the dashboard explicitly documents this in its
        // OpenAPI description.
        this.prisma.scanErrorRecord.count({
          where: { scan: { startedAt: { gt: cutoff } } },
        }),
      ]);

    const latestScan: AdminDashboardLatestScan | null = latestScanRow
      ? {
          scanId: latestScanRow.id,
          libraryId: latestScanRow.libraryId,
          status: latestScanRow.status,
          startedAt: latestScanRow.startedAt.toISOString(),
          finishedAt: latestScanRow.finishedAt ? latestScanRow.finishedAt.toISOString() : null,
          filesScanned: latestScanRow.filesScanned,
          errorsCount: latestScanRow._count.errors,
        }
      : null;

    return {
      counts: {
        libraries: librariesCount,
        users: usersCount,
        courses: coursesCount,
        lessons: lessonsCount,
      },
      latestScan,
      errorsLast24h,
    };
  }

  async listRecentScans(limit: number): Promise<AdminScanListItem[]> {
    const scanRows = await this.prisma.scan.findMany({
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        _count: { select: { errors: true } },
      },
    });

    if (scanRows.length === 0) {
      return [];
    }

    // Fetch library names in a single batched query.
    const libraryIds = [...new Set(scanRows.map((s) => s.libraryId))];
    const libraries = await this.prisma.library.findMany({
      where: { id: { in: libraryIds } },
      select: { id: true, name: true },
    });
    const libraryNameById = new Map(libraries.map((l) => [l.id, l.name]));

    // Derive coursesAdded: count Course rows for the library whose createdAt
    // falls within [scan.startedAt, scan.finishedAt] (or now for running scans).
    // One batched query per scan — limit ≤ 100 so the fan-out is bounded.
    const now = new Date();
    const coursesAddedByScanId = new Map<string, number>(
      await Promise.all(
        scanRows.map(async (scan) => {
          const windowEnd = scan.finishedAt ?? now;
          const count = await this.prisma.course.count({
            where: {
              libraryId: scan.libraryId,
              createdAt: {
                gte: scan.startedAt,
                lte: windowEnd,
              },
            },
          });
          return [scan.id, count] as [string, number];
        }),
      ),
    );

    return scanRows.map((scan) => ({
      scanId: scan.id,
      libraryId: scan.libraryId,
      libraryName: libraryNameById.get(scan.libraryId) ?? '',
      status: scan.status,
      startedAt: scan.startedAt.toISOString(),
      finishedAt: scan.finishedAt ? scan.finishedAt.toISOString() : null,
      filesScanned: scan.filesScanned,
      coursesAdded: coursesAddedByScanId.get(scan.id) ?? 0,
      errorsCount: scan._count.errors,
    }));
  }
}
