<script setup lang="ts">
  import { computed, ref, toRef, watch } from 'vue';
  // Explicit: Nuxt 4.5 no longer surfaces auto-imports to template
  // expressions during `nuxt typecheck`, and `navigateTo` is called from the
  // template below. Same `#imports` idiom as `stores/auth.ts`.
  import { navigateTo } from '#imports';
  import { AppBanner, AppButton, AppDialog, AppSkeleton, IconCS } from '@app/ui';
  import type { CourseDto, AccessGrantDto } from '@app/api-client-ts';
  import { getCourse, listCourses, client } from '@app/api-client-ts';
  import AdminRoleChip from '~/components/admin/AdminRoleChip.vue';
  import AdminPermissionRow from '~/components/admin/AdminPermissionRow.vue';
  import { useAdminUser } from '~/composables/useAdminUser';
  import { useAdminLibraries } from '~/composables/useAdminLibraries';
  import { useAccessGrants } from '~/composables/useAccessGrants';
  import { avatarBgFromId } from '~/utils/avatar-color';

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

  // ── Resolve courseId → libraryId for every course-scope grant ────────────────
  // `coursesByLibrary` only knows about a library's courses once that library's
  // row has been expanded — a course-level grant inside a still-collapsed
  // library was invisible (and its library's overrides badge undercounted) until
  // the admin happened to open it (#576). Resolved independently of expansion,
  // one `getCourse` per granted course — bounded by how many course-scope
  // grants this one user has, not by how many courses exist.
  const courseLibraryMap = ref(new Map<string, string>());
  // Course title, captured off the same `getCourse` response — the revoke
  // confirmation dialog names the course, and this is a free byproduct of a
  // lookup already made for `overridesByLibrary`, not a second fetch.
  const courseTitleMap = ref(new Map<string, string>());
  const courseLibraryFetching = ref(new Set<string>());

  async function ensureCourseLibraryResolved(courseId: string): Promise<void> {
    if (courseLibraryMap.value.has(courseId)) return;
    if (courseLibraryFetching.value.has(courseId)) return;
    courseLibraryFetching.value.add(courseId);
    try {
      const res = await getCourse({ client, throwOnError: false, path: { id: courseId } });
      if (!res.error) {
        const next = new Map(courseLibraryMap.value);
        next.set(courseId, res.data.libraryId);
        courseLibraryMap.value = next;
        const nextTitles = new Map(courseTitleMap.value);
        nextTitles.set(courseId, res.data.title);
        courseTitleMap.value = nextTitles;
      }
    } finally {
      courseLibraryFetching.value.delete(courseId);
    }
  }

  watch(
    grants.grantedCourses,
    (courseGrants) => {
      for (const courseId of courseGrants.keys()) {
        void ensureCourseLibraryResolved(courseId);
      }
    },
    { immediate: true },
  );

  // ── Build overridesByLibrary ─────────────────────────────────────────────────
  const overridesByLibrary = computed<Map<string, AccessGrantDto[]>>(() => {
    const result = new Map<string, AccessGrantDto[]>();
    const courseGrants = grants.grantedCourses.value;
    for (const [courseId, grant] of courseGrants) {
      const libraryId = courseLibraryMap.value.get(courseId);
      if (libraryId === undefined) continue; // resolution still in flight
      const existing = result.get(libraryId) ?? [];
      existing.push(grant);
      result.set(libraryId, existing);
    }
    return result;
  });

  // A granted course whose `getCourse` lookup hasn't resolved yet is invisible
  // to `overridesByLibrary` above (the `continue` skips it) — so the table's
  // skeleton stays up until every grant is resolved, rather than letting the
  // overrides badge silently creep up count-by-count with no loading signal
  // (#599).
  const isResolvingOverrides = computed(() =>
    [...grants.grantedCourses.value.keys()].some(
      (courseId) => !courseLibraryMap.value.has(courseId),
    ),
  );

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

  // ── Revoke confirmation (#606, #633) ─────────────────────────────────────────
  // A grant — library or course — is someone else's access, not the admin's
  // own — revoking it has no undo (the person has to be re-granted, and any
  // in-progress work they lose track of in the meantime is on them to
  // resume). Granting stays one click; only the revoke path routes through a
  // dialog naming who and what is being taken away. One dialog, one pending-
  // state, two callers (library row / course row) — a course grant used to
  // revoke straight through, inconsistent with the library row one click away.
  interface PendingRevoke {
    kind: 'library' | 'course';
    id: string;
  }
  const pendingRevoke = ref<PendingRevoke | null>(null);
  const revokeDialogOpen = ref(false);
  const pendingRevokeName = computed(() => {
    const pending = pendingRevoke.value;
    if (!pending) return '';
    if (pending.kind === 'library') {
      return libraryItems.value.find((l) => l.id === pending.id)?.name ?? '';
    }
    return courseTitleMap.value.get(pending.id) ?? '';
  });
  const userDisplayName = computed(() =>
    user.value ? (user.value.displayName ?? user.value.name) : '',
  );
  const revokeDialogTitle = computed(() => {
    const pending = pendingRevoke.value;
    if (!pending) return '';
    return pending.kind === 'library'
      ? t('pages.admin.permissions.revokeDialogTitle', {
          library: pendingRevokeName.value,
          user: userDisplayName.value,
        })
      : t('pages.admin.permissions.revokeDialogTitleCourse', {
          course: pendingRevokeName.value,
          user: userDisplayName.value,
        });
  });

  function requestRevoke(kind: PendingRevoke['kind'], id: string): void {
    pendingRevoke.value = { kind, id };
    revokeDialogOpen.value = true;
  }

  function requestSetLibrary(libraryId: string, granted: boolean): void {
    if (!granted) {
      requestRevoke('library', libraryId);
      return;
    }
    void handleSetLibrary(libraryId, true);
  }

  function requestSetCourse(courseId: string, granted: boolean): void {
    if (!granted) {
      requestRevoke('course', courseId);
      return;
    }
    void handleSetCourse(courseId, true);
  }

  function cancelRevoke(): void {
    revokeDialogOpen.value = false;
    pendingRevoke.value = null;
  }

  function confirmRevoke(): void {
    const pending = pendingRevoke.value;
    revokeDialogOpen.value = false;
    pendingRevoke.value = null;
    if (!pending) return;
    if (pending.kind === 'library') void handleSetLibrary(pending.id, false);
    else void handleSetCourse(pending.id, false);
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
    user.value ? avatarBgFromId(user.value.id) : 'var(--avatar-indigo)',
  );
