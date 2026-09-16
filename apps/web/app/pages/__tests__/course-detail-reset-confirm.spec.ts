/**
 * Spec for pages/courses/[id].vue's reset-progress confirm dialog (#624).
 *
 * A previous wave removed this dialog on the claim that resetting progress
 * is "fully reversible by rewatching" (#606). That's false for a large
 * course — the audit database's biggest course has 540 lessons, and there
 * is no restore button, only a rewatch. This restores the confirm step,
 * sharing the same `AppDialog` the rescan/transcribe actions already use
 * (see course-detail-admin-actions.spec.ts for those).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount } from '@vue/test-utils';
import type { CourseOutlineDto, LessonOutlineItem } from '@app/api-client-ts';

vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
vi.stubGlobal('useRoute', () => ({ params: { id: 'course-1' }, name: 'courses-id' }));
const toastAdd = vi.fn();
vi.stubGlobal('useToast', () => ({ add: toastAdd }));

vi.mock('@app/api-client-ts', () => ({
  runCourseRescan: vi.fn(),
  startCourseTranscription: vi.fn(),
  client: {},
}));

const outlineData = ref<CourseOutlineDto | undefined>(undefined);
const resetProgress = vi.fn().mockResolvedValue(null);
vi.mock('~/composables/useCourseOutline', () => ({
  useCourseOutline: () => ({
    data: outlineData,
    status: ref('success'),
    errorStatus: ref(null),
    refetch: vi.fn(),
    markComplete: vi.fn(),
    resetProgress,
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
    template: '<dialog v-if="open" open><slot /><slot name="footer" /></dialog>',
  },
  AppNoPermission: { name: 'AppNoPermission', template: '<div />' },
  AppSkeleton: { name: 'AppSkeleton', template: '<div />' },
}));

function lesson(overrides: Partial<LessonOutlineItem> = {}): LessonOutlineItem {
  return {
    id: 'lesson-1',
    title: 'Lesson 1',
    position: 1,
    state: 'in-progress',
    durationSeconds: 60,
    ...overrides,
  } as LessonOutlineItem;
}

function makeOutline(): CourseOutlineDto {
  return {
    course: {
      id: 'course-1',
      title: 'Course One',
      lessonsTotal: 1,
      totalDurationSeconds: 60,
      progress: { percent: 50, lessonsCompleted: 0, lessonsTotal: 1 },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    sections: [{ id: 'section-1', title: 'Section 1', position: 1, lessons: [lesson()] }],
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

describe('pages/courses/[id].vue — reset progress confirm dialog (#624)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetProgress.mockResolvedValue(null);
    outlineData.value = makeOutline();
    authUser.value = { role: 'member' };
  });

  it('opens a confirm dialog on click and does not call resetProgress yet', async () => {
    const wrapper = await mountPage();

    const button = wrapper
      .findAll('button')
      .find((b) => b.text() === 'pages.courseDetail.ctaResetProgress');
    expect(button).toBeDefined();
    await button!.trigger('click');

    expect(resetProgress).not.toHaveBeenCalled();
    expect(wrapper.find('dialog').exists()).toBe(true);
  });

  it('calls resetProgress and shows a success toast only once the dialog is confirmed', async () => {
    const wrapper = await mountPage();

    const button = wrapper
      .findAll('button')
      .find((b) => b.text() === 'pages.courseDetail.ctaResetProgress');
    await button!.trigger('click');

    const confirm = wrapper
      .findAll('button')
      .find((b) => b.text() === 'pages.courseDetail.resetDialogConfirm');
    expect(confirm).toBeDefined();

    await confirm!.trigger('click');
    await flush();

    expect(resetProgress).toHaveBeenCalledTimes(1);
    expect(toastAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'pages.courseDetail.toastResetSuccess', color: 'success' }),
    );
  });

  it('does not call resetProgress when the dialog is cancelled', async () => {
    const wrapper = await mountPage();

    const button = wrapper
      .findAll('button')
      .find((b) => b.text() === 'pages.courseDetail.ctaResetProgress');
    await button!.trigger('click');

    const cancel = wrapper
      .findAll('button')
      .find((b) => b.text() === 'pages.courseDetail.adminActionDialogCancel');
    await cancel!.trigger('click');
    await flush();

    expect(resetProgress).not.toHaveBeenCalled();
    expect(wrapper.find('dialog').exists()).toBe(false);
  });
});
