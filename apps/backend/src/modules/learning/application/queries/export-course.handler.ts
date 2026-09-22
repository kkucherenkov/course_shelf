/**
 * WHY this file exists:
 * Orchestrates the "export a course as a Markdown ZIP" use case
 * (E28-F01-S01, design §7): `course.md` plus one `lessons/NN-slug.md` per
 * lesson in outline order, sharing one `images/` directory.
 *
 * Steps:
 *   1. Load course → 404 if missing, same order GetCourseHandler uses.
 *   2. AuthorizationService.canSee (course-level, mirrors getCourse) → 403 if
 *      non-admin without a grant.
 *   3. Load every lesson in the course (findByCourse, already sectionId+position
 *      ordered), then bucket them by `course.sections` (already position-sorted)
 *      the same way GetCourseOutlineHandler does — this IS "outline order".
 *      Lessons whose sectionId matches no section (should be impossible —
 *      Section is a child aggregate of Course) land in a trailing "Other"
 *      pseudo-section rather than silently vanishing from course.md.
 *   4. Load the actor's notes, bookmarks, and every lesson's transcript cues —
 *      one batched query each across every lesson id (no N+1 across up to a
 *      few dozen lessons).
 *   5. Render each lesson via the same pure renderer export-lesson.handler.ts
 *      uses, and course.md via renderCourseMarkdown.
 *
 * No NestJS HTTP exceptions — HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { AppConfig } from '../../../../common/config/app-config';
import {
  COURSE_REPOSITORY,
  CourseNotFoundError,
  LESSON_REPOSITORY,
  TRANSCRIPT_REPOSITORY,
} from '../../../../common/catalog-tokens';
import { PermissionDenied } from '../../../../shared/domain-error';
import { BOOKMARK_REPOSITORY } from '../../domain/bookmark/bookmark.repository';
import { NOTE_REPOSITORY } from '../../domain/note/note.repository';
import {
  buildDeepLink,
  cuesNearPosition,
  lessonFileName,
  renderCourseMarkdown,
  renderLessonMarkdown,
  slugifyForFilename,
} from '../../domain/export/export-renderer';

import { ExportCourseQuery } from './export-course.query';

import type {
  AuthorizationService,
  LibraryId,
} from '../../../../common/access/authorization.service';
import type {
  CourseRepository,
  LessonRepository,
  TranscriptRepository,
} from '../../../../common/catalog-tokens';
import type { BookmarkRepository } from '../../domain/bookmark/bookmark.repository';
import type { NoteRepository } from '../../domain/note/note.repository';
import type { ExportBundle, ExportFile } from '../../domain/export/export-bundle';
import type {
  CourseExportSectionView,
  LessonExportBookmarkView,
} from '../../domain/export/export-renderer';

const OTHER_SECTION_TITLE = 'Other';

@QueryHandler(ExportCourseQuery)
export class ExportCourseHandler implements IQueryHandler<ExportCourseQuery, ExportBundle> {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
    @Inject(NOTE_REPOSITORY) private readonly noteRepo: NoteRepository,
    @Inject(BOOKMARK_REPOSITORY) private readonly bookmarkRepo: BookmarkRepository,
    @Inject(TRANSCRIPT_REPOSITORY) private readonly transcripts: TranscriptRepository,
    private readonly config: AppConfig,
  ) {}

  async execute(query: ExportCourseQuery): Promise<ExportBundle> {
    const { courseId, actor } = query;

    const course = await this.courseRepo.findById(courseId);
    if (!course) {
      throw new CourseNotFoundError(courseId);
    }

    const allowed = await this.authz.canSee(actor, {
      kind: 'course',
      id: course.id,
      libraryId: course.libraryId as LibraryId,
    });
    if (!allowed) {
      throw new PermissionDenied('You do not have access to this course.');
    }

    const webOrigin = this.config.runtime.corsOrigins[0] ?? 'http://localhost:3001';

    // Bucket lessons by section, preserving course.sections' position order —
    // same grouping GetCourseOutlineHandler uses. findByCourse already
    // returns lessons ordered by (sectionId, position), so each bucket stays
    // position-sorted.
    const lessons = await this.lessonRepo.findByCourse(courseId);
    const sectionMap = new Map<string, typeof lessons>(course.sections.map((s) => [s.id, []]));
    const orphans: typeof lessons = [];
    for (const lesson of lessons) {
      const bucket = sectionMap.get(lesson.sectionId);
      if (bucket) {
        bucket.push(lesson);
      } else {
        orphans.push(lesson);
      }
    }
    const orderedLessons = [
      ...course.sections.flatMap((s) => sectionMap.get(s.id) ?? []),
      ...orphans,
    ];

    const lessonIds = orderedLessons.map((l) => String(l.id));
    const [notesByLesson, bookmarksByLesson, cuesByLesson] = await Promise.all([
      this.noteRepo.findManyByUserAndLessons(actor.id, lessonIds),
      this.bookmarkRepo.findManyByUserAndLessons(actor.id, lessonIds),
      this.transcripts.findCuesForLessons(lessonIds),
    ]);

    const total = orderedLessons.length;
    const fileNameByLessonId = new Map<string, string>(
      orderedLessons.map((lesson, index) => [
        String(lesson.id),
        lessonFileName(index, total, lesson.title),
      ]),
    );

    const lessonFiles: ExportFile[] = orderedLessons.map((lesson) => {
      const lessonId = String(lesson.id);
      const cues = cuesByLesson.get(lessonId)?.cues ?? [];
      const bookmarkViews: LessonExportBookmarkView[] = (bookmarksByLesson.get(lessonId) ?? []).map(
        (bookmark) => ({
          positionSeconds: bookmark.positionSeconds,
          label: bookmark.label,
          deepLink: buildDeepLink(webOrigin, courseId, lessonId, bookmark.positionSeconds),
          transcriptLines: cuesNearPosition(cues, bookmark.positionSeconds).map((cue) => cue.text),
        }),
      );

      const markdown = renderLessonMarkdown({
        title: lesson.title,
        deepLink: buildDeepLink(webOrigin, courseId, lessonId),
        noteBody: notesByLesson.get(lessonId)?.body,
        bookmarks: bookmarkViews,
      });

      // Non-null: fileNameByLessonId was built from this same orderedLessons list.
      const fileName = fileNameByLessonId.get(lessonId) ?? '';
      return { path: `lessons/${fileName}`, content: markdown };
    });

    const sections: CourseExportSectionView[] = course.sections.map((section) => ({
      title: section.title,
      lessons: (sectionMap.get(section.id) ?? []).map((lesson) => ({
        title: lesson.title,
        fileName: fileNameByLessonId.get(String(lesson.id)) ?? '',
      })),
    }));
    if (orphans.length > 0) {
      sections.push({
        title: OTHER_SECTION_TITLE,
        lessons: orphans.map((lesson) => ({
          title: lesson.title,
          fileName: fileNameByLessonId.get(String(lesson.id)) ?? '',
        })),
      });
    }

    const courseMarkdown = renderCourseMarkdown({
      title: course.title,
      deepLink: `${webOrigin}/courses/${courseId}`,
      sections,
    });

    return {
      files: [{ path: 'course.md', content: courseMarkdown }, ...lessonFiles],
      directories: ['images/'],
      suggestedFileName: `${slugifyForFilename(course.title)}.zip`,
    };
  }
}
