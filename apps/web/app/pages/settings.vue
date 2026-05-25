<script setup lang="ts">
  /**
   * /settings — User preferences page.
   *
   * Layout: single-column, max 720 px, centred.
   * Auth: protected by the global `auth.global.ts` middleware; no page-level
   *       middleware needed because the global one already redirects unauthenticated
   *       users to /sign-in.
   *
   * Sections:
   *  1. Profile  — avatar (placeholder), display name, email (read-only), password
   *  2. Appearance — theme (3-up picker), density (3-up picker)
   *  3. Playback — default speed, autoplay, resume, completion threshold
   *  4. Account  — sign out, sign out other devices, delete account
   */

  import { ref, computed, onBeforeUnmount } from 'vue';
  import {
    AppButton,
    AppInput,
    AppSwitch,
    AppPasswordField,
    AppSegmented,
    AppSegmentedItem,
    AppDialog,
  } from '@app/ui';
  import { updateMe, signOutOtherSessions, client } from '@app/api-client-ts';
  import type { MeDto } from '@app/api-client-ts';

  import { useAuthStore } from '~/stores/auth';
  import { usePreferencesStore } from '~/stores/preferences';
  import { AUTH_ERROR_CODES } from '~/constants/authErrorCodes';
  import SettingSyncIndicator from '~/components/SettingSyncIndicator.vue';

  definePageMeta({ layout: 'default' });

  const { t } = useI18n();
  const toast = useToast();
  const authStore = useAuthStore();
  const prefs = usePreferencesStore();
  const colorMode = useColorMode();

  // ── Profile — display name ────────────────────────────────────────────────

  const displayName = ref(authStore.user?.displayName ?? authStore.user?.name ?? '');
  const nameSyncState = ref<'idle' | 'saving' | 'saved' | 'error'>('idle');
  let nameSaveTimer: ReturnType<typeof setTimeout> | null = null;

  async function saveDisplayName(): Promise<void> {
    if (nameSaveTimer !== null) {
      clearTimeout(nameSaveTimer);
      nameSaveTimer = null;
    }

    nameSyncState.value = 'saving';

    const res = await updateMe({
      client,
      throwOnError: false,
      body: { displayName: displayName.value || null },
    });

    if (res.error) {
      nameSyncState.value = 'error';
      toast.add({ title: t('pages.settings.toastUpdateFailed'), color: 'error' });
      return;
    }

    // Sync auth store user with returned data.
    const updated = res.data as MeDto;
    if (authStore.user) {
      authStore.user.displayName = updated.displayName ?? undefined;
    }

    nameSyncState.value = 'saved';
    nameSaveTimer = setTimeout(() => {
      nameSyncState.value = 'idle';
      nameSaveTimer = null;
    }, 2000);
  }

  // Debounced on input — save 800 ms after the user stops typing.
  let nameDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  function onDisplayNameInput(): void {
    if (nameDebounceTimer !== null) clearTimeout(nameDebounceTimer);
    nameSyncState.value = 'idle';
    nameDebounceTimer = setTimeout(() => {
      void saveDisplayName();
    }, 800);
  }

  // Flush a pending debounced save when the field loses focus.
  function onDisplayNameBlur(): void {
    if (nameDebounceTimer !== null) {
      clearTimeout(nameDebounceTimer);
      nameDebounceTimer = null;
      void saveDisplayName();
    }
  }

  // Don't let a queued save/reset fire after the page is gone.
  onBeforeUnmount(() => {
    if (nameDebounceTimer !== null) clearTimeout(nameDebounceTimer);
    if (nameSaveTimer !== null) clearTimeout(nameSaveTimer);
  });

  // ── Profile — email (read-only) ───────────────────────────────────────────

  const emailDisplay = computed(() => authStore.user?.email ?? '');

  // ── Profile — password ────────────────────────────────────────────────────

  const passwordFormOpen = ref(false);
  const currentPassword = ref('');
  const newPassword = ref('');
  const confirmPassword = ref('');
  const passwordError = ref('');
  const passwordSaving = ref(false);

  function togglePasswordForm(): void {
    passwordFormOpen.value = !passwordFormOpen.value;
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
    passwordError.value = '';
  }

  async function onPasswordSubmit(): Promise<void> {
    passwordError.value = '';

    if (newPassword.value !== confirmPassword.value) {
      passwordError.value = t('pages.settings.profilePasswordErrorMismatch');
      return;
    }

    passwordSaving.value = true;
    const result = await authStore.changePassword(currentPassword.value, newPassword.value);
    passwordSaving.value = false;

    if (!result.ok) {
      // Map Better Auth's machine code to a localized message; never surface
      // the raw (English, internal) message to the user.
      passwordError.value =
        result.code === AUTH_ERROR_CODES.INVALID_PASSWORD
          ? t('pages.settings.profilePasswordErrorWrongCurrent')
          : t('pages.settings.profilePasswordErrorGeneric');
      return;
    }

    toast.add({ title: t('pages.settings.profilePasswordToastSaved'), color: 'success' });
    togglePasswordForm();
  }

  // ── Appearance — theme ────────────────────────────────────────────────────

  type ThemeOption = 'dark' | 'light' | 'system';

  const themeOptions: ThemeOption[] = ['dark', 'light', 'system'];

  const activeTheme = computed<ThemeOption>(() => {
    const p = colorMode.preference;
    if (p === 'dark' || p === 'light') return p;
    return 'system';
  });

  function onTheme(value: ThemeOption): void {
    colorMode.preference = value;
  }

  function themeLabel(v: ThemeOption): string {
    if (v === 'dark') return t('pages.settings.themeDark');
    if (v === 'light') return t('pages.settings.themeLight');
    return t('pages.settings.themeSystem');
  }

  // ── Appearance — density ──────────────────────────────────────────────────

  type DensityOption = 'comfortable' | 'cozy' | 'compact';
  const densityOptions: DensityOption[] = ['comfortable', 'cozy', 'compact'];

  function densityLabel(v: DensityOption): string {
    if (v === 'comfortable') return t('pages.settings.densityComfortable');
    if (v === 'cozy') return t('pages.settings.densityCozy');
    return t('pages.settings.densityCompact');
  }

  // ── Playback — speed ──────────────────────────────────────────────────────

  const speedOptions = [0.75, 1, 1.25, 1.5, 1.75, 2];

  // ── Account — sign out ────────────────────────────────────────────────────

  async function onSignOut(): Promise<void> {
    await authStore.signOut();
    await navigateTo('/sign-in');
  }

  // ── Account — sign out other devices (confirmed) ──────────────────────────

  const signOutOthersPending = ref(false);
  const signOutOthersDialogOpen = ref(false);

  async function confirmSignOutOthers(): Promise<void> {
    signOutOthersDialogOpen.value = false;
    signOutOthersPending.value = true;
    const res = await signOutOtherSessions({ client, throwOnError: false });
    signOutOthersPending.value = false;

    if (res.error) {
      toast.add({ title: t('pages.settings.toastUpdateFailed'), color: 'error' });
      return;
    }

    toast.add({ title: t('pages.settings.accountSignOutOthersToastDone'), color: 'success' });
  }
