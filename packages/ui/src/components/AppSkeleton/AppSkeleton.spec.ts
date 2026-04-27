import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppSkeleton from './AppSkeleton.vue';

describe('AppSkeleton', () => {
  it('renders a <span> element', () => {
    const wrapper = mount(AppSkeleton);
    expect(wrapper.element.tagName).toBe('SPAN');
  });

  it('is aria-hidden by default', () => {
    const wrapper = mount(AppSkeleton);
    expect(wrapper.attributes('aria-hidden')).toBe('true');
  });

  it('applies default width=100% and height=1em via inline style', () => {
    const wrapper = mount(AppSkeleton);
    expect(wrapper.attributes('style')).toContain('width: 100%');
    expect(wrapper.attributes('style')).toContain('height: 1em');
  });

  it('applies custom width and height via inline style', () => {
    const wrapper = mount(AppSkeleton, {
      props: { width: '200px', height: '16px' },
    });
    expect(wrapper.attributes('style')).toContain('width: 200px');
    expect(wrapper.attributes('style')).toContain('height: 16px');
  });

  it('applies sm radius modifier by default', () => {
    const wrapper = mount(AppSkeleton);
    expect(wrapper.classes()).toContain('app-skeleton--sm');
  });

  it('applies md radius modifier when radius="md"', () => {
    const wrapper = mount(AppSkeleton, { props: { radius: 'md' } });
    expect(wrapper.classes()).toContain('app-skeleton--md');
    expect(wrapper.classes()).not.toContain('app-skeleton--sm');
  });

  it('applies pill radius modifier when radius="pill"', () => {
    const wrapper = mount(AppSkeleton, { props: { radius: 'pill' } });
    expect(wrapper.classes()).toContain('app-skeleton--pill');
    expect(wrapper.classes()).not.toContain('app-skeleton--sm');
  });

  it('always has the base app-skeleton class', () => {
    const wrapper = mount(AppSkeleton);
    expect(wrapper.classes()).toContain('app-skeleton');
  });
});
