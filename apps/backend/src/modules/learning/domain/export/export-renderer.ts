/**
 * WHY this file exists:
 * Pure Markdown rendering for the lesson/course export (E28-F01-S01,
 * design §7). No Prisma, no NestJS, no I/O — every function here takes a
 * plain view model and returns a string, so the query handlers stay the only
 * place that talks to a repository and this file is testable with plain
 * fixtures.
 *
 * There is deliberately no summary section anywhere below: the generated-
 * summary feature (design §5-6) was cut from this card on 2026-09-22. A
 * lesson without a note or without bookmarks renders without that section —
 * same "absence is not a bug" posture the design applies to the summary.
 */
import type { SubtitleCue } from '../../../../shared/subtitle-converter';

/**
 * How far from a bookmark's timestamp a transcript cue can sit and still
 * count as "the lines it points at" (design §7 leaves the window
 * unspecified). ±5s reads as the sentence or two around the moment the user
 * bookmarked, without pulling in unrelated dialogue from a busy transcript.
 *
 * ponytail: fixed window, not adaptive to speech rate — widen per-lesson if
 * a real transcript turns out to need it.
 */
export const BOOKMARK_CONTEXT_WINDOW_MS = 5000;

export interface LessonExportBookmarkView {
  readonly positionSeconds: number;
  readonly label: string | undefined;
  readonly deepLink: string;
  /** Cue text, in chronological order, within BOOKMARK_CONTEXT_WINDOW_MS of the bookmark. */
  readonly transcriptLines: readonly string[];
}

export interface LessonExportView {
  readonly title: string;
  readonly deepLink: string;
  /** undefined renders without a Note section — the user never wrote one. */
  readonly noteBody: string | undefined;
  readonly bookmarks: readonly LessonExportBookmarkView[];
}

export interface CourseExportLessonLink {
  readonly title: string;
  /** Relative to `lessons/`, e.g. "01-intro.md". */
  readonly fileName: string;
}

export interface CourseExportSectionView {
  readonly title: string;
  readonly lessons: readonly CourseExportLessonLink[];
}

export interface CourseExportView {
  readonly title: string;
  readonly deepLink: string;
  readonly sections: readonly CourseExportSectionView[];
}

/** `${webOrigin}/courses/:courseId/lessons/:lessonId`, `?t=` appended when positionSeconds is given. */
export function buildDeepLink(
  webOrigin: string,
  courseId: string,
  lessonId: string,
  positionSeconds?: number,
): string {
  const base = `${webOrigin}/courses/${courseId}/lessons/${lessonId}`;
  return positionSeconds === undefined ? base : `${base}?t=${String(Math.floor(positionSeconds))}`;
}

/** `mm:ss`, widening to `h:mm:ss` past the hour mark. Negative input clamps to 0. */
export function formatTimestamp(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const mm = String(minutes).padStart(2, '0');
  const ss = String(secs).padStart(2, '0');
  return hours > 0 ? `${String(hours)}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Every cue whose [startMs, endMs] window overlaps the bookmark's timestamp
 * ± windowMs, in chronological (startMs asc) order. `cues` is expected
 * pre-sorted by startMs (TranscriptRepository's contract) — this only
 * filters, it never re-sorts.
 */
export function cuesNearPosition(
  cues: readonly SubtitleCue[],
  positionSeconds: number,
  windowMs = BOOKMARK_CONTEXT_WINDOW_MS,
): SubtitleCue[] {
  const positionMs = positionSeconds * 1000;
  const from = positionMs - windowMs;
  const to = positionMs + windowMs;
  return cues.filter((cue) => cue.endMs >= from && cue.startMs <= to);
}

// Filesystem-safe filename slug. Deliberately simpler than the catalog
// Course slug (shared-vo/entity-slug.ts): there is no uniqueness constraint
// to satisfy here, just a readable name inside a ZIP the user already chose
// to download, and cross-module import would violate the learning/catalog
// boundary (learning.module.ts's dependency-boundary note) for a filename
// cosmetic. `\p{L}\p{N}` keeps any-script letters and digits; everything
// else (including combining marks) becomes a hyphen.
const FILENAME_UNSAFE_RE = /[^\p{L}\p{N}]+/gu;
const FILENAME_EDGE_RE = /^-+|-+$/g;

export function slugifyForFilename(title: string): string {
  const hyphenated = title.toLowerCase().normalize('NFC').replaceAll(FILENAME_UNSAFE_RE, '-');
  const trimmed = hyphenated.replaceAll(FILENAME_EDGE_RE, '');
  return trimmed.length > 0 ? trimmed.slice(0, 60) : 'lesson';
}

/** `NN-slug.md`, NN zero-padded to fit `total` (at least 2 digits) — design §7's `lessons/NN-slug.md`. */
export function lessonFileName(index: number, total: number, title: string): string {
  const width = Math.max(2, String(total).length);
  const n = String(index + 1).padStart(width, '0');
  return `${n}-${slugifyForFilename(title)}.md`;
}

export function renderLessonMarkdown(view: LessonExportView): string {
  const lines: string[] = [`# ${view.title}`, '', `[Open in course_shelf](${view.deepLink})`, ''];

  if (view.noteBody !== undefined) {
    lines.push('## Note', '', view.noteBody, '');
  }

  if (view.bookmarks.length > 0) {
    lines.push('## Bookmarks', '');
    for (const bookmark of view.bookmarks) {
      lines.push(
        `### ${formatTimestamp(bookmark.positionSeconds)} — ${bookmark.label ?? 'Bookmark'}`,
        '',
        `[Jump to this moment](${bookmark.deepLink})`,
        '',
      );
      for (const line of bookmark.transcriptLines) {
        lines.push(`> ${line}`);
      }
      if (bookmark.transcriptLines.length > 0) lines.push('');
    }
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

export function renderCourseMarkdown(view: CourseExportView): string {
  const lines: string[] = [`# ${view.title}`, '', `[Open in course_shelf](${view.deepLink})`, ''];

  for (const section of view.sections) {
    lines.push(`## ${section.title}`, '');
    for (const lesson of section.lessons) {
      lines.push(`- [${lesson.title}](lessons/${lesson.fileName})`);
    }
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}
