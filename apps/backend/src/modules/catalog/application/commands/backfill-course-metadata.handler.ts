/**
 * WHY this file exists:
 * Backfills metadata (instructor, studio, tag, level, language, releaseDate,
 * posterUrl, externalIds) from course.json for all existing courses — or a
 * single library's courses when libraryId is supplied.
 *
 * The handler is a sibling of RunScanHandler but deliberately does NOT share
 * code with it: scan-handler concerns (file-walk, lesson discovery, scan
 * aggregate) are completely orthogonal to backfill. Small duplications
 * (e.g. the metadata-linking block) are intentional.
 *
 * Progress granularity:
 *   BackfillStarted  — once, immediately.
 *   BackfillProgress — once per course (every course, not throttled).
 *     Rationale: backfill is expected to run once on a cold DB and the course
 *     count is bounded by the library size. If spamming is a concern, the
 *     Centrifugo proxy layer can throttle on the client side.
 *   BackfillFinished — once, at the end.
 *
 * When progressChannel is undefined (CLI path) all Centrifugo calls are
 * skipped entirely — no publish invocations are made.
 *
 * Error handling:
 *   - Missing course.json → coursesSkipped++; no error entry (expected state).
 *   - Unreadable / malformed course.json → errors[]; course skipped.
 *   - Metadata-link failure → errors[]; course skipped from update count.
 *   - Handler never throws — BackfillFinished is always published (or returned).
 */
import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CentrifugoService } from '../../../../common/centrifugo/centrifugo.service';
import { isCourseLevel } from '../../domain/course/course';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { LIBRARY_REPOSITORY } from '../../domain/library/library.repository';
import { parseCourseJson, normaliseCourseJson } from '../../domain/scan/course-json.schema';
import { FS_ADAPTER } from '../../domain/scan/fs-adapter';
import { MetadataLinker } from '../scan/metadata-linker';
import { BackfillCourseMetadataCommand } from './backfill-course-metadata.command';

import type { CourseRepository } from '../../domain/course/course.repository';
import type { LibraryRepository } from '../../domain/library/library.repository';
import type { FsAdapter } from '../../domain/scan/fs-adapter';

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface BackfillError {
  readonly courseId: string;
  readonly message: string;
}

