import { mount, flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import AppNavigationShell from './AppNavigationShell.vue';
import shellSource from './AppNavigationShell.vue?raw';
import type { NavItem, ShellUser } from './AppNavigationShell.vue';

// The real AppDialog wraps a native <dialog>, which jsdom doesn't implement
// (no showModal()/close()) — AppDialog's own spec covers that plumbing.
// Here we only care that AppNavigationShell wires `mobileNavOpen` to `open`
// and slots the full nav (incl. admin) into it, so a bare stub is enough.
vi.mock('../AppDialog/AppDialog.vue', () => ({
  default: {
    name: 'AppDialog',
    props: ['open', 'size', 'title', 'dismissLabel'],
    emits: ['update:open'],
    template: '<div v-if="open" data-testid="mobile-nav-dialog" :aria-label="title"><slot /></div>',
  },
}));

// Shared z-index scale (docs/design/shared/tokens.json → --z-*). Kept here to
// assert relative layering: the account menu is anchored in the fixed bottom-tab
// bar, so its rung must outrank the bar's --z-sticky rung.
const Z_SCALE: Record<string, number> = {
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
  tooltip: 600,
};

/** Extract the `z-index: var(--z-<rung>)` token declared inside a `&__<block>` rule. */
function zTokenFor(source: string, block: string): string | undefined {
  const rule = new RegExp(String.raw`&__${block}\s*\{[\s\S]*?\}`).exec(source)?.[0];
  return /z-index:\s*var\(--z-([a-z]+)\)/.exec(rule ?? '')?.[1];
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const defaultNav: NavItem[] = [
  { key: 'home', label: 'Home', icon: 'home' },
  { key: 'browse', label: 'Browse', icon: 'library' },
  { key: 'search', label: 'Search', icon: 'search' },
];

const adminNav: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'libraries', label: 'Libraries', icon: 'folder' },
  { key: 'users', label: 'Users', icon: 'users' },
];

const defaultUser: ShellUser = {
  name: 'Elena Lin',
  role: 'USER',
  roleLabel: 'User',
};

const adminUser: ShellUser = {
  name: 'Admin User',
  role: 'ADMIN',
  roleLabel: 'Administrator',
  initials: 'AU',
};

