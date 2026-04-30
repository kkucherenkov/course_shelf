/**
 * Client-only plugin that writes the `data-density` attribute on `<html>`
 * from the preferences store.
 *
 * Runs before any page is rendered (plugin order: 00, 01, …) so the
 * attribute is in place before CSS layout queries it. Watching the ref
 * means live changes from the settings page are reflected immediately
 * without a reload.
 */

import { watch } from 'vue';
import { usePreferencesStore } from '~/stores/preferences';

function applyDensity(value: string): void {
  document.documentElement.dataset.density = value;
}

export default defineNuxtPlugin(() => {
  const prefs = usePreferencesStore();

  // Apply on boot.
  applyDensity(prefs.density);

  // Apply on every future change.
  watch(
    () => prefs.density,
    (v) => {
      applyDensity(v);
    },
  );
});
