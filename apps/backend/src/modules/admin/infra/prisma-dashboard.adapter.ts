import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';

import type { DashboardPort, DashboardSnapshot } from '../domain/dashboard.port';
import type { AdminDashboardLatestScan } from '@app/api-client-ts';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class PrismaDashboardAdapter implements DashboardPort {
  constructor(private readonly prisma: PrismaService) {}

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
}
