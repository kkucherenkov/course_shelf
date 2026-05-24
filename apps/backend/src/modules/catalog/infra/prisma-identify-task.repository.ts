/**
 * WHY this file exists:
 * Prisma adapter implementing IdentifyTaskRepository. The jsonb columns
 * (scrapedFragment, mergePolicy) round-trip as plain objects; on read they are
 * cast back to their domain types (the DB is the source of truth, written only
 * by this app). identifyTaskRowToDomain is exported for unit testing the mapping.
 */
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../common/prisma/prisma.service';
import { IdentifyTask } from '../domain/identify/identify-task';

import type { IdentifyTaskStatus } from '../domain/identify/identify-task';
import type { IdentifyTaskRepository } from '../domain/identify/identify-task.repository';
import type { MergePolicy } from '../domain/identify/merge-policy';
import type { ScrapedCourseFragment } from '../domain/scraper/scraper.types';

interface IdentifyTaskRow {
  id: string;
  courseId: string;
  status: string;
  source: string;
  sourceUrl: string | null;
  scrapedFragment: unknown;
  mergePolicy: unknown;
  createdAt: Date;
  completedAt: Date | null;
}

export function identifyTaskRowToDomain(row: IdentifyTaskRow): IdentifyTask {
  return IdentifyTask.reconstitute({
    id: row.id,
    courseId: row.courseId,
    status: row.status as IdentifyTaskStatus,
    source: row.source,
    ...(row.sourceUrl === null ? {} : { sourceUrl: row.sourceUrl }),
    scrapedFragment: row.scrapedFragment as ScrapedCourseFragment,
    mergePolicy: row.mergePolicy as MergePolicy,
    createdAt: row.createdAt,
    ...(row.completedAt === null ? {} : { completedAt: row.completedAt }),
  });
}

@Injectable()
export class PrismaIdentifyTaskRepository implements IdentifyTaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(task: IdentifyTask): Promise<void> {
    const data = {
      courseId: task.courseId,
      status: task.status,
      source: task.source,
      sourceUrl: task.sourceUrl ?? null,
      scrapedFragment: task.scrapedFragment as object,
      mergePolicy: task.mergePolicy as object,
      completedAt: task.completedAt ?? null,
    };
    await this.prisma.identifyTask.upsert({
      where: { id: task.id },
      create: { id: task.id, createdAt: task.createdAt, ...data },
      update: data,
    });
  }

  async findById(id: string): Promise<IdentifyTask | null> {
    const row = await this.prisma.identifyTask.findUnique({ where: { id } });
    return row ? identifyTaskRowToDomain(row) : null;
  }

  async findMany(filter: {
    status?: IdentifyTaskStatus;
    courseId?: string;
  }): Promise<IdentifyTask[]> {
    const rows = await this.prisma.identifyTask.findMany({
      where: {
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.courseId ? { courseId: filter.courseId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => identifyTaskRowToDomain(row));
  }
}
