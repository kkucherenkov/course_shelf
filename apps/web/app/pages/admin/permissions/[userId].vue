<script setup lang="ts">
  import { computed, provide, ref, toRef } from 'vue';
  import { AppBanner } from '@app/ui';
  import type { CourseDto, AccessGrantDto } from '@app/api-client-ts';
  import { listCourses, client } from '@app/api-client-ts';
  import AdminRoleChip from '~/components/admin/AdminRoleChip.vue';
  import AdminPermissionRow from '~/components/admin/AdminPermissionRow.vue';
  import { useAdminUser } from '~/composables/useAdminUser';
  import { useAdminLibraries } from '~/composables/useAdminLibraries';
  import { useAccessGrants } from '~/composables/useAccessGrants';

  definePageMeta({ middleware: 'admin' });

  const { t } = useI18n();
  const toast = useToast();
  const route = useRoute();

  const userId = computed(() => route.params.userId as string);

  // ── Data ────────────────────────────────────────────────────────────────────
  const userIdRef = toRef(userId);
  const { data: user, status: userStatus, errorStatus: userErrorStatus } = useAdminUser(userIdRef);
  const { data: libraries, status: libStatus, refetch: refetchLibs } = useAdminLibraries();
  const grants = useAccessGrants(userIdRef);

  // ── Page title ──────────────────────────────────────────────────────────────
  const pageTitle = computed(() =>
    user.value ? (user.value.displayName ?? user.value.name) : t('pages.admin.permissions.title'),
  );
  provide('adminPageTitle', pageTitle);

  // ── Derived states ──────────────────────────────────────────────────────────
  const isUserLoading = computed(() => userStatus.value === 'pending');
  const userNotFound = computed(() => userErrorStatus.value === 404);

  const isLibsLoading = computed(() => libStatus.value === 'pending');
  const hasLibsError = computed(() => libStatus.value === 'error');

  const isGrantsLoading = computed(() => grants.status.value === 'pending');
  const hasGrantsError = computed(() => grants.status.value === 'error');

  const libraryItems = computed(() => libraries.value?.items ?? []);

  // ── Expanded state per library ───────────────────────────────────────────────
  const expandedLibraries = ref(new Set<string>());
  // Lazy-loaded courses per library: libraryId → CourseDto[]
  const coursesByLibrary = ref(new Map<string, CourseDto[]>());
  // Track in-flight library fetches to avoid duplicates
  const coursesFetching = ref(new Set<string>());

  async function ensureCoursesLoaded(libraryId: string): Promise<void> {
    if (coursesByLibrary.value.has(libraryId)) return;
    if (coursesFetching.value.has(libraryId)) return;
    coursesFetching.value.add(libraryId);
    try {
      const res = await listCourses({ client, throwOnError: false, query: { libraryId } });
      if (!res.error) {
        const newMap = new Map(coursesByLibrary.value);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- res.data is defined when !res.error
        newMap.set(libraryId, res.data!.items);
        coursesByLibrary.value = newMap;
      }
    } finally {
      coursesFetching.value.delete(libraryId);
    }
  }

  function toggleExpanded(libraryId: string, value: boolean): void {
    const next = new Set(expandedLibraries.value);
    if (value) {
      next.add(libraryId);
      void ensureCoursesLoaded(libraryId);
    } else {
      next.delete(libraryId);
    }
    expandedLibraries.value = next;
  }

  // ── Build overridesByLibrary ─────────────────────────────────────────────────
  // We resolve courseId → libraryId using the already-loaded coursesByLibrary map.
  const overridesByLibrary = computed<Map<string, AccessGrantDto[]>>(() => {
    const result = new Map<string, AccessGrantDto[]>();
    const courseGrants = grants.grantedCourses.value;
    for (const [courseId, grant] of courseGrants) {
      // Find which library this course belongs to via our loaded courses.
      for (const [libraryId, courses] of coursesByLibrary.value) {
        if (courses.some((c) => c.id === courseId)) {
          const existing = result.get(libraryId) ?? [];
          existing.push(grant);
          result.set(libraryId, existing);
          break;
        }
      }
    }
    return result;
  });

  // ── In-flight toggle guard — prevents double-click races ────────────────────
  const toggling = ref(new Set<string>());

  // ── Library toggle ───────────────────────────────────────────────────────────
  async function handleSetLibrary(libraryId: string, granted: boolean): Promise<void> {
    const key = `lib:${libraryId}`;
    if (toggling.value.has(key)) return;
    toggling.value.add(key);
    try {
      if (granted) {
        if (grants.grantedLibraries.value.has(libraryId)) return;
        const err = await grants.grant({ kind: 'library', libraryId });
        if (err) {
          toast.add({ title: t('pages.admin.permissions.toastGrantFailed'), color: 'error' });
          return;
        }
        toast.add({ title: t('pages.admin.permissions.toastGrantCreated') });
      } else {
        const existing = (grants.data.value ?? []).find(
          (g) => g.target.kind === 'library' && g.target.libraryId === libraryId,
        );
        if (!existing) return;
        const err = await grants.revoke(existing.id);
        if (err) {
          toast.add({ title: t('pages.admin.permissions.toastGrantFailed'), color: 'error' });
          return;
        }
        toast.add({ title: t('pages.admin.permissions.toastGrantRevoked') });
      }
      await grants.refetch();
    } finally {
      toggling.value.delete(key);
    }
  }

  // ── Course toggle ────────────────────────────────────────────────────────────
  async function handleSetCourse(courseId: string, granted: boolean): Promise<void> {
    const key = `course:${courseId}`;
    if (toggling.value.has(key)) return;
    toggling.value.add(key);
    try {
      if (granted) {
        if (grants.grantedCourses.value.has(courseId)) return;
        const err = await grants.grant({ kind: 'course', courseId });
        if (err) {
          toast.add({ title: t('pages.admin.permissions.toastGrantFailed'), color: 'error' });
          return;
        }
        toast.add({ title: t('pages.admin.permissions.toastGrantCreated') });
      } else {
        const existing = grants.grantedCourses.value.get(courseId);
        if (!existing) return;
        const err = await grants.revoke(existing.id);
        if (err) {
          toast.add({ title: t('pages.admin.permissions.toastGrantFailed'), color: 'error' });
          return;
        }
        toast.add({ title: t('pages.admin.permissions.toastGrantRevoked') });
      }
      await grants.refetch();
    } finally {
      toggling.value.delete(key);
    }
  }

  // ── Avatar helpers ───────────────────────────────────────────────────────────
  const AVATAR_PALETTES = ['#4f76c8', '#2d9e7a', '#c07a2e', '#8a4fc8', '#b04040', '#4a8cb0'];

  function avatarBgFromId(id: string): string {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = ((h * 31 + (id.codePointAt(i) ?? 0)) >>> 0) >>> 0;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- palette is statically non-empty
    return AVATAR_PALETTES[h % AVATAR_PALETTES.length]!;
  }

  const userInitials = computed<string>(() => {
    if (!user.value) return '';
    const name = user.value.displayName ?? user.value.name;
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase() ?? '')
      .join('');
  });

  const userAvatarBg = computed<string>(() =>
    user.value ? avatarBgFromId(user.value.id) : '#4f76c8',
  );
