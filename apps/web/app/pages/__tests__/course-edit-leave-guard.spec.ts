/**
 * Spec for the unsaved-changes leave guard on pages/courses/[id]/edit.vue
 * (#570).
 *
 * Before this guard, an admin could leave the 14-field metadata form via the
 * header "Back to course" link, the footer "Cancel" button, or any sidebar
 * nav item, with no warning that in-progress edits would be lost — the form
 * itself only ever showed a passive "You have unsaved changes" line. This
 * covers the guard's decision logic: it reads `CourseMetadataForm`'s exposed
 * `hasChanges` and only blocks navigation (via a confirm dialog) when it's
 * true.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, nextTick, onMounted, onUnmounted } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';
import type { CourseDto } from '@app/api-client-ts';

// ── Nuxt auto-imports ──────────────────────────────────────────────────────
vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
vi.stubGlobal('useRoute', () => ({ params: { id: 'course-1' } }));
vi.stubGlobal('useToast', () => ({ add: vi.fn() }));
vi.stubGlobal('navigateTo', vi.fn());
vi.stubGlobal('onMounted', onMounted);
vi.stubGlobal('onUnmounted', onUnmounted);

// ── vue-router — capture the guard instead of running a real router ────────
type LeaveGuard = () => boolean | Promise<boolean>;
let leaveGuard: LeaveGuard | undefined;
vi.mock('vue-router', () => ({
  onBeforeRouteLeave: (guard: LeaveGuard) => {
    leaveGuard = guard;
  },
}));

// ── useCourseEdit ────────────────────────────────────────────────────────────
const dataRef = ref<CourseDto | undefined>(undefined);
vi.mock('~/composables/useCourseEdit', () => ({
  useCourseEdit: () => ({
    data: dataRef,
    status: ref('success'),
    errorStatus: ref(null),
    refetch: vi.fn(),
    saving: ref(false),
    save: vi.fn(),
  }),
}));

// ── CourseMetadataForm — a minimal double exposing a controllable `hasChanges` ──
const dirty = ref(false);
vi.mock('~/components/course-edit/CourseMetadataForm.vue', () => ({
  default: {
    name: 'CourseMetadataForm',
    props: ['course', 'saving'],
    emits: ['submit', 'cancel'],
    template: '<div />',
    setup(_props: unknown, { expose }: { expose: (exposed: object) => void }) {
      expose({ hasChanges: dirty });
    },
  },
}));

vi.mock('@app/ui', () => ({
  AppBanner: { name: 'AppBanner', template: '<div />' },
  AppButton: {
    name: 'AppButton',
    props: ['label', 'variant', 'to'],
    emits: ['click'],
    template: '<button @click="$emit(\'click\')">{{ label }}</button>',
  },
  AppSkeleton: { name: 'AppSkeleton', template: '<span />' },
  AppDialog: {
    name: 'AppDialog',
    props: ['open', 'size', 'title', 'description'],
    emits: ['update:open'],
    template: '<div v-if="open" class="dialog"><slot name="footer" /></div>',
  },
}));

function makeCourse(): CourseDto {
  return {
    id: 'course-1',
    libraryId: 'lib-1',
    slug: 'course',
    title: 'Course',
    sections: [],
    progress: { percent: 0, lessonsCompleted: 0, lessonsTotal: 0 },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };
}

async function mountPage(): Promise<VueWrapper> {
  const mod = await import('../courses/[id]/edit.vue');
  return mount(mod.default);
}

describe('pages/courses/[id]/edit.vue — leave guard (#570)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dataRef.value = makeCourse();
    dirty.value = false;
    leaveGuard = undefined;
  });

  it('has no header "Back to course" link — the footer Cancel is the one exit control', async () => {
    const wrapper = await mountPage();
    expect(wrapper.text()).not.toContain('pages.courseEdit.back');
  });

  it('registers a route-leave guard', async () => {
    await mountPage();
    expect(leaveGuard).toBeInstanceOf(Function);
  });

  it('allows navigation straight through when nothing was edited', async () => {
    dirty.value = false;
    await mountPage();
    await expect(leaveGuard?.()).resolves.toBe(true);
  });

  it('blocks navigation and shows a confirm dialog when there are unsaved changes', async () => {
    dirty.value = true;
    const wrapper = await mountPage();

    let resolved: boolean | undefined;
    void Promise.resolve(leaveGuard?.()).then((v) => {
      resolved = v;
    });
    await nextTick();

    expect(wrapper.find('.dialog').exists()).toBe(true);
    expect(resolved).toBeUndefined(); // still pending — nothing decided yet
  });

  it('resolves the guard with true (leave) when the admin confirms discarding', async () => {
    dirty.value = true;
    const wrapper = await mountPage();

    const guardResult = leaveGuard?.();
    await nextTick();

    const [, discardBtn] = wrapper.findAll('.dialog button');
    await discardBtn?.trigger('click');

    await expect(guardResult).resolves.toBe(true);
    expect(wrapper.find('.dialog').exists()).toBe(false);
  });

  it('resolves the guard with false (stay) when the admin chooses to keep editing', async () => {
    dirty.value = true;
    const wrapper = await mountPage();

    const guardResult = leaveGuard?.();
    await nextTick();

    const [stayBtn] = wrapper.findAll('.dialog button');
    await stayBtn?.trigger('click');

    await expect(guardResult).resolves.toBe(false);
    expect(wrapper.find('.dialog').exists()).toBe(false);
  });
});
