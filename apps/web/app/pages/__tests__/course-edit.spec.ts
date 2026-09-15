/**
 * Spec for pages/courses/[id]/edit.vue (E30-F03-S01).
 *
 * The card requires the admin guard to be real, not merely hidden UI. The
 * generic redirect behaviour of the `admin` middleware itself is already
 * covered by `admin-middleware.spec.ts`; what this spec adds is that *this*
 * page actually requests that middleware, so a non-admin never reaches it.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, onMounted, onUnmounted } from 'vue';
import { mount } from '@vue/test-utils';
import type { CourseDto } from '@app/api-client-ts';

// ── Nuxt auto-imports ──────────────────────────────────────────────────────
let capturedMeta: Record<string, unknown> | undefined;
vi.stubGlobal('definePageMeta', (meta: Record<string, unknown>) => {
  capturedMeta = meta;
});
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
vi.stubGlobal('useRoute', () => ({ params: { id: 'course-1' } }));
vi.stubGlobal('useToast', () => ({ add: vi.fn() }));
vi.stubGlobal('navigateTo', vi.fn());
// edit.vue calls these lifecycle hooks bare (relies on Nuxt's auto-import at
// real app runtime); wire them to Vue's real implementations for the same
// reason `sign-up.spec.ts` does for `onUnmounted`.
vi.stubGlobal('onMounted', onMounted);
vi.stubGlobal('onUnmounted', onUnmounted);

// The leave guard itself is covered by course-edit-leave-guard.spec.ts —
// this file only needs `onBeforeRouteLeave` to not blow up outside a router.
vi.mock('vue-router', () => ({ onBeforeRouteLeave: vi.fn() }));

// ── useCourseEdit ──────────────────────────────────────────────────────────
const mockSave = vi.fn();
const dataRef = ref<CourseDto | undefined>(undefined);
const statusRef = ref<'idle' | 'pending' | 'success' | 'error'>('idle');

vi.mock('~/composables/useCourseEdit', () => ({
  useCourseEdit: () => ({
    data: dataRef,
    status: statusRef,
    errorStatus: ref(null),
    refetch: vi.fn(),
    saving: ref(false),
    save: mockSave,
  }),
}));

vi.mock('@app/ui', () => ({
  AppBanner: { name: 'AppBanner', props: ['variant', 'body'], template: '<div class="banner" />' },
  AppButton: {
    name: 'AppButton',
    props: ['label', 'to', 'variant', 'size'],
    template: '<button>{{ label }}</button>',
  },
  AppSkeleton: { name: 'AppSkeleton', props: ['width', 'height'], template: '<span />' },
  AppDialog: {
    name: 'AppDialog',
    props: ['open', 'size', 'title', 'description'],
    emits: ['update:open'],
    template: '<div v-if="open"><slot name="footer" /></div>',
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

async function mountPage() {
  const mod = await import('../courses/[id]/edit.vue');
  return mount(mod.default, {
    global: { stubs: { CourseMetadataForm: true } },
  });
}

describe('pages/courses/[id]/edit.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedMeta = undefined;
    dataRef.value = undefined;
    statusRef.value = 'idle';
  });

  it('requests the admin middleware — the real guard, not just hidden UI', async () => {
    await mountPage();
    expect(capturedMeta?.middleware).toBe('admin');
  });

  it('renders the metadata form once the course loads', async () => {
    dataRef.value = makeCourse();
    statusRef.value = 'success';
    const wrapper = await mountPage();
    expect(wrapper.findComponent({ name: 'CourseMetadataForm' }).exists()).toBe(true);
  });

  it('shows the error banner instead of the form on load failure', async () => {
    statusRef.value = 'error';
    const wrapper = await mountPage();
    expect(wrapper.find('.banner').exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'CourseMetadataForm' }).exists()).toBe(false);
  });
});
