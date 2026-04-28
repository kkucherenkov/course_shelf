import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import TokensPage from '../__tokens.vue';

// Stub NuxtLink which is a Nuxt runtime component.
const stubs = {
  NuxtLink: { template: '<a><slot /></a>' },
};

// definePageMeta is a compiler macro — stub it globally so the import succeeds.
// eslint-disable-next-line @typescript-eslint/no-empty-function
vi.stubGlobal('definePageMeta', () => {});

describe('TokensPage (legacy redirect)', () => {
  it('renders a link to /dev/foundations', () => {
    const wrapper = mount(TokensPage, { global: { stubs } });
    expect(wrapper.text()).toContain('Foundations');
  });
});
