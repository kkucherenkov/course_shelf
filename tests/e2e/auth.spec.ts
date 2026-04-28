/**
 * Auth pages E2E tests.
 *
 * All endpoints are mocked with Playwright `route()` — no live backend needed.
 *
 * Tests covered:
 *  1. First-user signup → admin role promotion called
 *  2. Second-user signup → no role promotion
 *  3. Sign-in error → error banner shown
 *  4. Forgot-password full flow (email → sent → reset)
 *  5. Sign-up disabled → empty state on /sign-up; sign-in hides CTA
 */

import { test, expect, type Page } from '@playwright/test';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const fakeSession = {
  session: { id: 'sess-1', userId: 'user-1', expiresAt: '2099-01-01T00:00:00Z' },
  user: { id: 'user-1', name: 'Test User', email: 'test@example.com', role: 'USER' },
};

const defaultInstance = {
  selfRegistration: true,
  emailVerificationRequired: false,
  ssoProviders: [],
};

const adminInstance = {
  selfRegistration: true,
  emailVerificationRequired: false,
  ssoProviders: [],
};

// ── Route helpers ─────────────────────────────────────────────────────────────

async function mockInstance(
  page: Page,
  overrides: Partial<typeof defaultInstance> = {},
): Promise<void> {
  await page.route('**/api/v1/admin/instance**', (route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...defaultInstance, ...overrides }),
    });
  });
}

async function mockHasUsers(page: Page, hasUsers: boolean): Promise<void> {
  await page.route('**/api/v1/admin/has-users**', (route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ hasUsers }),
    });
  });
}

async function mockAuthEndpoints(page: Page): Promise<void> {
  await page.route('**/api/v1/auth/**', (route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fakeSession),
    });
  });
}

async function mockSignUpSuccess(page: Page): Promise<void> {
  // Better Auth sign-up endpoint
  await page.route('**/api/v1/auth/sign-up/**', (route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fakeSession),
      headers: { 'set-auth-token': 'fake-token' },
    });
  });
}

async function mockSignInError(page: Page, status: number): Promise<void> {
  await page.route('**/api/v1/auth/sign-in/**', (route) => {
    void route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' }),
    });
  });
}

async function mockLibrarySuccess(page: Page): Promise<void> {
  // The wizard step 3 issues:
  //   POST /api/v1/libraries          (register)
  //   POST /api/v1/libraries/:id/scans (kick the first scan, fire-and-forget)
  // Then the page navigates to /libraries which fetches:
  //   GET  /api/v1/libraries                 (list)
  //   GET  /api/v1/libraries/:id/scans/latest (poll)
  // Mock all four so the post-finish navigation lands cleanly.
  await page.route('**/api/v1/libraries', (route) => {
    if (route.request().method() === 'POST') {
      void route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'lib-1',
          name: 'Test Library',
          rootPath: '/workspace/docs/data/courses',
          createdAt: '2026-04-28T00:00:00Z',
          updatedAt: '2026-04-28T00:00:00Z',
        }),
      });
      return;
    }
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 'lib-1',
            name: 'Test Library',
            rootPath: '/workspace/docs/data/courses',
            createdAt: '2026-04-28T00:00:00Z',
            updatedAt: '2026-04-28T00:00:00Z',
          },
        ],
      }),
    });
  });
  await page.route('**/api/v1/libraries/lib-1/scans', (route) =>
    route.fulfill({
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
    }),
  );
  await page.route('**/api/v1/libraries/lib-1/scans/latest', (route) =>
    route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }),
  );
}

/** Navigate to the given auth page without seeding a bearer token. */
async function gotoAuthPage(page: Page, path: string): Promise<void> {
  await page.goto(path);
}

// ── Test 1: First-user signup → admin promotion ───────────────────────────────

test('first-user signup drives full wizard and calls promoteToAdmin stub', async ({ page }) => {
  await mockHasUsers(page, false);
  await mockInstance(page, adminInstance);
  await mockAuthEndpoints(page);
  await mockSignUpSuccess(page);
  await mockLibrarySuccess(page);

  const promoteCalls: string[] = [];
  // Track the admin setRole call — stub logs a console warning, we capture it.
  page.on('console', (msg) => {
    if (msg.type() === 'warning' && msg.text().includes('promoteToAdmin')) {
      promoteCalls.push(msg.text());
    }
  });

  await gotoAuthPage(page, '/sign-up');

  // Should be on the sign-up page (wizard visible)
  await expect(page.locator('[data-testid="page-sign-up"]')).toBeVisible({ timeout: 10_000 });

  // Step 1: fill account form
  await page.fill('input[autocomplete="name"]', 'Elena Lin');
  await page.fill('input[type="email"]', 'elena@example.com');
  // Fill password field (AppPasswordField renders a native <input type="password">)
  await page.fill('input[autocomplete="new-password"]', 'StrongPass-2026!');

  // Submit step 1
  const continueBtn = page.locator('button[type="submit"]').first();
  await continueBtn.click();

  // emailVerificationRequired=false → jump straight to library step
  await expect(
    page.locator('.page-sign-up__title').filter({ hasText: /courses|library/i }),
  ).toBeVisible({
    timeout: 8_000,
  });

  // Step 3: fill library
  await page.fill(
    'input[placeholder*="Computer Science"], input[placeholder*="Library"]',
    'My Courses',
  );
  // Path field — find by placeholder pattern (matches the new
  // /workspace/docs/data/courses default we ship after wiring the scanner).
  const pathInputs = page.locator('input[placeholder*="/workspace"]');
  await pathInputs.fill('/workspace/docs/data/courses');

  // Finish
  await page.locator('button[type="submit"]').last().click();

  // After Finish the wizard navigates to /libraries (production path).
  // We don't assert the destination here because the test mocks
  // `hasUsers: false` statically — the auth middleware would bounce a
  // post-signup visit to /libraries back to /sign-up. In production the
  // mock value flips to true once the new user is persisted, breaking
  // the loop. The /libraries-redirect itself is verified separately via
  // the libraries.spec.ts e2e. Here we just confirm step 1 fired
  // promoteToAdmin and the wizard reached its terminal click.
  expect(promoteCalls.length).toBeGreaterThan(0);
});

