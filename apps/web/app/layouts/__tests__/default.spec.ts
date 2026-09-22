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
 *  - The primary `nav` never offers a 'libraries' entry (#618) — `/libraries`
 *    has been admin-only since #595, so the item used to dead-end every
 *    non-admin at `middleware/admin.ts`'s silent `navigateTo('/')`.
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

// The real composable calls `useAsyncData`, a Nuxt auto-import this plain
// Vitest environment doesn't provide — same reason every other composable
// call in this file is mocked rather than left real.
vi.mock('~/composables/useFlashcards', () => ({
  useFlashcardReviewQueue: () => ({
    queue: { value: [] },
    status: { value: 'success' },
  }),
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
    props: [
      'activeRoute',
      'nav',
      'adminNav',
      'user',
      'colorMode',
      'resolvedColorMode',
      'locales',
      'locale',
    ],
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
  // Session-unconfirmed banner (#777) and its retry button — covered by
  // their own tests below, stubbed minimally everywhere else.
  AppBanner: {
    name: 'AppBanner',
    props: ['variant', 'title', 'body'],
    template: '<div class="stub-banner">{{ title }}<slot name="actions" /></div>',
  },
  AppButton: {
    name: 'AppButton',
    props: ['label', 'size', 'variant', 'loading'],
    emits: ['click'],
    template: '<button @click="$emit(\'click\')">{{ label }}</button>',
  },
  // Pulled in transitively via AdminAccessGate.vue, which is not itself
  // covered by this '@app/ui' mock (it's a local component, not a barrel
  // export) — its own behaviour is AdminAccessGate.spec.ts's job.
  AppSkeleton: { name: 'AppSkeleton', props: ['width', 'height', 'radius'], template: '<div />' },
  AppNoPermission: {
    name: 'AppNoPermission',
    props: ['title', 'body'],
    template: '<div class="stub-no-permission">{{ title }}</div>',
  },
}));

async function mountDefaultLayout(options: { pageMarker?: boolean } = {}): Promise<VueWrapper> {
  const mod = await import('../default.vue');
  return mount(mod.default, {
    global: { stubs: { ScanLifecycleNotifier: true } },
    slots: options.pageMarker
      ? { default: '<div data-testid="page-content">Page</div>' }
      : undefined,
  });
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

  it('passes every configured locale, and which one is active, to the shell (#607)', async () => {
    routePath = '/';
    authUser = { displayName: 'Admin User', role: 'admin' };
    authToken = 'token-123';
    const w = await mountDefaultLayout();
    const shell = w.getComponent({ name: 'AppNavigationShell' });
    // The whole list plus the current code, not "the other one": the shell
    // renders a segmented control, and the button it replaced named the
    // language a click switched to, which read as a status label.
    expect(shell.props('locales')).toEqual([
      { code: 'en', name: 'English' },
      { code: 'ru', name: 'Русский' },
    ]);
    expect(shell.props('locale')).toBe('en');
  });

  it('hands the shell the resolved appearance, not the stored preference', async () => {
    routePath = '/';
    authUser = { displayName: 'Admin User', role: 'admin' };
    authToken = 'token-123';
    const w = await mountDefaultLayout();
    const shell = w.getComponent({ name: 'AppNavigationShell' });
    // `useColorMode().value` never reads back "system", which is exactly why
    // the binary topbar toggle needs it: it has to flip away from what is on
    // screen. `colorMode` keeps carrying the preference for Settings.
    expect(shell.props('resolvedColorMode')).toMatch(/^(light|dark)$/);
  });

  it('the command palette is not mounted until first opened (#607, no stray app-dialog)', async () => {
    routePath = '/';
    authUser = { displayName: 'Admin User', role: 'admin' };
    authToken = 'token-123';
    const w = await mountDefaultLayout();
    // Mounting it unconditionally would leave AppDialog's native
    // `<dialog class="app-dialog">` permanently in every page's DOM, even
    // closed — see `paletteMounted`'s doc comment in default.vue.
    expect(w.findComponent({ name: 'AppCommandPalette' }).exists()).toBe(false);
  });

  it('Ctrl+K mounts and opens the command palette (#607)', async () => {
    routePath = '/';
    authUser = { displayName: 'Admin User', role: 'admin' };
    authToken = 'token-123';
    const w = await mountDefaultLayout();

    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    // Two ticks: one mounts AppCommandPalette (`paletteMounted`), the next
    // flips `open` — see default.vue's `onGlobalKeydown` comment for why
    // the two are deliberately not in the same tick.
    await w.vm.$nextTick();
    await w.vm.$nextTick();

    expect(w.getComponent({ name: 'AppCommandPalette' }).props('open')).toBe(true);
  });

  it('never offers a "libraries" entry in the primary nav (#618)', async () => {
    routePath = '/';
    authUser = { displayName: 'Learner', role: 'user' };
    authToken = 'token-123';
    const w = await mountDefaultLayout();
    const shell = w.getComponent({ name: 'AppNavigationShell' });
    const nav = shell.props('nav') as { key: string }[];
    // `/libraries` has been admin-only since #595 — a primary-nav entry to
    // it dead-ends every non-admin at `middleware/admin.ts`'s silent
    // `navigateTo('/')`, and for an admin it only duplicates `admin-libraries`.
    expect(nav.some((item) => item.key === 'libraries')).toBe(false);
  });

  it('selecting a nav command navigates to its route', async () => {
    routePath = '/';
    authUser = { displayName: 'Admin User', role: 'admin' };
    authToken = 'token-123';
    navigateToMock.mockClear();
    const w = await mountDefaultLayout();
    globalThis.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    await w.vm.$nextTick();
    await w.vm.$nextTick();
    const palette = w.getComponent({ name: 'AppCommandPalette' });
    const homeCommand = (palette.props('commands') as { id: string; to?: string }[]).find(
      (c) => c.id === 'nav-home',
    );
    expect(homeCommand?.to).toBe('/');

    await palette.vm.$emit('select', homeCommand);
    expect(navigateToMock).toHaveBeenCalledWith('/');
  });

  // ── Admin gate (#776) ────────────────────────────────────────────────────

  it('permanently offers a "Review" entry with the due-flashcard count as its badge (#775)', async () => {
    routePath = '/';
    authUser = { displayName: 'Learner', role: 'user' };
    authToken = 'token-123';
    const w = await mountDefaultLayout();
    const shell = w.getComponent({ name: 'AppNavigationShell' });
    const nav = shell.props('nav') as { key: string; to?: string; badge?: number }[];
    const review = nav.find((item) => item.key === 'flashcards-review');
    expect(review?.to).toBe('/flashcards/review');
    // The mocked composable above returns an empty queue — no cards due, so
    // the badge stays hidden rather than showing a false "0".
    expect(review?.badge).toBeUndefined();
  });

  it('shows a loading state, not the real page, on /admin/* while role is unknown', async () => {
    routePath = '/admin';
    authUser = null; // live token, no confirmed session — role unknown
    authToken = 'token-123';
    const w = await mountDefaultLayout({ pageMarker: true });
    expect(w.find('[data-testid="page-content"]').exists()).toBe(false);
    expect(w.find('[role="status"]').exists()).toBe(true);
  });

  it('shows AppNoPermission, not the real page, on /admin/* once role is confirmed non-admin', async () => {
    routePath = '/admin';
    authUser = { displayName: 'Learner', role: 'user' };
    authToken = 'token-123';
    const w = await mountDefaultLayout({ pageMarker: true });
    expect(w.find('[data-testid="page-content"]').exists()).toBe(false);
    expect(w.find('.stub-no-permission').text()).toBe('pages.courseDetail.noAccess');
  });

  it('renders the real page on /admin/* once role is confirmed admin', async () => {
    routePath = '/admin';
    authUser = { displayName: 'Admin User', role: 'admin' };
    authToken = 'token-123';
    const w = await mountDefaultLayout({ pageMarker: true });
    expect(w.find('[data-testid="page-content"]').exists()).toBe(true);
  });

  it('does not gate a non-admin route on adminGateState', async () => {
    routePath = '/';
    authUser = null; // role unknown — would gate on /admin, must not gate here
    authToken = 'token-123';
    const w = await mountDefaultLayout({ pageMarker: true });
    expect(w.find('[data-testid="page-content"]').exists()).toBe(true);
  });

  // ── Session-unconfirmed banner (#777) ───────────────────────────────────

  it('shows a retryable banner when a transient get-session failure was recorded', async () => {
    const { lastTransientRefreshFailureAt } =
      await import('~/composables/useSessionRefreshCooldown');
    routePath = '/';
    authUser = null;
    authToken = 'token-123';
    lastTransientRefreshFailureAt.value = Date.now();
    const w = await mountDefaultLayout();
    expect(w.find('.stub-banner').exists()).toBe(true);
    lastTransientRefreshFailureAt.value = 0; // reset for later tests
  });

  it('shows no banner once the session is confirmed', async () => {
    const { lastTransientRefreshFailureAt } =
      await import('~/composables/useSessionRefreshCooldown');
    routePath = '/';
    authUser = { displayName: 'Learner', role: 'user' };
    authToken = 'token-123';
    lastTransientRefreshFailureAt.value = 0;
    const w = await mountDefaultLayout();
    expect(w.find('.stub-banner').exists()).toBe(false);
  });
});
