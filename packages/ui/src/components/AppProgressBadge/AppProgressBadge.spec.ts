import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';

import AppProgressBadge from './AppProgressBadge.vue';

const VARIANTS = ['ring', 'bar', 'pill'] as const;
const STATES = ['not-started', 'in-progress', 'completed', 'locked'] as const;

describe('AppProgressBadge', () => {
  it.each(VARIANTS.flatMap((v) => STATES.map((s) => [v, s] as const)))(
    'renders %s × %s with the right modifier classes',
    (variant, state) => {
      const wrapper = mount(AppProgressBadge, {
        props: { variant, state, completed: 4, total: 12 },
      });
      const root = wrapper.find('.app-progress-badge');
      expect(root.exists()).toBe(true);
      expect(root.classes()).toContain(`app-progress-badge--${variant}`);
      expect(root.classes()).toContain(`app-progress-badge--${state}`);
      expect(wrapper.html()).toMatchSnapshot();
    },
  );

  it('clamps percentage to 100 when state=completed regardless of completed/total', () => {
    const wrapper = mount(AppProgressBadge, {
      props: { variant: 'ring', state: 'completed', completed: 99, total: 100 },
    });
    expect(wrapper.find('.app-progress-badge').attributes('aria-label')).toBe('100%');
  });

  it('returns 0% when state=not-started even with positive completed', () => {
    const wrapper = mount(AppProgressBadge, {
      props: { variant: 'bar', state: 'not-started', completed: 5, total: 10 },
    });
    expect(wrapper.find('.app-progress-badge').attributes('aria-label')).toBe('0%');
  });

  it('returns 0% when state=locked', () => {
    const wrapper = mount(AppProgressBadge, {
      props: { variant: 'ring', state: 'locked', completed: 5, total: 10 },
    });
    expect(wrapper.find('.app-progress-badge').attributes('aria-label')).toBe('0%');
  });

  it('rounds percentage in in-progress state', () => {
    const wrapper = mount(AppProgressBadge, {
      props: { variant: 'bar', state: 'in-progress', completed: 1, total: 3 },
    });
    expect(wrapper.find('.app-progress-badge').attributes('aria-label')).toBe('33%');
  });

  it('handles total=0 without dividing by zero', () => {
    const wrapper = mount(AppProgressBadge, {
      props: { variant: 'bar', state: 'in-progress', completed: 0, total: 0 },
    });
    expect(wrapper.find('.app-progress-badge').attributes('aria-label')).toBe('0%');
  });

  it('pill renders "<completed> of <total>" for in-progress', () => {
    const wrapper = mount(AppProgressBadge, {
      props: { variant: 'pill', state: 'in-progress', completed: 4, total: 12 },
    });
    expect(wrapper.text()).toContain('4 of 12');
  });

  it('pill renders Done with check icon for completed', () => {
    const wrapper = mount(AppProgressBadge, {
      props: { variant: 'pill', state: 'completed' },
    });
    expect(wrapper.text()).toContain('Done');
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('pill renders Locked with lock icon for locked', () => {
    const wrapper = mount(AppProgressBadge, {
      props: { variant: 'pill', state: 'locked' },
    });
    expect(wrapper.text()).toContain('Locked');
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('pill renders em-dash for not-started', () => {
    const wrapper = mount(AppProgressBadge, {
      props: { variant: 'pill', state: 'not-started' },
    });
    expect(wrapper.text()).toBe('—');
  });
});
