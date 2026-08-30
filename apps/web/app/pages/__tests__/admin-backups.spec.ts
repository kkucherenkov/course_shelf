/**
 * Spec for apps/web/app/pages/admin/backups.vue (E31-F01-S02).
 *
 * Covers the three states the card names: running, ready, failed. The download
 * link is asserted as an href and never followed — the route it points at is
 * deliberately outside the OpenAPI document (opaque byte stream), and
 * following it here would test pg_dump rather than this page.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

import type { BackupCreatedDto } from '@app/api-client-ts';
import type { BackupStatus } from '~/composables/useAdminBackup';

// ── Nuxt auto-imports ──────────────────────────────────────────────────────
vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key, locale: ref('en') }));

// ── Composable under the page ──────────────────────────────────────────────
const status = ref<BackupStatus>('idle');
const backup = ref<BackupCreatedDto | null>(null);
const errorDetail = ref<string | null>(null);
const create = vi.fn();

vi.mock('~/composables/useAdminBackup', () => ({
  useAdminBackup: () => ({ status, backup, errorDetail, create }),
}));

// ── @app/ui + Nuxt UI stubs ────────────────────────────────────────────────
vi.mock('@app/ui', () => ({
  AppBanner: {
    name: 'AppBanner',
    props: ['variant', 'title', 'body'],
    template: '<div class="stub-banner">{{ title }} {{ body }}<slot name="actions" /></div>',
  },
  AppCard: { name: 'AppCard', props: ['size'], template: '<div><slot /></div>' },
  AppSpinner: { name: 'AppSpinner', props: ['size', 'label'], template: '<span role="status" />' },
}));

const UButtonStub = {
  name: 'UButton',
  props: ['icon', 'label', 'loading', 'disabled', 'size', 'variant', 'color'],
  emits: ['click'],
  template: '<button :disabled="disabled" @click="$emit(\'click\')">{{ label }}<slot /></button>',
};

const DTO: BackupCreatedDto = {
  id: '20260830T120000-abc',
  createdAt: '2026-08-30T12:00:00Z',
  sizeBytes: 5_242_880,
  url: '/api/v1/admin/backups/20260830T120000-abc/download?token=signed.token.here',
  token: 'signed.token.here',
  expiresAt: '2099-01-01T00:00:00Z',
};

async function mountPage(): Promise<VueWrapper> {
  const mod = await import('../admin/backups.vue');
  return mount(mod.default, { global: { stubs: { UButton: UButtonStub } } });
}

describe('admin backups page', () => {
  beforeEach(() => {
    status.value = 'idle';
    backup.value = null;
    errorDetail.value = null;
    vi.clearAllMocks();
  });

  it('offers the create action and warns that media is not included', async () => {
    const wrapper = await mountPage();

    expect(wrapper.find('[data-testid="backup-create"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('pages.admin.backups.scopeTitle');
  });

  it('starts a backup when the action is clicked', async () => {
    const wrapper = await mountPage();
    await wrapper.find('[data-testid="backup-create"]').trigger('click');

    expect(create).toHaveBeenCalledOnce();
  });

  it('makes the in-progress state visible and disables the action', async () => {
    status.value = 'pending';
    const wrapper = await mountPage();

    const pending = wrapper.find('[data-testid="backup-pending"]');
    expect(pending.exists()).toBe(true);
    expect(pending.attributes('aria-live')).toBe('polite');
    expect(wrapper.text()).toContain('pages.admin.backups.pendingTitle');
    expect(wrapper.find('[data-testid="backup-create"]').attributes('disabled')).toBeDefined();
    expect(wrapper.find('[data-testid="backup-result"]').exists()).toBe(false);
  });

  it('renders the download link, size and expiry when the archive is ready', async () => {
    status.value = 'success';
    backup.value = DTO;
    const wrapper = await mountPage();

    const link = wrapper.find('[data-testid="backup-download"]');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe(DTO.url);
    expect(link.attributes('download')).toBeDefined();
    // 5 MiB, formatted — proves the size actually reaches the template.
    expect(wrapper.text()).toContain('5.0 MB');
    expect(wrapper.text()).toContain('pages.admin.backups.metaExpiresAt');
  });

  it('replaces the link with an explanation once it has expired', async () => {
    status.value = 'success';
    backup.value = { ...DTO, expiresAt: '2000-01-01T00:00:00Z' };
    const wrapper = await mountPage();

    expect(wrapper.find('[data-testid="backup-download"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="backup-expired"]').exists()).toBe(true);
  });

  it('shows the server problem detail and a retry when the backup fails', async () => {
    status.value = 'error';
    errorDetail.value = 'pg_dump was not found. Install postgresql-client.';
    const wrapper = await mountPage();

    const banner = wrapper.find('[data-testid="backup-error"]');
    expect(banner.exists()).toBe(true);
    expect(banner.text()).toContain('pg_dump was not found');
    expect(wrapper.find('[data-testid="backup-result"]').exists()).toBe(false);

    await wrapper.find('[data-testid="backup-retry"]').trigger('click');
    expect(create).toHaveBeenCalledOnce();
  });

  it('falls back to generic copy when the server gave no detail', async () => {
    status.value = 'error';
    errorDetail.value = null;
    const wrapper = await mountPage();

    expect(wrapper.text()).toContain('pages.admin.backups.errorFallback');
  });
});
