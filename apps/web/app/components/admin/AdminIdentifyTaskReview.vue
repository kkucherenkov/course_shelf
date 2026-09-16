<script setup lang="ts">
  /**
   * Per-field identify-task review panel (E30-F03-S02).
   *
   * One `MergeMode` control per `MergePolicyDto` field, each showing the
   * course's current value next to the scraped fragment's. Calls `t()`
   * directly rather than taking pre-translated props — same choice as
   * `CourseMetadataForm`/`CourseScrapePreviewPanel`, the two components with
   * a comparably large internal string surface.
   */
  import { computed, reactive, ref } from 'vue';
  import { AppBadge, AppButton, AppDialog, AppSegmented, AppSegmentedItem } from '@app/ui';
  import type {
    CourseLevel,
    IdentifyTaskDto,
    CourseDto,
    MergeMode,
    MergePolicyDto,
  } from '@app/api-client-ts';
  import {
    buildMergePolicy,
    MERGE_POLICY_FIELDS,
    type MergePolicyField,
  } from '~/composables/useIdentifyTasks';

  const props = defineProps<{
    task: IdentifyTaskDto;
    /** `null` when the course fetch failed — current-value column reads blank. */
    course: CourseDto | null;
    applying: boolean;
    discarding: boolean;
  }>();

  const emit = defineEmits<{ apply: [policy: MergePolicyDto]; discard: [] }>();

  const { t } = useI18n();

  const readOnly = computed(() => props.task.status !== 'proposed');

  type BadgeColor = 'warning' | 'success' | 'neutral';
  const statusBadge = computed<{ label: string; color: BadgeColor }>(() => {
    const map: Record<IdentifyTaskDto['status'], { label: string; color: BadgeColor }> = {
      proposed: { label: t('pages.admin.identifyTasks.statusProposed'), color: 'warning' },
      applied: { label: t('pages.admin.identifyTasks.statusApplied'), color: 'success' },
      discarded: { label: t('pages.admin.identifyTasks.statusDiscarded'), color: 'neutral' },
    };
    return map[props.task.status];
  });

  // Per-field mode state, seeded from the task's stored policy — an omitted
  // field there defaults to `merge` (see `buildMergePolicy`), same as here.
  const modes = reactive<Record<MergePolicyField, MergeMode>>(
    Object.fromEntries(
      MERGE_POLICY_FIELDS.map((field) => [field, props.task.mergePolicy[field] ?? 'merge']),
    ) as Record<MergePolicyField, MergeMode>,
  );

  const modeLabels: Record<MergeMode, string> = {
    merge: t('pages.admin.identifyTaskDetail.mode.merge'),
    overwrite: t('pages.admin.identifyTaskDetail.mode.overwrite'),
    ignore: t('pages.admin.identifyTaskDetail.mode.ignore'),
  };

  const levelLabels: Record<CourseLevel, string> = {
    beginner: t('pages.courseEdit.level.beginner'),
    intermediate: t('pages.courseEdit.level.intermediate'),
    advanced: t('pages.courseEdit.level.advanced'),
    expert: t('pages.courseEdit.level.expert'),
    all_levels: t('pages.courseEdit.level.all_levels'),
  };

  function levelLabel(level: CourseLevel | null | undefined): string {
    return level ? levelLabels[level] : t('pages.courseEdit.level.unset');
  }

  interface FieldRow {
    key: MergePolicyField;
    label: string;
    current: string;
    candidate: string | null;
  }

  const rows = computed<FieldRow[]>(() => {
    const f = props.task.scrapedFragment;
    const c = props.course;

    return [
      {
        key: 'title',
        label: t('pages.admin.identifyTaskDetail.fields.title'),
        current: c?.title ?? '',
        candidate: f.title ?? null,
      },
      {
        key: 'description',
        label: t('pages.admin.identifyTaskDetail.fields.description'),
        current: c?.description ?? '',
        candidate: f.description ?? null,
      },
      {
        key: 'level',
        label: t('pages.admin.identifyTaskDetail.fields.level'),
        current: levelLabel(c?.level),
        candidate: f.level ? levelLabel(f.level) : null,
      },
      {
        key: 'language',
        label: t('pages.admin.identifyTaskDetail.fields.language'),
        current: c?.language ?? '',
        candidate: f.language ?? null,
      },
      {
        key: 'posterUrl',
        label: t('pages.admin.identifyTaskDetail.fields.posterUrl'),
        current: c?.posterUrl ?? '',
        candidate: f.posterUrl ?? null,
      },
      {
        key: 'releaseDate',
        label: t('pages.admin.identifyTaskDetail.fields.releaseDate'),
        current: c?.releaseDate ?? '',
        candidate: f.releaseDate ?? null,
      },
      {
        key: 'ratingAverage',
        label: t('pages.admin.identifyTaskDetail.fields.ratingAverage'),
        current: c?.ratingAverage != null ? String(c.ratingAverage) : '',
        candidate: f.ratingAverage != null ? String(f.ratingAverage) : null,
      },
      {
        key: 'ratingCount',
        label: t('pages.admin.identifyTaskDetail.fields.ratingCount'),
        current: c?.ratingCount != null ? String(c.ratingCount) : '',
        candidate: f.ratingCount != null ? String(f.ratingCount) : null,
      },
      {
        key: 'instructors',
        label: t('pages.admin.identifyTaskDetail.fields.instructors'),
        current: (c?.instructors ?? []).map((i) => i.displayName).join(', '),
        candidate: f.instructorNames?.length ? f.instructorNames.join(', ') : null,
      },
      {
        key: 'studios',
        label: t('pages.admin.identifyTaskDetail.fields.studios'),
        current: (c?.studios ?? []).map((s) => s.displayName).join(', '),
        candidate: f.studioName ?? null,
      },
      {
        key: 'tags',
        label: t('pages.admin.identifyTaskDetail.fields.tags'),
        current: (c?.tags ?? []).map((tag) => tag.displayName).join(', '),
        candidate: f.tags?.length ? f.tags.join(', ') : null,
      },
      {
        key: 'externalIds',
        label: t('pages.admin.identifyTaskDetail.fields.externalIds'),
        current: String(c?.externalIds?.length ?? 0),
        candidate: f.externalIds ? String(f.externalIds.length) : null,
      },
    ];
  });

  function setMode(field: MergePolicyField, mode: MergeMode): void {
    modes[field] = mode;
  }

  /** The policy actually recorded on the task — read directly from `props`
   * (not the local `modes` edit buffer) so a read-only task always shows
   * what the server has, regardless of how `modes` was last seeded. */
  function storedMode(field: MergePolicyField): MergeMode {
    return props.task.mergePolicy[field] ?? 'merge';
  }

  // ── Apply confirmation ───────────────────────────────────────────────────
  // Applying overwrites the course from the scraper; there is no bulk undo,
  // only restoring each field by hand (#606). A count of fields actually
  // affected — `mode` is not `ignore` and the candidate has data to write —
  // gives the admin something concrete to weigh before committing.
  const applyDialogOpen = ref(false);
  const changedFieldsCount = computed(
    () => rows.value.filter((row) => modes[row.key] !== 'ignore' && row.candidate !== null).length,
  );

  function openApplyDialog(): void {
    applyDialogOpen.value = true;
  }

  function confirmApply(): void {
    applyDialogOpen.value = false;
    emit('apply', buildMergePolicy(modes));
  }
