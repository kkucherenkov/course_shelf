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
