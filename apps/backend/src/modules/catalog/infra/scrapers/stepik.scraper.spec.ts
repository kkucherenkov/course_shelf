// stepik.scraper.spec.ts
import { describe, expect, it, vi } from 'vitest';

import { StepikScraper } from './stepik.scraper';
import { ScrapeFetchError } from '../../domain/scraper/scraper.errors';

import type { FetchResult, HttpFetcher } from './http-fetcher';

// Recorded 2026-09-14 against stepik.org/api (see docs/roadmap/tasks/E30-F02-S02.md).
// Shortened: the live course carries 140 fields and 29 acquired_skills.
const COURSE_URL = 'https://stepik.org/course/181875/promo';

const courseFixture = JSON.stringify({
  courses: [
    {
      id: 181_875,
      title: 'SQL для всех: от начинающих до продвинутых',
      summary: 'Курс разработан специально для новичков.',
      description:
        '<p>Этот курс создан для тех, кто начинает знакомство с SQL.</p><p>Второй абзац.</p>',
      cover: 'https://cdn.stepik.net/media/cache/images/courses/181875/cover.jpg',
      language: 'ru',
      instructors: [564_134_108],
      review_summary: 181_344,
      create_date: '2023-08-28T16:12:00Z',
      acquired_skills: ['Писать SELECT-запросы', 'Применять подзапросы'],
      target_audience: '– Аналитиков данных\n– Бизнес-аналитиков',
      requirements: '<p>– Базовые навыки работы с компьютером</p>',
      workload: '3-4 часа в неделю',
    },
  ],
});

const usersFixture = JSON.stringify({
  users: [{ id: 564_134_108, full_name: 'Алексей Андросов' }],
});
const reviewFixture = JSON.stringify({
  'course-review-summaries': [{ id: 181_344, average: 4.951_612_903_225_806, count: 62 }],
});

const OK = (body: string): FetchResult => ({ status: 200, headers: new Headers(), body });

/** Fetcher stub keyed by which Stepik resource the URL targets. */
function fetcherFor(responses: {
  course?: FetchResult;
  users?: FetchResult;
  review?: FetchResult;
}): HttpFetcher {
  return {
    fetchText: vi.fn(async (url: string): Promise<FetchResult> => {
      if (url.includes('/api/courses/')) return responses.course ?? OK(courseFixture);
      if (url.includes('/api/users')) return responses.users ?? OK(usersFixture);
      if (url.includes('/api/course-review-summaries/'))
        return responses.review ?? OK(reviewFixture);
      throw new Error(`unexpected URL ${url}`);
    }),
  } as unknown as HttpFetcher;
}

