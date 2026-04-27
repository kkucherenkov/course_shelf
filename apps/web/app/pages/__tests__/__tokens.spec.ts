import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import TokensPage from '../__tokens.vue';

// Stub Nuxt / Nuxt UI composables that are unavailable in the unit test environment.
vi.mock('#imports', () => ({
  useColorMode: () => ({ value: 'dark' }),
}));

// UColorModeButton is a Nuxt UI runtime component — stub it so the import
// doesn't attempt to resolve the full Nuxt UI module graph.
const stubs = {
  UColorModeButton: { template: '<button data-testid="color-mode-toggle" />' },
};

describe('TokensPage', () => {
  it('renders the Foundations heading', async () => {
    const wrapper = mount(TokensPage, { global: { stubs } });
    expect(wrapper.text()).toContain('Foundations');
  });

  it('renders the color token section', async () => {
    const wrapper = mount(TokensPage, { global: { stubs } });
    expect(wrapper.find('[data-token-category="color"]').exists()).toBe(true);
  });

  it('renders the spacing token section', async () => {
    const wrapper = mount(TokensPage, { global: { stubs } });
    expect(wrapper.find('[data-token-category="spacing"]').exists()).toBe(true);
  });

  it('renders the radius token section', async () => {
    const wrapper = mount(TokensPage, { global: { stubs } });
    expect(wrapper.find('[data-token-category="radius"]').exists()).toBe(true);
  });

  it('renders the typography token section', async () => {
    const wrapper = mount(TokensPage, { global: { stubs } });
    expect(wrapper.find('[data-token-category="typography"]').exists()).toBe(true);
  });

  it('renders the motion / raw values section', async () => {
    const wrapper = mount(TokensPage, { global: { stubs } });
    expect(wrapper.find('[data-token-category="motion"]').exists()).toBe(true);
  });
});
