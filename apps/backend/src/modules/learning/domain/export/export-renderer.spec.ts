/**
 * Unit tests for the export renderer — fixture in, Markdown out.
 * Pure functions, no mocks needed.
 */
import { describe, expect, it } from 'vitest';

import {
  buildDeepLink,
  cuesNearPosition,
  formatTimestamp,
  lessonFileName,
  renderCourseMarkdown,
  renderLessonMarkdown,
  slugifyForFilename,
} from './export-renderer';

import type { LessonExportView } from './export-renderer';
import type { SubtitleCue } from '../../../../shared/subtitle-converter';

describe('buildDeepLink', () => {
  it('builds a plain player URL without a position', () => {
    expect(buildDeepLink('http://localhost:8080', 'course-1', 'lesson-1')).toBe(
      'http://localhost:8080/courses/course-1/lessons/lesson-1',
    );
  });

  it('appends ?t= when a position is given, floored to whole seconds', () => {
    expect(buildDeepLink('http://localhost:8080', 'course-1', 'lesson-1', 90.7)).toBe(
      'http://localhost:8080/courses/course-1/lessons/lesson-1?t=90',
    );
  });
});

describe('formatTimestamp', () => {
  it('formats under an hour as mm:ss', () => {
    expect(formatTimestamp(90)).toBe('01:30');
    expect(formatTimestamp(5)).toBe('00:05');
  });

  it('widens to h:mm:ss past the hour mark', () => {
    expect(formatTimestamp(3661)).toBe('1:01:01');
  });

  it('clamps negative input to zero', () => {
    expect(formatTimestamp(-5)).toBe('00:00');
  });
});

describe('cuesNearPosition', () => {
  const cues: SubtitleCue[] = [
    { startMs: 0, endMs: 2000, text: 'too early' },
    { startMs: 8000, endMs: 10_000, text: 'in window' },
    { startMs: 10_500, endMs: 12_000, text: 'also in window' },
    { startMs: 30_000, endMs: 32_000, text: 'too late' },
  ];

  it('keeps only cues overlapping the ±window around the bookmark', () => {
    const result = cuesNearPosition(cues, 10, 5000);
    expect(result.map((c) => c.text)).toEqual(['in window', 'also in window']);
  });

  it('returns an empty array when no cue is near the position', () => {
    expect(cuesNearPosition(cues, 100, 5000)).toEqual([]);
  });
});

describe('slugifyForFilename / lessonFileName', () => {
  it('lowercases and hyphenates non-letter runs', () => {
    expect(slugifyForFilename('Intro: Setting Up!')).toBe('intro-setting-up');
  });

  it('falls back to "lesson" when the title slugifies to nothing', () => {
    expect(slugifyForFilename('???')).toBe('lesson');
  });

  it('pads NN to at least 2 digits for small courses', () => {
    expect(lessonFileName(0, 5, 'Intro')).toBe('01-intro.md');
  });

  it('widens NN padding for courses over 99 lessons', () => {
    expect(lessonFileName(0, 150, 'Intro')).toBe('001-intro.md');
  });
});

describe('renderLessonMarkdown', () => {
  const base: LessonExportView = {
    title: 'Intro to Signals',
    deepLink: 'http://localhost:8080/courses/course-1/lessons/lesson-1',
    noteBody: undefined,
    bookmarks: [],
  };

  it('renders title and deep link with no Note/Bookmarks sections when both are absent', () => {
    const md = renderLessonMarkdown(base);
    expect(md).toBe(
      '# Intro to Signals\n\n' +
        '[Open in course_shelf](http://localhost:8080/courses/course-1/lessons/lesson-1)\n',
    );
  });

  it('renders a Note section when noteBody is present', () => {
    const md = renderLessonMarkdown({ ...base, noteBody: 'Remember: sampling theorem.' });
    expect(md).toContain('## Note\n\nRemember: sampling theorem.');
  });

  it('renders each bookmark with its timestamp, label, deep link and transcript lines', () => {
    const md = renderLessonMarkdown({
      ...base,
      bookmarks: [
        {
          positionSeconds: 90,
          label: 'Key insight',
          deepLink: 'http://localhost:8080/courses/course-1/lessons/lesson-1?t=90',
          transcriptLines: ['So the key idea here is...', 'sampling at twice the frequency.'],
        },
      ],
    });
    expect(md).toContain('## Bookmarks');
    expect(md).toContain('### 01:30 — Key insight');
    expect(md).toContain(
      '[Jump to this moment](http://localhost:8080/courses/course-1/lessons/lesson-1?t=90)',
    );
    expect(md).toContain('> So the key idea here is...');
    expect(md).toContain('> sampling at twice the frequency.');
  });

  it('falls back to "Bookmark" heading text when the bookmark has no label', () => {
    const md = renderLessonMarkdown({
      ...base,
      bookmarks: [
        {
          positionSeconds: 5,
          label: undefined,
          deepLink: 'http://localhost:8080/courses/course-1/lessons/lesson-1?t=5',
          transcriptLines: [],
        },
      ],
    });
    expect(md).toContain('### 00:05 — Bookmark');
  });

  it('renders a bookmark with no nearby transcript lines without an empty blockquote', () => {
    const md = renderLessonMarkdown({
      ...base,
      bookmarks: [
        {
          positionSeconds: 5,
          label: 'Silence',
          deepLink: 'http://localhost:8080/courses/course-1/lessons/lesson-1?t=5',
          transcriptLines: [],
        },
      ],
    });
    expect(md).not.toContain('>');
  });

  it('never mentions a summary section — the feature was cut from this card', () => {
    const md = renderLessonMarkdown({ ...base, noteBody: 'x' });
    expect(md.toLowerCase()).not.toContain('summary');
  });
});

describe('renderCourseMarkdown', () => {
  it('renders the course title, deep link, and each section as a list of lesson links', () => {
    const md = renderCourseMarkdown({
      title: 'Signals and Systems',
      deepLink: 'http://localhost:8080/courses/course-1',
      sections: [
        {
          title: 'Foundations',
          lessons: [
            { title: 'Intro', fileName: '01-intro.md' },
            { title: 'Sampling', fileName: '02-sampling.md' },
          ],
        },
      ],
    });

    expect(md).toContain('# Signals and Systems');
    expect(md).toContain('[Open in course_shelf](http://localhost:8080/courses/course-1)');
    expect(md).toContain('## Foundations');
    expect(md).toContain('- [Intro](lessons/01-intro.md)');
    expect(md).toContain('- [Sampling](lessons/02-sampling.md)');
  });
});
