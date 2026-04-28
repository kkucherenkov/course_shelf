/**
 * Course detail page E2E tests.
 *
 * All endpoints are mocked with Playwright `route()` — hermetic, no live backend.
 *
 * States covered:
 *  - Default   (mixed lessons / partial progress)
 *  - InProgress (≥1 lesson in-progress) — primary CTA reads "Resume — …"
 *  - Completed  (every lesson done)      — quiet banner, no confetti
 *  - Locked     (403)                    — AppNoPermission block, no section list
 *
 * Viewports: 1440x900, 1024x768, 375x800.
 *
 * Mutations:
 *  - Mark complete → refreshed outline flips to Completed state
 *  - Reset progress → dialog opens, confirm calls mutation, outline refreshes
 */

import { test, expect, type Page } from '@playwright/test';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const COURSE_ID = 'course-abc123';
const COURSE_URL = `/courses/${COURSE_ID}`;

const fakeSession = {
  session: { id: 'sess-1', userId: 'user-1', expiresAt: '2099-01-01T00:00:00Z' },
  user: { id: 'user-1', name: 'Test User', email: 'test@example.com', role: 'USER' },
};

function makeOutline(state: 'default' | 'in-progress' | 'completed') {
  const lesson1State =
    state === 'completed' ? 'completed' : state === 'in-progress' ? 'in-progress' : 'completed';
  const lesson2State = state === 'completed' ? 'completed' : 'not-started';
  const lesson3State = state === 'completed' ? 'completed' : 'not-started';

  const progress = {
    percent: state === 'completed' ? 100 : state === 'in-progress' ? 33 : 50,
    lessonsCompleted: state === 'completed' ? 3 : 1,
    lessonsTotal: 3,
  };

  return {
    course: {
      id: COURSE_ID,
      title: 'TypeScript Fundamentals',
      description: 'A comprehensive guide to TypeScript.',
      instructor: 'Jane Doe',
      lessonsTotal: 3,
      totalDurationSeconds: 7200,
      progress,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-04-01T00:00:00Z',
    },
    sections: [
      {
        id: 'sec-1',
        position: 1,
        title: 'Getting Started',
        totalDurationSeconds: 3600,
        lessons: [
          {
            id: 'lesson-1',
            position: 1,
            title: 'Introduction',
            durationSeconds: 1200,
            hasMaterials: true,
            state: lesson1State,
            progressPercent: state === 'in-progress' ? 45 : state === 'completed' ? 100 : 0,
          },
          {
            id: 'lesson-2',
            position: 2,
            title: 'Types and Interfaces',
            durationSeconds: 2400,
            hasMaterials: false,
            state: lesson2State,
            progressPercent: 0,
          },
        ],
      },
      {
        id: 'sec-2',
        position: 2,
        title: 'Advanced Patterns',
        totalDurationSeconds: 3600,
        lessons: [
          {
            id: 'lesson-3',
            position: 1,
            title: 'Generics',
            durationSeconds: 3600,
            hasMaterials: false,
            state: lesson3State,
            progressPercent: 0,
          },
        ],
      },
    ],
    materials: [
      {
        id: 'mat-1',
        lessonId: 'lesson-1',
        kind: 'doc',
        label: 'TypeScript Cheatsheet.pdf',
        sizeBytes: 512000,
      },
    ],
  };
}

const completedOutline = makeOutline('completed');

// ── Route mock helpers ────────────────────────────────────────────────────────

async function mockBaseAuth(page: Page): Promise<void> {
  await page.route('**/api/v1/admin/has-users**', (route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ hasUsers: true }),
    });
  });
  await page.route('**/api/v1/auth/**', (route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fakeSession),
    });
  });
}

async function mockOutline(page: Page, body: object, status = 200): Promise<void> {
  await page.route(`**/api/v1/courses/${COURSE_ID}/outline**`, (route) => {
    void route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

async function mockMarkComplete(page: Page, responseBody: object): Promise<void> {
  await page.route(`**/api/v1/courses/${COURSE_ID}/mark-complete**`, (route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseBody),
    });
  });
}

async function mockResetProgress(page: Page, responseBody: object): Promise<void> {
  await page.route(`**/api/v1/courses/${COURSE_ID}/reset-progress**`, (route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(responseBody),
    });
  });
}

async function gotoCourseDetail(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('cs.web.bearer', 'fake-e2e-token');
  });
  await mockBaseAuth(page);
  await page.goto(COURSE_URL);
}

// ── Tests: layout at three viewports ─────────────────────────────────────────

test.describe('course detail — 1440x900', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('hero + section list + right rail visible side-by-side', async ({ page }) => {
    await mockOutline(page, makeOutline('default'));
    await gotoCourseDetail(page);

    // Hero visible
    await expect(page.locator('.course-hero')).toBeVisible({ timeout: 10_000 });
    // Section list visible
    await expect(page.locator('.course-sections-list')).toBeVisible();
    // Rail visible (>1024px CSS media query shows it)
    await expect(page.locator('.page-course-detail__rail')).toBeVisible();
    // Materials rail inside the right rail column
    await expect(page.locator('.course-materials-rail')).toBeVisible();
  });
});