</script>

<template>
  <section class="adm-identify-review">
    <header class="adm-identify-review__header">
      <AppBadge :label="statusBadge.label" :color="statusBadge.color" />
      <span class="adm-identify-review__source">{{ props.task.source }}</span>
    </header>

    <table class="adm-identify-review__table">
      <thead>
        <tr>
          <th>{{ t('pages.admin.identifyTaskDetail.fieldCol') }}</th>
          <th>{{ t('pages.admin.identifyTaskDetail.current') }}</th>
          <th>{{ t('pages.admin.identifyTaskDetail.candidate') }}</th>
          <th>{{ t('pages.admin.identifyTaskDetail.modeCol') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key">
          <th scope="row">{{ row.label }}</th>
          <td>{{ row.current || '—' }}</td>
          <td>{{ row.candidate ?? t('pages.admin.identifyTaskDetail.unavailable') }}</td>
          <td>
            <AppSegmented
              v-if="!readOnly"
              :model-value="modes[row.key]"
              :label="row.label"
              @update:model-value="(mode) => setMode(row.key, mode)"
            >
              <AppSegmentedItem
                v-for="mode in ['merge', 'overwrite', 'ignore'] as const"
                :key="mode"
                :value="mode"
                :label="modeLabels[mode]"
              />
            </AppSegmented>
            <span v-else class="adm-identify-review__mode-readonly">{{
              modeLabels[storedMode(row.key)]
            }}</span>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-if="!readOnly" class="adm-identify-review__actions">
      <AppButton
        type="button"
        variant="ghost"
        :label="t('pages.admin.identifyTaskDetail.discardCta')"
        :loading="props.discarding"
        :disabled="props.applying"
        @click="emit('discard')"
      />
      <AppButton
        type="button"
        variant="primary"
        :label="t('pages.admin.identifyTaskDetail.applyCta')"
        :loading="props.applying"
        :disabled="props.discarding"
        @click="openApplyDialog"
      />
    </div>

    <AppDialog
      :open="applyDialogOpen"
      size="sm"
      :title="t('pages.admin.identifyTaskDetail.applyDialogTitle')"
      :description="t('pages.admin.identifyTaskDetail.applyDialogBody', { n: changedFieldsCount })"
      @update:open="applyDialogOpen = $event"
    >
      <template #footer>
        <AppButton
          type="button"
          variant="ghost"
          :label="t('pages.admin.identifyTaskDetail.applyDialogCancel')"
          @click="applyDialogOpen = false"
        />
        <AppButton
          type="button"
          variant="primary"
          :label="t('pages.admin.identifyTaskDetail.applyDialogConfirm')"
          @click="confirmApply"
        />
      </template>
    </AppDialog>
  </section>
</template>

<style scoped lang="scss">
  .adm-identify-review {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);

    &__header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    &__source {
      font-size: var(--text-sm);
      font-weight: var(--fw-medium);
      color: var(--text-loud);
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
        vertical-align: middle;
      }

      thead th {
        color: var(--text-secondary);
        font-weight: var(--fw-medium);
        font-size: var(--text-xs);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      tbody th {
        font-weight: var(--fw-medium);
        color: var(--text-fg);
      }
    }

    &__mode-readonly {
      color: var(--text-secondary);
      font-size: var(--text-sm);
    }

    &__actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding-top: var(--space-4);
      border-top: 1px solid var(--border-default);
    }
  }
</style>