</script>

<template>
  <div class="page-settings">
    <div class="page-settings__inner">
      <!-- Header -->
      <div class="page-settings__header">
        <h1 class="page-settings__title">{{ t('pages.settings.title') }}</h1>
        <p class="page-settings__subtitle">{{ t('pages.settings.subtitle') }}</p>
      </div>

      <!-- ── Section: Profile ─────────────────────────────────────────────── -->
      <section class="settings-section" aria-labelledby="section-profile">
        <h2 id="section-profile" class="settings-section__title">
          {{ t('pages.settings.sectionProfile') }}
        </h2>

        <!-- Avatar row -->
        <div class="settings-row">
          <div class="settings-row__left">
            <span class="settings-row__label">{{ t('pages.settings.profileAvatarLabel') }}</span>
            <span class="settings-row__help">{{
              t('pages.settings.profileAvatarComingSoon')
            }}</span>
          </div>
          <div class="settings-row__control settings-row__control--avatar">
            <div class="settings-avatar">
              <div class="settings-avatar__placeholder" aria-hidden="true">
                {{ (authStore.user?.displayName ?? authStore.user?.name ?? '?')[0]?.toUpperCase() }}
              </div>
            </div>
            <div class="settings-avatar__actions">
              <AppButton
                size="sm"
                variant="secondary"
                disabled
                :label="t('pages.settings.profileAvatarUpload')"
              />
              <AppButton
                size="sm"
                variant="ghost"
                disabled
                :label="t('pages.settings.profileAvatarRemove')"
              />
            </div>
          </div>
        </div>

        <!-- Display name row -->
        <div class="settings-row">
          <div class="settings-row__left">
            <span class="settings-row__label">{{ t('pages.settings.profileNameLabel') }}</span>
            <span class="settings-row__help">{{ t('pages.settings.profileNameHelp') }}</span>
          </div>
          <div class="settings-row__control">
            <AppInput
              v-model="displayName"
              :placeholder="t('pages.settings.profileNamePlaceholder')"
              class="settings-row__input"
              @update:model-value="onDisplayNameInput"
              @blur="onDisplayNameBlur"
            />
            <SettingSyncIndicator
              :state="nameSyncState"
              :label-saving="t('pages.settings.syncSaving')"
              :label-saved="t('pages.settings.syncSaved')"
              :label-error="t('pages.settings.syncError')"
            />
          </div>
        </div>

        <!-- Email row (read-only) -->
        <div class="settings-row">
          <div class="settings-row__left">
            <span class="settings-row__label">{{ t('pages.settings.profileEmailLabel') }}</span>
            <span class="settings-row__help">{{ t('pages.settings.profileEmailComingSoon') }}</span>
          </div>
          <div class="settings-row__control settings-row__control--inline">
            <span class="settings-row__value">{{ emailDisplay }}</span>
            <AppButton
              size="sm"
              variant="ghost"
              disabled
              :label="t('pages.settings.profileEmailChange')"
            />
          </div>
        </div>

        <!-- Password row -->
        <div class="settings-row settings-row--column">
          <div class="settings-row__top">
            <div class="settings-row__left">
              <span class="settings-row__label">{{
                t('pages.settings.profilePasswordLabel')
              }}</span>
              <span class="settings-row__help">{{ t('pages.settings.profilePasswordHelp') }}</span>
            </div>
            <div class="settings-row__control">
              <AppButton
                size="sm"
                variant="secondary"
                :label="t('pages.settings.profilePasswordChange')"
                @click="togglePasswordForm"
              />
            </div>
          </div>

          <form
            v-if="passwordFormOpen"
            class="settings-password-form"
            @submit.prevent="onPasswordSubmit"
          >
            <AppPasswordField
              v-model="currentPassword"
              :label="t('pages.settings.profilePasswordCurrent')"
              auto-complete="current-password"
              class="settings-password-form__input"
            />
            <AppPasswordField
              v-model="newPassword"
              :label="t('pages.settings.profilePasswordNew')"
              auto-complete="new-password"
              class="settings-password-form__input"
            />
            <AppPasswordField
              v-model="confirmPassword"
              :label="t('pages.settings.profilePasswordConfirm')"
              auto-complete="new-password"
              class="settings-password-form__input"
            />
            <p v-if="passwordError" class="settings-password-form__error" role="alert">
              {{ passwordError }}
            </p>
            <AppButton
              type="submit"
              :loading="passwordSaving"
              :label="t('pages.settings.profilePasswordSubmit')"
            />
          </form>
        </div>
      </section>

      <!-- ── Section: Appearance ──────────────────────────────────────────── -->
      <section class="settings-section" aria-labelledby="section-appearance">
        <h2 id="section-appearance" class="settings-section__title">
          {{ t('pages.settings.sectionAppearance') }}
        </h2>

        <!-- Theme row -->
        <div class="settings-row">
          <div class="settings-row__left">
            <span class="settings-row__label">{{ t('pages.settings.appearanceThemeLabel') }}</span>
            <span class="settings-row__help">{{ t('pages.settings.appearanceThemeHelp') }}</span>
          </div>
          <div class="settings-row__control">
            <AppSegmented
              :model-value="activeTheme"
              :label="t('pages.settings.appearanceThemeLabel')"
              @update:model-value="onTheme"
            >
              <AppSegmentedItem
                v-for="opt in themeOptions"
                :key="opt"
                :value="opt"
                :label="themeLabel(opt)"
              />
            </AppSegmented>
          </div>
        </div>

        <!-- Density row -->
        <div class="settings-row">
          <div class="settings-row__left">
            <span class="settings-row__label">{{
              t('pages.settings.appearanceDensityLabel')
            }}</span>
            <span class="settings-row__help">{{ t('pages.settings.appearanceDensityHelp') }}</span>
          </div>
          <div class="settings-row__control">
            <AppSegmented
              :model-value="prefs.density"
              :label="t('pages.settings.appearanceDensityLabel')"
              @update:model-value="prefs.setDensity"
            >
              <AppSegmentedItem
                v-for="opt in densityOptions"
                :key="opt"
                :value="opt"
                :label="densityLabel(opt)"
              />
            </AppSegmented>
          </div>
        </div>
      </section>

      <!-- ── Section: Playback ────────────────────────────────────────────── -->
      <section class="settings-section" aria-labelledby="section-playback">
        <h2 id="section-playback" class="settings-section__title">
          {{ t('pages.settings.sectionPlayback') }}
        </h2>

        <!-- Default speed row -->
        <div class="settings-row">
          <div class="settings-row__left">
            <span class="settings-row__label">{{ t('pages.settings.playbackSpeedLabel') }}</span>
            <span class="settings-row__help">{{ t('pages.settings.playbackSpeedHelp') }}</span>
          </div>
          <div class="settings-row__control">
            <AppSegmented
              :model-value="prefs.defaultSpeed"
              :label="t('pages.settings.playbackSpeedLabel')"
              @update:model-value="prefs.setDefaultSpeed"
            >
              <AppSegmentedItem
                v-for="speed in speedOptions"
                :key="speed"
                :value="speed"
                :label="speed === 1 ? '1×' : `${speed}×`"
              />
            </AppSegmented>
          </div>
        </div>

        <!-- Autoplay next row -->
        <div class="settings-row settings-row--toggle">
          <div class="settings-row__left">
            <span class="settings-row__label">{{ t('pages.settings.playbackAutoplayLabel') }}</span>
            <span class="settings-row__help">{{ t('pages.settings.playbackAutoplayHelp') }}</span>
          </div>
          <div class="settings-row__control">
            <AppSwitch
              :model-value="prefs.autoplayNext"
              :aria-label="t('pages.settings.playbackAutoplayLabel')"
              @update:model-value="prefs.setAutoplayNext"
            />
          </div>
        </div>

        <!-- Resume where left off row -->
        <div class="settings-row settings-row--toggle">
          <div class="settings-row__left">
            <span class="settings-row__label">{{ t('pages.settings.playbackResumeLabel') }}</span>
            <span class="settings-row__help">{{ t('pages.settings.playbackResumeHelp') }}</span>
          </div>
          <div class="settings-row__control">
            <AppSwitch
              :model-value="prefs.resumeWhereLeftOff"
              :aria-label="t('pages.settings.playbackResumeLabel')"
              @update:model-value="prefs.setResumeWhereLeftOff"
            />
          </div>
        </div>

        <!-- Completion threshold row -->
        <div class="settings-row settings-row--column">
          <div class="settings-row__top">
            <div class="settings-row__left">
              <span class="settings-row__label">{{
                t('pages.settings.playbackThresholdLabel')
              }}</span>
              <span class="settings-row__help">{{
                t('pages.settings.playbackThresholdHelp')
              }}</span>
            </div>
            <div class="settings-row__control settings-row__control--inline">
              <span class="settings-row__value settings-row__value--mono"
                >{{ prefs.completionThreshold }}%</span
              >
            </div>
          </div>
          <input
            type="range"
            :value="prefs.completionThreshold"
            min="70"
            max="100"
            step="5"
            class="settings-slider"
            :aria-label="t('pages.settings.playbackThresholdLabel')"
            :aria-valuetext="`${prefs.completionThreshold}%`"
            @input="
              (e) => prefs.setCompletionThreshold(Number((e.target as HTMLInputElement).value))
            "
          />
        </div>
      </section>

      <!-- ── Section: Account ─────────────────────────────────────────────── -->
      <section class="settings-section" aria-labelledby="section-account">
        <h2 id="section-account" class="settings-section__title">
          {{ t('pages.settings.sectionAccount') }}
        </h2>

        <!-- Sign out row -->
        <div class="settings-row">
          <div class="settings-row__left">
            <span class="settings-row__label">{{ t('pages.settings.accountSignOutLabel') }}</span>
            <span class="settings-row__help">{{ t('pages.settings.accountSignOutHelp') }}</span>
          </div>
          <div class="settings-row__control">
            <AppButton
              variant="secondary"
              :label="t('pages.settings.accountSignOutCta')"
              @click="onSignOut"
            />
          </div>
        </div>

        <!-- Sign out other devices row -->
        <div class="settings-row">
          <div class="settings-row__left">
            <span class="settings-row__label">{{
              t('pages.settings.accountSignOutOthersLabel')
            }}</span>
            <span class="settings-row__help">{{
              t('pages.settings.accountSignOutOthersHelp')
            }}</span>
          </div>
          <div class="settings-row__control">
            <AppButton
              variant="secondary"
              :loading="signOutOthersPending"
              :label="t('pages.settings.accountSignOutOthersCta')"
              @click="signOutOthersDialogOpen = true"
            />
          </div>
        </div>

        <!-- Delete account row -->
        <div class="settings-row">
          <div class="settings-row__left">
            <span class="settings-row__label">{{ t('pages.settings.accountDeleteLabel') }}</span>
            <span class="settings-row__help">{{
              t('pages.settings.accountDeleteComingSoon')
            }}</span>
          </div>
          <div class="settings-row__control">
            <AppButton
              variant="destructive"
              disabled
              :label="t('pages.settings.accountDeleteCta')"
            />
          </div>
        </div>
      </section>

      <!-- Confirm: sign out other devices -->
      <AppDialog
        :open="signOutOthersDialogOpen"
        size="sm"
        :title="t('pages.settings.accountSignOutOthersDialogTitle')"
        :description="t('pages.settings.accountSignOutOthersDialogDescription')"
        @update:open="signOutOthersDialogOpen = $event"
      >
        <template #footer>
          <AppButton
            variant="ghost"
            :label="t('pages.settings.accountSignOutOthersDialogCancel')"
            @click="signOutOthersDialogOpen = false"
          />
          <AppButton
            variant="destructive"
            :label="t('pages.settings.accountSignOutOthersDialogConfirm')"
            @click="confirmSignOutOthers"
          />
        </template>
      </AppDialog>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $max-w: 720px;
  $section-gap: var(--space-8);
  $row-gap: var(--space-1);
  $border: 1px solid var(--border-default);
  $ctrl-min-w: 220px;

  .page-settings {
    padding: var(--space-8) var(--space-4);
    min-height: 100%;

    &__inner {
      max-width: $max-w;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: $section-gap;
    }

    &__header {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    &__title {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--text-fg);
      margin: 0;
    }

    &__subtitle {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0;
    }
  }

  // ── Section ────────────────────────────────────────────────────────────────

  .settings-section {
    display: flex;
    flex-direction: column;
    border: $border;
    border-radius: var(--radius-lg);
    overflow: hidden;

    &__title {
      font-size: var(--text-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-secondary);
      padding: var(--space-3) var(--space-4);
      margin: 0;
      background: var(--surface-raised);
      border-bottom: $border;
    }
  }

  // ── Row ────────────────────────────────────────────────────────────────────

  // AppSegmented is inline-flex with no wrap; cap it to the row width and let
  // it scroll rather than overflow when a picker is wide (e.g. the 6-item
  // speed control on a very narrow viewport).
  .settings-row :deep(.app-segmented) {
    max-width: 100%;
    overflow-x: auto;
  }

  .settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-4);
    border-bottom: $border;

    &:last-child {
      border-bottom: none;
    }

    &--column {
      flex-direction: column;
      align-items: stretch;

      .settings-row__top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--space-4);
      }
    }

    &--toggle {
      .settings-row__control {
        flex-shrink: 0;
      }
    }

    &__left {
      display: flex;
      flex-direction: column;
      gap: $row-gap;
      flex: 1;
      min-width: 0;
    }

    &__label {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--text-fg);
    }

    &__help {
      font-size: var(--text-xs);
      color: var(--text-secondary);
    }

    &__control {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--space-1);
      flex-shrink: 0;

      &--inline {
        flex-direction: row;
        align-items: center;
        gap: var(--space-2);
      }

      &--avatar {
        flex-direction: row;
        align-items: center;
        gap: var(--space-3);
      }
    }

    &__input {
      min-width: $ctrl-min-w;
    }

    &__value {
      font-size: var(--text-sm);
      color: var(--text-fg);

      &--mono {
        font-family: var(--font-mono);
        font-variant-numeric: tabular-nums;
        font-weight: 600;
        min-width: 3ch;
        text-align: right;
      }
    }
  }

  // ── Avatar placeholder ─────────────────────────────────────────────────────

  $avatar-size: 48px;

  .settings-avatar {
    flex-shrink: 0;

    &__placeholder {
      width: $avatar-size;
      height: $avatar-size;
      border-radius: 50%;
      background: var(--surface-raised);
      border: $border;
      display: grid;
      place-items: center;
      font-size: var(--text-lg);
      font-weight: 700;
      color: var(--text-secondary);
      user-select: none;
    }

    &__actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }
  }

  // ── Password form ──────────────────────────────────────────────────────────

  .settings-password-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding-top: var(--space-3);

    &__input {
      width: 100%;
      max-width: $ctrl-min-w;
    }

    &__error {
      font-size: var(--text-sm);
      color: var(--status-error-fg);
      margin: 0;
    }
  }

  // ── Range slider ───────────────────────────────────────────────────────────

  .settings-slider {
    width: 100%;
    accent-color: var(--brand-accent);
    cursor: pointer;
  }

  // ── Responsive ────────────────────────────────────────────────────────────

  @media (width < 600px) {
    .settings-row {
      flex-direction: column;
      align-items: stretch;

      &--toggle {
        flex-direction: row;
        align-items: center;
      }

      &__control {
        align-items: flex-start;
      }

      &__input {
        min-width: unset;
        width: 100%;
      }
    }
  }
</style>
