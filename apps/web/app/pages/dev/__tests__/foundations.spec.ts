import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import FoundationsPage from '../foundations.vue';

// Stub Nuxt / Nuxt UI composables that are unavailable in the unit test environment.
vi.mock('#imports', () => ({
  useColorMode: () => ({ value: 'dark' }),
}));

// Stub components that require full Nuxt runtime to resolve.
const stubs = {
  UColorModeButton: { template: '<button data-testid="color-mode-toggle" />' },
  NuxtLink: { template: '<a><slot /></a>' },
  // @app/ui components that use inject (AppTab, AppSegmentedItem, AppRadio) would throw
  // without their parent providers in a shallow mount. Use shallow: true to avoid this.
};

describe('FoundationsPage', () => {
  it('renders the Foundations heading', () => {
    const wrapper = mount(FoundationsPage, { global: { stubs }, shallow: true });
    expect(wrapper.text()).toContain('Foundations');
  });

  it('renders all 16 section headings', () => {
    const wrapper = mount(FoundationsPage, { global: { stubs }, shallow: true });
    const sectionTitles = wrapper
      .findAll('.page-foundations__section-title')
      .map((el) => el.text().trim());
    expect(sectionTitles.length).toBeGreaterThanOrEqual(16);
  });

  it('renders the color token section', () => {
    const wrapper = mount(FoundationsPage, { global: { stubs }, shallow: true });
    expect(wrapper.find('[data-token-category="color"]').exists()).toBe(true);
  });

  it('renders the spacing token section', () => {
    const wrapper = mount(FoundationsPage, { global: { stubs }, shallow: true });
    expect(wrapper.find('[data-token-category="spacing"]').exists()).toBe(true);
  });

  it('renders the radius token section', () => {
    const wrapper = mount(FoundationsPage, { global: { stubs }, shallow: true });
    expect(wrapper.find('[data-token-category="radius"]').exists()).toBe(true);
  });

  it('renders the typography section', () => {
    const wrapper = mount(FoundationsPage, { global: { stubs }, shallow: true });
    expect(wrapper.find('[data-token-category="typography"]').exists()).toBe(true);
  });

  it('renders the motion section', () => {
    const wrapper = mount(FoundationsPage, { global: { stubs }, shallow: true });
    expect(wrapper.find('[data-token-category="motion"]').exists()).toBe(true);
  });

  it('renders the buttons section', () => {
    const wrapper = mount(FoundationsPage, { global: { stubs }, shallow: true });
    expect(wrapper.find('[data-token-category="buttons"]').exists()).toBe(true);
  });

  it('renders the inputs section', () => {
    const wrapper = mount(FoundationsPage, { global: { stubs }, shallow: true });
    expect(wrapper.find('[data-token-category="inputs"]').exists()).toBe(true);
  });

  it('renders the cards section', () => {
    const wrapper = mount(FoundationsPage, { global: { stubs }, shallow: true });
    expect(wrapper.find('[data-token-category="cards"]').exists()).toBe(true);
  });

  it('renders the rows section', () => {
    const wrapper = mount(FoundationsPage, { global: { stubs }, shallow: true });
    expect(wrapper.find('[data-token-category="rows"]').exists()).toBe(true);
  });

  it('renders the tabs section', () => {
    const wrapper = mount(FoundationsPage, { global: { stubs }, shallow: true });
    expect(wrapper.find('[data-token-category="tabs"]').exists()).toBe(true);
  });

  it('renders the feedback section', () => {
    const wrapper = mount(FoundationsPage, { global: { stubs }, shallow: true });
    expect(wrapper.find('[data-token-category="feedback"]').exists()).toBe(true);
  });

  it('renders the overlays section', () => {
    const wrapper = mount(FoundationsPage, { global: { stubs }, shallow: true });
    expect(wrapper.find('[data-token-category="overlays"]').exists()).toBe(true);
  });

  it('renders the progress section', () => {
    const wrapper = mount(FoundationsPage, { global: { stubs }, shallow: true });
    expect(wrapper.find('[data-token-category="progress"]').exists()).toBe(true);
  });

  it('renders the empty states section', () => {
    const wrapper = mount(FoundationsPage, { global: { stubs }, shallow: true });
    expect(wrapper.find('[data-token-category="empty"]').exists()).toBe(true);
  });

  it('renders the skeletons section', () => {
    const wrapper = mount(FoundationsPage, { global: { stubs }, shallow: true });
    expect(wrapper.find('[data-token-category="skeletons"]').exists()).toBe(true);
  });

  it('renders the avatar section', () => {
    const wrapper = mount(FoundationsPage, { global: { stubs }, shallow: true });
    expect(wrapper.find('[data-token-category="avatar"]').exists()).toBe(true);
  });

  it('renders the chips section', () => {
    const wrapper = mount(FoundationsPage, { global: { stubs }, shallow: true });
    expect(wrapper.find('[data-token-category="chips"]').exists()).toBe(true);
  });
});
