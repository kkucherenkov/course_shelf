/**
 * WHY this file exists:
 * Query handler for GET /search. Performs case-insensitive substring search
 * across course titles, section titles (matched into their courses), lesson
 * titles, and transcript cue text. Respects per-library READ grants —
 * non-admin actors only see courses / lessons / transcript cues inside
 * libraries they have access to.
 *
 * Short-circuit: q.trim().length < 2 returns empty lists immediately without
 * hitting the DB (avoids a pathologically broad full-table scan).
 *
 * Authorization strategy: the handler resolves accessible library ids once via
 * AuthorizationService.listAccessibleLibraryIds, then passes the id set to the
 * search port so the DB query itself is already scoped. This is more efficient
 * than fetching all matches and then filtering per-item (the old list-courses
 * pattern works for small sets; search result sets can be much larger).
 *
 * Ranking is done in JS after the DB call — result sets are capped at `limit`
 * (max 100) so there is no performance issue.
 */
import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { AUTHORIZATION_SERVICE } from '../../../../common/access/authorization.service';
import { SEARCH_PORT } from '../../domain/search.port';

import { SearchCatalogueQuery } from './search-catalogue.query';

import type { AuthorizationService } from '../../../../common/access/authorization.service';
import type {
  SearchPort,
  SearchCourseHitRow,
  SearchLessonHitRow,
  SearchTranscriptHitRow,
} from '../../domain/search.port';
import type {
  SearchResultDto,
  SearchCourseHit,
  SearchLessonHit,
  SearchTranscriptHitDto,
} from '@app/api-client-ts';

// ── ranking helpers ───────────────────────────────────────────────────────────

/**
 * Tier 0: title starts with q (case-insensitive).
 * Tier 1: any whitespace-separated word in title starts with q.
 * Tier 2: everything else (substring match only).
 * Within each tier: alphabetical by title.
 */
function rankTier(title: string, q: string): number {
  const lower = title.toLowerCase();
  const lq = q.toLowerCase();
  if (lower.startsWith(lq)) return 0;
  if (lower.split(/\s+/).some((word) => word.startsWith(lq))) return 1;
  return 2;
}

function sortByRank<T>(items: T[], q: string, key: (item: T) => string): T[] {
  return items.toSorted((a, b) => {
    const ka = key(a);
    const kb = key(b);
    const ta = rankTier(ka, q);
    const tb = rankTier(kb, q);
    if (ta !== tb) return ta - tb;
    return ka.localeCompare(kb);
  });
}

const byTitle = (item: { title: string }): string => item.title;

// ── handler ───────────────────────────────────────────────────────────────────

@QueryHandler(SearchCatalogueQuery)
export class SearchCatalogueHandler implements IQueryHandler<
  SearchCatalogueQuery,
  SearchResultDto
> {
  constructor(
    @Inject(SEARCH_PORT) private readonly searchPort: SearchPort,
    @Inject(AUTHORIZATION_SERVICE) private readonly authz: AuthorizationService,
  ) {}

  async execute(query: SearchCatalogueQuery): Promise<SearchResultDto> {
    const trimmed = query.q.trim();

    // Short-circuit for empty / too-short queries.
    if (trimmed.length < 2) {
      return { query: trimmed, courses: [], lessons: [], transcripts: [] };
    }

    // Resolve accessible library ids once. null = admin (no filter).
    const libraryIds = await this.authz.listAccessibleLibraryIds(query.actor);

    // Empty array means user has no grants — skip DB entirely.
    if (Array.isArray(libraryIds) && libraryIds.length === 0) {
      return { query: trimmed, courses: [], lessons: [], transcripts: [] };
    }

    // Fetch hits from DB in parallel.
    const [courseRows, lessonRows, transcriptRows] = await Promise.all([
      this.searchPort.findCourseHits(trimmed, query.limit, libraryIds),
      this.searchPort.findLessonHits(trimmed, query.limit, libraryIds),
      this.searchPort.findTranscriptHits(trimmed, query.limit, libraryIds),
    ]);

    // Rank + slice.
    const rankedCourses = sortByRank(courseRows, trimmed, byTitle).slice(0, query.limit);
    const rankedLessons = sortByRank(lessonRows, trimmed, byTitle).slice(0, query.limit);
    const rankedTranscripts = sortByRank(
      transcriptRows,
      trimmed,
      (r: SearchTranscriptHitRow) => r.text,
    ).slice(0, query.limit);

    // Map to DTO shapes (already match — just re-assert the types).
    const courses: SearchCourseHit[] = rankedCourses.map(
      (r: SearchCourseHitRow): SearchCourseHit => ({
        id: r.id,
        libraryId: r.libraryId,
        title: r.title,
        slug: r.slug,
        lessonsTotal: r.lessonsTotal,
      }),
    );

    const lessons: SearchLessonHit[] = rankedLessons.map(
      (r: SearchLessonHitRow): SearchLessonHit => ({
        id: r.id,
        courseId: r.courseId,
        courseTitle: r.courseTitle,
        sectionTitle: r.sectionTitle,
        title: r.title,
        position: r.position,
      }),
    );

    const transcripts: SearchTranscriptHitDto[] = rankedTranscripts.map(
      (r: SearchTranscriptHitRow): SearchTranscriptHitDto => ({
        lessonId: r.lessonId,
        lessonTitle: r.lessonTitle,
        courseId: r.courseId,
        courseTitle: r.courseTitle,
        sectionTitle: r.sectionTitle,
        language: r.language,
        startMs: r.startMs,
        text: r.text,
      }),
    );

    return { query: trimmed, courses, lessons, transcripts };
  }
}
