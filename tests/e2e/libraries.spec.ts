import { test, expect, type Page } from '@playwright/test';

/**
 * E2E for /libraries — register-and-scan flow.
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

test('libraries page lists, registers, and triggers scans', async ({ page }) => {
  await mockAuthenticated(page);

  // First load: no libraries.
  let listCallCount = 0;
  await page.route('**/api/v1/libraries', (route) => {
    if (route.request().method() === 'GET') {
      listCallCount += 1;
      const items =
        listCallCount === 1
          ? []
          : [
              {
                id: 'lib-1',
                name: 'Course Shelf samples',
                rootPath: '/workspace/docs/data/courses',
                createdAt: '2026-04-28T00:00:00Z',
                updatedAt: '2026-04-28T00:00:00Z',
              },
            ];
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items }),
      });
      return;
    }
    if (route.request().method() === 'POST') {
      void route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'lib-1',
          name: 'Course Shelf samples',
          rootPath: '/workspace/docs/data/courses',
          createdAt: '2026-04-28T00:00:00Z',
          updatedAt: '2026-04-28T00:00:00Z',
        }),
      });
      return;
    }
    void route.continue();
  });

  // No scans yet for the empty library — return 404.
  let scansPolled = 0;
  await page.route('**/api/v1/libraries/lib-1/scans/latest', (route) => {
    scansPolled += 1;
    void route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });

  // Trigger-scan POST returns a running scan.
  let scansTriggered = 0;
  await page.route('**/api/v1/libraries/lib-1/scans', (route) => {
    if (route.request().method() === 'POST') {
      scansTriggered += 1;
      void route.fulfill({
        status: 202,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'scan-1',
          libraryId: 'lib-1',
          status: 'running',
          startedAt: '2026-04-28T00:01:00Z',
          filesScanned: 0,
          filesAdded: 0,
          filesUpdated: 0,
          coursesDiscovered: 0,
          errors: [],
        }),
      });
      return;
    }
    void route.continue();
  });

  await page.goto('/libraries');

  // Page renders with empty state.
  await expect(page.locator('[data-testid="page-libraries"]')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.locator('.app-empty-state')).toBeVisible();

  // Open the form, fill it in, submit.
  await page.getByRole('button', { name: 'Add library' }).click();
  await page.getByLabel('Name').fill('Course Shelf samples');
  await page.getByLabel('Path on this server').fill('/workspace/docs/data/courses');
  await page.getByRole('button', { name: 'Register' }).click();

  // List re-fetched, library row appears.
  await expect(page.locator('[data-testid="library-row"]')).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText('Course Shelf samples')).toBeVisible();
  await expect(page.getByText('/workspace/docs/data/courses')).toBeVisible();

  // Click rescan and verify the POST was made.
  await page.getByRole('button', { name: 'Rescan' }).click();
  await expect.poll(() => scansTriggered, { timeout: 5000 }).toBe(1);
  // The polling kicked in at least once.
  expect(scansPolled).toBeGreaterThan(0);
});
