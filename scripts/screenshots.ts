#!/usr/bin/env node
// README screenshot capture — Playwright headless against a running web dev
// server (or the docker `web` container). Hermetic: every API/auth endpoint is
// mocked so the captures don't depend on seed data, auth flow, or backend
// availability.
//
// Usage:
//   pnpm screenshots                  # WEB_URL defaults to http://localhost:3001
//   WEB_URL=http://localhost:8080 pnpm screenshots
//
// Output:
//   docs/screenshots/home.png
//   docs/screenshots/course-detail.png
//   docs/screenshots/lesson-player.png
//   docs/screenshots/admin-dashboard.png

import { chromium, type BrowserContext, type Page } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const outDir = path.join(repo, 'docs', 'screenshots');
const baseUrl = process.env.WEB_URL ?? 'http://localhost:3001';

const VIEWPORT = { width: 1440, height: 900 } as const;

// ── Shared mock fixtures ─────────────────────────────────────────────────────

const adminSession = {
  session: { id: 'sess-1', userId: 'user-1', expiresAt: '2099-01-01T00:00:00Z' },
  user: {
    id: 'user-1',
    name: 'Demo Owner',
    email: 'owner@example.com',
    role: 'admin',
  },
};

const userSession = {
  session: { id: 'sess-1', userId: 'user-1', expiresAt: '2099-01-01T00:00:00Z' },
  user: { id: 'user-1', name: 'Demo User', email: 'demo@example.com', role: 'USER' },
};

async function mockBaseAuth(target: BrowserContext | Page, session: unknown): Promise<void> {
  await target.route('**/api/v1/admin/has-users**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ hasUsers: true }),
    }),
  );
  await target.route('**/api/v1/auth/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(session),
    }),
  );
}

function jsonRoute(body: unknown, status = 200) {
  return (route: { fulfill: (r: object) => Promise<void> }): void => {
    void route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  };
}

// ── Page-level mock helpers ──────────────────────────────────────────────────

async function mockHome(page: Page): Promise<void> {
  await page.route(
    '**/api/v1/home/continue-watching**',
    jsonRoute({
      items: [
        {
          courseId: 'cw-1',
          courseTitle: 'TypeScript Fundamentals',
          percent: 45,
          lessonsCompleted: 9,
          lessonsTotal: 20,
          lastSeenAt: '2026-05-09T10:00:00Z',
          lastSeenLessonId: 'lesson-5',
        },
        {
          courseId: 'cw-2',
          courseTitle: 'Vue 3 Deep Dive',
          percent: 30,
          lessonsCompleted: 6,
          lessonsTotal: 20,
          lastSeenAt: '2026-05-08T10:00:00Z',
          lastSeenLessonId: 'lesson-3',
        },
        {
          courseId: 'cw-3',
          courseTitle: 'NestJS in Practice',
          percent: 10,
          lessonsCompleted: 2,
          lessonsTotal: 20,
          lastSeenAt: '2026-05-07T10:00:00Z',
          lastSeenLessonId: 'lesson-1',
        },
      ],
    }),
  );
  await page.route(
    '**/api/v1/home/recently-added**',
    jsonRoute({
      items: [
        {
          courseId: 'ra-1',
          courseTitle: 'Prisma ORM Masterclass',
          lessonCount: 15,
          totalDurationSeconds: 7200,
          createdAt: '2026-05-09T08:00:00Z',
        },
        {
          courseId: 'ra-2',
          courseTitle: 'Docker from Zero',
          lessonCount: 12,
          totalDurationSeconds: 5400,
          createdAt: '2026-05-08T08:00:00Z',
        },
        {
          courseId: 'ra-3',
          courseTitle: 'Tailwind v4 Patterns',
          lessonCount: 9,
          totalDurationSeconds: 3600,
          createdAt: '2026-05-07T08:00:00Z',
        },
      ],
    }),
  );
  await page.route(
    '**/api/v1/home/recently-completed**',
    jsonRoute({
      items: [
        {
          courseId: 'rc-1',
          courseTitle: 'JavaScript Fundamentals',
          lessonsTotal: 18,
          completedAt: '2026-04-15T15:00:00Z',
        },
      ],
    }),
  );
  await page.route(
    '**/api/v1/home/your-week**',
    jsonRoute({
      minutesWatched: 142,
      lessonsCompleted: 7,
      range: { from: '2026-05-04T00:00:00Z', to: '2026-05-11T00:00:00Z' },
    }),
  );
}

const COURSE_ID = 'demo-typescript-fundamentals';
const LESSON_ID = 'demo-lesson-intro';
const NEXT_LESSON_ID = 'demo-lesson-types';

