/**
 * WHY this file exists:
 * Query handler for GET /courses/{id}/outline.
 *
 * Single round-trip design: loads Course + all Lessons (with materials) in two
 * queries, then loads LessonProgress rows for the requester in a third query
 * (findManyByUserAndLessons). The CourseProgressReadModel projection gives us
 * the course-level aggregate percent from a fourth single-key lookup.
 *
 * Authz: existence is checked first (→ 404), then the grant is evaluated (→ 403)
 * — same order as GetCourseHandler to avoid leaking course existence.
 *
 * Mapping:
 *   - Sections come from Course.sections (already ordered by position).
 *   - Lessons come from LessonRepository.findByCourse (ordered by sectionId, position).
 *   - Per-lesson state is derived from the LessonProgress rows for the actor.
 *   - materials[] is the flat, deduplicated list ordered by (lesson.position, material.id).
 *
 * No NestJS HTTP exceptions — HttpExceptionFilter translates DomainError subclasses.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { COURSE_REPOSITORY } from '../../domain/course/course.repository';
import { LESSON_REPOSITORY } from '../../domain/lesson/lesson.repository';
import { CourseNotFoundError } from '../../domain/course/course.errors';
import { PermissionDenied } from '../../../../shared/domain-error';
import { COURSE_PROGRESS_READ_MODEL_REPOSITORY } from '../../domain/progress/course-progress-read-model.repository';
import { LESSON_PROGRESS_REPOSITORY } from '../../../../common/learning-progress';

import { GetCourseOutlineQuery } from './get-course-outline.query';

import type {
  AuthorizationService,
  LibraryId,
} from '../../../../common/access/authorization.service';
import type { CourseRepository } from '../../domain/course/course.repository';
import type { LessonRepository } from '../../domain/lesson/lesson.repository';
import type { CourseProgressReadModelRepository } from '../../domain/progress/course-progress-read-model.repository';
import type { LessonProgressRepository } from '../../../../common/learning-progress';
import type {
  CourseOutlineDto,
  CourseOutlineSummary,
  SectionOutline,
  LessonOutlineItem,
  CourseMaterialItem,
} from '@app/api-client-ts';

@QueryHandler(GetCourseOutlineQuery)
export class GetCourseOutlineHandler implements IQueryHandler<
  GetCourseOutlineQuery,
  CourseOutlineDto
> {
  constructor(
    @Inject(COURSE_REPOSITORY) private readonly courseRepo: CourseRepository,
    @Inject(LESSON_REPOSITORY) private readonly lessonRepo: LessonRepository,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
    @Inject(COURSE_PROGRESS_READ_MODEL_REPOSITORY)
    private readonly progressRepo: CourseProgressReadModelRepository,
    @Inject(LESSON_PROGRESS_REPOSITORY)
    private readonly lessonProgressRepo: LessonProgressRepository,
  ) {}

  async execute(query: GetCourseOutlineQuery): Promise<CourseOutlineDto> {
    const { courseId, actor } = query;

    // 1. Existence check → 404.
    const course = await this.courseRepo.findById(courseId);
    if (!course) {
      throw new CourseNotFoundError(courseId);
    }

    // 2. Authz check → 403.
    const allowed = await this.authz.canSee(actor, {
      kind: 'library',
      id: course.libraryId as LibraryId,
    });
    if (!allowed) {
      throw new PermissionDenied('You do not have access to this course.');
    }

    // 3. Load lessons with materials (one query, sorted by sectionId, position).
    const lessons = await this.lessonRepo.findByCourse(courseId);

    // 4. Load per-lesson progress for the actor (one query — no N+1).
    const lessonIds = lessons.map((l) => String(l.id));
    const [progressRows, courseProgressRow] = await Promise.all([
      this.lessonProgressRepo.findManyByUserAndLessons(actor.id, lessonIds),
      this.progressRepo.findByUserAndCourse(actor.id, courseId),
    ]);

    // Index progress rows by lessonId for O(1) lookup.
    const progressByLessonId = new Map(progressRows.map((p) => [p.lessonId, p]));

    // 5. Group lessons by section, preserving section position ordering.
    // course.sections is already sorted by position.
    const sectionMap = new Map<string, typeof lessons>(course.sections.map((s) => [s.id, []]));
    for (const lesson of lessons) {
      const bucket = sectionMap.get(lesson.sectionId);
      if (bucket) {
        bucket.push(lesson);
      }
    }

    // 6. Build SectionOutline[].
    const sections: SectionOutline[] = course.sections.map((section) => {
      const sectionLessons = sectionMap.get(section.id) ?? [];
      // Already sorted by position from findByCourse.
      const lessonItems: LessonOutlineItem[] = sectionLessons.map((lesson) => {
        const progress = progressByLessonId.get(String(lesson.id));
        let state: LessonOutlineItem['state'] = 'not-started';
        let progressPercent = 0;

        if (progress) {
          if (progress.completed) {
            state = 'completed';
            progressPercent = 100;
          } else if (progress.percent > 0) {
            state = 'in-progress';
            progressPercent = progress.percent;
          }
        }

        return {
          id: String(lesson.id),
          position: lesson.position,
          title: lesson.title,
          durationSeconds: lesson.duration ?? 0,
          hasMaterials: lesson.materials.length > 0,
          state,
          progressPercent,
        };
      });

      const totalDurationSeconds = sectionLessons.reduce((sum, l) => sum + (l.duration ?? 0), 0);

      return {
        id: section.id,
        position: section.position,
        title: section.title,
        totalDurationSeconds,
        lessons: lessonItems,
      };
    });

    // 7. Build flat materials list ordered by (lesson.position, material.id).
    // Use toSorted to avoid mutating the array (lessons is readonly from findByCourse).
    const materials: CourseMaterialItem[] = lessons
      .toSorted((a, b) => a.position - b.position)
      .flatMap((lesson) =>
        [...lesson.materials]
          .toSorted((a, b) => a.id.localeCompare(b.id))
          .map(
            (m): CourseMaterialItem => ({
              id: m.id,
              lessonId: String(lesson.id),
              kind: m.kind,
              label: m.label,
              sizeBytes: m.sizeBytes,
            }),
          ),
      );

    // 8. Build CourseOutlineSummary.
    const lessonsTotal = lessons.length;
    const totalDurationSeconds = lessons.reduce((sum, l) => sum + (l.duration ?? 0), 0);

    const progress = courseProgressRow
      ? {
          percent: courseProgressRow.percent,
          lessonsCompleted: courseProgressRow.lessonsCompleted,
          lessonsTotal: courseProgressRow.lessonsTotal,
        }
      : { percent: 0, lessonsCompleted: 0, lessonsTotal };

    const summary: CourseOutlineSummary = {
      id: String(course.id),
      title: course.title,
      lessonsTotal,
      totalDurationSeconds,
      progress,
      createdAt: course.createdAt.toISOString(),
      updatedAt: course.updatedAt.toISOString(),
      // instructor: not present in the Course aggregate yet — omit per spec note.
      // librarySlug: Library has no slug field yet — omit per spec note.
      ...(course.slug ? { slug: course.slug } : {}),
      ...(course.description ? { description: course.description } : {}),
    };

    return { course: summary, sections, materials };
  }
}
