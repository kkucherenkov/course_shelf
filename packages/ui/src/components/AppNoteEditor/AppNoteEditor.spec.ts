import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import AppNoteEditor from './AppNoteEditor.vue';

function makeWrapper(props: Record<string, unknown> = {}) {
  return mount(AppNoteEditor, {
    props: { modelValue: '', ...props },
    attachTo: document.body,
  });
}

describe('AppNoteEditor', () => {
  describe('mode toggle', () => {
    it('renders the textarea in edit mode (default)', () => {
      const wrapper = makeWrapper({ modelValue: 'hi' });
      expect(wrapper.find('textarea').exists()).toBe(true);
      expect(wrapper.find('.app-note-editor__body--view').exists()).toBe(false);
    });

    it('renders the rendered preview in view mode', () => {
      const wrapper = makeWrapper({ modelValue: '**bold**', mode: 'view' });
      expect(wrapper.find('textarea').exists()).toBe(false);
      const preview = wrapper.find('.app-note-editor__body--view');
      expect(preview.exists()).toBe(true);
      expect(preview.html()).toContain('<strong>bold</strong>');
    });

    it('emits update:mode when toggling', async () => {
      const wrapper = makeWrapper({ modelValue: '', mode: 'edit' });
      const toggle = wrapper.findAll('button').find((b) => b.text() === 'Preview')!;
      await toggle.trigger('click');
      expect(wrapper.emitted('update:mode')).toEqual([['view']]);
    });

    it('disables every toolbar tool in view mode', () => {
      const wrapper = makeWrapper({ modelValue: '', mode: 'view' });
      const tools = wrapper.findAll('.app-note-editor__tool');
      expect(tools.length).toBeGreaterThan(0);
      for (const tool of tools) {
        expect((tool.element as HTMLButtonElement).disabled).toBe(true);
      }
    });
  });

  describe('toolbar actions', () => {
    it('Bold wraps the current selection with **…**', async () => {
      const wrapper = makeWrapper({ modelValue: 'hello world' });
      const ta = wrapper.find('textarea').element as HTMLTextAreaElement;
      ta.setSelectionRange(0, 5);
      await wrapper.find('button[aria-label="Bold"]').trigger('click');
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['**hello** world']);
    });

    it('Italic wraps with single *', async () => {
      const wrapper = makeWrapper({ modelValue: 'hi' });
      const ta = wrapper.find('textarea').element as HTMLTextAreaElement;
      ta.setSelectionRange(0, 2);
      await wrapper.find('button[aria-label="Italic"]').trigger('click');
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['*hi*']);
    });

    it('Heading inserts "# " at the start of the current line', async () => {
      const wrapper = makeWrapper({ modelValue: 'first\nsecond' });
      const ta = wrapper.find('textarea').element as HTMLTextAreaElement;
      // caret on the second line
      ta.setSelectionRange(8, 8);
      await wrapper.find('button[aria-label="Heading"]').trigger('click');
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['first\n# second']);
    });

    it('List inserts "- " at the start of the current line', async () => {
      const wrapper = makeWrapper({ modelValue: 'item' });
      const ta = wrapper.find('textarea').element as HTMLTextAreaElement;
      ta.setSelectionRange(2, 2);
      await wrapper.find('button[aria-label="List"]').trigger('click');
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['- item']);
    });

    it('Link wraps the selection with [sel](url)', async () => {
      const wrapper = makeWrapper({ modelValue: 'see docs' });
      const ta = wrapper.find('textarea').element as HTMLTextAreaElement;
      ta.setSelectionRange(4, 8); // "docs"
      await wrapper.find('button[aria-label="Link"]').trigger('click');
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['see [docs](url)']);
    });

    it('Link inserts placeholder text when nothing is selected', async () => {
      const wrapper = makeWrapper({ modelValue: 'before' });
      const ta = wrapper.find('textarea').element as HTMLTextAreaElement;
      ta.setSelectionRange(6, 6);
      await wrapper.find('button[aria-label="Link"]').trigger('click');
      expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['before[link](url)']);
    });
  });

  describe('markdown renderer', () => {
    it('escapes raw HTML in input', () => {
      const wrapper = makeWrapper({
        modelValue: '<script>alert(1)</script>',
        mode: 'view',
      });
      const html = wrapper.find('.app-note-editor__body--view').html();
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('renders #/##/### as h1/h2/h3', () => {
      const wrapper = makeWrapper({
        modelValue: '# A\n\n## B\n\n### C',
        mode: 'view',
      });
      const html = wrapper.find('.app-note-editor__body--view').html();
      expect(html).toContain('<h1>A</h1>');
      expect(html).toContain('<h2>B</h2>');
      expect(html).toContain('<h3>C</h3>');
    });

    it('renders consecutive "- " lines as a single <ul>', () => {
      const wrapper = makeWrapper({
        modelValue: '- one\n- two\n- three',
        mode: 'view',
      });
      const ul = wrapper.find('.app-note-editor__body--view ul');
      expect(ul.exists()).toBe(true);
      const items = ul.findAll('li').map((li) => li.text());
      expect(items).toEqual(['one', 'two', 'three']);
    });

    it('renders **bold** and *italic* inline', () => {
      const wrapper = makeWrapper({
        modelValue: 'a **b** *c* d',
        mode: 'view',
      });
      const html = wrapper.find('.app-note-editor__body--view').html();
      expect(html).toContain('<strong>b</strong>');
      expect(html).toContain('<em>c</em>');
    });

    it('renders links with rel=noopener and an http(s)/mailto allowlist', () => {
      const wrapper = makeWrapper({
        modelValue: '[ok](https://example.com) [bad](javascript:alert(1))',
        mode: 'view',
      });
      const html = wrapper.find('.app-note-editor__body--view').html();
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('rel="noopener noreferrer"');
      expect(html).not.toContain('javascript:');
      expect(html).toContain('href="#"'); // unsafe URL replaced with #
    });
  });

  describe('debounced save', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('emits save once after debounceMs of quiet', async () => {
      const wrapper = makeWrapper({ modelValue: '', debounceMs: 600 });
      await wrapper.setProps({ modelValue: 'a' });
      vi.advanceTimersByTime(300);
      await wrapper.setProps({ modelValue: 'ab' });
      vi.advanceTimersByTime(300);
      expect(wrapper.emitted('save')).toBeUndefined();
      vi.advanceTimersByTime(300);
      await nextTick();
      expect(wrapper.emitted('save')).toEqual([['ab']]);
    });

    it('does not fire save after unmount', async () => {
      const wrapper = makeWrapper({ modelValue: '', debounceMs: 600 });
      await wrapper.setProps({ modelValue: 'pending' });
      wrapper.unmount();
      vi.advanceTimersByTime(1000);
      expect(wrapper.emitted('save')).toBeUndefined();
    });
  });

  describe('sync indicator', () => {
    it('shows the bare "Saved" label when savedAt is missing', () => {
      const wrapper = makeWrapper({ modelValue: '', syncState: 'saved' });
      expect(wrapper.find('.app-note-editor__sync').text()).toContain('Saved');
      expect(wrapper.find('.app-note-editor__sync').text()).not.toContain('ago');
    });

    it('formats "Saved · Ns ago" with the time-since helper', () => {
      const now = Date.now();
      const wrapper = makeWrapper({
        modelValue: '',
        syncState: 'saved',
        savedAt: now - 30_000,
      });
      expect(wrapper.find('.app-note-editor__sync').text()).toContain('Saved · 30s ago');
    });

    it('shows "Syncing…" / "Failed — retrying" / "Offline — queued"', async () => {
      const wrapper = makeWrapper({ modelValue: '', syncState: 'syncing' });
      expect(wrapper.find('.app-note-editor__sync').text()).toContain('Syncing');

      await wrapper.setProps({ syncState: 'failed' });
      expect(wrapper.find('.app-note-editor__sync').text()).toContain('Failed — retrying');

      await wrapper.setProps({ syncState: 'offline' });
      expect(wrapper.find('.app-note-editor__sync').text()).toContain('Offline — queued');
    });

    it('emits retry when the Retry button is clicked in failed state', async () => {
      const wrapper = makeWrapper({ modelValue: '', syncState: 'failed' });
      const retry = wrapper.findAll('button').find((b) => b.text() === 'Retry')!;
      await retry.trigger('click');
      expect(wrapper.emitted('retry')).toEqual([[]]);
    });

    it('uses role=status + aria-live=polite for screen readers', () => {
      const wrapper = makeWrapper({ modelValue: '' });
      const sync = wrapper.find('.app-note-editor__sync');
      expect(sync.attributes('role')).toBe('status');
      expect(sync.attributes('aria-live')).toBe('polite');
    });
  });
});
