<script setup lang="ts">
  /**
   * The 14-field course metadata form plus the "fill from source" panel
   * (E30-F03-S01). Owns the shared `form`/`touched` state for both — an
   * "apply" click in `CourseScrapePreviewPanel` goes through the same
   * `setField` the manual inputs use, so it is indistinguishable from the
   * admin typing the value in here, and lands in the same partial-update
   * payload on submit.
   *
   * Every control binds `:model-value` + `@update:model-value="setField(...)"`
   * rather than `v-model` directly on `form.*`, so a write is never missed by
   * the touched-tracking — `buildUpdatePayload` only sends what `touched`
   * records.
   */
  import { computed } from 'vue';
  import {
    AppField,
    AppTextField,
    AppTextarea,
    AppInput,
    AppSelect,
    AppNumberField,
    AppButton,
    AppIconButton,
    type AppSelectOption,
  } from '@app/ui';
  import type {
    CourseDto,
    CourseLevel,
    ExternalIdRef,
    UpdateCourseRequest,
  } from '@app/api-client-ts';
  import {
    buildUpdatePayload,
    courseToFormState,
    useCourseFormState,
  } from '~/composables/useCourseEdit';
  import {
    useEntitySearch,
    fetchInstructorOptions,
    fetchStudioOptions,
    fetchTagOptions,
    type EntityOption,
  } from '~/composables/useEntitySearch';
  import CourseScrapePreviewPanel from './CourseScrapePreviewPanel.vue';

  const props = defineProps<{
    course: CourseDto;
    saving: boolean;
  }>();

  const emit = defineEmits<{ submit: [payload: UpdateCourseRequest]; cancel: [] }>();

  const { t } = useI18n();

  const { form, touched, setField, setRating } = useCourseFormState(
    courseToFormState(props.course),
  );

  // ── Validation (required-if-touched fields only) ─────────────────────────────

  const titleError = computed<string>(() =>
    touched.has('title') && form.title.trim() === ''
      ? t('pages.courseEdit.errors.titleRequired')
      : '',
  );
  const slugError = computed<string>(() =>
    touched.has('slug') && form.slug.trim() === '' ? t('pages.courseEdit.errors.slugRequired') : '',
  );
  const hasErrors = computed(() => Boolean(titleError.value || slugError.value));
  const hasChanges = computed(() => touched.size > 0);

  function onSubmit(): void {
    if (hasErrors.value || !hasChanges.value || props.saving) return;
    emit('submit', buildUpdatePayload(form, touched));
  }

  // ── Level ─────────────────────────────────────────────────────────────────────

  const levelOptions = computed<AppSelectOption[]>(() => [
    { id: '', label: t('pages.courseEdit.level.unset') },
    { id: 'beginner', label: t('pages.courseEdit.level.beginner') },
    { id: 'intermediate', label: t('pages.courseEdit.level.intermediate') },
    { id: 'advanced', label: t('pages.courseEdit.level.advanced') },
    { id: 'expert', label: t('pages.courseEdit.level.expert') },
    { id: 'all_levels', label: t('pages.courseEdit.level.all_levels') },
  ]);

  function onLevelChange(value: string): void {
    setField('level', value === '' ? null : (value as CourseLevel));
  }

  // ── Entity pickers ────────────────────────────────────────────────────────────

  function toOptions(refs: { id: string; displayName: string }[] | undefined): EntityOption[] {
    return (refs ?? []).map((r) => ({ id: r.id, displayName: r.displayName }));
  }

  const instructorSearch = useEntitySearch(
    fetchInstructorOptions,
    toOptions(props.course.instructors),
  );
  const studioSearch = useEntitySearch(fetchStudioOptions, toOptions(props.course.studios));
  const tagSearch = useEntitySearch(fetchTagOptions, toOptions(props.course.tags));

  // ── External ids ──────────────────────────────────────────────────────────────

  function addExternalId(): void {
    setField('externalIds', [...form.externalIds, { source: '', externalId: '' }]);
  }

  function removeExternalId(index: number): void {
    setField(
      'externalIds',
      form.externalIds.filter((_, i) => i !== index),
    );
  }

  function updateExternalId(index: number, patch: Partial<ExternalIdRef>): void {
    setField(
      'externalIds',
      form.externalIds.map((ref, i) => (i === index ? { ...ref, ...patch } : ref)),
    );
  }
</script>

