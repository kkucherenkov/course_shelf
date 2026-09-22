/**
 * Spec for apps/web/app/error.vue (#778).
 *
 * A 404 wraps in the `default` layout when a session exists — the audit
 * found the page losing the whole shell (sidebar/search/language switch)
 * for what is usually a typo in the address bar. A fatal (non-404) error,
 * or a 404 with no session, stays standalone — see the file's doc comment
 * for why.
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
vi.stubGlobal('useHead', () => undefined);
vi.stubGlobal('clearError', vi.fn());

let authToken: string | null = 'token-123';
vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    get token() {
      return authToken;
    },
  }),
}));

vi.mock('@app/ui', () => ({
  AppButton: { name: 'AppButton', props: ['label'], template: '<button>{{ label }}</button>' },
}));

async function mountError(status: number) {
  const mod = await import('../../error.vue');
  return mount(mod.default, {
    props: { error: { status, statusCode: status } as never },
    global: {
      stubs: {
        NuxtLayout: { name: 'NuxtLayout', template: '<div class="stub-layout"><slot /></div>' },
      },
    },
  });
}

describe('error.vue', () => {
  it('wraps a 404 in the default layout when a session exists', async () => {
    authToken = 'token-123';
    const w = await mountError(404);
    expect(w.find('.stub-layout').exists()).toBe(true);
    expect(w.find('.stub-layout .app-error').exists()).toBe(true);
  });

  it('renders a bare 404 with no layout when there is no session', async () => {
    authToken = null;
    const w = await mountError(404);
    expect(w.find('.stub-layout').exists()).toBe(false);
    expect(w.find('.app-error').exists()).toBe(true);
  });

  it('renders a bare fatal error even with a live session — the shell may be part of what broke', async () => {
    authToken = 'token-123';
    const w = await mountError(500);
    expect(w.find('.stub-layout').exists()).toBe(false);
    expect(w.find('.app-error').exists()).toBe(true);
  });
});
