/**
 * Spec for apps/web/app/pages/admin/identify-tasks/index.vue.
 *
 * Covers the two fixes from #575: the status filter defaults to `proposed`
 * (the queue's whole point is "what needs my attention") and the error
 * banner's retry action is `AppButton`, not a bare `UButton`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref, type Ref } from 'vue';
import { mount, type VueWrapper } from '@vue/test-utils';

import type { IdentifyTaskListDto, IdentifyTaskStatus } from '@app/api-client-ts';

vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
vi.stubGlobal('useRouter', () => ({ push: vi.fn() }));

// ── Composable under the page ──────────────────────────────────────────────
const data = ref<IdentifyTaskListDto | undefined>({ tasks: [] });
const status = ref<'idle' | 'pending' | 'success' | 'error'>('success');
const error = ref<Error | null>(null);
const refetch = vi.fn();
let lastStatusFilter: Ref<IdentifyTaskStatus | undefined> | undefined;

vi.mock('~/composables/useIdentifyTasks', () => ({
  useIdentifyTasksList: (statusFilter: Ref<IdentifyTaskStatus | undefined>) => {
    lastStatusFilter = statusFilter;
    return { data, status, error, refetch };
  },
}));

// ── @app/ui + Nuxt UI stubs ────────────────────────────────────────────────
const AppButtonStub = {
  name: 'AppButton',
  props: ['variant', 'size'],
  emits: ['click'],
  template: '<button class="stub-app-button" @click="$emit(\'click\')"><slot /></button>',
};

vi.mock('@app/ui', () => ({
  AppBanner: {
    name: 'AppBanner',
    props: ['variant', 'title', 'body'],
    template: '<div class="stub-banner">{{ title }} {{ body }}<slot name="actions" /></div>',
  },
  AppButton: AppButtonStub,
  AppEmptyState: {
    name: 'AppEmptyState',
    props: ['icon', 'title', 'body'],
    template: '<div class="stub-empty">{{ title }}<slot name="action" /></div>',
  },
  AppSelect: {
    name: 'AppSelect',
    props: ['modelValue', 'options', 'size'],
    emits: ['update:modelValue'],
    template:
      '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)">' +
      '<option v-for="o in options" :key="o.id" :value="o.id">{{ o.label }}</option></select>',
  },
}));

vi.mock('~/components/admin/AdminIdentifyTaskRow.vue', () => ({
  default: {
    name: 'AdminIdentifyTaskRow',
    props: ['task', 'labelProposed', 'labelApplied', 'labelDiscarded'],
    template: '<div class="stub-row" />',
  },
}));

async function mountPage(): Promise<VueWrapper> {
  const mod = await import('../admin/identify-tasks/index.vue');
  return mount(mod.default);
}

describe('admin identify-tasks queue page', () => {
  beforeEach(() => {
    data.value = { tasks: [] };
    status.value = 'success';
    error.value = null;
    lastStatusFilter = undefined;
    vi.clearAllMocks();
  });

  it('defaults the status filter to "proposed"', async () => {
    await mountPage();
    expect(lastStatusFilter?.value).toBe('proposed');
  });

  it('maps the "all statuses" option to an undefined filter', async () => {
    const wrapper = await mountPage();
    await wrapper.find('select').setValue('all');
    expect(lastStatusFilter?.value).toBeUndefined();
  });

  // #600: an empty result under the default `status=proposed` filter reads
  // as "nothing to review" rather than "nothing proposed right now" — the
  // empty state must name the filter and offer a way out of it.
  it('names the active status filter as the reason for an empty queue, with a way to clear it', async () => {
    const wrapper = await mountPage();

    const empty = wrapper.find('.stub-empty');
    expect(empty.text()).toContain('pages.admin.identifyTasks.emptyFilteredTitle');

    const showAll = wrapper.find('[data-testid="identify-tasks-empty-show-all"]');
    expect(showAll.exists()).toBe(true);
    await showAll.trigger('click');
    expect(lastStatusFilter?.value).toBeUndefined();
  });

  it('falls back to the generic empty state once the filter is "all"', async () => {
    const wrapper = await mountPage();
    await wrapper.find('select').setValue('all');

    const empty = wrapper.find('.stub-empty');
    expect(empty.text()).toContain('pages.admin.identifyTasks.emptyTitle');
    expect(wrapper.find('[data-testid="identify-tasks-empty-show-all"]').exists()).toBe(false);
  });

  it('uses AppButton, not a bare UButton, for the error-state retry action', async () => {
    status.value = 'error';
    error.value = new Error('boom');
    const wrapper = await mountPage();

    const retry = wrapper.find('.stub-app-button');
    expect(retry.exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'UButton' }).exists()).toBe(false);

    await retry.trigger('click');
    expect(refetch).toHaveBeenCalledOnce();
  });
});
