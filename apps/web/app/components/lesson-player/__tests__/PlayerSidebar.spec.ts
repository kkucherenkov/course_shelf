/**
 * Spec for PlayerSidebar's tablist accessible name (#597).
 *
 * `AppTabs`' `label` prop becomes the `role="tablist"`'s `aria-label`.
 * Reusing `tabSections` there gave the tablist the exact same accessible
 * name as its own first tab — a screen reader announced "Sections, tablist,
 * Sections, tab 1 of 5". The fix is a distinct `tabsLabel` prop; this only
 * covers that the two names differ, since `AppTabs` itself already has its
 * own coverage for wiring `label` to `aria-label`.
 */

import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';

import PlayerSidebar from '../PlayerSidebar.vue';

// The `@app/ui` barrel re-exports components that need Nuxt's build context
// (`#build/ui/*`), unavailable under plain vitest — every spec in this repo
// mocks it rather than importing it live. These fakes mirror the one
// accessibility contract under test: `label` → the tablist's `aria-label`,
// and each `AppTab`'s own `label` renders as its text content.
vi.mock('@app/ui', () => ({
  AppTabs: {
    name: 'AppTabs',
    props: ['modelValue', 'label'],
    template: '<div role="tablist" :aria-label="label"><slot /></div>',
  },
  AppTab: {
    name: 'AppTab',
    props: ['value', 'label'],
    template: '<button role="tab">{{ label }}</button>',
  },
}));

const baseProps = {
  sections: [],
  courseId: 'c1',
  currentLessonId: 'l1',
  bookmarks: [],
  materials: [],
  currentTime: 0,
  tabsLabel: 'Lesson sidebar',
  tabSections: 'Sections',
  tabNotes: 'Notes',
  tabBookmarks: 'Bookmarks',
  tabMaterials: 'Materials',
  bookmarksEmptyTitle: 'No bookmarks yet',
  bookmarksEmptyBody: 'Add a bookmark to see it here.',
  bookmarksAddLabel: '+ Bookmark',
  materialsEmptyLabel: 'No materials',
};

function mountSidebar() {
  return mount(PlayerSidebar, {
    props: baseProps,
    global: {
      stubs: {
        PlayerSectionsTab: true,
        PlayerNotesTab: true,
        PlayerBookmarksTab: true,
        PlayerMaterialsTab: true,
      },
    },
  });
}

describe('PlayerSidebar — tablist accessible name (#597)', () => {
  it("gives the tablist its own aria-label, distinct from the first tab's label", () => {
    const wrapper = mountSidebar();
    const tablist = wrapper.find('[role="tablist"]');
    const firstTab = wrapper.find('[role="tab"]');

    expect(tablist.attributes('aria-label')).toBe('Lesson sidebar');
    expect(tablist.attributes('aria-label')).not.toBe(firstTab.text());
  });
});

describe('PlayerSidebar — tabs', () => {
  it('offers four tabs, with the transcript no longer among them', () => {
    const wrapper = mountSidebar();
    const tabs = wrapper.findAll('[role="tab"]');
    expect(tabs).toHaveLength(4);
    expect(tabs.map((t) => t.text())).toEqual(['Sections', 'Notes', 'Bookmarks', 'Materials']);
  });
});
