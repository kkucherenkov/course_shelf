/**
 * WHY this file exists:
 * Maps the IdentifyTask aggregate to its OpenAPI DTO. Dates serialize to ISO
 * strings; jsonb fragment/policy pass through unchanged (their domain shapes
 * already match the generated DTO shapes). `courseTitle` is not part of the
 * IdentifyTask aggregate — it is the target Course's title, joined by the
 * caller (a query/command handler that already has the Course in scope) and
 * passed in explicitly, keeping the aggregate itself free of a foreign
 * display field.
 */
import type { IdentifyTask } from './domain/identify/identify-task';
import type { IdentifyTaskDto } from '@app/api-client-ts';

export function toIdentifyTaskDto(task: IdentifyTask, courseTitle: string): IdentifyTaskDto {
  return {
    id: task.id,
    courseId: task.courseId,
    courseTitle,
    status: task.status,
    source: task.source,
    ...(task.sourceUrl === undefined ? {} : { sourceUrl: task.sourceUrl }),
    scrapedFragment: task.scrapedFragment,
    mergePolicy: task.mergePolicy,
    createdAt: task.createdAt.toISOString(),
    ...(task.completedAt === undefined ? {} : { completedAt: task.completedAt.toISOString() }),
  };
}