function makeOutline(state: 'default' | 'in-progress') {
  const inProgress = state === 'in-progress';
  return {
    course: {
      id: COURSE_ID,
      title: 'TypeScript Fundamentals',
      description:
        'A guided tour through type-safe JavaScript: structural typing, generics, narrowing, and the patterns Vue and React teams use in production.',
      instructor: 'Jane Doe',
      lessonsTotal: 3,
      totalDurationSeconds: 7200,
      progress: {
        percent: inProgress ? 33 : 50,
        lessonsCompleted: 1,
        lessonsTotal: 3,
      },
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
            id: LESSON_ID,
            position: 1,
            title: 'Why TypeScript?',
            durationSeconds: 1200,
            hasMaterials: true,
            state: 'completed',
            progressPercent: 100,
          },
          {
            id: NEXT_LESSON_ID,
            position: 2,
            title: 'Types and Interfaces',
            durationSeconds: 2400,
            hasMaterials: false,
            state: inProgress ? 'in-progress' : 'not-started',
            progressPercent: inProgress ? 45 : 0,
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
            title: 'Generics in Practice',
            durationSeconds: 3600,
            hasMaterials: false,
            state: 'not-started',
            progressPercent: 0,
          },
        ],
      },
    ],
    materials: [
      {
        id: 'mat-1',
        lessonId: LESSON_ID,
        sectionId: 'sec-1',
        sectionTitle: 'Getting Started',
        kind: 'doc',
        label: 'TypeScript Cheatsheet.pdf',
        sizeBytes: 512_000,
      },
      {
        id: 'mat-2',
        lessonId: LESSON_ID,
        sectionId: 'sec-1',
        sectionTitle: 'Getting Started',
        kind: 'note',
        label: 'Generics: warm-up exercises',
        sizeBytes: 24_000,
      },
      {
        id: 'mat-3',
        lessonId: 'lesson-3',
        sectionId: 'sec-2',
        sectionTitle: 'Advanced Patterns',
        kind: 'slide',
        label: 'Module 2 slides.pdf',
        sizeBytes: 1_280_000,
      },
    ],
  };
}

async function mockCourseDetail(page: Page): Promise<void> {
  await page.route(`**/api/v1/courses/${COURSE_ID}/outline**`, jsonRoute(makeOutline('default')));
}

async function mockLessonPlayer(page: Page): Promise<void> {
  // Minimal MP4 stub the browser will accept but won't actually play.
  const STUB_VIDEO_URI =
    'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAAhtZGF0';

  await page.route(
    `**/api/v1/courses/${COURSE_ID}/outline**`,
    jsonRoute(makeOutline('in-progress')),
  );
  await page.route(
    `**/api/v1/lessons/${LESSON_ID}`,
    jsonRoute({
      id: LESSON_ID,
      courseId: COURSE_ID,
      sectionId: 'sec-1',
      position: 1,
      title: 'Why TypeScript?',
      durationSeconds: 1200,
      materials: [],
      subtitles: [],
      progress: { percent: 32, completed: false, lastSeenAtSeconds: 384 },
    }),
  );
  await page.route(
    `**/api/v1/lessons/${LESSON_ID}/stream-url**`,
    jsonRoute({
      url: STUB_VIDEO_URI,
      token: 'stub-token',
      expiresAt: '2099-01-01T00:00:00Z',
    }),
  );
  await page.route(
    `**/api/v1/lessons/${LESSON_ID}/bookmarks**`,
    jsonRoute({
      items: [
        { id: 'bm-1', positionSeconds: 64, note: 'Structural typing intro' },
        { id: 'bm-2', positionSeconds: 240, note: 'Narrowing example' },
      ],
    }),
  );
  await page.route(
    '**/api/v1/progress**',
    jsonRoute({
      lessonId: LESSON_ID,
      positionSeconds: 384,
      durationSeconds: 1200,
      percent: 32,
      completed: false,
      lastSeenAt: new Date().toISOString(),
    }),
  );
}