export interface BackfillResult {
  readonly jobId: string;
  readonly finishedAt: string;
  readonly coursesProcessed: number;
  readonly coursesUpdated: number;
  readonly coursesSkipped: number;
  readonly errors: BackfillError[];
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

@CommandHandler(BackfillCourseMetadataCommand)
export class BackfillCourseMetadataHandler implements ICommandHandler<
  BackfillCourseMetadataCommand,
  BackfillResult
> {
  private readonly logger = new Logger(BackfillCourseMetadataHandler.name);

  constructor(
    @Inject(LIBRARY_REPOSITORY) private readonly libraryRepo: LibraryRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(FS_ADAPTER) private readonly fs: FsAdapter,
    private readonly linker: MetadataLinker,
    private readonly centrifugo: CentrifugoService,
  ) {}

  async execute(command: BackfillCourseMetadataCommand): Promise<BackfillResult> {
    const { jobId, progressChannel } = command;

    // 1. Resolve the library set.
    const libraries = command.libraryId
      ? await this.resolveLibrary(command.libraryId)
      : await this.libraryRepo.findAll();

    // 2. Publish BackfillStarted.
    this.publish(progressChannel, {
      kind: 'BackfillStarted',
      jobId,
      startedAt: new Date().toISOString(),
      librariesScanned: libraries.length,
    });

    const errors: BackfillError[] = [];
    let coursesProcessed = 0;
    let coursesUpdated = 0;
    let coursesSkipped = 0;

    // 3. For each library, load courses and process them.
    for (const library of libraries) {
      const courses = await this.courseRepo.findManyByLibrary(library.id);
      const coursesTotal = courses.length;

      for (const course of courses) {
        const courseRoot = `${library.rootPath}/${course.slug}`;
        const jsonPath = `${courseRoot}/course.json`;

        // 3a. Read course.json — missing is normal (skip, not an error).
        let raw: string;
        try {
          raw = await this.fs.readUtf8(jsonPath);
        } catch {
          coursesSkipped++;
          coursesProcessed++;
          this.publish(progressChannel, {
            kind: 'BackfillProgress',
            jobId,
            courseSlug: course.slug,
            coursesProcessed,
            coursesTotal,
            currentAction: 'skipped',
          });
          continue;
        }

        // 3b. Parse + normalise.
        let normalised: ReturnType<typeof normaliseCourseJson>;
        try {
          const parsed = parseCourseJson(raw, jsonPath);
          normalised = normaliseCourseJson(parsed);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.warn(`[backfill ${jobId}] parse failed for course ${course.id}: ${message}`);
          errors.push({ courseId: course.id, message });
          coursesSkipped++;
          coursesProcessed++;
          this.publish(progressChannel, {
            kind: 'BackfillProgress',
            jobId,
            courseSlug: course.slug,
            coursesProcessed,
            coursesTotal,
            currentAction: 'skipped',
          });
          continue;
        }

        // 3c. Link metadata — upsert instructor/studio/tag aggregates.
        try {
          const instructorRefs = await this.linker.upsertInstructorsByName(
            normalised.instructorNames ?? [],
          );
          course.setInstructors([...instructorRefs]);

          const studioRef = normalised.studioName
            ? await this.linker.upsertStudioByName(normalised.studioName)
            : null;
          course.setStudios(studioRef ? [studioRef] : []);

          const tagRefs = await this.linker.upsertTagsByName(normalised.tags ?? []);
          course.setTags([...tagRefs]);

          if (normalised.level !== undefined && isCourseLevel(normalised.level)) {
            course.setLevel(normalised.level);
          }
          if (normalised.language !== undefined) {
            course.setLanguage(normalised.language);
          }
          if (normalised.releaseDate !== undefined) {
            course.setReleaseDate(new Date(normalised.releaseDate));
          }
          if (normalised.posterUrl !== undefined) {
            course.setPosterUrl(normalised.posterUrl);
          }
          if (normalised.externalIds !== undefined) {
            course.setExternalIds([...normalised.externalIds]);
          }

          // 3d. Persist.
          await this.courseRepo.save(course);
          coursesUpdated++;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.warn(
            `[backfill ${jobId}] metadata-link failed for course ${course.id}: ${message}`,
          );
          errors.push({ courseId: course.id, message });
        }

        coursesProcessed++;
        this.publish(progressChannel, {
          kind: 'BackfillProgress',
          jobId,
          courseSlug: course.slug,
          coursesProcessed,
          coursesTotal,
          currentAction: 'persisting',
        });
      }
    }

    // 4. Publish BackfillFinished and return the result.
    const result: BackfillResult = {
      jobId,
      finishedAt: new Date().toISOString(),
      coursesProcessed,
      coursesUpdated,
      coursesSkipped,
      errors,
    };

    this.publish(progressChannel, { kind: 'BackfillFinished', ...result });

    return result;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Resolves a single library by id. Returns an empty array (not a throw) when
   * the library does not exist — the handler then emits a Finished event with
   * zero counts. This is intentional: the CLI / HTTP caller already validated
   * the id at the outer layer; the handler's job is to backfill, not to raise
   * HTTP exceptions.
   */
  private async resolveLibrary(
    libraryId: string,
  ): Promise<Awaited<ReturnType<LibraryRepository['findAll']>>> {
    const lib = await this.libraryRepo.findById(libraryId);
    return lib ? [lib] : [];
  }

  /**
   * Fire-and-forget publish. When progressChannel is undefined, this is a no-op.
   * Centrifugo failures are swallowed (CentrifugoService already logs warnings).
   */
  private publish(channel: string | undefined, data: Record<string, unknown>): void {
    if (!channel) return;
    void this.centrifugo.publish(channel, data);
  }
}
