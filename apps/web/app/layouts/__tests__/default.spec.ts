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
 *  - Shell visibility gates on the bearer token, not the hydrated profile
 *    (#602) — a live token with no confirmed session yet must still render
 *    the shell, or a transient 429/5xx on get-session makes the whole nav
 *    vanish even though `auth.global.ts` deliberately keeps the user signed
 *    in through it (#581).
 */

import { describe, it, expect, vi } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';

// ── Nuxt auto-imports ──────────────────────────────────────────────────────
const setLocaleMock = vi.fn();
vi.stubGlobal('useI18n', () => ({
  t: (key: string) => key,
  locale: { value: 'en' },
  locales: {
    value: [
      { code: 'en', name: 'English' },
      { code: 'ru', name: 'Русский' },
    ],
  },
  setLocale: setLocaleMock,
}));
const navigateToMock = vi.fn();
vi.stubGlobal('navigateTo', navigateToMock);

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
// Independent of `authUser` on purpose — the degraded-session test (#602)
// needs a live token with a still-null profile.
let authToken: string | null = 'token-123';
vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({
    isAuthenticated: authUser !== null,
    user: authUser,
    token: authToken,
    signOut: vi.fn(),
  }),
}));

// ── @app/ui stub — exposes the props under test as plain text nodes ────────
vi.mock('@app/ui', () => ({
  AppNavigationShell: {
    name: 'AppNavigationShell',
    props: ['activeRoute', 'nav', 'adminNav', 'user', 'colorMode', 'otherLocale'],
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
  // Explicitly imported (not auto-resolved by tag name), so it needs its own
  // stub — the command palette itself is covered by its own colocated spec.
  AppCommandPalette: {
    name: 'AppCommandPalette',
    props: ['open', 'commands'],
    template: '<div />',
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

  it('renders the shell on a live token even when the profile has not hydrated yet (#602)', async () => {
    routePath = '/';
    authUser = null;
    authToken = 'token-123';
    const w = await mountDefaultLayout();
    expect(w.find('[data-testid="active-route"]').exists()).toBe(true);
    expect(w.find('.default-layout-bare').exists()).toBe(false);
  });

  it('falls back to the bare slot when there is no token at all', async () => {
    routePath = '/';
    authUser = null;
    authToken = null;
    const w = await mountDefaultLayout();
    expect(w.find('[data-testid="active-route"]').exists()).toBe(false);
    expect(w.find('.default-layout-bare').exists()).toBe(true);
  });

  it('passes the other configured locale to the shell for the language toggle (#607)', async () => {
    routePath = '/';
    authUser = { displayName: 'Admin User', role: 'admin' };
    authToken = 'token-123';
    const w = await mountDefaultLayout();
    const shell = w.getComponent({ name: 'AppNavigationShell' });
    expect(shell.props('otherLocale')).toEqual({ code: 'ru', name: 'Русский' });
  });

  it('Ctrl+K opens the command palette (#607)', async () => {
    routePath = '/';
    authUser = { displayName: 'Admin User', role: 'admin' };
    authToken = 'token-123';
    const w = await mountDefaultLayout();
    const palette = w.getComponent({ name: 'AppCommandPalette' });
    expect(palette.props('open')).toBe(false);

    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    await w.vm.$nextTick();

    expect(w.getComponent({ name: 'AppCommandPalette' }).props('open')).toBe(true);
  });

  it('selecting a nav command navigates to its route', async () => {
    routePath = '/';
    authUser = { displayName: 'Admin User', role: 'admin' };
    authToken = 'token-123';
    navigateToMock.mockClear();
    const w = await mountDefaultLayout();
    const palette = w.getComponent({ name: 'AppCommandPalette' });
    const homeCommand = (palette.props('commands') as { id: string; to?: string }[]).find(
      (c) => c.id === 'nav-home',
    );
    expect(homeCommand?.to).toBe('/');

    await palette.vm.$emit('select', homeCommand);
    expect(navigateToMock).toHaveBeenCalledWith('/');
  });
});
