/// Which privileged role, if any, decorates an [AppAvatar] with a small
/// corner badge.
///
/// Mirrors the web `AppAvatar` `Role` union (`'admin' | 'guest'`).
enum AppAvatarRole { admin, guest }

/// The avatar diameter ramp, mirroring the web `AppAvatar` `Size` union
/// (`'xs' | 'sm' | 'md' | 'lg' | 'xl'`). `md` is the default, matching the
/// web prop default of `size = 'md'`.
///
/// Diameters and the per-size initials font size are a locally-owned scale:
/// the web component hard-codes its own `--app-avatar-*` pixel values in the
/// `&--xs` … `&--xl` SCSS modifiers rather than routing them through the
/// shared type scale, so there is no design token to bind these getters to
/// either — they mirror the web pixel values 1:1 instead.
enum AppAvatarSize {
  xs,
  sm,
  md,
  lg,
  xl;

  /// Circle diameter in logical pixels (web: 20 / 24 / 32 / 40 / 56).
  double get diameter => switch (this) {
    AppAvatarSize.xs => 20,
    AppAvatarSize.sm => 24,
    AppAvatarSize.md => 32,
    AppAvatarSize.lg => 40,
    AppAvatarSize.xl => 56,
  };

  /// Initials label font size in logical pixels (web: 10 / 11 / 13 / 15 / 18).
  double get initialsFontSize => switch (this) {
    AppAvatarSize.xs => 10,
    AppAvatarSize.sm => 11,
    AppAvatarSize.md => 13,
    AppAvatarSize.lg => 15,
    AppAvatarSize.xl => 18,
  };
}