</script>

<template>
  <div class="adm-perms">
    <!-- Not found -->
    <div v-if="userNotFound" class="adm-perms__not-found">
      <p>{{ t('pages.admin.permissions.notFound') }}</p>
      <UButton variant="outline" size="sm" @click="navigateTo('/admin/permissions')">
        {{ t('pages.admin.permissions.errorRetry') }}
      </UButton>
    </div>

    <template v-else>
      <!-- User header card skeleton -->
      <div v-if="isUserLoading" class="adm-perms__header-skel" aria-hidden="true">
        <div class="adm-perms__skel adm-perms__skel--avatar" />
        <div class="adm-perms__skel-col">
          <div class="adm-perms__skel adm-perms__skel--name" />
          <div class="adm-perms__skel adm-perms__skel--email" />
        </div>
      </div>

      <!-- User header card -->
      <div v-else-if="user" class="adm-perms__header">
        <div class="adm-perms__avatar" :style="{ background: userAvatarBg }" aria-hidden="true">
          {{ userInitials }}
        </div>
        <div class="adm-perms__header-text">
          <div class="adm-perms__header-name">{{ user.displayName ?? user.name }}</div>
          <div class="adm-perms__header-email">{{ user.email }}</div>
        </div>
        <AdminRoleChip
          :role="user.role"
          :banned="user.banned"
          :editable="false"
          :label-admin="t('pages.admin.users.roleAdmin')"
          :label-user="t('pages.admin.users.roleUser')"
          :label-guest="t('pages.admin.users.roleGuest')"
          :label-disabled="t('pages.admin.users.roleDisabled')"
          :tooltip-self="t('pages.admin.permissions.roleChipReadOnlyTooltip')"
        />
        <UButton size="sm" class="adm-perms__add-btn" @click="navigateTo('/admin/permissions')">
          {{ t('pages.admin.permissions.addGrantCta') }}
        </UButton>
      </div>

      <!-- Info banner -->
      <AppBanner
        v-if="!isUserLoading"
        variant="info"
        :body="t('pages.admin.permissions.infoBannerBody')"
        class="adm-perms__banner"
      />

      <!-- Library/grants error -->
      <AppBanner
        v-if="hasLibsError || hasGrantsError"
        variant="error"
        :title="t('pages.admin.permissions.errorTitle')"
        class="adm-perms__banner"
      >
        <template #actions>
          <UButton
            size="sm"
            variant="outline"
            color="error"
            @click="
              () => {
                void refetchLibs();
                void grants.refetch();
              }
            "
          >
            {{ t('pages.admin.permissions.errorRetry') }}
          </UButton>
        </template>
      </AppBanner>

      <!-- Permission table -->
      <div v-if="!hasLibsError && !hasGrantsError" class="adm-perms__tbl">
        <!-- Loading skeleton -->
        <template v-if="isLibsLoading || isGrantsLoading">
          <div v-for="i in 4" :key="i" class="adm-perms__tbl-skel-row">
            <div class="adm-perms__skel adm-perms__skel--lib-icon" />
            <div class="adm-perms__skel-col">
              <div class="adm-perms__skel adm-perms__skel--lib-name" />
              <div class="adm-perms__skel adm-perms__skel--lib-meta" />
            </div>
            <div class="adm-perms__skel adm-perms__skel--toggle" />
          </div>
        </template>

        <!-- Empty state -->
        <div v-else-if="libraryItems.length === 0" class="adm-perms__empty">
          <span class="i-heroicons-key adm-perms__empty-icon" aria-hidden="true" />
          <p>{{ t('pages.admin.permissions.noLibraries') }}</p>
        </div>

        <!-- Library rows -->
        <template v-else>
          <AdminPermissionRow
            v-for="library in libraryItems"
            :key="library.id"
            :library="library"
            :library-granted="grants.grantedLibraries.value.has(library.id)"
            :overrides="overridesByLibrary.get(library.id) ?? []"
            :expanded="expandedLibraries.has(library.id)"
            :courses="coursesByLibrary.get(library.id)"
            :label-read="t('pages.admin.permissions.levelRead')"
            :label-none="t('pages.admin.permissions.levelNone')"
            :label-expand-library="
              t('pages.admin.permissions.expandLibrary', { name: library.name })
            "
            :label-collapse-library="
              t('pages.admin.permissions.collapseLibrary', { name: library.name })
            "
            :label-overrides-badge="
              t('pages.admin.permissions.overridesBadge', {
                n: (overridesByLibrary.get(library.id) ?? []).length,
              })
            "
            :label-courses-loading="t('pages.admin.permissions.coursesLoading')"
            :label-course-toggle-hint="t('pages.admin.permissions.courseToggleHint')"
            @set-library="({ granted }) => handleSetLibrary(library.id, granted)"
            @set-course="({ courseId, granted }) => handleSetCourse(courseId, granted)"
            @update:expanded="(val) => toggleExpanded(library.id, val)"
          />
        </template>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
  $avatar-lg: 48px;
  $avatar-font: 16px;
  $skel-dur: var(--dur-slow, 1400ms);
  $skel-avatar: 48px;
  $skel-name-h: 16px;
  $skel-email-h: 12px;
  $skel-lib-icon: 28px;
  $skel-lib-name-h: 14px;
  $skel-lib-meta-h: 11px;
  $skel-toggle-w: 120px;
  $empty-icon-size: 32px;
  $skel-toggle-h: 28px;

  .adm-perms {
    &__not-found {
      text-align: center;
      padding: var(--space-8) var(--space-4);
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
    }

    // ── Header card ────────────────────────────────────────────────────────────
    &__header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--surface-raised);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-4);
      flex-wrap: wrap;
    }

    &__header-skel {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--surface-raised);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-4);
    }

    &__avatar {
      flex-shrink: 0;
      width: $avatar-lg;
      height: $avatar-lg;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: $avatar-font;
      font-weight: 600;
      font-family: var(--font-mono);
      color: var(--brand-accent-fg);
      user-select: none;
    }

    &__header-text {
      flex: 1;
      min-width: 0;
    }

    &__header-name {
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--text-loud);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__header-email {
      font-size: var(--text-xs);
      color: var(--text-muted);
      margin-top: var(--space-1);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__add-btn {
      flex-shrink: 0;
    }

    // ── Banner ─────────────────────────────────────────────────────────────────
    &__banner {
      margin-bottom: var(--space-4);
    }

    // ── Permission table ───────────────────────────────────────────────────────
    &__tbl {
      background: var(--surface-surface);
      border: 1px solid var(--border-default);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    &__tbl-skel-row {
      display: grid;
      grid-template-columns: #{$skel-lib-icon} 1fr auto;
      gap: var(--space-3);
      align-items: center;
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--border-default);

      &:last-child {
        border-bottom: 0;
      }
    }

    &__empty {
      padding: var(--space-8) var(--space-4);
      text-align: center;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
      font-size: var(--text-sm);
    }

    &__empty-icon {
      width: $empty-icon-size;
      height: $empty-icon-size;
      color: var(--text-subtle);
    }

    // ── Skeletons ──────────────────────────────────────────────────────────────
    &__skel {
      background: var(--surface-skeleton-base);
      border-radius: var(--radius-sm);
      animation: adm-perms-skel-pulse $skel-dur ease-in-out infinite;

      &--avatar {
        width: $skel-avatar;
        height: $skel-avatar;
        border-radius: 50%;
        flex-shrink: 0;
      }

      &--name {
        width: 60%;
        height: $skel-name-h;
      }

      &--email {
        width: 45%;
        height: $skel-email-h;
      }

      &--lib-icon {
        width: $skel-lib-icon;
        height: $skel-lib-icon;
        border-radius: var(--radius-sm);
      }

      &--lib-name {
        width: 70%;
        height: $skel-lib-name-h;
      }

      &--lib-meta {
        width: 45%;
        height: $skel-lib-meta-h;
      }

      &--toggle {
        width: $skel-toggle-w;
        height: $skel-toggle-h;
        border-radius: var(--radius-md);
      }
    }

    &__skel-col {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
  }

  @keyframes adm-perms-skel-pulse {
    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.4;
    }
  }
</style>
