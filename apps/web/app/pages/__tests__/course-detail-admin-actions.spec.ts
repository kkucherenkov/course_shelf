/**
 * Spec for the two admin buttons on pages/courses/[id].vue: rescan
 * (E32-F01-S02) and transcribe (E32-F02-S01).
 *
 * Scope: only those affordances — admin-only visibility, that each opens a
 * confirm dialog and only calls its endpoint once that's confirmed (#606:
 * rescan rewrites the course's section/lesson list, transcribe can occupy
 * a GPU for hours — the two most consequential admin actions on this page
 * had no confirmation while a fully reversible "Reset progress" did), and
 * that the transcribe failure path shows the server's own `detail` rather
 * than a canned sentence (the 409 names the run already in flight and how
 * to cancel it). The rest of the page (hero, sections, materials) is
 * stubbed out; it is not these cards' concern.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import type { CourseOutlineDto } from '@app/api-client-ts';

// ── Nuxt auto-imports ──────────────────────────────────────────────────────
vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
vi.stubGlobal('useRoute', () => ({ params: { id: 'course-1' }, name: 'courses-id' }));
vi.stubGlobal('useHead', () => undefined);
const toastAdd = vi.fn();
vi.stubGlobal('useToast', () => ({ add: toastAdd }));

// ── SDK mock ───────────────────────────────────────────────────────────────
const mockRunCourseRescan = vi.fn().mockResolvedValue({ data: { id: 'scan-1' }, error: undefined });
const mockStartCourseTranscription = vi
  .fn()
  .mockResolvedValue({ data: { id: 'run-1' }, error: undefined });
vi.mock('@app/api-client-ts', () => ({
  runCourseRescan: (...args: unknown[]) => mockRunCourseRescan(...args),
  startCourseTranscription: (...args: unknown[]) => mockStartCourseTranscription(...args),
  client: {},
}));

// ── Composables ────────────────────────────────────────────────────────────
const outlineData = ref<CourseOutlineDto | undefined>(undefined);
vi.mock('~/composables/useCourseOutline', () => ({
  useCourseOutline: () => ({
    data: outlineData,
    status: ref('success'),
    errorStatus: ref(null),
    refetch: vi.fn(),
    markComplete: vi.fn(),
    resetProgress: vi.fn(),
    mutating: ref(false),
  }),
}));
vi.mock('~/composables/useMaterialDownload', () => ({
  useMaterialDownload: () => ({ download: vi.fn() }),
}));
// Resume-lesson sourcing from continue-watching is covered by
// course-detail-resume-lesson.spec.ts — this file only needs it not to hit
// the real `useAsyncData` (a Nuxt auto-import unavailable in this harness).
vi.mock('~/composables/useHome', () => ({
  useContinueWatching: () => ({
    data: ref(undefined),
    status: ref('success'),
    error: ref(null),
    refetch: vi.fn(),
  }),
}));

// ── Auth store ─────────────────────────────────────────────────────────────
const authUser = ref<{ role?: string } | null>(null);
vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({ user: authUser.value }),
}));

// ── @app/ui stubs ──────────────────────────────────────────────────────────
vi.mock('@app/ui', () => ({
  AppButton: {
    name: 'AppButton',
    props: ['label', 'to', 'variant', 'size', 'loading', 'iconLeading'],
    emits: ['click'],
    template: '<button @click="$emit(\'click\')">{{ label }}</button>',
  },
  AppDialog: {
    name: 'AppDialog',
    props: ['open', 'title', 'description'],
    emits: ['update:open'],
    template: '<dialog v-if="open" open><slot /><slot name="footer" /></dialog>',
  },
  AppNoPermission: { name: 'AppNoPermission', template: '<div />' },
  AppSkeleton: { name: 'AppSkeleton', template: '<div />' },
}));

function makeOutline(): CourseOutlineDto {
  return {
    course: {
      id: 'course-1',
      title: 'Course One',
      lessonsTotal: 0,
      totalDurationSeconds: 0,
      progress: { percent: 0, lessonsCompleted: 0, lessonsTotal: 0 },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    sections: [],
    materials: [],
  };
}

/** Let the click handler's promise chain settle. */
async function flush(): Promise<void> {
  for (let i = 0; i < 4; i++) await Promise.resolve();
}

