import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AppProgressCircle from './AppProgressCircle.vue';

describe('AppProgressCircle', () => {
  // --- ARIA structure ---

  it('has role="progressbar"', () => {
    const wrapper = mount(AppProgressCircle, { props: { value: 50 } });
    expect(wrapper.find('svg').attributes('role')).toBe('progressbar');
  });

  it('sets aria-valuemin=0, aria-valuemax=100, aria-valuenow', () => {
    const wrapper = mount(AppProgressCircle, { props: { value: 60 } });
    const svg = wrapper.find('svg');
    expect(svg.attributes('aria-valuemin')).toBe('0');
    expect(svg.attributes('aria-valuemax')).toBe('100');
    expect(svg.attributes('aria-valuenow')).toBe('60');
  });

  it('sets aria-label when label prop is provided', () => {
    const wrapper = mount(AppProgressCircle, {
      props: { value: 50, label: 'Course completion' },
    });
    expect(wrapper.find('svg').attributes('aria-label')).toBe('Course completion');
  });

  // --- SVG geometry ---

  it('uses default size of 32 and stroke of 3', () => {
    const wrapper = mount(AppProgressCircle, { props: { value: 50 } });
    const svg = wrapper.find('svg');
    expect(svg.attributes('width')).toBe('32');
    expect(svg.attributes('height')).toBe('32');
  });

  it('uses custom size prop', () => {
    const wrapper = mount(AppProgressCircle, { props: { value: 50, size: 48 } });
    const svg = wrapper.find('svg');
    expect(svg.attributes('width')).toBe('48');
    expect(svg.attributes('height')).toBe('48');
  });

  it('renders two circle elements (track + fill)', () => {
    const wrapper = mount(AppProgressCircle, { props: { value: 50 } });
    expect(wrapper.findAll('circle')).toHaveLength(2);
  });

  it('track circle has the track class', () => {
    const wrapper = mount(AppProgressCircle, { props: { value: 50 } });
    expect(wrapper.find('.app-progress-circle__track').exists()).toBe(true);
  });

  it('fill circle has the fill class', () => {
    const wrapper = mount(AppProgressCircle, { props: { value: 50 } });
    expect(wrapper.find('.app-progress-circle__fill').exists()).toBe(true);
  });

  it('fill circle has stroke-dashoffset set', () => {
    const wrapper = mount(AppProgressCircle, { props: { value: 50 } });
    const fill = wrapper.find('.app-progress-circle__fill');
    // stroke-dashoffset should be a number string
    const offset = fill.attributes('stroke-dashoffset');
    expect(typeof Number(offset)).toBe('number');
    expect(Number(offset)).toBeGreaterThanOrEqual(0);
  });

  it('offset is 0 (fully complete) when value=100', () => {
    const wrapper = mount(AppProgressCircle, { props: { value: 100 } });
    const fill = wrapper.find('.app-progress-circle__fill');
    expect(Number(fill.attributes('stroke-dashoffset'))).toBeCloseTo(0, 2);
  });

  it('offset equals circumference (fully empty) when value=0', () => {
    const wrapper = mount(AppProgressCircle, { props: { value: 0 } });
    const fill = wrapper.find('.app-progress-circle__fill');
    const dashArray = Number(fill.attributes('stroke-dasharray'));
    const offset = Number(fill.attributes('stroke-dashoffset'));
    expect(offset).toBeCloseTo(dashArray, 2);
  });
});