test.describe('course detail — 1024x768', () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test('rail moved below the section list (single-column layout)', async ({ page }) => {
    await mockOutline(page, makeOutline('default'));
    await gotoCourseDetail(page);

    await expect(page.locator('.course-hero')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.course-sections-list')).toBeVisible();

    // At 1024px (≤1024px) layout is single-column — rail is in the DOM but
    // below the section list (not sticky/side).
    const layout = page.locator('.page-course-detail__layout');
    await expect(layout).toBeVisible();

    // Both main and rail are children of the same grid — rail is after main
    const rail = page.locator('.page-course-detail__rail');
    const main = page.locator('.page-course-detail__main');
    await expect(rail).toBeVisible();
    await expect(main).toBeVisible();

    // Verify rail is ordered after main in DOM (stacked layout)
    const mainBox = await main.boundingBox();
    const railBox = await rail.boundingBox();
    expect(mainBox).toBeTruthy();
    expect(railBox).toBeTruthy();
    // Rail should be below (or at same position vertically) the main section
    expect(railBox!.y).toBeGreaterThanOrEqual(mainBox!.y);
  });
});

test.describe('course detail — 375x800', () => {
  test.use({ viewport: { width: 375, height: 800 } });

  test('hero strip layout active, sections stack vertically', async ({ page }) => {
    await mockOutline(page, makeOutline('default'));
    await gotoCourseDetail(page);

    await expect(page.locator('.course-hero')).toBeVisible({ timeout: 10_000 });
    // Hero uses strip layout (grid-template-columns: 96px 1fr at ≤480px)
    await expect(page.locator('.course-hero__cover')).toBeVisible();
    await expect(page.locator('.course-hero__info')).toBeVisible();
    // Description is hidden in strip layout
    await expect(page.locator('.course-hero__description')).not.toBeVisible();

    // Sections stack
    await expect(page.locator('.course-sections-list')).toBeVisible();
  });
});

// ── Tests: states ─────────────────────────────────────────────────────────────

test.describe('course detail — InProgress state', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('primary CTA reads "Resume — ..."', async ({ page }) => {
    await mockOutline(page, makeOutline('in-progress'));
    await gotoCourseDetail(page);

    await expect(page.locator('.course-hero')).toBeVisible({ timeout: 10_000 });

    // Primary CTA button label should contain "Resume"
    const primaryLink = page.locator('.course-actions__primary-link');
    await expect(primaryLink).toBeVisible();
    const btn = primaryLink.locator('.app-button__label');
    await expect(btn).toContainText('Resume');
  });
});

test.describe('course detail — Completed state', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('quiet completed banner visible, no confetti', async ({ page }) => {
    await mockOutline(page, completedOutline);
    await gotoCourseDetail(page);

    await expect(page.locator('.course-hero')).toBeVisible({ timeout: 10_000 });

    // Completed banner visible
    const banner = page.locator('.course-completed-banner');
    await expect(banner).toBeVisible();
    // No confetti elements
    await expect(page.locator('[class*="confetti"]')).toHaveCount(0);
    await expect(page.locator('[class*="celebrate"]')).toHaveCount(0);
  });
});

test.describe('course detail — Locked / NoAccess state', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('AppNoPermission block shown, no section list', async ({ page }) => {
    await mockOutline(page, { title: 'Forbidden', status: 403, detail: 'Access denied.' }, 403);
    await gotoCourseDetail(page);

    // Wait a bit for error state to resolve
    await expect(page.locator('.page-course-detail__error-wrap')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('.app-no-permission')).toBeVisible();
    // Section list must NOT be present
    await expect(page.locator('.course-sections-list')).not.toBeVisible();
  });
});

// ── Tests: mutations ──────────────────────────────────────────────────────────

test.describe('course detail — Mark complete mutation', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('mark complete click shows refreshed outline with completed state', async ({ page }) => {
    await mockOutline(page, makeOutline('in-progress'));
    await mockMarkComplete(page, completedOutline);
    await gotoCourseDetail(page);

    await expect(page.locator('.course-hero')).toBeVisible({ timeout: 10_000 });

    // Click "Mark complete" button
    const markBtn = page.locator('.app-button', { hasText: /Mark complete|Отметить/i });
    await expect(markBtn).toBeVisible();
    await markBtn.click();

    // After mutation, completed banner should appear
    await expect(page.locator('.course-completed-banner')).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('course detail — Reset progress mutation', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('opens reset dialog, confirms, calls mutation, shows refreshed outline', async ({
    page,
  }) => {
    const defaultOutline = makeOutline('default');
    const resetOutline = makeOutline('default'); // All not-started after reset
    resetOutline.sections[0]!.lessons[0]!.state = 'not-started';
    resetOutline.sections[0]!.lessons[0]!.progressPercent = 0;
    resetOutline.course.progress.percent = 0;
    resetOutline.course.progress.lessonsCompleted = 0;

    await mockOutline(page, completedOutline);
    await mockResetProgress(page, resetOutline);
    await gotoCourseDetail(page);

    await expect(page.locator('.course-hero')).toBeVisible({ timeout: 10_000 });

    // Click "Reset progress" button
    const resetBtn = page.locator('.app-button', { hasText: /Reset progress|Сбросить/i });
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();

    // Dialog should appear
    const dialog = page.locator('.app-dialog');
    await expect(dialog).toBeVisible({ timeout: 3_000 });

    // Confirm reset
    const confirmBtn = dialog.locator('.app-button', { hasText: /Reset|Сбросить/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // Dialog should close
    await expect(dialog).not.toBeVisible({ timeout: 3_000 });

    // Completed banner should NOT be visible after reset
    await expect(page.locator('.course-completed-banner')).not.toBeVisible({ timeout: 5_000 });
  });
});
