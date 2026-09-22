/**
 * Spec for pages/courses/[id].vue's mark-complete confirm dialog (#783).
 *
 * "Mark complete" sat directly under the primary CTA and closed the whole
 * course — on the audit database's biggest course, 540 lessons — in one
 * click with no confirmation. Shares the same `AppDialog` the
 * rescan/transcribe/reset actions already use (see
 * course-detail-reset-confirm.spec.ts for those), and shows the number of
 * lessons the click is about to mark.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import type { CourseOutlineDto, LessonOutlineItem } from '@app/api-client-ts';

vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({
  t: (key: string, ...args: unknown[]) => {
    const opts = args.find((a) => typeof a === 'object' && a !== null) as
      | { named?: { n?: unknown } }
      | undefined;
    return opts?.named?.n === undefined ? key : `${key}:${String(opts.named.n)}`;
  },
}));
vi.stubGlobal('useRoute', () => ({ params: { id: 'course-1' }, name: 'courses-id' }));
vi.stubGlobal('useHead', () => undefined);
const toastAdd = vi.fn();
vi.stubGlobal('useToast', () => ({ add: toastAdd }));

vi.mock('@app/api-client-ts', () => ({
  runCourseRescan: vi.fn(),
  startCourseTranscription: vi.fn(),
  client: {},
}));

const outlineData = ref<CourseOutlineDto | undefined>(undefined);
const markComplete = vi.fn().mockResolvedValue(null);
vi.mock('~/composables/useCourseOutline', () => ({
  useCourseOutline: () => ({
    data: outlineData,
    status: ref('success'),
    errorStatus: ref(null),
    refetch: vi.fn(),
    markComplete,
    resetProgress: vi.fn(),
    mutating: ref(false),
  }),
}));
vi.mock('~/composables/useMaterialDownload', () => ({
  useMaterialDownload: () => ({ download: vi.fn() }),
}));
vi.mock('~/composables/useHome', () => ({
  useContinueWatching: () => ({
    data: ref(undefined),
    status: ref('success'),
    error: ref(null),
    refetch: vi.fn(),
  }),
}));

const authUser = ref<{ role?: string } | null>({ role: 'member' });
vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({ user: authUser.value }),
}));

vi.mock('@app/ui', () => ({
  AppButton: {
    name: 'AppButton',
    props: ['label', 'to', 'variant', 'size', 'loading', 'iconLeading', 'disabled'],
    emits: ['click'],
    template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
  },
  AppDialog: {
    name: 'AppDialog',
    props: ['open', 'title', 'description'],
    emits: ['update:open'],
    template: '<dialog v-if="open" open>{{ description }}<slot /><slot name="footer" /></dialog>',
  },
  AppNoPermission: { name: 'AppNoPermission', template: '<div />' },
  AppSkeleton: { name: 'AppSkeleton', template: '<div />' },
}));

function lesson(id: string, overrides: Partial<LessonOutlineItem> = {}): LessonOutlineItem {
  return {
    id,
    title: `Lesson ${id}`,
    position: 1,
    state: 'in-progress',
    durationSeconds: 60,
    ...overrides,
  } as LessonOutlineItem;
}

/** Three lessons across two sections — exercises the flattened count, not just a single-section sum. */
function makeOutline(): CourseOutlineDto {
  return {
    course: {
      id: 'course-1',
      title: 'Course One',
      lessonsTotal: 3,
      totalDurationSeconds: 180,
      progress: { percent: 33, lessonsCompleted: 1, lessonsTotal: 3 },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    sections: [
      { id: 'section-1', title: 'Section 1', position: 1, lessons: [lesson('l1'), lesson('l2')] },
      { id: 'section-2', title: 'Section 2', position: 2, lessons: [lesson('l3')] },
    ],
    materials: [],
  } as unknown as CourseOutlineDto;
}

async function flush(): Promise<void> {
  for (let i = 0; i < 4; i++) await Promise.resolve();
}

async function mountPage() {
  const mod = await import('../courses/[id].vue');
  return mount(mod.default, {
    global: {
      stubs: {
        CourseHero: true,
        CourseSectionsList: true,
        CourseMaterialsRail: true,
        CourseCompletedBanner: true,
        NuxtPage: true,
      },
    },
  });
}

describe('pages/courses/[id].vue — mark complete confirm dialog (#783)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    markComplete.mockResolvedValue(null);
    outlineData.value = makeOutline();
    authUser.value = { role: 'member' };
  });

  it('opens a confirm dialog naming the lesson count and does not call markComplete yet', async () => {
    const wrapper = await mountPage();

    const button = wrapper
      .findAll('button')
      .find((b) => b.text() === 'pages.courseDetail.ctaMarkComplete');
    expect(button).toBeDefined();
    await button!.trigger('click');

    expect(markComplete).not.toHaveBeenCalled();
    const dialog = wrapper.find('dialog');
    expect(dialog.exists()).toBe(true);
    expect(dialog.text()).toContain('pages.courseDetail.completeDialogDescription:3');
  });

  it('calls markComplete and shows a success toast only once the dialog is confirmed', async () => {
    const wrapper = await mountPage();

    const button = wrapper
      .findAll('button')
      .find((b) => b.text() === 'pages.courseDetail.ctaMarkComplete');
    await button!.trigger('click');

    const confirm = wrapper
      .findAll('button')
      .find((b) => b.text() === 'pages.courseDetail.completeDialogConfirm');
    expect(confirm).toBeDefined();

    await confirm!.trigger('click');
    await flush();

    expect(markComplete).toHaveBeenCalledTimes(1);
    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'pages.courseDetail.toastMarkCompleteSuccess',
        color: 'success',
      }),
    );
  });

  it('does not call markComplete when the dialog is cancelled', async () => {
    const wrapper = await mountPage();

    const button = wrapper
      .findAll('button')
      .find((b) => b.text() === 'pages.courseDetail.ctaMarkComplete');
    await button!.trigger('click');

    const cancel = wrapper
      .findAll('button')
      .find((b) => b.text() === 'pages.courseDetail.adminActionDialogCancel');
    await cancel!.trigger('click');
    await flush();

    expect(markComplete).not.toHaveBeenCalled();
    expect(wrapper.find('dialog').exists()).toBe(false);
  });
});
