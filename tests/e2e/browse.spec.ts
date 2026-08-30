import { test, expect, type Page } from '@playwright/test';

/**
 * E2E for /browse — full-catalogue grid backed by `listCourses`.
 *
 * Hermetic: every backend call is mocked via `route()`. The auth bypass
 * primes localStorage so the page-level `useAuthStore` thinks the user
 * is signed in and the global middleware lets the navigation through.
 */
test.use({ viewport: { width: 1280, height: 900 } });

async function mockAuthenticated(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('cs.web.bearer', 'fake-token');
  });

  await page.route('**/api/v1/admin/has-users', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ hasUsers: true }),
    }),
  );

  await page.route('**/api/v1/auth/get-session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: 'u-1', email: 't@e.com', name: 'Tester', role: 'ADMIN' },
        session: { id: 's-1', token: 'fake-token' },
      }),
    }),
  );

  // Sidecar lists behind the library and instructor filters (E31-F01-S01).
  await page.route('**/api/v1/libraries', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 'lib-1',
            name: 'Backend',
            rootPath: '/srv/backend',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
      }),
    }),
  );

  await page.route('**/api/v1/catalog/instructors**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 'i-1',
            slug: 'ada',
            displayName: 'Ada Lovelace',
            externalIds: [],
            coursesTotal: 2,
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        ],
        total: 1,
        offset: 0,
        limit: 100,
      }),
    }),
  );
}

/** Fulfil every shape of the course-list call and record the URLs requested. */
async function mockCourses(page: Page, body: unknown, seen: string[] = []): Promise<string[]> {
  await page.route('**/api/v1/courses**', (route) => {
    seen.push(route.request().url());
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
  return seen;
}

const SAMPLE_COURSES = {
  items: [
    {
      id: 'crs-1',
      libraryId: 'lib-1',
      slug: 'pragmatic-clean-architecture',
      title: 'Pragmatic Clean Architecture',
      description: null,
      sections: [],
      progress: { percent: 0, lessonsCompleted: 0, lessonsTotal: 24 },
      createdAt: '2026-04-25T09:00:00Z',
      updatedAt: '2026-04-25T09:00:00Z',
    },
    {
      id: 'crs-2',
      libraryId: 'lib-1',
      slug: 'super-figma',
      title: 'Super Figma',
      description: null,
      sections: [],
      progress: { percent: 50, lessonsCompleted: 6, lessonsTotal: 12 },
      createdAt: '2026-04-26T09:00:00Z',
      updatedAt: '2026-04-26T09:00:00Z',
    },
    {
      id: 'crs-3',
      libraryId: 'lib-1',
      slug: 'building-gui-applications-with-fyne',
      title: 'Building GUI Applications with Fyne and Go',
      description: null,
      sections: [],
      progress: { percent: 100, lessonsCompleted: 18, lessonsTotal: 18 },
      createdAt: '2026-04-27T09:00:00Z',
      updatedAt: '2026-04-27T09:00:00Z',
    },
  ],
};

test('browse page renders the course grid from listCourses', async ({ page }) => {
  await mockAuthenticated(page);

  await page.route('**/api/v1/courses?**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(SAMPLE_COURSES),
    }),
  );
  await page.route('**/api/v1/courses', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(SAMPLE_COURSES),
    }),
  );

  await page.goto('/browse');

  await expect(page.locator('[data-testid="page-browse"]')).toBeVisible({
    timeout: 10_000,
  });

  // Three poster cards rendered in the grid.
  await expect(page.getByText('Pragmatic Clean Architecture')).toBeVisible();
  await expect(page.getByText('Super Figma')).toBeVisible();
  await expect(page.getByText('Building GUI Applications with Fyne and Go')).toBeVisible();

  // Subtitle reflects count.
  await expect(page.locator('.page-browse__subtitle')).toContainText('3 courses');
});

test('browse page renders empty state when no courses', async ({ page }) => {
  await mockAuthenticated(page);

  await page.route('**/api/v1/courses', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [] }),
    }),
  );

  await page.goto('/browse');

  await expect(page.locator('[data-testid="page-browse"]')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator('.app-empty-state')).toBeVisible();
  await expect(page.getByText('No courses yet')).toBeVisible();
});

test('a chosen filter reaches the server and lands in the URL', async ({ page }) => {
  await mockAuthenticated(page);
  const seen = await mockCourses(page, SAMPLE_COURSES);

  await page.goto('/browse');
  await expect(page.locator('[data-testid="page-browse"]')).toBeVisible({ timeout: 10_000 });

  await page.locator('[data-testid="browse-filter-duration"]').selectOption('gt20');

  await expect(page).toHaveURL(/duration=gt20/);
  await expect.poll(() => seen.some((url) => url.includes('durationBucket=gt20'))).toBe(true);
});

test('filters survive a reload through the query string', async ({ page }) => {
  await mockAuthenticated(page);
  const seen = await mockCourses(page, SAMPLE_COURSES);

  // A cold load of a filtered URL — the bookmark / shared-link case.
  await page.goto('/browse?status=completed&duration=lt5&sort=duration&library=lib-1');
  await expect(page.locator('[data-testid="page-browse"]')).toBeVisible({ timeout: 10_000 });

  await expect
    .poll(() =>
      seen.some(
        (url) =>
          url.includes('status=completed') &&
          url.includes('durationBucket=lt5') &&
          url.includes('sort=duration') &&
          url.includes('libraryId=lib-1'),
      ),
    )
    .toBe(true);

  // The controls reflect the URL rather than their defaults.
  await expect(page.locator('[data-testid="browse-filter-duration"]')).toHaveValue('lt5');
  await expect(page.locator('[data-testid="browse-sort"]')).toHaveValue('duration');
  await expect(page.locator('[data-testid="browse-filter-library"]')).toHaveValue('lib-1');
});