function factory(
  overrides: {
    props?: Record<string, unknown>;
    slots?: Record<string, string>;
  } = {},
) {
  return mount(AppNavigationShell, {
    props: {
      activeRoute: 'home',
      nav: defaultNav,
      user: defaultUser,
      sidebarLabel: 'Sidebar',
      rightRailLabel: 'Secondary content',
      userMenuLabel: 'User menu',
      ...overrides.props,
    },
    slots: overrides.slots,
    attachTo: document.body,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AppNavigationShell', () => {
  // ── Brand ──────────────────────────────────────────────────────────────────

  it('renders the default brand mark "CS"', () => {
    const w = factory();
    expect(w.find('.app-navigation-shell__brand-mark').text()).toBe('CS');
  });

  it('renders the default brand name "CourseShelf"', () => {
    const w = factory();
    expect(w.find('.app-navigation-shell__brand-name').text()).toBe('CourseShelf');
  });

  it('renders a custom brandMark and brandName', () => {
    const w = factory({ props: { brandMark: 'XY', brandName: 'MyApp' } });
    expect(w.find('.app-navigation-shell__brand-mark').text()).toBe('XY');
    expect(w.find('.app-navigation-shell__brand-name').text()).toBe('MyApp');
  });

  // ── Primary nav ───────────────────────────────────────────────────────────

  it('renders all primary nav item labels', () => {
    const w = factory();
    const sidebar = w.find('.app-navigation-shell__sidebar');
    expect(sidebar.text()).toContain('Home');
    expect(sidebar.text()).toContain('Browse');
    expect(sidebar.text()).toContain('Search');
  });

  it('sets aria-current="page" on the active nav item', () => {
    const w = factory({ props: { activeRoute: 'browse' } });
    const navItems = w.findAll('.app-navigation-shell__nav .app-row');
    const browseItem = navItems.find((el) => el.text().includes('Browse'));
    expect(browseItem?.attributes('aria-current')).toBe('page');
  });

  it('does not set aria-current on non-active nav items', () => {
    const w = factory({ props: { activeRoute: 'home' } });
    const navItems = w.findAll('.app-navigation-shell__nav .app-row');
    const browseItem = navItems.find((el) => el.text().includes('Browse'));
    expect(browseItem?.attributes('aria-current')).toBeUndefined();
  });

  it('emits "nav" with item key when a nav item is clicked', async () => {
    const w = factory({ props: { activeRoute: 'home' } });
    const navItems = w.findAll('.app-navigation-shell__nav .app-row');
    const searchItem = navItems.find((el) => el.text().includes('Search'));
    await searchItem?.trigger('click');
    expect(w.emitted('nav')).toEqual([['search']]);
  });

  // ── Admin section ─────────────────────────────────────────────────────────

  it('does not render admin section when adminNav is empty (default)', () => {
    const w = factory();
    expect(w.find('.app-navigation-shell__admin-section').exists()).toBe(false);
  });

  it('renders admin section label when adminNav has items', () => {
    const w = factory({ props: { adminNav } });
    expect(w.find('.app-navigation-shell__admin-section').exists()).toBe(true);
    expect(w.find('.app-navigation-shell__admin-section').text()).toBe('Admin');
  });

  it('renders all admin nav items', () => {
    const w = factory({ props: { adminNav } });
    const navs = w.findAll('.app-navigation-shell__nav');
    // last nav is the admin nav
    const adminNavEl = navs.at(-1);
    expect(adminNavEl?.text()).toContain('Dashboard');
    expect(adminNavEl?.text()).toContain('Libraries');
    expect(adminNavEl?.text()).toContain('Users');
  });

  it('sets aria-current="page" on active admin nav item', () => {
    const w = factory({ props: { activeRoute: 'dashboard', adminNav } });
    const allRows = w.findAll('.app-navigation-shell__nav .app-row');
    const dashRow = allRows.find((el) => el.text().includes('Dashboard'));
    expect(dashRow?.attributes('aria-current')).toBe('page');
  });

  // ── Search ────────────────────────────────────────────────────────────────

  it('renders search input with default placeholder', () => {
    const w = factory();
    const input = w.find('.app-navigation-shell__search-input');
    expect(input.attributes('placeholder')).toBe('Search courses, lessons…');
  });

  it('renders search input with custom placeholder', () => {
    const w = factory({ props: { searchPlaceholder: 'Find something…' } });
    expect(w.find('.app-navigation-shell__search-input').attributes('placeholder')).toBe(
      'Find something…',
    );
  });

  it('emits update:searchValue when typing in search input', async () => {
    const w = factory();
    const input = w.find<HTMLInputElement>('.app-navigation-shell__search-input');
    await input.setValue('vue');
    // setValue triggers both input and change; look for at least one emission
    const emitted = w.emitted('update:searchValue') as string[][];
    expect(emitted).toBeTruthy();
    expect(emitted.at(-1)).toEqual(['vue']);
  });

  it('emits searchSubmit with current value when Enter is pressed in search input', async () => {
    const w = factory({ props: { searchValue: 'postgres' } });
    const input = w.find<HTMLInputElement>('.app-navigation-shell__search-input');
    await input.trigger('keydown', { key: 'Enter' });
    const emitted = w.emitted('searchSubmit') as string[][];
    expect(emitted).toBeTruthy();
    expect(emitted).toHaveLength(1);
  });

  it('does not emit searchSubmit when a non-Enter key is pressed', async () => {
    const w = factory({ props: { searchValue: 'postgres' } });
    const input = w.find<HTMLInputElement>('.app-navigation-shell__search-input');
    await input.trigger('keydown', { key: 'a' });
    expect(w.emitted('searchSubmit')).toBeUndefined();
  });

  it('search input is type="search" with an aria-label (#597 — it had neither)', () => {
    const w = factory({ props: { searchPlaceholder: 'Find something…' } });
    const input = w.find('.app-navigation-shell__search-input');
    expect(input.attributes('type')).toBe('search');
    expect(input.attributes('aria-label')).toBe('Find something…');
  });

  // ── Theme toggle ─────────────────────────────────────────────────────────
  // Binary, and keyed on the RESOLVED appearance rather than the stored
  // preference. The old three-step cycle existed because, as the comment here
  // used to say, "one click from System and it's gone, with no control anywhere
  // that can set it again" — that premise is no longer true: the Settings page
  // renders all three modes in an AppSegmented, so the topbar is free to be
  // the quick flip and nothing else.
  //
  // Reading `resolvedColorMode` is what makes the `system` case work: a toggle
  // keyed on `colorMode` would see "system", have no opposite to pick, and
  // either guess or no-op while the viewer stares at an unchanged screen.

  it('flips to light when the viewer is looking at dark', async () => {
    const w = factory({ props: { colorMode: 'dark', resolvedColorMode: 'dark' } });
    await w.find('.app-navigation-shell__theme-toggle').trigger('click');
    expect(w.emitted('update:colorMode')).toEqual([['light']]);
  });

  it('flips to dark when the viewer is looking at light', async () => {
    const w = factory({ props: { colorMode: 'light', resolvedColorMode: 'light' } });
    await w.find('.app-navigation-shell__theme-toggle').trigger('click');
    expect(w.emitted('update:colorMode')).toEqual([['dark']]);
  });

  it('flips away from what is on screen when the stored preference is "system"', async () => {
    const dark = factory({ props: { colorMode: 'system', resolvedColorMode: 'dark' } });
    await dark.find('.app-navigation-shell__theme-toggle').trigger('click');
    expect(dark.emitted('update:colorMode')).toEqual([['light']]);

    const light = factory({ props: { colorMode: 'system', resolvedColorMode: 'light' } });
    await light.find('.app-navigation-shell__theme-toggle').trigger('click');
    expect(light.emitted('update:colorMode')).toEqual([['dark']]);
  });

  it('never emits "system" — the topbar cannot set it, only Settings can', async () => {
    for (const mode of ['light', 'dark', 'system'] as const) {
      for (const resolved of ['light', 'dark'] as const) {
        const w = factory({ props: { colorMode: mode, resolvedColorMode: resolved } });
        await w.find('.app-navigation-shell__theme-toggle').trigger('click');
        expect(w.emitted('update:colorMode')?.flat()).not.toContain('system');
      }
    }
  });

  it('theme toggle aria-label is static — it does not depend on colorMode', () => {
    const dark = factory({ props: { colorMode: 'dark' } });
    const light = factory({ props: { colorMode: 'light' } });
    const label = dark.find('.app-navigation-shell__theme-toggle').attributes('aria-label');
    expect(label).toBe('Toggle color theme');
    expect(light.find('.app-navigation-shell__theme-toggle').attributes('aria-label')).toBe(label);
  });

  it('theme toggle aria-label is overridable via the themeToggleLabel prop', () => {
    const w = factory({ props: { themeToggleLabel: 'Переключить тему' } });
    expect(w.find('.app-navigation-shell__theme-toggle').attributes('aria-label')).toBe(
      'Переключить тему',
    );
  });

  // ── Language switch (#607) ─────────────────────────────────────────────────
  // A segmented control, not a relabelled button. The button it replaced
  // rendered the language a click switched *to*, so a Russian UI displayed the
  // word "Russian" only because English was next in the list — it read as a
  // status label while actually being a target.

  const TWO_LOCALES = [
    { code: 'en', name: 'English' },
    { code: 'ru', name: 'Русский' },
  ];

  it('does not render the language switch without locales (default)', () => {
    const w = factory();
    expect(w.find('.app-navigation-shell__locale-switch').exists()).toBe(false);
  });

  it('does not render the language switch for a single locale', () => {
    const w = factory({ props: { locales: [{ code: 'en', name: 'English' }], locale: 'en' } });
    expect(w.find('.app-navigation-shell__locale-switch').exists()).toBe(false);
  });

  it('shows every locale by its own name, current one included', () => {
    const w = factory({ props: { locales: TWO_LOCALES, locale: 'ru' } });
    const text = w.find('.app-navigation-shell__locale-switch').text();
    expect(text).toContain('English');
    expect(text).toContain('Русский');
  });

  it('marks the active locale rather than leaving it to be inferred', () => {
    const w = factory({ props: { locales: TWO_LOCALES, locale: 'ru' } });
    const checked = w
      .findAll('.app-navigation-shell__locale-switch [role="radio"]')
      .filter((el) => el.attributes('aria-checked') === 'true');
    expect(checked).toHaveLength(1);
    expect(checked[0]?.text()).toBe('Русский');
  });

  it('emits the code of the locale that was picked', async () => {
    const w = factory({ props: { locales: TWO_LOCALES, locale: 'en' } });
    const options = w.findAll('.app-navigation-shell__locale-switch [role="radio"]');
    const russian = options.find((el) => el.text() === 'Русский');
    await russian?.trigger('click');
    expect(w.emitted('update:locale')).toEqual([['ru']]);
  });

  // ── Avatar menu — open / close ─────────────────────────────────────────────

  it('menu is closed by default', () => {
    const w = factory();
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(false);
  });

  it('desktop avatar trigger has an accessible name via aria-label (#630)', () => {
    const w = factory();
    expect(w.find('.app-navigation-shell__avatar-trigger').attributes('aria-label')).toBe(
      'User menu',
    );
  });

  it('desktop avatar trigger aria-label is overridable via userMenuLabel', () => {
    const w = factory({ props: { userMenuLabel: 'Меню пользователя' } });
    expect(w.find('.app-navigation-shell__avatar-trigger').attributes('aria-label')).toBe(
      'Меню пользователя',
    );
  });

  it('opens the menu when avatar trigger is clicked', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(true);
  });

  it('closes the menu on a second trigger click (toggle)', async () => {
    const w = factory();
    const trigger = w.find('.app-navigation-shell__avatar-trigger');
    await trigger.trigger('click');
    await trigger.trigger('click');
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(false);
  });

  it('closes the menu when ESC is pressed', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(true);
    await w.trigger('keydown', { key: 'Escape' });
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(false);
  });

  it('closes the menu on click-outside (mousedown on document)', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(true);
    // Simulate mousedown on document outside the component
    const event = new MouseEvent('mousedown', { bubbles: true });
    document.dispatchEvent(event);
    await flushPromises();
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(false);
  });

  // ── Avatar menu — item events ─────────────────────────────────────────────

  it('emits "profile" and closes menu when Profile item is clicked', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    const items = w.findAll('[role="menuitem"]');
    const profileItem = items.find((el) => el.text().includes('Profile'));
    await profileItem?.trigger('click');
    expect(w.emitted('profile')).toHaveLength(1);
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(false);
  });

  it('emits "settings" and closes menu when Settings item is clicked', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    const items = w.findAll('[role="menuitem"]');
    const settingsItem = items.find((el) => el.text().includes('Settings'));
    await settingsItem?.trigger('click');
    expect(w.emitted('settings')).toHaveLength(1);
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(false);
  });

  it('emits "signOut" and closes menu when Sign out item is clicked', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    const items = w.findAll('[role="menuitem"]');
    const signOutItem = items.find((el) => el.text().includes('Sign out'));
    await signOutItem?.trigger('click');
    expect(w.emitted('signOut')).toHaveLength(1);
    expect(w.find('.app-navigation-shell__menu').exists()).toBe(false);
  });

  it('offers no theme item — Settings owns the full choice, the topbar the flip', async () => {
    const w = factory({ props: { colorMode: 'dark', resolvedColorMode: 'dark' } });
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    const items = w.findAll('[role="menuitem"]');
    expect(items.map((el) => el.text())).toEqual(['Profile', 'Settings', 'Sign out']);
    // A third entry point that also cycled three ways was the defect, not a
    // convenience: it carried the same show-the-next-state wording as the two
    // controls this change fixed.
    for (const el of items) {
      await el.trigger('click');
    }
    expect(w.emitted('update:colorMode')).toBeUndefined();
  });

  // ── Menu keyboard navigation ───────────────────────────────────────────────

  it('ArrowDown moves focus to next menu item', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    await flushPromises();
    const items = w.findAll('[role="menuitem"]');
    expect(items.length).toBeGreaterThanOrEqual(2);
    // focus the first item manually
    (items[0]!.element as HTMLElement).focus();
    await w.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[1]!.element);
  });

  it('ArrowUp moves focus to previous menu item (wraps)', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    await flushPromises();
    const items = w.findAll('[role="menuitem"]');
    expect(items.length).toBeGreaterThanOrEqual(1);
    (items[0]!.element as HTMLElement).focus();
    await w.trigger('keydown', { key: 'ArrowUp' });
    // wrap: 0 → last
    const lastItem = items.at(-1);
    expect(lastItem).toBeDefined();
    expect(document.activeElement).toBe(lastItem!.element);
  });

  // ── Bottom-tab bar ────────────────────────────────────────────────────────

  it('renders bottom-tab bar in the DOM (present at all viewport sizes; CSS hides at ≥600px)', () => {
    const w = factory();
    expect(w.find('.app-navigation-shell__bottom-tabs').exists()).toBe(true);
  });

  it('bottom-tab bar shows only primary nav items (not admin items)', () => {
    const w = factory({ props: { adminNav } });
    const tabs = w.findAll('.app-navigation-shell__tab-item');
    const tabLabels = tabs.map((t) => t.text());
    // primary nav items are present
    expect(tabLabels.some((l) => l.includes('Home'))).toBe(true);
    // admin items are NOT present
    expect(tabLabels.some((l) => l.includes('Dashboard'))).toBe(false);
  });

  it('bottom-tab bar renders at most 5 items even when nav has more', () => {
    const bigNav: NavItem[] = [
      { key: 'a', label: 'A', icon: 'home' },
      { key: 'b', label: 'B', icon: 'library' },
      { key: 'c', label: 'C', icon: 'search' },
      { key: 'd', label: 'D', icon: 'settings' },
      { key: 'e', label: 'E', icon: 'user' },
      { key: 'f', label: 'F', icon: 'users' },
    ];
    const w = factory({ props: { nav: bigNav } });
    expect(w.findAll('.app-navigation-shell__tab-item')).toHaveLength(5);
  });

  it('sets aria-current="page" on the active bottom-tab item', () => {
    const w = factory({ props: { activeRoute: 'browse' } });
    const tabs = w.findAll('.app-navigation-shell__tab-item');
    const browseTab = tabs.find((t) => t.text().includes('Browse'));
    expect(browseTab?.attributes('aria-current')).toBe('page');
  });

  it('bottom-tab item click emits "nav" with the item key', async () => {
    const w = factory({ props: { activeRoute: 'home' } });
    const tabs = w.findAll('.app-navigation-shell__tab-item');
    const searchTab = tabs.find((t) => t.text().includes('Search'));
    await searchTab?.trigger('click');
    expect(w.emitted('nav')).toEqual([['search']]);
  });

  // ── Slots ─────────────────────────────────────────────────────────────────

  it('renders default slot content inside main body', () => {
    const w = factory({ slots: { default: '<p id="content">Page content</p>' } });
    expect(w.find('.app-navigation-shell__main-body').find('#content').exists()).toBe(true);
  });

  it('does not render rail aside when right-rail slot is absent', () => {
    const w = factory();
    expect(w.find('.app-navigation-shell__main-rail').exists()).toBe(false);
  });

  it('renders rail aside when right-rail slot is provided', () => {
    const w = factory({ slots: { 'right-rail': '<div id="rail">Rail</div>' } });
    expect(w.find('.app-navigation-shell__main-rail').exists()).toBe(true);
    expect(w.find('#rail').exists()).toBe(true);
  });

  it('adds --has-rail modifier class when right-rail slot is provided', () => {
    const w = factory({ slots: { 'right-rail': '<div>Rail</div>' } });
    expect(w.find('.app-navigation-shell__main').classes()).toContain(
      'app-navigation-shell__main--has-rail',
    );
  });

  it('does not add --has-rail modifier class when right-rail slot is absent', () => {
    const w = factory();
    expect(w.find('.app-navigation-shell__main').classes()).not.toContain(
      'app-navigation-shell__main--has-rail',
    );
  });

  // ── User block ────────────────────────────────────────────────────────────

  it('renders the user name in the sidebar user block', () => {
    const w = factory();
    expect(w.find('.app-navigation-shell__user-block').text()).toContain('Elena Lin');
  });

  it('renders the translated roleLabel, not the raw role enum, in the sidebar user block', () => {
    const w = factory({ props: { user: adminUser } });
    const text = w.find('.app-navigation-shell__user-block').text();
    expect(text).toContain('Administrator');
    expect(text).not.toContain('ADMIN');
  });

  it('forwards user.roleLabel to the AppAvatar role badge (#597 — it used to be hardcoded English)', () => {
    const w = factory({
      props: { user: { ...adminUser, role: 'ADMIN', roleLabel: 'Администратор' } },
    });
    const badge = w.find('.app-avatar__role');
    expect(badge.attributes('aria-label')).toBe('Администратор');
  });

  // ── Actions slot ─────────────────────────────────────────────────────────

  it('renders actions slot content in the topbar', () => {
    const w = factory({ slots: { actions: '<button id="act">New</button>' } });
    expect(w.find('.app-navigation-shell__topbar').find('#act').exists()).toBe(true);
  });

  // ── Menu role ─────────────────────────────────────────────────────────────

  it('menu has role="menu"', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    expect(w.find('.app-navigation-shell__menu').attributes('role')).toBe('menu');
  });

  it('all menu items have role="menuitem"', async () => {
    const w = factory();
    await w.find('.app-navigation-shell__avatar-trigger').trigger('click');
    const items = w.findAll('[role="menuitem"]');
    expect(items.length).toBeGreaterThanOrEqual(3); // Profile, Settings, Sign out
  });

  // ── z-index layering (#160) ─────────────────────────────────────────────────
  // The account menu is anchored inside the fixed bottom-tab bar at xs widths.
  // Scoped SCSS is not applied under jsdom, so assert the layering against the
  // token declared in source: the menu's rung must outrank the sticky bar's.

  describe('z-index layering', () => {
    const menuToken = zTokenFor(shellSource, 'menu');
    const barToken = zTokenFor(shellSource, 'bottom-tabs');

    it('the account menu uses a known z-index scale rung', () => {
      expect(menuToken).toBeDefined();
      expect(Z_SCALE[menuToken as string]).toBeTypeOf('number');
    });

    it('the bottom-tab bar uses --z-sticky', () => {
      expect(barToken).toBe('sticky');
    });

    it('the open account menu outranks the bottom-tab bar', () => {
      const menuZ = Z_SCALE[menuToken as string];
      const barZ = Z_SCALE[barToken as string];
      // Guard the index lookups (both proven present by the tests above) so the
      // comparison is over `number`, not `number | undefined`.
      expect(menuZ).toBeTypeOf('number');
      expect(barZ).toBeTypeOf('number');
      expect(menuZ as number).toBeGreaterThan(barZ as number);
    });
  });

  // ── Mobile nav overflow (#568) ───────────────────────────────────────────
  // Below 600px the sidebar is CSS-hidden and the bottom-tab bar only fits a
  // handful of items — admin nav used to have no way in at all. The "More"
  // tab now opens a dialog with the full nav, admin section included.

  describe('mobile nav overflow (#568)', () => {
    it('does not show a "More" tab when the primary nav fits and there is no admin nav', () => {
      const w = factory();
      const tabs = w.findAll('.app-navigation-shell__tab-item');
      expect(tabs).toHaveLength(defaultNav.length);
      expect(tabs.some((t) => t.text().includes('More'))).toBe(false);
    });

    it('shows a "More" tab once adminNav has items, even though primary nav alone still fits', () => {
      const w = factory({ props: { adminNav } });
      const tabs = w.findAll('.app-navigation-shell__tab-item');
      expect(tabs.some((t) => t.text().includes('More'))).toBe(true);
    });

    it('shows a "More" tab when primary nav alone overflows 5 items, even with no admin nav', () => {
      const bigNav: NavItem[] = Array.from({ length: 6 }, (_, i) => ({
        key: `item-${i}`,
        label: `Item ${i}`,
        icon: 'home',
      }));
      const w = factory({ props: { nav: bigNav } });
      const tabs = w.findAll('.app-navigation-shell__tab-item');
      expect(tabs.some((t) => t.text().includes('More'))).toBe(true);
    });

    it('the overflow dialog is not in the DOM until the "More" tab is clicked', () => {
      const w = factory({ props: { adminNav } });
      expect(w.find('[data-testid="mobile-nav-dialog"]').exists()).toBe(false);
    });

    it('opens the overflow dialog and exposes every admin nav item when "More" is clicked', async () => {
      const w = factory({ props: { adminNav } });
      const moreTab = w
        .findAll('.app-navigation-shell__tab-item')
        .find((t) => t.text().includes('More'));
      await moreTab?.trigger('click');

      const dialog = w.find('[data-testid="mobile-nav-dialog"]');
      expect(dialog.exists()).toBe(true);
      expect(dialog.text()).toContain('Dashboard');
      expect(dialog.text()).toContain('Libraries');
      expect(dialog.text()).toContain('Users');
    });

    it('the overflow dialog also carries the primary nav', async () => {
      const w = factory({ props: { adminNav } });
      const moreTab = w
        .findAll('.app-navigation-shell__tab-item')
        .find((t) => t.text().includes('More'));
      await moreTab?.trigger('click');

      const dialog = w.find('[data-testid="mobile-nav-dialog"]');
      expect(dialog.text()).toContain('Home');
      expect(dialog.text()).toContain('Browse');
    });

    it('clicking a nav item inside the overflow dialog emits "nav" with its key and closes the dialog', async () => {
      const w = factory({ props: { adminNav } });
      const moreTab = w
        .findAll('.app-navigation-shell__tab-item')
        .find((t) => t.text().includes('More'));
      await moreTab?.trigger('click');

      const dialog = w.find('[data-testid="mobile-nav-dialog"]');
      const dashboardRow = dialog.findAll('.app-row').find((el) => el.text().includes('Dashboard'));
      await dashboardRow?.trigger('click');

      expect(w.emitted('nav')).toEqual([['dashboard']]);
      expect(w.find('[data-testid="mobile-nav-dialog"]').exists()).toBe(false);
    });

    it('sets aria-current="page" on the active item inside the overflow dialog', async () => {
      const w = factory({ props: { activeRoute: 'dashboard', adminNav } });
      const moreTab = w
        .findAll('.app-navigation-shell__tab-item')
        .find((t) => t.text().includes('More'));
      await moreTab?.trigger('click');

      const dialog = w.find('[data-testid="mobile-nav-dialog"]');
      const dashboardRow = dialog.findAll('.app-row').find((el) => el.text().includes('Dashboard'));
      expect(dashboardRow?.attributes('aria-current')).toBe('page');
    });
  });
});
