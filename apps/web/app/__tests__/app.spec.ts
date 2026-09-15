/**
 * Spec for apps/web/app/app.vue
 *
 * Covers the route→title resolution and the `html[lang]` binding (#589) —
 * the two things this file exists to own now that neither was set anywhere
 * (axe `document-title` + `html-has-lang` failed on every one of 128
 * audited page/locale/theme combinations).
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

interface HeadInput {
  htmlAttrs?: { lang?: string };
  title?: string;
  titleTemplate?: (title: string) => string;
}

let routePath = '/';
vi.stubGlobal('useRoute', () => ({ path: routePath }));

let currentLocale = 'en';
vi.stubGlobal('useI18n', () => ({
  t: (key: string) => key,
  locale: { value: currentLocale },
}));

const useHeadMock = vi.fn<(input: HeadInput) => void>();
vi.stubGlobal('useHead', (getter: () => HeadInput) => useHeadMock(getter()));

async function mountApp() {
  const mod = await import('../app.vue');
  return mount(mod.default, {
    global: { stubs: { UApp: true, NuxtLayout: true, NuxtPage: true } },
  });
}

describe('app.vue', () => {
  it('binds html[lang] to the active locale', async () => {
    currentLocale = 'ru';
    routePath = '/';
    await mountApp();
    const input = useHeadMock.mock.calls.at(-1)?.[0];
    expect(input?.htmlAttrs?.lang).toBe('ru');
  });

  it('resolves the sign-in route to its own title key', async () => {
    currentLocale = 'en';
    routePath = '/sign-in';
    await mountApp();
    const input = useHeadMock.mock.calls.at(-1)?.[0];
    expect(input?.title).toBe('pages.signIn.title');
  });

  it('falls back to no title (bare app name via titleTemplate) for an unmapped route', async () => {
    currentLocale = 'en';
    routePath = '/courses/abc-123';
    await mountApp();
    const input = useHeadMock.mock.calls.at(-1)?.[0];
    expect(input?.title).toBeUndefined();
    expect(input?.titleTemplate?.(input?.title ?? '')).toBe('layouts.default.appName');
  });

  it('composes distinct titles for two different admin routes', async () => {
    currentLocale = 'en';
    routePath = '/admin/users';
    await mountApp();
    const usersTitle = useHeadMock.mock.calls.at(-1)?.[0]?.title;

    routePath = '/admin/backups';
    await mountApp();
    const backupsTitle = useHeadMock.mock.calls.at(-1)?.[0]?.title;

    expect(usersTitle).toBe('pages.admin.users.title');
    expect(backupsTitle).toBe('pages.admin.backups.title');
    expect(usersTitle).not.toBe(backupsTitle);
  });
});
