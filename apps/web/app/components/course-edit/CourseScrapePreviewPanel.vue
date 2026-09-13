<script setup lang="ts">
  /**
   * "Fill from source" panel (E30-F03-S01) — the other half of the metadata
   * editor. Fetches candidate metadata via `scrapeCoursePreview` and applies
   * it **one field at a time** into the same `form`/`setField` the manual
   * form uses, so an applied field is marked touched exactly like a typed
   * one and travels through the same partial-update payload.
   *
   * `instructorNames` / `studioName` / `tags` are shown for reference only —
   * they are raw scraped names, not entity ids, and resolving them is the
   * identify pipeline's job (Stage 4, out of scope here). The admin reads
   * the name and picks the matching entity in the pickers above instead.
   */
  import { computed, ref } from 'vue';
  import {
    AppField,
    AppTextField,
    AppSelect,
    AppSegmented,
    AppSegmentedItem,
    AppButton,
  } from '@app/ui';
  import type { CourseLevel, ScrapeCandidateDto } from '@app/api-client-ts';
  import type { CourseFormField, CourseFormState } from '~/composables/useCourseEdit';
  import { useCourseScrapePreview } from '~/composables/useCourseScrapePreview';

  const props = defineProps<{
    courseId: string;
    form: CourseFormState;
    setField: <K extends CourseFormField>(key: K, value: CourseFormState[K]) => void;
    setRating: (average: number | null, count: number | null) => void;
  }>();

  const { t } = useI18n();
  const { candidates, status, scrapers, run } = useCourseScrapePreview(props.courseId);

  // ── Query form ────────────────────────────────────────────────────────────────

  const kind = ref<'url' | 'name'>('url');
  const queryValue = ref('');
  const sourceId = ref<string | null>(null);
  const runError = ref('');

  const nameCapableScrapers = computed(() =>
    scrapers.value.filter((s) => s.supportedKinds.includes('name')),
  );

  async function onRun(): Promise<void> {
    runError.value = '';
    const value = queryValue.value.trim();
    if (!value) {
      runError.value = t('pages.courseEdit.scrapePreview.queryRequiredError');
      return;
    }
    const source = sourceId.value;
    if (kind.value === 'name' && !source) {
      runError.value = t('pages.courseEdit.scrapePreview.sourceRequiredError');
      return;
    }
    const err = await run(
      kind.value === 'url'
        ? { kind: 'url', url: value }
        : { kind: 'name', query: value, source: source ?? '' },
    );
    if (err) runError.value = t('pages.courseEdit.scrapePreview.error');
  }

  // ── Field comparison ──────────────────────────────────────────────────────────

  const levelLabels: Record<CourseLevel, string> = {
    beginner: t('pages.courseEdit.level.beginner'),
    intermediate: t('pages.courseEdit.level.intermediate'),
    advanced: t('pages.courseEdit.level.advanced'),
    expert: t('pages.courseEdit.level.expert'),
    all_levels: t('pages.courseEdit.level.all_levels'),
  };

  function levelLabel(level: CourseLevel | null): string {
    return level ? levelLabels[level] : t('pages.courseEdit.level.unset');
  }

  interface CompareRow {
    key: string;
    label: string;
    current: string;
    candidateValue: string | null;
    apply: () => void;
  }

  function rowsFor(candidate: ScrapeCandidateDto): CompareRow[] {
    const f = candidate.fragment;
    const rows: CompareRow[] = [
      {
        key: 'title',
        label: t('pages.courseEdit.scrapePreview.fields.title'),
        current: props.form.title,
        candidateValue: f.title ?? null,
        apply: () => {
          props.setField('title', f.title ?? '');
        },
      },
      {
        key: 'description',
        label: t('pages.courseEdit.scrapePreview.fields.description'),
        current: props.form.description,
        candidateValue: f.description ?? null,
        apply: () => {
          props.setField('description', f.description ?? '');
        },
      },
      {
        key: 'level',
        label: t('pages.courseEdit.scrapePreview.fields.level'),
        current: levelLabel(props.form.level),
        candidateValue: f.level ? levelLabel(f.level) : null,
        apply: () => {
          props.setField('level', f.level ?? null);
        },
      },
      {
        key: 'language',
        label: t('pages.courseEdit.scrapePreview.fields.language'),
        current: props.form.language,
        candidateValue: f.language ?? null,
        apply: () => {
          props.setField('language', f.language ?? '');
        },
      },
      {
        key: 'releaseDate',
        label: t('pages.courseEdit.scrapePreview.fields.releaseDate'),
        current: props.form.releaseDate,
        candidateValue: f.releaseDate ?? null,
        apply: () => {
          props.setField('releaseDate', f.releaseDate ?? '');
        },
      },
      {
        key: 'posterUrl',
        label: t('pages.courseEdit.scrapePreview.fields.posterUrl'),
        current: props.form.posterUrl,
        candidateValue: f.posterUrl ?? null,
        apply: () => {
          props.setField('posterUrl', f.posterUrl ?? '');
        },
      },
      {
        key: 'rating',
        label: t('pages.courseEdit.scrapePreview.fields.rating'),
        current:
          props.form.ratingAverage !== null && props.form.ratingCount !== null
            ? `${String(props.form.ratingAverage)} (${String(props.form.ratingCount)})`
            : '',
        candidateValue:
          f.ratingAverage !== undefined && f.ratingCount !== undefined
            ? `${String(f.ratingAverage)} (${String(f.ratingCount)})`
            : null,
        apply: () => {
          props.setRating(f.ratingAverage ?? null, f.ratingCount ?? null);
        },
      },
      {
        key: 'externalIds',
        label: t('pages.courseEdit.scrapePreview.fields.externalIds'),
        current: String(props.form.externalIds.length),
        candidateValue: f.externalIds ? String(f.externalIds.length) : null,
        apply: () => {
          props.setField('externalIds', f.externalIds ?? []);
        },
      },
    ];
    return rows;
  }

  function nameHints(candidate: ScrapeCandidateDto): { label: string; value: string }[] {
    const f = candidate.fragment;
    const hints: { label: string; value: string }[] = [];
    if (f.instructorNames?.length) {
      hints.push({
        label: t('pages.courseEdit.scrapePreview.fields.instructorNames'),
        value: f.instructorNames.join(', '),
      });
    }
    if (f.studioName) {
      hints.push({
        label: t('pages.courseEdit.scrapePreview.fields.studioName'),
        value: f.studioName,
      });
    }
    if (f.tags?.length) {
      hints.push({
        label: t('pages.courseEdit.scrapePreview.fields.tags'),
        value: f.tags.join(', '),
      });
    }
    return hints;
  }