<template>
  <form novalidate class="course-metadata-form" @submit.prevent="onSubmit">
    <!-- ── Basics ────────────────────────────────────────────────────────────── -->
    <fieldset class="course-metadata-form__section">
      <legend class="course-metadata-form__section-title">
        {{ t('pages.courseEdit.sections.basics') }}
      </legend>

      <AppTextField
        :label="t('pages.courseEdit.fields.title')"
        :model-value="form.title"
        required
        :error="titleError"
        :disabled="saving"
        @update:model-value="setField('title', $event)"
      />
      <AppTextField
        :label="t('pages.courseEdit.fields.slug')"
        :model-value="form.slug"
        required
        :error="slugError"
        :help="slugError ? undefined : t('pages.courseEdit.help.slug')"
        :placeholder="t('pages.courseEdit.placeholders.slug')"
        :disabled="saving"
        @update:model-value="setField('slug', $event)"
      />
      <AppField :label="t('pages.courseEdit.fields.description')">
        <template #default="slotAttrs">
          <AppTextarea
            v-bind="slotAttrs"
            :model-value="form.description"
            :disabled="saving"
            @update:model-value="setField('description', $event)"
          />
        </template>
      </AppField>
    </fieldset>

    <!-- ── Classification ────────────────────────────────────────────────────── -->
    <fieldset class="course-metadata-form__section">
      <legend class="course-metadata-form__section-title">
        {{ t('pages.courseEdit.sections.classification') }}
      </legend>

      <AppField :label="t('pages.courseEdit.fields.level')">
        <template #default="slotAttrs">
          <AppSelect
            v-bind="slotAttrs"
            :model-value="form.level ?? ''"
            :options="levelOptions"
            :disabled="saving"
            @update:model-value="onLevelChange"
          />
        </template>
      </AppField>
      <AppTextField
        :label="t('pages.courseEdit.fields.language')"
        :model-value="form.language"
        :placeholder="t('pages.courseEdit.placeholders.language')"
        :help="t('pages.courseEdit.help.language')"
        :disabled="saving"
        @update:model-value="setField('language', $event)"
      />
      <AppField :label="t('pages.courseEdit.fields.releaseDate')">
        <template #default="slotAttrs">
          <AppInput
            v-bind="slotAttrs"
            type="date"
            :model-value="form.releaseDate"
            :disabled="saving"
            @update:model-value="setField('releaseDate', $event)"
          />
        </template>
      </AppField>
    </fieldset>

    <!-- ── Media & rating ─────────────────────────────────────────────────────── -->
    <fieldset class="course-metadata-form__section">
      <legend class="course-metadata-form__section-title">
        {{ t('pages.courseEdit.sections.media') }}
      </legend>

      <AppTextField
        :label="t('pages.courseEdit.fields.posterUrl')"
        type="url"
        :model-value="form.posterUrl"
        :placeholder="t('pages.courseEdit.placeholders.posterUrl')"
        :disabled="saving"
        @update:model-value="setField('posterUrl', $event)"
      />
      <div class="course-metadata-form__rating-row">
        <AppNumberField
          :label="t('pages.courseEdit.fields.ratingAverage')"
          :model-value="form.ratingAverage"
          :min="0"
          :max="5"
          :step="0.1"
          :help="t('pages.courseEdit.help.rating')"
          :disabled="saving"
          @update:model-value="setRating($event, form.ratingCount)"
        />
        <AppNumberField
          :label="t('pages.courseEdit.fields.ratingCount')"
          :model-value="form.ratingCount"
          :min="0"
          :step="1"
          :disabled="saving"
          @update:model-value="setRating(form.ratingAverage, $event)"
        />
      </div>
    </fieldset>

    <!-- ── Relations ──────────────────────────────────────────────────────────── -->
    <fieldset class="course-metadata-form__section">
      <legend class="course-metadata-form__section-title">
        {{ t('pages.courseEdit.sections.relations') }}
      </legend>

      <AppField :label="t('pages.courseEdit.fields.instructors')">
        <template #default="slotAttrs">
          <USelectMenu
            v-bind="slotAttrs"
            v-model:search-term="instructorSearch.searchTerm.value"
            :model-value="form.instructorIds"
            :items="instructorSearch.items.value"
            value-key="id"
            label-key="displayName"
            multiple
            ignore-filter
            :placeholder="t('pages.courseEdit.placeholders.entitySearch')"
            :disabled="saving"
            @update:model-value="setField('instructorIds', $event as string[])"
          />
        </template>
      </AppField>
      <AppField :label="t('pages.courseEdit.fields.studios')">
        <template #default="slotAttrs">
          <USelectMenu
            v-bind="slotAttrs"
            v-model:search-term="studioSearch.searchTerm.value"
            :model-value="form.studioIds"
            :items="studioSearch.items.value"
            value-key="id"
            label-key="displayName"
            multiple
            ignore-filter
            :placeholder="t('pages.courseEdit.placeholders.entitySearch')"
            :disabled="saving"
            @update:model-value="setField('studioIds', $event as string[])"
          />
        </template>
      </AppField>
      <AppField :label="t('pages.courseEdit.fields.tags')">
        <template #default="slotAttrs">
          <USelectMenu
            v-bind="slotAttrs"
            v-model:search-term="tagSearch.searchTerm.value"
            :model-value="form.tagIds"
            :items="tagSearch.items.value"
            value-key="id"
            label-key="displayName"
            multiple
            ignore-filter
            :placeholder="t('pages.courseEdit.placeholders.entitySearch')"
            :disabled="saving"
            @update:model-value="setField('tagIds', $event as string[])"
          />
        </template>
      </AppField>
    </fieldset>

    <!-- ── External references ───────────────────────────────────────────────── -->
    <fieldset class="course-metadata-form__section">
      <legend class="course-metadata-form__section-title">
        {{ t('pages.courseEdit.externalIds.heading') }}
      </legend>

      <p v-if="form.externalIds.length === 0" class="course-metadata-form__empty">
        {{ t('pages.courseEdit.externalIds.empty') }}
      </p>

      <div
        v-for="(ref, index) in form.externalIds"
        :key="index"
        class="course-metadata-form__external-row"
      >
        <AppTextField
          :label="t('pages.courseEdit.externalIds.source')"
          :placeholder="t('pages.courseEdit.externalIds.sourcePlaceholder')"
          :model-value="ref.source"
          :disabled="saving"
          @update:model-value="updateExternalId(index, { source: $event })"
        />
        <AppTextField
          :label="t('pages.courseEdit.externalIds.id')"
          :placeholder="t('pages.courseEdit.externalIds.idPlaceholder')"
          :model-value="ref.externalId"
          :disabled="saving"
          @update:model-value="updateExternalId(index, { externalId: $event })"
        />
        <AppTextField
          :label="t('pages.courseEdit.externalIds.url')"
          type="url"
          :placeholder="t('pages.courseEdit.externalIds.urlPlaceholder')"
          :model-value="ref.url ?? ''"
          :disabled="saving"
          @update:model-value="updateExternalId(index, { url: $event || undefined })"
        />
        <AppIconButton
          name="trash"
          variant="ghost"
          size="sm"
          :ariaLabel="t('pages.courseEdit.externalIds.remove')"
          class="course-metadata-form__external-remove"
          :disabled="saving"
          @click="removeExternalId(index)"
        />
      </div>

      <AppButton
        type="button"
        variant="secondary"
        size="sm"
        icon-leading="plus"
        :label="t('pages.courseEdit.externalIds.add')"
        :disabled="saving"
        @click="addExternalId"
      />

      <AppField :label="t('pages.courseEdit.fields.sourceUpdatedAt')">
        <template #default="slotAttrs">
          <AppInput
            v-bind="slotAttrs"
            type="datetime-local"
            :model-value="form.sourceUpdatedAt"
            :disabled="saving"
            @update:model-value="setField('sourceUpdatedAt', $event)"
          />
        </template>
      </AppField>
    </fieldset>

    <!-- ── Fill from source ──────────────────────────────────────────────────── -->
    <CourseScrapePreviewPanel
      :course-id="course.id"
      :form="form"
      :set-field="setField"
      :set-rating="setRating"
    />

    <!-- ── Footer ─────────────────────────────────────────────────────────────── -->
    <div class="course-metadata-form__footer">
      <span v-if="hasChanges" class="course-metadata-form__unsaved">
        {{ t('pages.courseEdit.unsavedWarning') }}
      </span>
      <AppButton
        type="button"
        variant="ghost"
        :label="t('pages.courseEdit.cancelCta')"
        :disabled="saving"
        @click="emit('cancel')"
      />
      <AppButton
        type="submit"
        variant="primary"
        :label="t('pages.courseEdit.saveCta')"
        :loading="saving"
        :disabled="!hasChanges || hasErrors"
      />
    </div>
  </form>
</template>

<style scoped lang="scss">
  .course-metadata-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);

    &__section {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      margin: 0;
      padding: 0;
      border: 0;
    }

    &__section-title {
      padding: 0;
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--text-loud);
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    &__rating-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
    }

    &__empty {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    &__external-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr auto;
      gap: var(--space-3);
      align-items: end;
    }

    &__external-remove {
      margin-bottom: var(--space-1);
    }

    &__footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--space-3);
      padding-top: var(--space-4);
      border-top: 1px solid var(--border-default);
    }

    &__unsaved {
      margin-inline-end: auto;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }
  }
</style>
