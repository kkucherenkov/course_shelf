/**
 * Spec for apps/web/app/layouts/default.vue
 *
 * Covers the three pieces of wiring that live in this file rather than in
 * `AppNavigationShell` itself:
 *  - `activeRoute` must resolve `/settings` to a key no nav item matches
 *    (not fall through to 'home' and light up the wrong tab).
 *  - `shellUser.roleLabel` must be the translated word, not embed the raw
 *    role enum.
 *  - `shellColorMode` must surface the "system" preference as-is instead of
 *    resolving it away, so the topbar toggle can display/cycle through it.
 */

import { describe, it, expect, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── Nuxt auto-imports ──────────────────────────────────────────────────────
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
vi.stubGlobal('navigateTo', vi.fn());

let routePath = '/';
vi.stubGlobal('useRoute', () => ({ path: routePath, query: {} }));

let colorModePreference: 'light' | 'dark' | 'system' = 'dark';
vi.stubGlobal('useColorMode', () => ({ value: 'dark', preference: colorModePreference }));

// ── Composables / stores ────────────────────────────────────────────────────
vi.mock('~/composables/useScanLifecycle', () => ({
  useScanLifecycle: () => ({ status: { value: 'idle' } }),
}));

let authUser: { displayName?: string; role?: string } | null = {
  displayName: 'Admin User',
  role: 'admin',
};
vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: authUser !== null,
    user: authUser,
    signOut: vi.fn(),
  }),
}));

// ── @app/ui stub — exposes the props under test as plain text nodes ────────
vi.mock('@app/ui', () => ({
  AppNavigationShell: {
    name: 'AppNavigationShell',
    props: ['activeRoute', 'nav', 'adminNav', 'user', 'colorMode'],
    emits: [
      'nav',
      'update:colorMode',
      'update:searchValue',
      'searchSubmit',
      'profile',
      'settings',
      'signOut',
    ],
    template: `<div>
      <span data-testid="active-route">{{ activeRoute }}</span>
      <span data-testid="color-mode">{{ colorMode }}</span>
      <span data-testid="role-label">{{ user.roleLabel }}</span>
      <slot />
    </div>`,
  },
}));

async function mountDefaultLayout(): Promise<VueWrapper> {
  const mod = await import('../default.vue');
  return mount(mod.default, { global: { stubs: { ScanLifecycleNotifier: true } } });
}

describe('layouts/default.vue', () => {
  it('maps /settings to a key no nav item shares, instead of falling through to "home"', async () => {
    routePath = '/settings';
    const w = await mountDefaultLayout();
    const active = w.get('[data-testid="active-route"]').text();
    expect(active).toBe('settings');
    expect(active).not.toBe('home');
  });

  it('still maps "/" to "home"', async () => {
    routePath = '/';
    const w = await mountDefaultLayout();
    expect(w.get('[data-testid="active-route"]').text()).toBe('home');
  });

  it('passes a translated roleLabel, not the raw role enum', async () => {
    routePath = '/';
    authUser = { displayName: 'Admin User', role: 'admin' };
    const w = await mountDefaultLayout();
    // `t` is the identity mock above, so the rendered text is the key itself.
    expect(w.get('[data-testid="role-label"]').text()).toBe('ui.nav.roleAdmin');
  });

  it('passes through the "system" color-mode preference instead of resolving it away', async () => {
    routePath = '/';
    colorModePreference = 'system';
    const w = await mountDefaultLayout();
    expect(w.get('[data-testid="color-mode"]').text()).toBe('system');
  });
});
