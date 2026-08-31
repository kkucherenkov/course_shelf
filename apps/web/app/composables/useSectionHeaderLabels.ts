import { computed, type ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';

export interface SectionHeaderLabels {
  /** Word before the padded section index. */
  sectionLabel: ComputedRef<string>;
  /** Pluralised lesson count. */
  formatLessons: (count: number) => string;
  /** Section runtime, from raw seconds. */
  formatDuration: (seconds: number) => string;
}

/**
 * The strings `AppSectionHeader` renders. `@app/ui` has no locale and never
 * calls `t()` itself, so every outline screen hands it the same translated set
 * from here rather than re-deriving it.
 */
export function useSectionHeaderLabels(): SectionHeaderLabels {
  const { t } = useI18n();

  return {
    sectionLabel: computed(() => t('ui.sectionHeader.section')),

    formatLessons: (count) => t('ui.sectionHeader.lessons', count, { named: { n: count } }),

    formatDuration: (seconds) => {
      const total = Math.max(0, Math.floor(seconds));
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      if (h > 0) {
        return m > 0
          ? t('ui.sectionHeader.durationHm', { h, m })
          : t('ui.sectionHeader.durationH', { h });
      }
      return t('ui.sectionHeader.durationM', { m });
    },
  };
}