describe('StepikScraper', () => {
  it('matches stepik.org/course/<numeric id> and rejects everything else', () => {
    const s = new StepikScraper(fetcherFor({}));
    expect(s.id).toBe('stepik');
    expect(s.canHandle(COURSE_URL)).toBe(true);
    expect(s.canHandle('https://stepik.org/course/181875/')).toBe(true);
    expect(s.canHandle('https://www.stepik.org/course/181875/syllabus')).toBe(true);
    // A slug in the id position is not an id — the API takes a number.
    expect(s.canHandle('https://stepik.org/course/sql-for-everyone')).toBe(false);
    expect(s.canHandle('https://stepik.org/catalog')).toBe(false);
    expect(s.canHandle('https://evil-stepik.org/course/181875')).toBe(false);
    expect(s.canHandle('not a url')).toBe(false);
  });

  it('fills the fragment from the three keyless calls', async () => {
    const scraper = new StepikScraper(fetcherFor({}));

    const [candidate] = await scraper.scrape({ kind: 'url', url: COURSE_URL });

    expect(candidate?.source).toBe('stepik');
    expect(candidate?.sourceUrl).toBe(COURSE_URL);
    expect(candidate?.fragment).toMatchObject({
      title: 'SQL для всех: от начинающих до продвинутых',
      posterUrl: 'https://cdn.stepik.net/media/cache/images/courses/181875/cover.jpg',
      language: 'ru',
      releaseDate: '2023-08-28',
      instructorNames: ['Алексей Андросов'],
      ratingAverage: 4.951_612_903_225_806,
      ratingCount: 62,
      externalIds: [{ source: 'stepik', externalId: '181875', url: COURSE_URL }],
    });
  });

  it('folds the five description-shaped fields into one description', async () => {
    const scraper = new StepikScraper(fetcherFor({}));

    const [candidate] = await scraper.scrape({ kind: 'url', url: COURSE_URL });
    const description = candidate?.fragment.description ?? '';

    // HTML became text, paragraph boundaries became blank lines, no tags left.
    expect(description).not.toMatch(/<[^>]+>/);
    expect(description).toContain('Курс разработан специально для новичков.');
    expect(description).toContain('Этот курс создан для тех, кто начинает знакомство с SQL.');
    // Headings follow the COURSE's language, not the viewer's.
    expect(description).toContain('Чему вы научитесь\n— Писать SELECT-запросы');
    expect(description).toContain('Кому подойдёт этот курс');
    expect(description).toContain('Требования\n– Базовые навыки работы с компьютером');
    expect(description).toContain('Нагрузка\n3-4 часа в неделю');
  });

  it('drops script and style payloads instead of rejoining them into a tag', async () => {
    // `<[^>]+>` removes the inner `<script>` and rejoins the outer halves into a
    // live tag — the bypass behind `js/incomplete-multi-character-sanitization`.
    // A parser has no such seam: the element and everything in it is gone.
    const nasty = JSON.stringify({
      courses: [
        {
          id: 1,
          title: 'C',
          description:
            '<p>Lead<<script>script>alert(1)<</script>/script></p><style>.x{color:red}</style>',
        },
      ],
    });
    const scraper = new StepikScraper(fetcherFor({ course: OK(nasty) }));

    const [candidate] = await scraper.scrape({ kind: 'url', url: 'https://stepik.org/course/1' });

    // The payload is gone, and what survives is TEXT — `<` and `/script>` are
    // text nodes here, not a tag. Stripping every `<` instead would corrupt the
    // legitimate case: a course about SQL or HTML whose description really does
    // say `WHERE x < 5` or shows a closing tag.
    expect(candidate?.fragment.description).toBe('Lead</script>');
  });

  it('uses English headings for a non-Russian course', async () => {
    const english = JSON.stringify({
      courses: [
        {
          id: 1,
          title: 'Course',
          language: 'en',
          description: '<p>Body.</p>',
          acquired_skills: ['Do a thing'],
          workload: '2 hours a week',
        },
      ],
    });
    const scraper = new StepikScraper(fetcherFor({ course: OK(english) }));

    const [candidate] = await scraper.scrape({ kind: 'url', url: 'https://stepik.org/course/1' });

    expect(candidate?.fragment.description).toContain("What you'll learn\n— Do a thing");
    expect(candidate?.fragment.description).toContain('Workload\n2 hours a week');
    expect(candidate?.fragment.description).not.toContain('Нагрузка');
  });

  it('does not repeat the summary when the description already opens with it', async () => {
    const repeated = JSON.stringify({
      courses: [
        { id: 1, title: 'C', summary: 'Same lead.', description: '<p>Same lead.</p><p>More.</p>' },
      ],
    });
    const scraper = new StepikScraper(fetcherFor({ course: OK(repeated) }));

    const [candidate] = await scraper.scrape({ kind: 'url', url: 'https://stepik.org/course/1' });

    const occurrences = (candidate?.fragment.description ?? '').split('Same lead.').length - 1;
    expect(occurrences).toBe(1);
  });

  it('caps the composed description at the 8000 the wire allows', async () => {
    const huge = JSON.stringify({
      courses: [
        {
          id: 1,
          title: 'C',
          description: `<p>${'x'.repeat(5000)}</p>`,
          acquired_skills: Array.from({ length: 200 }, (_, i) => `Skill number ${String(i)}`),
        },
      ],
    });
    const scraper = new StepikScraper(fetcherFor({ course: OK(huge) }));

    const [candidate] = await scraper.scrape({ kind: 'url', url: 'https://stepik.org/course/1' });

    expect((candidate?.fragment.description ?? '').length).toBeLessThanOrEqual(8000);
    expect(candidate?.fragment.description).toMatch(/…$/);
  });

  it('batches the instructor lookup into a single call', async () => {
    const many = JSON.stringify({
      courses: [{ id: 1, title: 'C', instructors: [11, 22, 33] }],
    });
    const fetcher = fetcherFor({ course: OK(many) });
    const scraper = new StepikScraper(fetcher);

    await scraper.scrape({ kind: 'url', url: 'https://stepik.org/course/1' });

    const calls = vi.mocked(fetcher.fetchText).mock.calls.map(([url]) => url);
    const userCalls = calls.filter((url) => url.includes('/api/users'));
    expect(userCalls).toHaveLength(1);
    expect(userCalls[0]).toContain('ids%5B%5D=11&ids%5B%5D=22&ids%5B%5D=33');
  });

  it('skips both lookups when the course carries no instructors and no review summary', async () => {
    const bare = JSON.stringify({ courses: [{ id: 1, title: 'Bare' }] });
    const fetcher = fetcherFor({ course: OK(bare) });
    const scraper = new StepikScraper(fetcher);

    const [candidate] = await scraper.scrape({ kind: 'url', url: 'https://stepik.org/course/1' });

    expect(vi.mocked(fetcher.fetchText).mock.calls).toHaveLength(1);
    expect(candidate?.fragment.instructorNames).toBeUndefined();
    expect(candidate?.fragment.ratingAverage).toBeUndefined();
  });

  it('degrades to a thinner fragment when a lookup fails', async () => {
    const scraper = new StepikScraper(
      fetcherFor({
        users: { status: 500, headers: new Headers(), body: '' },
        review: { status: 404, headers: new Headers(), body: '' },
      }),
    );

    const [candidate] = await scraper.scrape({ kind: 'url', url: COURSE_URL });

    expect(candidate?.fragment.title).toBe('SQL для всех: от начинающих до продвинутых');
    expect(candidate?.fragment.instructorNames).toBeUndefined();
    expect(candidate?.fragment.ratingAverage).toBeUndefined();
  });

  it('treats a failing course call as a real error', async () => {
    const scraper = new StepikScraper(
      fetcherFor({ course: { status: 503, headers: new Headers(), body: '' } }),
    );

    await expect(scraper.scrape({ kind: 'url', url: COURSE_URL })).rejects.toBeInstanceOf(
      ScrapeFetchError,
    );
  });

  it('returns nothing for an empty course list or a non-url request', async () => {
    const empty = new StepikScraper(fetcherFor({ course: OK('{"courses":[]}') }));
    await expect(empty.scrape({ kind: 'url', url: COURSE_URL })).resolves.toEqual([]);

    const scraper = new StepikScraper(fetcherFor({}));
    await expect(scraper.scrape({ kind: 'name', query: 'SQL' })).resolves.toEqual([]);
  });
});
