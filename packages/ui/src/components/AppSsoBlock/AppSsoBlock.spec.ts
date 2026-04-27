import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppSsoBlock from './AppSsoBlock.vue';
import type { SsoProvider } from './AppSsoBlock.vue';

const ALL_PROVIDERS: SsoProvider[] = [
  { id: 'google', label: 'Continue with Google', iconName: 'mail' },
  { id: 'github', label: 'Continue with GitHub', iconName: 'github' },
  { id: 'sso', label: 'Single sign-on', iconName: 'key' },
];

describe('AppSsoBlock', () => {
  it('renders nothing when providers is empty', () => {
    const wrapper = mount(AppSsoBlock, { props: { providers: [] } });
    expect(wrapper.find('.app-sso-block').exists()).toBe(false);
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('renders one button per provider', () => {
    const wrapper = mount(AppSsoBlock, { props: { providers: ALL_PROVIDERS } });
    expect(wrapper.findAll('button')).toHaveLength(3);
  });

  it('shows the provider label inside each button', () => {
    const wrapper = mount(AppSsoBlock, { props: { providers: ALL_PROVIDERS } });
    expect(wrapper.text()).toContain('Continue with Google');
    expect(wrapper.text()).toContain('Continue with GitHub');
    expect(wrapper.text()).toContain('Single sign-on');
  });

  it('exposes the role=group + aria-label on the wrapper', () => {
    const wrapper = mount(AppSsoBlock, { props: { providers: ALL_PROVIDERS } });
    const root = wrapper.find('.app-sso-block');
    expect(root.attributes('role')).toBe('group');
    expect(root.attributes('aria-label')).toBe('Sign in with');
  });

  it('emits select with the provider id when a button is clicked', async () => {
    const wrapper = mount(AppSsoBlock, { props: { providers: ALL_PROVIDERS } });
    const buttons = wrapper.findAll('button');
    await buttons[0]!.trigger('click');
    await buttons[2]!.trigger('click');
    expect(wrapper.emitted('select')).toEqual([['google'], ['sso']]);
  });

  it('handles a single-provider list', () => {
    const wrapper = mount(AppSsoBlock, { props: { providers: [ALL_PROVIDERS[1]!] } });
    expect(wrapper.findAll('button')).toHaveLength(1);
    expect(wrapper.text()).toContain('Continue with GitHub');
  });
});
