/**
 * Spec for apps/web/app/pages/admin/scrapers.vue (E30-F01-S02).
 *
 * Covers the states the card names: loading, error, empty, a loaded scraper,
 * and a rejected definition file listed alongside it with its reason.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, computed } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

import type { ScraperListDto } from '@app/api-client-ts';
import type { AdminScrapersStatus } from '~/composables/useAdminScrapers';

// ── Nuxt auto-imports ──────────────────────────────────────────────────────
vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({
  t: (key: string, named?: Record<string, unknown>) =>
    named ? `${key}:${JSON.stringify(named)}` : key,
  locale: ref('en'),
}));

// ── Composable under the page ──────────────────────────────────────────────
const data = ref<ScraperListDto | undefined>(undefined);
const status = ref<AdminScrapersStatus>('idle');
const error = ref<Error | null>(null);
const refetch = vi.fn();

vi.mock('~/composables/useAdminScrapers', () => ({
  useAdminScrapers: () => ({ data, status, error, errorStatus: computed(() => null), refetch }),
}));

// ── @app/ui stubs ────────────────────────────────────────────────────────────
vi.mock('@app/ui', () => ({
  AppBanner: {
    name: 'AppBanner',
    props: ['variant', 'title', 'body'],
    template: '<div class="stub-banner">{{ title }} {{ body }}<slot name="actions" /></div>',
  },
  AppButton: {
    name: 'AppButton',
    props: ['label', 'variant', 'size'],
    emits: ['click'],
    template: '<button @click="$emit(\'click\')">{{ label }}</button>',
  },
  AppEmptyState: {
    name: 'AppEmptyState',
    props: ['icon', 'title'],
    template: '<div class="stub-empty">{{ title }}</div>',
  },
  AppSkeleton: { name: 'AppSkeleton', props: ['width', 'height', 'radius'], template: '<div />' },
  AppRow: {
    name: 'AppRow',
    template: '<div class="stub-row"><slot /><slot name="trailing" /></div>',
  },
  AppBadge: {
    name: 'AppBadge',
    props: ['color', 'size', 'label'],
    template: '<span class="stub-badge">{{ label }}</span>',
  },
}));

const LOADED: ScraperListDto['scrapers'][number] = {
  id: 'youtube',
  supportedKinds: ['url', 'name', 'fragment'],
  configured: true,
  origin: 'built-in',
  loadError: null,
};

const REJECTED: ScraperListDto['scrapers'][number] = {
  id: 'acme-academy',
  supportedKinds: [],
  configured: false,
  origin: 'definition-file',
  loadError: 'selector "title" did not match "$.selectors.title": required property',
};

async function mountPage(): Promise<VueWrapper> {
  const mod = await import('../admin/scrapers.vue');
  return mount(mod.default);
}

describe('admin scrapers page', () => {
  beforeEach(() => {
    data.value = undefined;
    status.value = 'idle';
    error.value = null;
    vi.clearAllMocks();
  });

  it('shows a loading skeleton while pending', async () => {
    status.value = 'pending';
    const wrapper = await mountPage();

    expect(wrapper.find('[data-testid="scrapers-loading"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="scrapers-list"]').exists()).toBe(false);
  });

  it('shows the error banner with a retry action on failure', async () => {
    status.value = 'error';
    error.value = new Error('network down');
    const wrapper = await mountPage();

    const banner = wrapper.find('[data-testid="scrapers-error"]');
    expect(banner.exists()).toBe(true);
    expect(banner.text()).toContain('network down');

    await wrapper.find('button').trigger('click');
    expect(refetch).toHaveBeenCalledOnce();
  });

  it('shows the empty state when no scrapers are configured', async () => {
    status.value = 'success';
    data.value = { scrapers: [] };
    const wrapper = await mountPage();

    expect(wrapper.find('.stub-empty').exists()).toBe(true);
  });

  it('lists a loaded scraper with its origin and supported kinds', async () => {
    status.value = 'success';
    data.value = { scrapers: [LOADED] };
    const wrapper = await mountPage();

    const row = wrapper.find('[data-testid="scraper-row-youtube"]');
    expect(row.exists()).toBe(true);
    expect(row.text()).toContain('youtube');
    expect(row.text()).toContain('pages.admin.scrapers.originBuiltIn');
    expect(row.find('[data-testid="scraper-load-error"]').exists()).toBe(false);
  });

  it('lists a rejected definition file with its reason and a rejected badge', async () => {
    status.value = 'success';
    data.value = { scrapers: [LOADED, REJECTED] };
    const wrapper = await mountPage();

    const row = wrapper.find('[data-testid="scraper-row-acme-academy"]');
    expect(row.exists()).toBe(true);
    expect(row.text()).toContain('acme-academy');
    expect(row.find('[data-testid="scraper-load-error"]').text()).toContain(
      'selector "title" did not match',
    );
    expect(row.text()).toContain('pages.admin.scrapers.statusRejected');
    expect(row.text()).toContain('pages.admin.scrapers.originDefinitionFile');
  });

  it('reports the rejected count in the subtitle', async () => {
    status.value = 'success';
    data.value = { scrapers: [LOADED, REJECTED] };
    const wrapper = await mountPage();

    expect(wrapper.text()).toContain('pages.admin.scrapers.subtitleWithRejected');
    expect(wrapper.text()).toContain('"rejected":1');
  });
});