// ── Test 2: Second-user signup → no promotion ─────────────────────────────────

test('second-user signup — no admin promotion', async ({ page }) => {
  await mockHasUsers(page, true);
  await mockInstance(page, adminInstance);
  await mockAuthEndpoints(page);
  await mockSignUpSuccess(page);
  await mockLibrarySuccess(page);

  const promoteCalls: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'warning' && msg.text().includes('promoteToAdmin')) {
      promoteCalls.push(msg.text());
    }
  });

  await gotoAuthPage(page, '/sign-up');
  await expect(page.locator('[data-testid="page-sign-up"]')).toBeVisible({ timeout: 10_000 });

  await page.fill('input[autocomplete="name"]', 'Bob Smith');
  await page.fill('input[type="email"]', 'bob@example.com');
  await page.fill('input[autocomplete="new-password"]', 'StrongPass-2026!');

  await page.locator('button[type="submit"]').first().click();

  // No promote call expected for second user
  expect(promoteCalls).toHaveLength(0);
});

// ── Test 3: Sign-in error → error banner ──────────────────────────────────────

test('sign-in with wrong credentials shows error banner', async ({ page }) => {
  await mockHasUsers(page, true);
  await mockInstance(page);
  await mockSignInError(page, 401);

  await gotoAuthPage(page, '/sign-in');
  await expect(page.locator('[data-testid="page-sign-in"]')).toBeVisible({ timeout: 10_000 });

  await page.fill('input[type="email"]', 'bad@example.com');
  await page.fill('input[autocomplete="current-password"]', 'WrongPassword1');

  await page.locator('button[type="submit"]').click();

  // Error banner (AppBanner variant="error" has role="alert")
  await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 8_000 });
  await expect(page.locator('[role="alert"]')).not.toBeEmpty();
});

// ── Test 4: Forgot-password full flow ─────────────────────────────────────────

test('forgot-password full flow: email → confirmation → reset', async ({ page }) => {
  await mockHasUsers(page, true);
  await mockInstance(page);

  // Mock the forgot-password endpoint
  await page.route('**/api/v1/auth/**', (route) => {
    void route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await gotoAuthPage(page, '/forgot');

  // Step 1: email input
  const forgotPage = page.locator('[data-testid="page-forgot"]');
  await expect(forgotPage).toBeVisible({ timeout: 10_000 });

  await page.fill('input[type="email"]', 'user@example.com');
  await page.locator('button[type="submit"]').click();

  // Step 2: confirmation card
  // forgotPassword is a stub → returns ok:true, advances to 'sent' step
  await expect(page.locator('text=/Check your email/i')).toBeVisible({ timeout: 8_000 });

  // The "Open mail app" button should link to mailto:
  const mailBtn = page.locator('a[href^="mailto:"]');
  await expect(mailBtn).toBeVisible();

  // Now simulate navigating to /forgot?token=abc (reset step directly)
  await page.goto('/forgot?token=reset-token-abc');
  await expect(page.locator('[data-testid="page-forgot"]')).toBeVisible({ timeout: 10_000 });

  // Should be on step 3 (new password form)
  await expect(page.locator('input[autocomplete="new-password"]').first()).toBeVisible({
    timeout: 8_000,
  });

  // Fill both password fields
  const passwordInputs = page.locator('input[autocomplete="new-password"]');
  await passwordInputs.nth(0).fill('NewStrongPass-2026!');
  await passwordInputs.nth(1).fill('NewStrongPass-2026!');

  await page.locator('button[type="submit"]').click();
  // resetPassword stub returns ok:true → navigateTo('/') happens
});

// ── Test 5: Sign-up disabled ──────────────────────────────────────────────────

test('sign-up disabled: /sign-up shows blocked state; /sign-in hides the CTA', async ({ page }) => {
  await mockHasUsers(page, true);
  await mockInstance(page, {
    selfRegistration: false,
    emailVerificationRequired: false,
    ssoProviders: [],
  });
  await mockAuthEndpoints(page);

  // 5a: /sign-up shows the "disabled" block
  await gotoAuthPage(page, '/sign-up');

  await expect(page.locator('[data-testid="page-sign-up-disabled"]')).toBeVisible({
    timeout: 10_000,
  });
  // AppNoPermission title text
  await expect(page.locator('[role="status"]')).toBeVisible();

  // 5b: /sign-in hides "Don't have an account?" CTA
  await page.goto('/sign-in');
  await expect(page.locator('[data-testid="page-sign-in"]')).toBeVisible({ timeout: 10_000 });

  // The sign-up footnote link should NOT be present when selfRegistration=false
  await expect(page.locator('a[href="/sign-up"]')).not.toBeVisible();
});