</script>

<template>
  <section class="course-scrape-preview">
    <h3 class="course-scrape-preview__heading">
      {{ t('pages.courseEdit.scrapePreview.heading') }}
    </h3>
    <p class="course-scrape-preview__subtitle">
      {{ t('pages.courseEdit.scrapePreview.subtitle') }}
    </p>

    <div class="course-scrape-preview__query">
      <AppSegmented v-model="kind" :label="t('pages.courseEdit.scrapePreview.kindLabel')">
        <AppSegmentedItem value="url" :label="t('pages.courseEdit.scrapePreview.kindUrl')" />
        <AppSegmentedItem value="name" :label="t('pages.courseEdit.scrapePreview.kindName')" />
      </AppSegmented>

      <AppTextField
        class="course-scrape-preview__query-input"
        :label="
          kind === 'url'
            ? t('pages.courseEdit.scrapePreview.kindUrl')
            : t('pages.courseEdit.scrapePreview.kindName')
        "
        :placeholder="
          kind === 'url'
            ? t('pages.courseEdit.scrapePreview.urlPlaceholder')
            : t('pages.courseEdit.scrapePreview.namePlaceholder')
        "
        :model-value="queryValue"
        @update:model-value="queryValue = $event"
      />

      <AppField v-if="kind === 'name'" :label="t('pages.courseEdit.scrapePreview.sourceLabel')">
        <template #default="slotAttrs">
          <AppSelect
            v-bind="slotAttrs"
            :model-value="sourceId"
            :options="nameCapableScrapers.map((s) => ({ id: s.id, label: s.id }))"
            :placeholder="t('pages.courseEdit.scrapePreview.sourcePlaceholder')"
            @update:model-value="sourceId = $event"
          />
        </template>
      </AppField>

      <AppButton
        type="button"
        variant="secondary"
        :label="
          status === 'pending'
            ? t('pages.courseEdit.scrapePreview.running')
            : t('pages.courseEdit.scrapePreview.run')
        "
        :loading="status === 'pending'"
        @click="onRun"
      />
    </div>

    <p v-if="runError" class="course-scrape-preview__error">{{ runError }}</p>

    <p v-if="status === 'success' && candidates.length === 0" class="course-scrape-preview__empty">
      {{ t('pages.courseEdit.scrapePreview.noneFound') }}
    </p>
    <p v-else-if="status === 'idle'" class="course-scrape-preview__empty">
      {{ t('pages.courseEdit.scrapePreview.empty') }}
    </p>

    <article
      v-for="(candidate, ci) in candidates"
      :key="ci"
      class="course-scrape-preview__candidate"
    >
      <header class="course-scrape-preview__candidate-head">
        <span class="course-scrape-preview__candidate-source">{{ candidate.source }}</span>
      </header>

      <table class="course-scrape-preview__table">
        <thead>
          <tr>
            <th />
            <th>{{ t('pages.courseEdit.scrapePreview.current') }}</th>
            <th>{{ t('pages.courseEdit.scrapePreview.candidate') }}</th>
            <th />
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rowsFor(candidate)" :key="row.key">
            <th scope="row">{{ row.label }}</th>
            <td>{{ row.current || '—' }}</td>
            <td>{{ row.candidateValue ?? t('pages.courseEdit.scrapePreview.unavailable') }}</td>
            <td>
              <AppButton
                type="button"
                variant="ghost"
                size="sm"
                :label="t('pages.courseEdit.scrapePreview.apply')"
                :disabled="row.candidateValue === null"
                @click="row.apply()"
              />
            </td>
          </tr>
        </tbody>
      </table>

      <p v-for="hint in nameHints(candidate)" :key="hint.label" class="course-scrape-preview__hint">
        <strong>{{ hint.label }}:</strong> {{ hint.value }}
        <span class="course-scrape-preview__hint-note">{{
          t('pages.courseEdit.scrapePreview.entityHint')
        }}</span>
      </p>
    </article>
  </section>
</template>

<style scoped lang="scss">
  .course-scrape-preview {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-5);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-lg);
    background: var(--surface-raised);

    &__heading {
      margin: 0;
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--text-loud);
    }

    &__subtitle {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__query {
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      gap: var(--space-3);
    }

    &__query-input {
      flex: 1 1 240px;
      min-width: 0;
    }

    &__error {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--status-error-fg);
    }

    &__empty {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__candidate {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      padding: var(--space-4);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      background: var(--surface-surface);
    }

    &__candidate-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    &__candidate-source {
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--text-secondary);
    }

    &__table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--text-sm);

      th,
      td {
        padding: var(--space-2) var(--space-3);
        text-align: start;
        border-bottom: 1px solid var(--border-default);
      }

      thead th {
        color: var(--text-secondary);
        font-weight: 500;
      }

      tbody th {
        font-weight: 500;
        color: var(--text-fg);
      }
    }

    &__hint {
      margin: 0;
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    &__hint-note {
      display: block;
      font-style: italic;
    }
  }
</style>