/** Open the transcribe confirm dialog and click its confirm button. */
async function confirmTranscribe(wrapper: Awaited<ReturnType<typeof mountPage>>): Promise<void> {
  await wrapper.find('.page-course-detail__transcribe-cta').trigger('click');
  const confirm = wrapper
    .findAll('button')
    .find((b) => b.text() === 'pages.courseDetail.transcribeDialogConfirm');
  await confirm!.trigger('click');
}

async function mountPage() {
  const mod = await import('../courses/[id].vue');
  return mount(mod.default, {
    global: {
      stubs: {
        CourseHero: true,
        CourseActions: true,
        CourseSectionsList: true,
        CourseMaterialsRail: true,
        CourseCompletedBanner: true,
        NuxtPage: true,
      },
    },
  });
}

describe('pages/courses/[id].vue — rescan button (E32-F01-S02)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRunCourseRescan.mockResolvedValue({ data: { id: 'scan-1' }, error: undefined });
    mockStartCourseTranscription.mockResolvedValue({ data: { id: 'run-1' }, error: undefined });
    outlineData.value = makeOutline();
    authUser.value = null;
  });

  it('is absent for a non-admin', async () => {
    authUser.value = { role: 'member' };
    const wrapper = await mountPage();
    expect(wrapper.find('.page-course-detail__rescan-cta').exists()).toBe(false);
  });

  it('opens a confirm dialog on click and does not call the endpoint yet', async () => {
    authUser.value = { role: 'admin' };
    const wrapper = await mountPage();

    const button = wrapper.find('.page-course-detail__rescan-cta');
    expect(button.exists()).toBe(true);

    await button.trigger('click');

    expect(mockRunCourseRescan).not.toHaveBeenCalled();
    expect(wrapper.find('dialog').exists()).toBe(true);
  });

  it('calls POST /courses/{id}/rescan only once the dialog is confirmed', async () => {
    authUser.value = { role: 'admin' };
    const wrapper = await mountPage();

    await wrapper.find('.page-course-detail__rescan-cta').trigger('click');
    const confirm = wrapper
      .findAll('button')
      .find((b) => b.text() === 'pages.courseDetail.rescanDialogConfirm');
    expect(confirm).toBeDefined();

    await confirm!.trigger('click');
    await Promise.resolve();

    expect(mockRunCourseRescan).toHaveBeenCalledWith(
      expect.objectContaining({ path: { id: 'course-1' } }),
    );
  });
});

describe('pages/courses/[id].vue — transcribe button (E32-F02-S01)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRunCourseRescan.mockResolvedValue({ data: { id: 'scan-1' }, error: undefined });
    mockStartCourseTranscription.mockResolvedValue({ data: { id: 'run-1' }, error: undefined });
    outlineData.value = makeOutline();
    authUser.value = null;
  });

  it('is absent for a non-admin', async () => {
    authUser.value = { role: 'member' };
    const wrapper = await mountPage();
    expect(wrapper.find('.page-course-detail__transcribe-cta').exists()).toBe(false);
  });

  it('opens a confirm dialog on click and does not call the endpoint yet', async () => {
    authUser.value = { role: 'admin' };
    const wrapper = await mountPage();

    await wrapper.find('.page-course-detail__transcribe-cta').trigger('click');

    expect(mockStartCourseTranscription).not.toHaveBeenCalled();
    expect(wrapper.find('dialog').exists()).toBe(true);
  });

  it('calls POST /courses/{id}/transcription and reports success once confirmed', async () => {
    authUser.value = { role: 'admin' };
    const wrapper = await mountPage();

    await confirmTranscribe(wrapper);
    await flush();

    expect(mockStartCourseTranscription).toHaveBeenCalledWith(
      expect.objectContaining({ path: { id: 'course-1' } }),
    );
    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'pages.courseDetail.toastTranscribeStarted',
        color: 'success',
      }),
    );
  });

  it("shows the server's own detail when a run is already going", async () => {
    authUser.value = { role: 'admin' };
    mockStartCourseTranscription.mockResolvedValue({
      data: undefined,
      error: {
        title: 'Conflict',
        detail:
          'A transcription is already running for library lib-1 (run run-existing). ' +
          'Cancel it with POST /api/v1/transcriptions/run-existing/cancel before starting another.',
      },
    });

    const wrapper = await mountPage();
    await confirmTranscribe(wrapper);
    await flush();

    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining('run-existing') as unknown as string,
        color: 'error',
      }),
    );
  });
});
