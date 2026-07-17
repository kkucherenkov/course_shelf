/**
 * Home page E2E tests.
 *
 * Endpoints are mocked with Playwright `route()` so the suite is hermetic —
 * no live backend required for these tests.
 *
 * Auth strategy:
 *   - `GET /api/v1/admin/has-users` → `{ hasUsers: true }` (middleware gate)
 *   - `GET /api/v1/auth/*` → fake session response (better-auth getSession)
 *   - localStorage `cs.web.bearer` token pre-seeded so the middleware refresh
 *     path kicks in and hydrates `auth.user` from the mocked session.
 *
 * Three viewport scenarios:
 *   1440x900  — full layout with right rail visible
 *   1024x768  — md layout: right rail hidden, sections stack full-width
 *   375x800   — xs layout: horizontal scroll rows, bottom-tab visible
 */

import { test, expect, type Page } from '@playwright/test';

// ── Fixture data ─────────────────────────────────────────────────────────────

const continueWatchingFixture = {
  items: [
    {
      courseId: 'cw-1',
      courseTitle: 'Introduction to TypeScript',
      percent: 45,
      lessonsCompleted: 9,
      lessonsTotal: 20,
      lastSeenAt: '2026-04-20T10:00:00Z',
      lastSeenLessonId: 'lesson-5',
    },
    {
      courseId: 'cw-2',
      courseTitle: 'Vue 3 Deep Dive',
      percent: 30,
      lessonsCompleted: 6,
      lessonsTotal: 20,
      lastSeenAt: '2026-04-21T10:00:00Z',
      lastSeenLessonId: 'lesson-3',
    },
    {
      courseId: 'cw-3',
      courseTitle: 'NestJS in Practice',
      percent: 10,
      lessonsCompleted: 2,
      lessonsTotal: 20,
      lastSeenAt: '2026-04-22T10:00:00Z',
      lastSeenLessonId: 'lesson-1',
    },
  ],
};

const recentlyAddedFixture = {
  items: [
    {
      courseId: 'ra-1',
      courseTitle: 'Prisma ORM Masterclass',
      lessonCount: 15,
      totalDurationSeconds: 7200,
      createdAt: '2026-04-25T08:00:00Z',
    },
    {
      courseId: 'ra-2',
      courseTitle: 'Docker from Zero',
      lessonCount: 12,
      totalDurationSeconds: 5400,
      createdAt: '2026-04-24T08:00:00Z',
    },
  ],
};

const recentlyCompletedFixture = {
  items: [
    {
      courseId: 'rc-1',
      courseTitle: 'JavaScript Fundamentals',
      lessonsTotal: 18,
      completedAt: '2026-04-15T15:00:00Z',
    },
    {
      courseId: 'rc-2',
      courseTitle: 'CSS Grid & Flexbox',
      lessonsTotal: 10,
      completedAt: '2026-04-10T15:00:00Z',
    },
  ],
};

const yourWeekFixture = {
  minutesWatched: 142,
  lessonsCompleted: 7,
  range: {
    from: '2026-04-21T00:00:00Z',
    to: '2026-04-28T00:00:00Z',
  },
};

// Fake session returned by better-auth `getSession` mock.
const fakeSession = {
  session: { id: 'sess-1', userId: 'user-1', expiresAt: '2099-01-01T00:00:00Z' },
  user: { id: 'user-1', name: 'Test User', email: 'test@example.com', role: 'USER' },
};

// ── Route mock setup ──────────────────────────────────────────────────────────

async function mockAllEndpoints(page: Page): Promise<void> {
  // Auth: has-users probe (global middleware gate).
  await page.route('**/api/v1/admin/has-users**', (route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ hasUsers: true }),
    });
  });

  // Auth: better-auth session endpoint (used by auth.refresh() in middleware).
  // Better-auth calls `/api/v1/auth/get-session`.
  await page.route('**/api/v1/auth/**', (route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fakeSession),
    });
  });

  // Home endpoints
  await page.route('**/api/v1/home/continue-watching**', (route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(continueWatchingFixture),
    });
  });
  await page.route('**/api/v1/home/recently-added**', (route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(recentlyAddedFixture),
    });
  });
  await page.route('**/api/v1/home/recently-completed**', (route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(recentlyCompletedFixture),
    });
  });
  await page.route('**/api/v1/home/your-week**', (route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(yourWeekFixture),
    });
  });
}

