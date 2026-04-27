import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { IconCS } from './';

const ALL_NAMES = [
  'play',
  'pause',
  'next',
  'prev',
  'home',
  'library',
  'search',
  'settings',
  'check',
  'check-circle',
  'circle',
  'lock',
  'download',
  'cloud',
  'cloud-down',
  'bookmark',
  'note',
  'pdf',
  'folder',
  'user',
  'users',
  'plus',
  'minus',
  'x',
  'chevron-right',
  'chevron-left',
  'chevron-down',
  'chevron-up',
  'arrow-right',
  'sun',
  'moon',
  'volume',
  'volume-mute',
  'subtitles',
  'fullscreen',
  'pip',
  'speed',
  'list',
  'grid',
  'filter',
  'sort',
  'eye',
  'eye-off',
  'mail',
  'key',
  'shield',
  'alert',
  'info',
  'wifi-off',
  'refresh',
  'edit',
  'trash',
  'copy',
  'logout',
  'menu',
  'more',
  'clock',
  'calendar',
  'at',
  'sliders',
  'arrow-left',
  'more-h',
  'corner-down-right',
  'hard-drive',
  'github',
  'banner',
] as const;

describe('IconCS', () => {
  it.each(ALL_NAMES)('renders %s with valid SVG', (name) => {
    const wrapper = mount(IconCS, { props: { name } });
    const svg = wrapper.find('svg');
    expect(svg.exists()).toBe(true);
    expect(svg.attributes('viewBox')).toBe('0 0 24 24');
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('is aria-hidden by default', () => {
    const wrapper = mount(IconCS, { props: { name: 'play' } });
    expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true');
    expect(wrapper.find('svg').attributes('role')).toBeUndefined();
    expect(wrapper.find('svg').attributes('aria-label')).toBeUndefined();
  });

  it('exposes role="img" + aria-label + <title> when title is given', () => {
    const wrapper = mount(IconCS, { props: { name: 'play', title: 'Play video' } });
    const svg = wrapper.find('svg');
    expect(svg.attributes('aria-hidden')).toBeUndefined();
    expect(svg.attributes('role')).toBe('img');
    expect(svg.attributes('aria-label')).toBe('Play video');
    expect(wrapper.find('title').text()).toBe('Play video');
  });

  it('honours fill on play (filled triangle)', () => {
    const wrapper = mount(IconCS, { props: { name: 'play', fill: true } });
    const path = wrapper.find('path');
    expect(path.attributes('fill')).toBe('currentColor');
  });

  it('honours fill on bookmark', () => {
    const wrapper = mount(IconCS, { props: { name: 'bookmark', fill: true } });
    expect(wrapper.html()).toContain('currentColor');
  });
});
