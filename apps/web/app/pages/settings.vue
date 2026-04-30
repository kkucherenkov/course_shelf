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

  import { ref, computed } from 'vue';
  import { updateMe, signOutOtherSessions, client } from '@app/api-client-ts';
  import type { MeDto } from '@app/api-client-ts';

  import { useAuthStore } from '~/stores/auth';
  import { usePreferencesStore } from '~/stores/preferences';
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

  // ── Profile — email (read-only) ───────────────────────────────────────────

  const emailDisplay = computed(() => authStore.user?.email ?? '');

  function onEmailChange(): void {
    toast.add({ title: t('pages.settings.profileEmailComingSoon'), color: 'info' });
  }

  // ── Profile — avatar (placeholder) ────────────────────────────────────────

  function onAvatarUpload(): void {
    toast.add({ title: t('pages.settings.profileAvatarComingSoon'), color: 'info' });
  }

  function onAvatarRemove(): void {
    toast.add({ title: t('pages.settings.profileAvatarComingSoon'), color: 'info' });
  }

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
      const msg = result.error ?? '';
      // Better Auth returns a message containing "incorrect" or similar for a
      // wrong current password; map it to a human-readable key.
      passwordError.value = msg.toLowerCase().includes('incorrect')
        ? t('pages.settings.profilePasswordErrorWrongCurrent')
        : msg;
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

  // ── Account — sign out other devices ──────────────────────────────────────

  const signOutOthersPending = ref(false);

  async function onSignOutOthers(): Promise<void> {
    signOutOthersPending.value = true;
    const res = await signOutOtherSessions({ client, throwOnError: false });
    signOutOthersPending.value = false;

    if (res.error) {
      toast.add({ title: t('pages.settings.toastUpdateFailed'), color: 'error' });
      return;
    }

    toast.add({ title: t('pages.settings.accountSignOutOthersToastDone'), color: 'success' });
  }

  // ── Account — delete (coming soon) ────────────────────────────────────────

  function onDeleteAccount(): void {
    toast.add({ title: t('pages.settings.accountDeleteComingSoon'), color: 'info' });
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
            <span class="settings-row__help">{{ t('pages.settings.profileAvatarHelp') }}</span>
          </div>
          <div class="settings-row__control settings-row__control--avatar">
            <div class="settings-avatar">
              <div class="settings-avatar__placeholder" aria-hidden="true">
                {{ (authStore.user?.displayName ?? authStore.user?.name ?? '?')[0]?.toUpperCase() }}
              </div>
            </div>
            <div class="settings-avatar__actions">
              <UButton size="sm" variant="outline" @click="onAvatarUpload">
                {{ t('pages.settings.profileAvatarUpload') }}
              </UButton>
              <UButton size="sm" variant="ghost" color="neutral" @click="onAvatarRemove">
                {{ t('pages.settings.profileAvatarRemove') }}
              </UButton>
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
            <UInput
              v-model="displayName"
              :placeholder="t('pages.settings.profileNamePlaceholder')"
              class="settings-row__input"
              @input="onDisplayNameInput"
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
            <span class="settings-row__help">{{ t('pages.settings.profileEmailHelp') }}</span>
          </div>
          <div class="settings-row__control settings-row__control--inline">
            <span class="settings-row__value">{{ emailDisplay }}</span>
            <UButton size="sm" variant="ghost" @click="onEmailChange">
              {{ t('pages.settings.profileEmailChange') }}
            </UButton>
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
              <UButton size="sm" variant="outline" @click="togglePasswordForm">
                {{ t('pages.settings.profilePasswordChange') }}
              </UButton>
            </div>
          </div>

          <form
            v-if="passwordFormOpen"
            class="settings-password-form"
            @submit.prevent="onPasswordSubmit"
          >
            <UFormField :label="t('pages.settings.profilePasswordCurrent')">
              <UInput
                v-model="currentPassword"
                type="password"
                autocomplete="current-password"
                class="settings-password-form__input"
              />
            </UFormField>
            <UFormField :label="t('pages.settings.profilePasswordNew')">
              <UInput
                v-model="newPassword"
                type="password"
                autocomplete="new-password"
                class="settings-password-form__input"
              />
            </UFormField>
            <UFormField :label="t('pages.settings.profilePasswordConfirm')">
              <UInput
                v-model="confirmPassword"
                type="password"
                autocomplete="new-password"
                class="settings-password-form__input"
              />
            </UFormField>
            <p v-if="passwordError" class="settings-password-form__error" role="alert">
              {{ passwordError }}
            </p>
            <UButton type="submit" :loading="passwordSaving">
              {{ t('pages.settings.profilePasswordSubmit') }}
            </UButton>
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
            <div
              class="settings-picker"
              role="radiogroup"
              :aria-label="t('pages.settings.appearanceThemeLabel')"
            >
              <button
                v-for="opt in themeOptions"
                :key="opt"
                type="button"
                role="radio"
                :aria-checked="activeTheme === opt"
                class="settings-picker__btn"
                :class="{ 'settings-picker__btn--active': activeTheme === opt }"
                @click="onTheme(opt)"
              >
                {{ themeLabel(opt) }}
              </button>
            </div>
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
            <div
              class="settings-picker"
              role="radiogroup"
              :aria-label="t('pages.settings.appearanceDensityLabel')"
            >
              <button
                v-for="opt in densityOptions"
                :key="opt"
                type="button"
                role="radio"
                :aria-checked="prefs.density === opt"
                class="settings-picker__btn"
                :class="{ 'settings-picker__btn--active': prefs.density === opt }"
                @click="prefs.setDensity(opt)"
              >
                {{ densityLabel(opt) }}
              </button>
            </div>
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
            <div
              class="settings-picker settings-picker--wrap"
              role="radiogroup"
              :aria-label="t('pages.settings.playbackSpeedLabel')"
            >
              <button
                v-for="speed in speedOptions"
                :key="speed"
                type="button"
                role="radio"
                :aria-checked="prefs.defaultSpeed === speed"
                class="settings-picker__btn"
                :class="{ 'settings-picker__btn--active': prefs.defaultSpeed === speed }"
                @click="prefs.setDefaultSpeed(speed)"
              >
                {{ speed === 1 ? '1×' : `${speed}×` }}
              </button>
            </div>
          </div>
        </div>

        <!-- Autoplay next row -->
        <div class="settings-row settings-row--toggle">
          <div class="settings-row__left">
            <span class="settings-row__label">{{ t('pages.settings.playbackAutoplayLabel') }}</span>
            <span class="settings-row__help">{{ t('pages.settings.playbackAutoplayHelp') }}</span>
          </div>
          <div class="settings-row__control">
            <UToggle
              :model-value="prefs.autoplayNext"
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
            <UToggle
              :model-value="prefs.resumeWhereLeftOff"
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
            <UButton variant="outline" color="neutral" @click="onSignOut">
              {{ t('pages.settings.accountSignOutCta') }}
            </UButton>
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
            <UButton
              variant="outline"
              color="neutral"
              :loading="signOutOthersPending"
              @click="onSignOutOthers"
            >
              {{ t('pages.settings.accountSignOutOthersCta') }}
            </UButton>
          </div>
        </div>

        <!-- Delete account row -->
        <div class="settings-row">
          <div class="settings-row__left">
            <span class="settings-row__label">{{ t('pages.settings.accountDeleteLabel') }}</span>
            <span class="settings-row__help">{{ t('pages.settings.accountDeleteHelp') }}</span>
          </div>
          <div class="settings-row__control">
            <UButton variant="outline" color="error" @click="onDeleteAccount">
              {{ t('pages.settings.accountDeleteCta') }}
            </UButton>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  $max-w: 720px;
  $section-gap: var(--space-8);
  $row-gap: var(--space-1);
  $border: 1px solid var(--border-default);
  $ctrl-min-w: 220px;
  $dur-btn: var(--dur-fast);

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
      color: var(--text-loud);
      margin: 0;
    }

    &__subtitle {
      font-size: var(--text-sm);
      color: var(--text-muted);
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
      color: var(--text-muted);
      padding: var(--space-3) var(--space-4);
      margin: 0;
      background: var(--surface-raised);
      border-bottom: $border;
    }
  }

  // ── Row ────────────────────────────────────────────────────────────────────

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
      color: var(--text-muted);
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
      color: var(--text-muted);
      user-select: none;
    }

    &__actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }
  }

  // ── 3-up picker ────────────────────────────────────────────────────────────

  .settings-picker {
    display: flex;
    border: $border;
    border-radius: var(--radius-md);
    overflow: hidden;

    &--wrap {
      flex-wrap: wrap;
    }

    &__btn {
      flex: 1;
      padding: var(--space-1-5) var(--space-3);
      font-size: var(--text-sm);
      font-weight: 500;
      background: var(--surface-surface);
      color: var(--text-muted);
      border: none;
      border-right: $border;
      cursor: pointer;
      transition:
        background $dur-btn ease,
        color $dur-btn ease;
      white-space: nowrap;

      &:last-child {
        border-right: none;
      }

      &:hover:not(.settings-picker__btn--active) {
        background: var(--surface-raised);
        color: var(--text-fg);
      }

      &--active {
        background: var(--primary);
        color: var(--text-inverse);
      }
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
    accent-color: var(--primary);
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