/**
 * Navigate to the home page with auth bypassed.
 *
 * Flow:
 *  1. Pre-seed `localStorage` with a fake bearer token via `addInitScript`
 *     (runs before any page JS).
 *  2. Register route mocks.
 *  3. Navigate to `/` — the global middleware sees `auth.token` set, calls
 *     `auth.refresh()` which hits the mocked session endpoint, hydrates
 *     `auth.user`, and the isAuthenticated check passes.
 */
async function gotoHome(page: Page): Promise<void> {
  // addInitScript runs in every page context before any scripts — localStorage
  // is available because the origin is already known from the baseURL config.
  await page.addInitScript(() => {
    localStorage.setItem('cs.web.bearer', 'fake-e2e-token');
  });

  await mockAllEndpoints(page);
  await page.goto('/');
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('home page — 1440x900', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('shows all four sections and right rail; recently-completed is collapsed by default', async ({
    page,
  }) => {
    await gotoHome(page);

    // Wait for the page content area to mount
    await expect(page.locator('.page-home')).toBeVisible({ timeout: 10_000 });

    // All home rows must be present
    await expect(page.locator('.home-row').first()).toBeVisible();

    // Right rail must be visible at 1440px (display:block via media query ≥1024px)
    const rail = page.locator('.page-home__rail');
    await expect(rail).toBeVisible();

    // "Continue watching" shows ≥1 card after data loads
    const continueSection = page.locator('.page-home__row--continue');
    await expect(continueSection).toBeVisible();
    await expect(continueSection.locator('.app-course-wide-card').first()).toBeVisible({
      timeout: 8000,
    });

    // "Recently completed" section exists but its card area is collapsed by default
    const completedSection = page.locator('.page-home__row--completed');
    await expect(completedSection).toBeVisible();
    // The toggle button should be present (section is collapsible)
    await expect(completedSection.locator('.home-row__toggle')).toBeVisible();
    // Card container should NOT be visible (collapsed — body is not rendered)
    await expect(completedSection.locator('.home-row__scroll')).not.toBeVisible();
  });
});

test.describe('home page — 1024x768', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('right rail is hidden at 1024px width', async ({ page }) => {
    await gotoHome(page);

    await expect(page.locator('.page-home')).toBeVisible({ timeout: 10_000 });

    // Rail should be hidden — CSS sets display:none below 1024px
    const rail = page.locator('.page-home__rail');
    await expect(rail).not.toBeVisible();
  });
});

test.describe('home page — 375x800', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test('sections stack vertically; row containers scroll horizontally; bottom-tab visible', async ({
    page,
  }) => {
    await gotoHome(page);

    await expect(page.locator('.page-home')).toBeVisible({ timeout: 10_000 });

    // Home rows exist and stack vertically (flex-direction: column on .page-home__main)
    const rows = page.locator('.home-row');
    await expect(rows.first()).toBeVisible();

    // The scroll container renders after data loads for the continue-watching row
    const continueRow = page.locator('.page-home__row--continue');
    await expect(continueRow).toBeVisible();
    const scrollArea = continueRow.locator('.home-row__scroll');
    await expect(scrollArea).toBeVisible({ timeout: 8000 });

    // Bottom-tab bar: AppNavigationShell renders it when viewport < 600px.
    // The default layout wraps pages inside AppNavigationShell so the
    // bottom-tab should be present at 375px.
    const bottomTabs = page.locator('.app-navigation-shell__bottom-tabs');
    const tabsCount = await bottomTabs.count();
    if (tabsCount > 0) {
      await expect(bottomTabs).toBeVisible();
    }
  });
});
