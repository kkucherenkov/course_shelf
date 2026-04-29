import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../common/prisma/prisma.service';

import type { DashboardPort, DashboardSnapshot } from '../domain/dashboard.port';
import type {
  AdminDashboardLatestScan,
  AdminLibraryListItem,
  AdminLibraryListItemScan,
  AdminScanListItem,
  AdminUserListItem,
  AdminUserRole,
} from '@app/api-client-ts';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/** Known DB role values (uppercase). Anything else is treated defensively. */
const KNOWN_DB_ROLES = new Set(['ADMIN', 'USER', 'GUEST']);

/**
 * Normalise a DB role string to the lowercase `AdminUserRole` expected by the
 * API. Unknown values fall back to `'user'` with a warning so future DB values
 * do not hard-crash the endpoint.
 */
function normaliseRole(dbRole: string, logger: Logger, userId: string): AdminUserRole {
  const lower = dbRole.toLowerCase() as AdminUserRole;
  if (KNOWN_DB_ROLES.has(dbRole.toUpperCase())) {
    return lower;
  }
  logger.warn(`Unknown role value "${dbRole}" for user ${userId} — falling back to "user"`);
  return 'user';
}

@Injectable()
export class PrismaDashboardAdapter implements DashboardPort {
  private readonly logger = new Logger(PrismaDashboardAdapter.name);
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

  async listRecentScans(limit: number, libraryId?: string): Promise<AdminScanListItem[]> {
    const scanRows = await this.prisma.scan.findMany({
      ...(libraryId === undefined ? {} : { where: { libraryId } }),
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

  async listAllLibrariesWithCounts(): Promise<AdminLibraryListItem[]> {
    const libraries = await this.prisma.library.findMany({
      orderBy: { name: 'asc' },
    });

    if (libraries.length === 0) {
      return [];
    }

    const ids = libraries.map((l) => l.id);

    // Count courses and aggregate lesson counts per library.
    // Course → Section → Lesson: no direct Course.lessons relation, so we use
    // course.groupBy for course counts and lesson.groupBy (by courseId) + a
    // course lookup for lesson counts.
    const [courseGroups, lessonGroups] = await Promise.all([
      this.prisma.course.groupBy({
        by: ['libraryId'],
        where: { libraryId: { in: ids } },
        _count: { _all: true },
      }),
      this.prisma.lesson.groupBy({
        by: ['courseId'],
        where: { section: { course: { libraryId: { in: ids } } } },
        _count: { _all: true },
      }),
    ]);

    // Build a courseId → libraryId map so we can aggregate lessons per library.
    const lessonCourseIds = lessonGroups.map((g) => g.courseId);
    const courseIdRows =
      lessonCourseIds.length > 0
        ? await this.prisma.course.findMany({
            where: { id: { in: lessonCourseIds } },
            select: { id: true, libraryId: true },
          })
        : [];
    const courseIdToLibraryId = new Map(courseIdRows.map((c) => [c.id, c.libraryId]));

    const courseCountByLibrary = new Map<string, number>(
      courseGroups.map((g) => [g.libraryId, g._count._all]),
    );

    const lessonCountByLibrary = new Map<string, number>();
    for (const g of lessonGroups) {
      const libId = courseIdToLibraryId.get(g.courseId);
      if (libId !== undefined) {
        lessonCountByLibrary.set(libId, (lessonCountByLibrary.get(libId) ?? 0) + g._count._all);
      }
    }

    // Most recent scan per library — one row per libraryId (distinct).
    const recentScanRows = await this.prisma.scan.findMany({
      where: { libraryId: { in: ids } },
      orderBy: { startedAt: 'desc' },
      distinct: ['libraryId'],
      include: { _count: { select: { errors: true } } },
    });

    const lastScanByLibrary = new Map(recentScanRows.map((s) => [s.libraryId, s]));

    return libraries.map((lib) => {
      const scanRow = lastScanByLibrary.get(lib.id);
      const lastScan: AdminLibraryListItemScan | null = scanRow
        ? {
            status: scanRow.status,
            startedAt: scanRow.startedAt.toISOString(),
            finishedAt: scanRow.finishedAt ? scanRow.finishedAt.toISOString() : null,
            errorsCount: scanRow._count.errors,
          }
        : null;

      return {
        id: lib.id,
        name: lib.name,
        rootPath: lib.rootPath,
        coursesCount: courseCountByLibrary.get(lib.id) ?? 0,
        lessonsCount: lessonCountByLibrary.get(lib.id) ?? 0,
        lastScan,
      };
    });
  }

  async listUsers(filter: { search?: string; limit: number }): Promise<AdminUserListItem[]> {
    const { search, limit } = filter;

    const hasSearch = search !== undefined && search.length > 0;
    const rows = await this.prisma.user.findMany({
      ...(hasSearch
        ? {
            where: {
              OR: [
                { email: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        role: true,
        banned: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      displayName: row.displayName ?? null,
      role: normaliseRole(row.role, this.logger, row.id),
      banned: row.banned,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async updateUser(
    id: string,
    patch: { role?: AdminUserRole; banned?: boolean },
  ): Promise<AdminUserListItem | null> {
    try {
      const updated = await this.prisma.user.update({
        where: { id },
        data: {
          ...(patch.role === undefined ? {} : { role: patch.role.toUpperCase() }),
          ...(patch.banned === undefined ? {} : { banned: patch.banned }),
        },
        select: {
          id: true,
          email: true,
          name: true,
          displayName: true,
          role: true,
          banned: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // When banning a user, invalidate all existing sessions immediately so
      // the ban takes effect without waiting for token expiry (mirrors the
      // behaviour of Better Auth's admin plugin setBanned).
      if (patch.banned === true) {
        await this.prisma.session.deleteMany({ where: { userId: id } });
      }

      return {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        displayName: updated.displayName ?? null,
        role: normaliseRole(updated.role, this.logger, updated.id),
        banned: updated.banned,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }
}