</script>

<template>
  <div class="adm-perms">
    <!-- Not found -->
    <div v-if="userNotFound" class="adm-perms__not-found">
      <p>{{ t('pages.admin.permissions.notFound') }}</p>
      <AppButton
        variant="secondary"
        size="sm"
        :label="t('pages.admin.permissions.backToUsersCta')"
        @click="navigateTo('/admin/permissions')"
      />
    </div>

    <template v-else>
      <!-- User header card skeleton -->
      <div v-if="isUserLoading" class="adm-perms__header-skel" aria-hidden="true">
        <AppSkeleton width="48px" height="48px" radius="pill" />
        <div class="adm-perms__skel-col">
          <AppSkeleton width="60%" height="16px" />
          <AppSkeleton width="45%" height="12px" />
        </div>
      </div>

      <!-- User header card -->
      <div v-else-if="user" class="adm-perms__header">
        <div class="adm-perms__avatar" :style="{ background: userAvatarBg }" aria-hidden="true">
          {{ userInitials }}
        </div>
        <div class="adm-perms__header-text">
          <h1 class="adm-perms__header-name">{{ user.displayName ?? user.name }}</h1>
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
        <AppButton
          variant="secondary"
          size="sm"
          class="adm-perms__add-btn"
          :label="t('pages.admin.permissions.backToUsersCta')"
          @click="navigateTo('/admin/permissions')"
        />
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
          <AppButton
            size="sm"
            variant="secondary"
            :label="t('pages.admin.permissions.errorRetry')"
            @click="
              () => {
                void refetchLibs();
                void grants.refetch();
              }
            "
          />
        </template>
      </AppBanner>

      <!-- Permission table -->
      <div v-if="!hasLibsError && !hasGrantsError" class="adm-perms__tbl">
        <!-- Loading skeleton -->
        <template v-if="isLibsLoading || isGrantsLoading || isResolvingOverrides">
          <div v-for="i in 4" :key="i" class="adm-perms__tbl-skel-row">
            <AppSkeleton width="28px" height="28px" />
            <div class="adm-perms__skel-col">
              <AppSkeleton width="70%" height="14px" />
              <AppSkeleton width="45%" height="11px" />
            </div>
            <AppSkeleton width="120px" height="28px" radius="md" />
          </div>
        </template>

        <!-- Empty state -->
        <div v-else-if="libraryItems.length === 0" class="adm-perms__empty">
          <IconCS name="key" class="adm-perms__empty-icon" />
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
            @set-library="({ granted }) => requestSetLibrary(library.id, granted)"
            @set-course="({ courseId, granted }) => requestSetCourse(courseId, granted)"
            @update:expanded="(val) => toggleExpanded(library.id, val)"
          />
        </template>
      </div>
    </template>

    <!-- Revoke confirmation (#606, #633) — shared by library and course rows -->
    <AppDialog
      :open="revokeDialogOpen"
      size="sm"
      :title="revokeDialogTitle"
      :description="t('pages.admin.permissions.revokeDialogBody')"
      @update:open="revokeDialogOpen = $event"
    >
      <template #footer>
        <AppButton
          variant="ghost"
          size="sm"
          :label="t('pages.admin.permissions.revokeDialogCancel')"
          @click="cancelRevoke"
        />
        <AppButton
          variant="destructive"
          size="sm"
          :label="t('pages.admin.permissions.revokeDialogConfirm')"
          @click="confirmRevoke"
        />
      </template>
    </AppDialog>
  </div>
</template>

<style lang="scss" scoped>
  $avatar-lg: 48px;
  $avatar-font: 16px;
  $skel-lib-icon: 28px;
  $empty-icon-size: 32px;

  .adm-perms {
    &__not-found {
      text-align: center;
      padding: var(--space-8) var(--space-4);
      color: var(--text-secondary);
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
      font-weight: var(--fw-semibold);
      font-family: var(--font-mono);
      // Theme-independent: --avatar-* backgrounds don't flip with the page
      // theme (hashed from the user id), so a theme-flipped foreground like
      // --brand-accent-fg went near-black-on-blue in dark mode.
      color: var(--media-fg);
      user-select: none;
    }

    &__header-text {
      flex: 1;
      min-width: 0;
    }

    &__header-name {
      font-size: var(--text-base);
      font-weight: var(--fw-semibold);
      color: var(--text-loud);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__header-email {
      font-size: var(--text-xs);
      color: var(--text-secondary);
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
      color: var(--text-secondary);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
      font-size: var(--text-sm);
    }

    &__empty-icon {
      width: $empty-icon-size;
      height: $empty-icon-size;
      color: var(--text-tertiary);
    }

    &__skel-col {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
  }
</style>
