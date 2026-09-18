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

// tuxedo 249: a member holding only a COURSE-level grant (the admin UI
// offers those) used to be told they have no access at all. `GET
// /libraries` only lists library-level grants, so it went empty; the page
// read that alone as "nothing was ever granted" and hid the whole
// catalogue, including the course the grant was actually for.
test('a member with only a course-level grant sees the catalogue, not the access denial', async ({
  page,
}) => {
  await mockAuthenticated(page);

  // Override the admin session `mockAuthenticated` set up, and the empty
  // library-grant list a course-only grant leaves behind.
  await page.route('**/api/v1/auth/get-session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: { id: 'u-2', email: 'member@e.com', name: 'Member', role: 'USER' },
        session: { id: 's-2', token: 'fake-token' },
      }),
    }),
  );
  await page.route('**/api/v1/libraries', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [] }),
    }),
  );
  await page.route('**/api/v1/courses**', (route) =>
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

  await expect(page.locator('[data-testid="page-browse"]')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('.app-no-permission')).toHaveCount(0);
  await expect(page.getByText('Pragmatic Clean Architecture')).toBeVisible();
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

// The filter group used to sit beside the status chips in English and drop
// below them in Russian, because `__controls` was a wrapping row and the
// Russian labels are wider — so switching language moved the filters and the
// grid under them. The position must not depend on the language.
test('the filter group sits below the status chips in both locales', async ({ page }) => {
  for (const locale of ['en', 'ru']) {
    await page.context().clearCookies();
    await page
      .context()
      .addCookies([{ name: 'i18n_locale', value: locale, domain: 'localhost', path: '/' }]);
    await mockAuthenticated(page);
    await mockCourses(page, SAMPLE_COURSES);

    await page.goto('/browse');
    await expect(page.locator('[data-testid="page-browse"]')).toBeVisible({ timeout: 10_000 });

    const chips = await page.locator('.page-browse__chips').boundingBox();
    const selects = await page.locator('.page-browse__selects').boundingBox();

    expect(chips, `chips missing in ${locale}`).toBeTruthy();
    expect(selects, `selects missing in ${locale}`).toBeTruthy();
    expect(selects!.y, `selects must start below the chips in ${locale}`).toBeGreaterThanOrEqual(
      chips!.y + chips!.height,
    );
  }
});
