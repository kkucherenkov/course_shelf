import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import { IconCS } from './';

const ALL_NAMES = [
  'play',
  'pause',
  'next',
  'prev',
  'home',
  'home-fill',
  'library',
  'library-fill',
  'search',
  'search-fill',
  'settings',
  'settings-fill',
  'check',
  'check-circle',
  'circle',
  'lock',
  'download',
  'download-fill',
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

  describe('filled nav glyphs', () => {
    const NAV_FILL_NAMES = [
      'home-fill',
      'library-fill',
      'download-fill',
      'search-fill',
      'settings-fill',
    ] as const;

    // The <svg> envelope sets stroke="currentColor" stroke-width="1.5"; a
    // silhouette that forgets stroke="none" is painted 0.75 units fatter than
    // it was drawn.
    it.each(NAV_FILL_NAMES)('%s paints solid and opts out of the envelope stroke', (name) => {
      const wrapper = mount(IconCS, { props: { name } });
      const shapes = wrapper.findAll('path, rect, circle');
      expect(shapes.length).toBeGreaterThan(0);
      for (const shape of shapes) {
        expect(shape.attributes('fill')).toBe('currentColor');
        expect(shape.attributes('stroke')).toBe('none');
      }
    });

    // The outlines these replace are open stroked paths — mechanically filling
    // them paints garbage, so each is a separately drawn closed silhouette.
    it.each(NAV_FILL_NAMES)('%s ignores the fill prop', (name) => {
      const outline = mount(IconCS, { props: { name } });
      const filled = mount(IconCS, { props: { name, fill: true } });
      expect(filled.html()).toBe(outline.html());
    });

    it('keeps the negative space that carries meaning', () => {
      // search must read as a magnifier (lens hole + handle), not a disc;
      // settings must keep the gear's centre hole.
      for (const name of ['search-fill', 'settings-fill'] as const) {
        const wrapper = mount(IconCS, { props: { name } });
        expect(wrapper.find('path').attributes('fill-rule')).toBe('evenodd');
      }
    });
  });
});