async function mockAdminDashboard(page: Page): Promise<void> {
  await page.route(
    '**/api/v1/admin/dashboard**',
    jsonRoute({
      generatedAt: '2026-05-11T09:00:00Z',
      counts: { libraries: 4, users: 27, courses: 132, lessons: 1840 },
      latestScan: {
        scanId: 'scan-01HX-demo-001',
        libraryId: 'lib-01HX-demo-coursera',
        status: 'succeeded',
        startedAt: '2026-05-11T08:42:00Z',
        finishedAt: '2026-05-11T08:46:21Z',
        filesScanned: 312,
        errorsCount: 0,
      },
      errorsLast24h: 2,
    }),
  );
  await page.route(
    '**/api/v1/admin/scans**',
    jsonRoute({
      items: [
        {
          scanId: 'scan-01HX-demo-001',
          libraryId: 'lib-01HX-demo-coursera',
          libraryName: 'Coursera archive',
          status: 'succeeded',
          startedAt: '2026-05-11T08:42:00Z',
          finishedAt: '2026-05-11T08:46:21Z',
          filesScanned: 312,
          coursesAdded: 4,
          errorsCount: 0,
        },
        {
          scanId: 'scan-01HX-demo-002',
          libraryId: 'lib-01HX-demo-frontend-masters',
          libraryName: 'Frontend Masters',
          status: 'succeeded',
          startedAt: '2026-05-11T07:10:00Z',
          finishedAt: '2026-05-11T07:14:08Z',
          filesScanned: 188,
          coursesAdded: 2,
          errorsCount: 0,
        },
        {
          scanId: 'scan-01HX-demo-003',
          libraryId: 'lib-01HX-demo-egghead',
          libraryName: 'Egghead.io',
          status: 'failed',
          startedAt: '2026-05-10T22:01:00Z',
          finishedAt: '2026-05-10T22:01:18Z',
          filesScanned: 9,
          coursesAdded: 0,
          errorsCount: 2,
        },
        {
          scanId: 'scan-01HX-demo-004',
          libraryId: 'lib-01HX-demo-talks',
          libraryName: 'Conference talks',
          status: 'running',
          startedAt: '2026-05-11T09:00:00Z',
          finishedAt: null,
          filesScanned: 41,
          coursesAdded: 0,
          errorsCount: 0,
        },
      ],
    }),
  );
}

// ── Capture plan ─────────────────────────────────────────────────────────────

interface Capture {
  name: string;
  url: string;
  session: unknown;
  mocks: (page: Page) => Promise<void>;
  waitFor: string;
  /** Extra ms to let CSS transitions / skeletons settle before snapshot. */
  settleMs: number;
}

const captures: Capture[] = [
  {
    name: 'home',
    url: '/',
    session: userSession,
    mocks: mockHome,
    waitFor: '.page-home .app-course-wide-card',
    settleMs: 600,
  },
  {
    name: 'course-detail',
    url: `/courses/${COURSE_ID}`,
    session: userSession,
    mocks: mockCourseDetail,
    waitFor: '.course-sections-list',
    settleMs: 600,
  },
  {
    name: 'lesson-player',
    url: `/courses/${COURSE_ID}/lessons/${LESSON_ID}`,
    session: userSession,
    mocks: mockLessonPlayer,
    waitFor: '.app-player-chrome',
    settleMs: 800,
  },
  {
    name: 'admin-dashboard',
    url: '/admin',
    session: adminSession,
    mocks: mockAdminDashboard,
    waitFor: '.adm-dashboard__grid',
    settleMs: 500,
  },
];

// ── Driver ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  try {
    for (const cap of captures) {
      const ctx = await browser.newContext({
        viewport: VIEWPORT,
        colorScheme: 'light',
        baseURL: baseUrl,
      });

      await ctx.addInitScript(() => {
        localStorage.setItem('cs.web.bearer', 'demo-bearer-token');

        // The lesson player feeds a stub MP4 data URI into <video>, which
        // browsers reject as malformed — the player's `error` listener then
        // flips the chrome into its "Could not load" overlay. For pixel-only
        // captures we just need the chrome to stay in its idle/play state,
        // so drop `error` listeners on HTMLMediaElement entirely.
        const origAddListener = HTMLMediaElement.prototype.addEventListener;
        HTMLMediaElement.prototype.addEventListener = function (
          type: string,
          listener: EventListenerOrEventListenerObject,
          options?: boolean | AddEventListenerOptions,
        ): void {
          if (type === 'error') return;
          // eslint-disable-next-line prefer-rest-params
          return origAddListener.call(this, type, listener, options);
        } as typeof HTMLMediaElement.prototype.addEventListener;
      });

      await mockBaseAuth(ctx, cap.session);
      const page = await ctx.newPage();
      await cap.mocks(page);

      const target = new URL(cap.url, baseUrl).toString();
      process.stdout.write(`→ ${cap.name.padEnd(18)} ${target} ... `);

      await page.goto(target, { waitUntil: 'networkidle' });
      await page.waitForSelector(cap.waitFor, { timeout: 15_000, state: 'visible' });
      await page.waitForTimeout(cap.settleMs);

      const outPath = path.join(outDir, `${cap.name}.png`);
      await page.screenshot({ path: outPath, fullPage: false });
      process.stdout.write(`saved ${path.relative(repo, outPath)}\n`);

      await ctx.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
