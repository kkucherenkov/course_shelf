/**
 * WHY this file exists:
 * Orchestrates the "export a lesson as a Markdown ZIP" use case
 * (E28-F01-S01, design §7).
 *
 * Steps:
 *   1. Load lesson → 404 if missing.
 *   2. Load parent course (for libraryId) → defensive fallthrough to 404,
 *      same ordering as GetLessonHandler so a caller without access gets the
 *      identical 403/404 shape whether they GET the lesson or export it.
 *   3. AuthorizationService.canSee → 403 if non-admin without a grant.
 *   4. Load the actor's note, bookmarks, and the lesson's transcript cues —
 *      three independent reads, fetched in parallel.
 *   5. Render lesson.md via the pure renderer and return it as an ExportBundle
 *      with an empty `images/` directory (no summary feature yet — design §7).
 *
 * No NestJS HTTP exceptions — HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { AppConfig } from '../../../../common/config/app-config';
import {
  COURSE_REPOSITORY,
  LESSON_REPOSITORY,
  LessonNotFoundError,
  TRANSCRIPT_REPOSITORY,
} from '../../../../common/catalog-tokens';
import { PermissionDenied } from '../../../../shared/domain-error';
import { BOOKMARK_REPOSITORY } from '../../domain/bookmark/bookmark.repository';
import { NOTE_REPOSITORY } from '../../domain/note/note.repository';
import {
  buildDeepLink,
  cuesNearPosition,
  renderLessonMarkdown,
  slugifyForFilename,
} from '../../domain/export/export-renderer';

import { ExportLessonQuery } from './export-lesson.query';

import type {
  AuthorizationService,
  CourseId,
  LibraryId,
} from '../../../../common/access/authorization.service';
import type {
  CourseRepository,
  LessonRepository,
  TranscriptRepository,
} from '../../../../common/catalog-tokens';
import type { BookmarkRepository } from '../../domain/bookmark/bookmark.repository';
import type { NoteRepository } from '../../domain/note/note.repository';
import type { ExportBundle } from '../../domain/export/export-bundle';
import type { LessonExportBookmarkView } from '../../domain/export/export-renderer';

@QueryHandler(ExportLessonQuery)
export class ExportLessonHandler implements IQueryHandler<ExportLessonQuery, ExportBundle> {
  constructor(
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
    @Inject(NOTE_REPOSITORY) private readonly noteRepo: NoteRepository,
    @Inject(BOOKMARK_REPOSITORY) private readonly bookmarkRepo: BookmarkRepository,
    @Inject(TRANSCRIPT_REPOSITORY) private readonly transcripts: TranscriptRepository,
    private readonly config: AppConfig,
  ) {}

  async execute(query: ExportLessonQuery): Promise<ExportBundle> {
    const { lessonId, actor } = query;

    const lesson = await this.lessonRepo.findById(lessonId);
    if (!lesson) {
      throw new LessonNotFoundError(lessonId);
    }

    const course = await this.courseRepo.findById(lesson.courseId);
    if (!course) {
      throw new LessonNotFoundError(lessonId);
    }

    const allowed = await this.authz.canSee(actor, {
      kind: 'lesson',
      id: lesson.id,
      courseId: lesson.courseId as CourseId,
      libraryId: course.libraryId as LibraryId,
    });
    if (!allowed) {
      throw new PermissionDenied('You do not have access to this lesson.');
    }

    // corsOrigins[0] is the canonical SPA origin (see .env.example: "8080 is
    // the nginx proxy (canonical SPA origin)") — the same origin CoursePoster
    // links etc. are meant to be reached through.
    const webOrigin = this.config.runtime.corsOrigins[0] ?? 'http://localhost:3001';

    const [note, bookmarks, lessonCues] = await Promise.all([
      this.noteRepo.findByUserAndLesson(actor.id, lessonId),
      this.bookmarkRepo.findManyByUserAndLesson(actor.id, lessonId),
      this.transcripts.findCuesForLesson(lessonId),
    ]);

    const cues = lessonCues?.cues ?? [];

    const bookmarkViews: LessonExportBookmarkView[] = bookmarks.map((bookmark) => ({
      positionSeconds: bookmark.positionSeconds,
      label: bookmark.label,
      deepLink: buildDeepLink(webOrigin, lesson.courseId, lessonId, bookmark.positionSeconds),
      transcriptLines: cuesNearPosition(cues, bookmark.positionSeconds).map((cue) => cue.text),
    }));

    const markdown = renderLessonMarkdown({
      title: lesson.title,
      deepLink: buildDeepLink(webOrigin, lesson.courseId, lessonId),
      noteBody: note?.body,
      bookmarks: bookmarkViews,
    });

    return {
      files: [{ path: 'lesson.md', content: markdown }],
      directories: ['images/'],
      suggestedFileName: `${slugifyForFilename(lesson.title)}.zip`,
    };
  }
}
