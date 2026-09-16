/**
 * Spec for pages/libraries.vue (#595).
 *
 * The generic redirect behaviour of the `admin` middleware itself is already
 * covered by `admin-middleware.spec.ts` (mirroring `course-edit.spec.ts`'s
 * own note); what this spec adds is that *this* page actually requests that
 * middleware. Before this fix a granted-but-non-admin learner could land
 * here and see a rootPath/rescan UI where every action 403s.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

let capturedMeta: Record<string, unknown> | undefined;
vi.stubGlobal('definePageMeta', (meta: Record<string, unknown>) => {
  capturedMeta = meta;
});
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));

vi.mock('~/composables/useLibraries', () => ({
  useLibraries: () => ({
    data: ref({ items: [] }),
    status: ref('success'),
    error: ref(null),
    register: vi.fn(),
    registerErrorDetail: ref(null),
  }),
}));

vi.mock('@app/ui', () => ({
  AppBanner: { name: 'AppBanner', template: '<div />' },
  AppButton: { name: 'AppButton', template: '<button />' },
  AppEmptyState: { name: 'AppEmptyState', template: '<div class="app-empty-state" />' },
  AppField: { name: 'AppField', template: '<div><slot :id="id" /></div>', props: ['id'] },
  AppInput: { name: 'AppInput', template: '<input />' },
}));

vi.mock('~/components/libraries/LibraryRow.vue', () => ({
  default: { name: 'LibraryRow', props: ['library'], template: '<div />' },
}));

async function mountPage() {
  const mod = await import('../libraries.vue');
  return mount(mod.default);
}

describe('pages/libraries.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedMeta = undefined;
  });

  it('requests the admin middleware — the real guard, not just hidden UI', async () => {
    await mountPage();
    expect(capturedMeta?.middleware).toBe('admin');
  });
});
