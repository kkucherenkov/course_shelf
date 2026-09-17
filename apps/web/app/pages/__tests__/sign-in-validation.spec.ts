/**
 * Spec for pages/sign-in.vue's submit button (#701).
 *
 * `formValid` used to disable submit whenever the password was under 8
 * chars — which made `onSignIn`'s own `errorEmailInvalid` /
 * `errorPasswordTooShort` branches unreachable: a 7-character password left
 * a dead button with no explanation on screen. Submit is now disabled only
 * by the rate-limit lockout; `onSignIn` itself validates and shows the
 * specific error.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computed } from 'vue';
import { mount } from '@vue/test-utils';

vi.stubGlobal('definePageMeta', () => undefined);
vi.stubGlobal('useI18n', () => ({ t: (key: string) => key }));
vi.stubGlobal('useToast', () => ({ add: vi.fn() }));
vi.stubGlobal('navigateTo', vi.fn());

vi.mock('~/composables/useInstanceConfig', () => ({
  useInstanceConfig: () => ({
    config: computed(() => ({ selfRegistration: true })),
    refresh: vi.fn(),
  }),
}));

const signIn = vi.fn();
vi.mock('~/stores/auth', () => ({
  useAuthStore: () => ({ isPending: false, signIn }),
}));

vi.mock('@app/ui', () => ({
  AppField: { name: 'AppField', props: ['label', 'help'], template: '<div><slot /></div>' },
  AppInput: {
    name: 'AppInput',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  AppPasswordField: {
    name: 'AppPasswordField',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input type="password" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  AppCheckbox: {
    name: 'AppCheckbox',
    props: ['modelValue', 'label'],
    template: '<input type="checkbox" />',
  },
  AppBanner: {
    name: 'AppBanner',
    props: ['variant', 'body'],
    template: '<div class="banner">{{ body }}</div>',
  },
  AppButton: {
    name: 'AppButton',
    props: ['label', 'loading', 'disabled'],
    template:
      '<button type="submit" data-testid="submit-btn" :disabled="disabled">{{ label }}</button>',
  },
}));

async function mountPage() {
  const mod = await import('../sign-in.vue');
  return mount(mod.default, {
    global: {
      stubs: {
        AuthLayout: { template: '<div><slot /></div>' },
        RateLimitBanner: true,
        NuxtLink: { template: '<a><slot /></a>' },
      },
    },
  });
}

describe('pages/sign-in.vue — submit button (#701)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not disable submit for a too-short password', async () => {
    const wrapper = await mountPage();
    await wrapper.find('input[type="email"]').setValue('a@b.com');
    await wrapper.find('input[type="password"]').setValue('short');

    expect(wrapper.find('[data-testid="submit-btn"]').attributes('disabled')).toBeUndefined();
  });

  it('shows the specific too-short-password error on submit, not silence', async () => {
    const wrapper = await mountPage();
    await wrapper.find('input[type="email"]').setValue('a@b.com');
    await wrapper.find('input[type="password"]').setValue('short');

    await wrapper.find('form').trigger('submit');

    expect(wrapper.find('.banner').text()).toBe('pages.signIn.errorPasswordTooShort');
    expect(signIn).not.toHaveBeenCalled();
  });

  it('shows the specific invalid-email error on submit', async () => {
    const wrapper = await mountPage();
    await wrapper.find('input[type="email"]').setValue('not-an-email');
    await wrapper.find('input[type="password"]').setValue('longenoughpassword');

    await wrapper.find('form').trigger('submit');

    expect(wrapper.find('.banner').text()).toBe('pages.signIn.errorEmailInvalid');
    expect(signIn).not.toHaveBeenCalled();
  });

  it('calls signIn once both fields are valid', async () => {
    signIn.mockResolvedValue({ ok: true });
    const wrapper = await mountPage();
    await wrapper.find('input[type="email"]').setValue('a@b.com');
    await wrapper.find('input[type="password"]').setValue('longenoughpassword');

    await wrapper.find('form').trigger('submit');

    expect(signIn).toHaveBeenCalledWith('a@b.com', 'longenoughpassword', false);
  });
});
