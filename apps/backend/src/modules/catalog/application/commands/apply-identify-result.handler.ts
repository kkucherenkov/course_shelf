/**
 * WHY this file exists:
 * Applies a proposed IdentifyTask. Computes the merged patch (pure), resolves
 * raw instructor/studio/tag names to entity ids via MetadataLinker, then writes
 * through UpdateCourseMetadataCommand — reusing the Stage 1 atomic write path
 * rather than duplicating it. Finally marks the task applied and publishes
 * IdentifyTaskApplied.
 *
 * Known limitation: the course write and the task-status save are not in one
 * transaction. Re-applying is guarded by the `proposed` invariant, and the merge
 * is idempotent (union / fill-if-empty / replace), so a crash between the two
 * leaves the course updated and the task re-appliable safely.
 */
import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';

import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { IDENTIFY_TASK_REPOSITORY } from '../../domain/identify/identify-task.repository';
import { IdentifyTaskNotFoundError } from '../../domain/identify/identify-task.errors';
import { IdentifyTaskApplied } from '../../domain/identify/identify-task.events';
import { computeMergedPatch } from '../../domain/identify/merge';
import { MetadataLinker } from '../scan/metadata-linker';
import { UpdateCourseMetadataCommand } from './update-course-metadata.command';
import { toIdentifyTaskDto } from '../../identify.dto';

import { ApplyIdentifyResultCommand } from './apply-identify-result.command';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { IdentifyTaskRepository } from '../../domain/identify/identify-task.repository';
import type { IdentifyTaskDto } from '@app/api-client-ts';

@CommandHandler(ApplyIdentifyResultCommand)
export class ApplyIdentifyResultHandler implements ICommandHandler<
  ApplyIdentifyResultCommand,
  IdentifyTaskDto
> {
  constructor(
    @Inject(IDENTIFY_TASK_REPOSITORY) private readonly taskRepo: IdentifyTaskRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    private readonly linker: MetadataLinker,
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: ApplyIdentifyResultCommand): Promise<IdentifyTaskDto> {
    const task = await this.taskRepo.findById(command.taskId);
    if (!task) throw new IdentifyTaskNotFoundError(command.taskId);

    // Determine the effective policy before the status guard so we can record it.
    const policy = command.mergePolicy ?? task.mergePolicy;

    // Enforce `proposed` state and record the final policy + completedAt on the
    // aggregate. Throws IdentifyTaskNotPendingError if the task is not proposed.
    // This runs before any further I/O so non-pending tasks fail fast.
    const now = new Date();
    task.markApplied(policy, now);

    const course = await this.courseRepo.findById(task.courseId);
    if (!course) throw new CourseNotFoundError(task.courseId);

    // Course satisfies CurrentCourseView structurally — passed directly, no cast.
    const patch = computeMergedPatch(course, task.scrapedFragment, policy);

    const cmdPatch: UpdateCourseMetadataCommand['patch'] = {};
    if (patch.title !== undefined) cmdPatch.title = patch.title;
    if (patch.description !== undefined) cmdPatch.description = patch.description;
    if (patch.level !== undefined) cmdPatch.level = patch.level;
    if (patch.language !== undefined) cmdPatch.language = patch.language;
    if (patch.posterUrl !== undefined) cmdPatch.posterUrl = patch.posterUrl;
    if (patch.releaseDate !== undefined) cmdPatch.releaseDate = new Date(patch.releaseDate);
    if (patch.externalIds !== undefined) cmdPatch.externalIds = patch.externalIds;

    // Rating is an atomic pair (UpdateCourseMetadataCommand writes avg+count together).
    // A side that the merge omitted (policy `ignore`, or `merge` with the field already
    // set, or simply absent from the fragment) is backfilled from the course's current
    // value — so the omitted side keeps its stored value while the other side updates.
    // Only write when BOTH sides resolve to a defined value (e.g. neither course nor
    // fragment ever had a count → no rating write).
    if (patch.ratingAverage !== undefined || patch.ratingCount !== undefined) {
      const avg = patch.ratingAverage ?? course.ratingAverage;
      const count = patch.ratingCount ?? course.ratingCount;
      if (avg !== undefined && count !== undefined) {
        cmdPatch.ratingAverage = avg;
        cmdPatch.ratingCount = count;
      }
    }

    if (patch.instructorNames !== undefined) {
      const refs = await this.linker.upsertInstructorsByName(patch.instructorNames);
      cmdPatch.instructorIds = refs.map((r) => r.id);
    }
    if (patch.studioNames !== undefined) {
      const ids: string[] = [];
      for (const name of patch.studioNames) {
        const ref = await this.linker.upsertStudioByName(name);
        if (ref) ids.push(ref.id);
      }
      cmdPatch.studioIds = ids;
    }
    if (patch.tagNames !== undefined) {
      const refs = await this.linker.upsertTagsByName(patch.tagNames);
      cmdPatch.tagIds = refs.map((r) => r.id);
    }

    await this.commandBus.execute(
      new UpdateCourseMetadataCommand(task.courseId, command.actor, cmdPatch),
    );

    await this.taskRepo.save(task);
    this.eventBus.publish(new IdentifyTaskApplied(task.id, task.courseId, command.actor.id, now));

    return toIdentifyTaskDto(task);
  }
}
