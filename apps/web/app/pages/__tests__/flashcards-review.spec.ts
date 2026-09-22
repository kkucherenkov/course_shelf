/**
 * Spec for apps/web/app/pages/flashcards/review.vue (#775).
 *
 * Covers the empty-state split this fix is about: "no cards yet" (never had
 * a due card this session) is a distinct message from "done for today" (had
 * some, graded through them) — the pre-fix bug was one "All caught up"
 * message claiming completion for a user who had never created a card.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

import type { FlashcardDto } from '@app/api-client-ts';
import type { RowStatus } from '~/composables/useHome';

// ── Nuxt auto-imports ────────────────────────────────────────────────────────
vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
vi.stubGlobal('useToast', () => ({ add: vi.fn() }));

// ── Composable under the page ────────────────────────────────────────────────
const queue = ref<FlashcardDto[]>([]);
const status = ref<RowStatus>('success');
const total = ref(0);
const grading = ref(false);
const gradeError = ref<Error | null>(null);
const grade = vi.fn();
const refetch = vi.fn();

vi.mock('~/composables/useFlashcards', () => ({
  useFlashcardReviewQueue: () => ({
    queue: computed(() => queue.value),
    status,
    error: ref(null),
    current: computed(() => queue.value[0] ?? null),
    total,
    grading,
    gradeError,
    grade,
    refetch,
  }),
}));

// ── @app/ui stubs ─────────────────────────────────────────────────────────────
vi.mock('@app/ui', () => ({
  AppButton: {
    name: 'AppButton',
    props: ['label', 'variant', 'size', 'to'],
    template: '<a>{{ label }}</a>',
  },
  AppEmptyState: {
    name: 'AppEmptyState',
    props: ['icon', 'title', 'body'],
    template:
      '<div class="stub-empty" :data-icon="icon">{{ title }} — {{ body }}<slot name="action" /></div>',
  },
  AppErrorState: {
    name: 'AppErrorState',
    props: ['title', 'body'],
    template: '<div class="stub-error">{{ title }}</div>',
  },
  AppSkeleton: { name: 'AppSkeleton', props: ['width', 'height', 'radius'], template: '<div />' },
  AppFlashcardReview: { name: 'AppFlashcardReview', props: [], template: '<div />' },
}));

async function mountPage(): Promise<VueWrapper> {
  const mod = await import('../flashcards/review.vue');
  return mount(mod.default);
}

describe('flashcards/review.vue — empty state split', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queue.value = [];
    status.value = 'success';
    total.value = 0;
  });

  it('shows "no cards yet" with a browse link when the queue was never non-empty', async () => {
    total.value = 0;
    const w = await mountPage();
    const empty = w.find('.stub-empty');
    expect(empty.text()).toContain('pages.flashcards.review.emptyNeverTitle');
    expect(empty.find('a').exists()).toBe(true);
  });

  it('shows "done for today" once cards existed and are now all graded', async () => {
    total.value = 5; // the first fetch had cards; the local queue emptied via grading
    queue.value = [];
    const w = await mountPage();
    const empty = w.find('.stub-empty');
    expect(empty.text()).toContain('pages.flashcards.review.emptyDoneTitle');
    expect(empty.text()).not.toContain('emptyNeverTitle');
  });

  it('shows neither empty state while a card is still due', async () => {
    total.value = 2;
    queue.value = [{ id: 'c1', lessonId: 'l1', front: 'Q', back: 'A' } as FlashcardDto];
    const w = await mountPage();
    expect(w.find('.stub-empty').exists()).toBe(false);
  });
});
