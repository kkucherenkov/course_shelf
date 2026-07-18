import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/auth/domain/auth_user.dart';
import 'package:app_mobile/features/auth/presentation/bloc/auth_cubit.dart';
import 'package:app_mobile/features/settings/presentation/bloc/settings_cubit.dart';
import 'package:app_mobile/features/settings/presentation/bloc/settings_state.dart';
import 'package:app_mobile/i18n/strings.g.dart';

/// Body of the Settings tab — E18-F03-S02 (`cs-mobile-search-settings`).
///
/// A grouped list (Profile · Appearance · Playback · Account), a pinned
/// destructive Sign out, and a version footer — driven by the app-level
/// [AuthCubit] (profile header, sign-out) and the tab-local [SettingsCubit]
/// (Appearance/Playback preference rows).
///
/// Deliberately owns neither a `Scaffold` nor an `AppBar`: `AppNavigationShell`
/// supplies both, and nesting a second Scaffold would stack two app bars. It
/// is also a `Column`, not a `ListView` — the shell wraps every tab body in a
/// `SliverToBoxAdapter`, where an unbounded-height scrollable throws.
///
/// It reads the app-level [AuthCubit] instead of creating one: signing out
/// has to mutate the very session `AuthGate` is watching, otherwise the gate
/// never rebuilds and the user stays inside the authenticated shell.
///
/// Takes no [SettingsCubit] of its own — `MainShell` provides one from
/// get_it at the point this body is mounted, the same way it provides
/// `HomeCubit` for `HomeTabBody`.
class SettingsTabBody extends StatelessWidget {
  const SettingsTabBody({super.key});

  @override
  Widget build(BuildContext context) {
    final t = context.t.settings;
    final user = context.watch<AuthCubit>().state.user;

    return BlocBuilder<SettingsCubit, SettingsState>(
      builder: (BuildContext context, SettingsState state) {
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const SizedBox(height: AppSpacing.s2),
            if (user != null) _ProfileHeader(user: user),
            _SettingsSection(
              title: t.appearanceSection,
              rows: <Widget>[
                _PrefRow(
                  icon: IconName.moon,
                  label: t.themeLabel,
                  value: _themeLabel(t, state.theme),
                  onTap: context.read<SettingsCubit>().cycleTheme,
                ),
                _PrefRow(
                  icon: IconName.sliders,
                  label: t.textSizeLabel,
                  value: _textSizeLabel(t, state.textSize),
                  onTap: context.read<SettingsCubit>().cycleTextSize,
                ),
                _PrefRow(
                  icon: IconName.eye,
                  label: t.reduceMotionLabel,
                  control: AppSwitch(
                    key: const ValueKey<String>('settingsReduceMotion'),
                    value: state.reduceMotion,
                    onChanged: (_) =>
                        context.read<SettingsCubit>().toggleReduceMotion(),
                  ),
                ),
                _PrefRow(
                  materialIcon: Icons.language_outlined,
                  label: t.languageLabel,
                  control: const _LanguageDropdown(),
                ),
              ],
            ),
            _SettingsSection(
              title: t.playbackSection,
              rows: <Widget>[
                _PrefRow(
                  icon: IconName.play,
                  label: t.autoplayLabel,
                  control: AppSwitch(
                    key: const ValueKey<String>('settingsAutoplay'),
                    value: state.autoplayNextLesson,
                    onChanged: (_) => context
                        .read<SettingsCubit>()
                        .toggleAutoplayNextLesson(),
                  ),
                ),
                _PrefRow(
                  icon: IconName.speed,
                  label: t.defaultSpeedLabel,
                  value: _speedLabel(state.playbackSpeed),
                  onTap: context.read<SettingsCubit>().cyclePlaybackSpeed,
                ),
                _PrefRow(
                  icon: IconName.subtitles,
                  label: t.subtitlesLabel,
                  value: _subtitlesLabel(t, state.subtitles),
                  onTap: context.read<SettingsCubit>().cycleSubtitles,
                ),
                _PrefRow(
                  icon: IconName.cloudDown,
                  label: t.wifiOnlyLabel,
                  control: AppSwitch(
                    key: const ValueKey<String>('settingsWifiOnly'),
                    value: state.wifiOnlyDownloads,
                    onChanged: (_) =>
                        context.read<SettingsCubit>().toggleWifiOnlyDownloads(),
                  ),
                ),
              ],
            ),
            _SettingsSection(
              title: t.accountSection,
              rows: <Widget>[
                _PrefRow(
                  icon: IconName.calendar,
                  label: t.subscriptionLabel,
                  onTap: () => _showComingSoonSnackBar(context),
                ),
                _PrefRow(
                  icon: IconName.hardDrive,
                  label: t.storageLabel,
                  onTap: () => _showComingSoonSnackBar(context),
                ),
                _PrefRow(
                  icon: IconName.mail,
                  label: t.notificationsSection,
                  onTap: () => _showComingSoonSnackBar(context),
                ),
                _PrefRow(
                  icon: IconName.shield,
                  label: t.privacySecurityLabel,
                  onTap: () =>
                      _showUrlSnackBar(context, 'https://example.com/privacy'),
                ),
                _PrefRow(
                  icon: IconName.info,
                  label: t.helpSupportLabel,
                  // Folds the former standalone Terms-of-service row in here:
                  // the design's Account section has no separate Terms entry,
                  // and dropping the working link outright would be a silent
                  // regression rather than a restructure. A real Help Center
                  // is a follow-up.
                  onTap: () =>
                      _showUrlSnackBar(context, 'https://example.com/terms'),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.s2),
            _SettingsSection(
              rows: <Widget>[
                _PrefRow(
                  key: const ValueKey<String>('settingsSignOut'),
                  icon: IconName.logout,
                  label: t.signOut,
                  danger: true,
                  onTap: () => _confirmSignOut(context),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.s5),
              child: Text(
                '${context.t.common.appTitle} 0.1.0',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  fontFamily: AppTypography.code.fontFamily,
                  color: context.semanticColors.textTertiary,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  // `TranslationsSettingsEn` is the base-locale (en) class every other
  // locale's settings-namespace class extends, so it doubles as the common
  // type for a `context.t.settings` value regardless of which locale is
  // actually active — slang generates no separate shared interface for it.
  String _themeLabel(TranslationsSettingsEn t, AppThemePreference theme) =>
      switch (theme) {
        AppThemePreference.system => t.themeSystem,
        AppThemePreference.light => t.themeLight,
        AppThemePreference.dark => t.themeDark,
      };

  String _textSizeLabel(TranslationsSettingsEn t, TextSizePreference size) =>
      switch (size) {
        TextSizePreference.small => t.textSizeSmall,
        TextSizePreference.defaultSize => t.textSizeDefault,
        TextSizePreference.large => t.textSizeLarge,
      };

  String _subtitlesLabel(
    TranslationsSettingsEn t,
    SubtitlesPreference subtitles,
  ) => switch (subtitles) {
    SubtitlesPreference.off => t.subtitlesOff,
    SubtitlesPreference.english => t.subtitlesEnglish,
  };

  /// `0.75` -> "0.75×", `1` -> "1.0×", `1.5` -> "1.5×". Not a t() key: the ×
  /// suffix and decimal formatting are locale-neutral, same as the player's
  /// own speed picker.
  String _speedLabel(double speed) {
    final bool isWhole = speed == speed.roundToDouble();
    final String value = isWhole ? speed.toStringAsFixed(1) : speed.toString();
    return '$value×';
  }

  void _showComingSoonSnackBar(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(context.t.common.comingSoon),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _showUrlSnackBar(BuildContext context, String url) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(url), behavior: SnackBarBehavior.floating),
    );
  }

  Future<void> _confirmSignOut(BuildContext context) async {
    final t = context.t.settings;
    final cubit = context.read<AuthCubit>();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(t.signOut),
        content: Text(t.signOutConfirm),
        actions: [
          TextButton(
            key: const ValueKey('settingsSignOutCancel'),
            onPressed: () => Navigator.pop(ctx, false),
            child: Text(t.signOutCancel),
          ),
          TextButton(
            key: const ValueKey('settingsSignOutConfirm'),
            onPressed: () => Navigator.pop(ctx, true),
            child: Text(
              t.signOutConfirmButton,
              style: TextStyle(color: Theme.of(ctx).colorScheme.error),
            ),
          ),
        ],
      ),
    );
    if (confirmed ?? false) {
      // No imperative navigation afterwards: AuthGate watches this same cubit
      // and swaps the shell for the unauthenticated stack on its own.
      await cubit.signOut();
    }
  }
}

/// Avatar initials + name + email, read from the current session.
///
/// Non-interactive: profile-detail navigation doesn't exist yet.
/// TODO(E18): open a profile-detail screen once one exists.
class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.user});

  final AuthUser user;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.s4,
        0,
        AppSpacing.s4,
        AppSpacing.s4,
      ),
      child: Row(
        children: <Widget>[
          AppAvatar(name: user.name, size: AppAvatarSize.lg),
          const SizedBox(width: AppSpacing.s3),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text(
                  user.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: AppFontWeight.semibold,
                  ),
                ),
                Text(
                  user.email,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// A section header + rounded card of rows — the design's grouped-list look.
/// [title] is omitted for the pinned Sign-out card, which carries no header.
class _SettingsSection extends StatelessWidget {
  const _SettingsSection({this.title, required this.rows});

  final String? title;
  final List<Widget> rows;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.s4,
        0,
        AppSpacing.s4,
        AppSpacing.s5,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          if (title != null)
            Padding(
              padding: const EdgeInsets.only(
                bottom: AppSpacing.s2,
                left: AppSpacing.s1,
              ),
              child: Text(
                title!,
                style: theme.textTheme.labelSmall?.copyWith(
                  color: cs.onSurfaceVariant,
                  letterSpacing: 0.6,
                  fontWeight: AppFontWeight.medium,
                ),
              ),
            ),
          DecoratedBox(
            decoration: BoxDecoration(
              color: cs.surface,
              border: Border.all(color: cs.outlineVariant),
              borderRadius: BorderRadius.circular(AppRadius.lg),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                for (var i = 0; i < rows.length; i++) ...<Widget>[
                  if (i > 0)
                    Padding(
                      padding: const EdgeInsets.only(left: 52),
                      child: Divider(height: 1, color: cs.outlineVariant),
                    ),
                  rows[i],
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// One row inside a [_SettingsSection]: an icon swatch, a label, and either a
/// [control] (a toggle — the row itself stays non-interactive so a switch is
/// never nested inside another tappable surface) or a display [value] with a
/// chevron when [onTap] is given.
class _PrefRow extends StatelessWidget {
  const _PrefRow({
    this.icon,
    this.materialIcon,
    required this.label,
    this.value,
    this.control,
    this.danger = false,
    this.onTap,
    super.key,
  }) : assert(
         icon != null || materialIcon != null,
         '_PrefRow needs either a brand icon or a materialIcon fallback',
       );

  /// Brand glyph — the common case.
  final IconName? icon;

  /// Escape hatch for rows with no brand-icon equivalent (there is no
  /// language/globe glyph in the 71-name [IconName] set); used only by the
  /// Language row, matching what the pre-restructure screen rendered.
  final IconData? materialIcon;

  final String label;
  final String? value;
  final Widget? control;
  final bool danger;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final cs = theme.colorScheme;
    final sem = context.semanticColors;
    final bool interactive = control == null && onTap != null;
    final Color iconColor = danger ? cs.error : cs.onSurface;
    final Widget glyph = icon != null
        ? IconCS(name: icon!, size: 15, color: iconColor)
        : Icon(materialIcon, size: 15, color: iconColor);

    final Widget content = Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s3,
        vertical: AppSpacing.s3,
      ),
      child: Row(
        children: <Widget>[
          Container(
            width: 28,
            height: 28,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: danger ? sem.errorSoft : sem.raised,
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: glyph,
          ),
          const SizedBox(width: AppSpacing.s3),
          Expanded(
            child: Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: danger ? cs.error : cs.onSurface,
                fontWeight: danger
                    ? AppFontWeight.medium
                    : AppFontWeight.regular,
              ),
            ),
          ),
          if (control != null)
            control!
          else ...<Widget>[
            if (value != null) ...<Widget>[
              Text(
                value!,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: cs.onSurfaceVariant,
                ),
              ),
              const SizedBox(width: AppSpacing.s1),
            ],
            if (onTap != null && !danger)
              IconCS(
                name: IconName.chevronRight,
                size: 15,
                color: sem.textTertiary,
              ),
          ],
        ],
      ),
    );

    if (!interactive) return content;

    return Material(
      color: Colors.transparent,
      child: InkWell(onTap: onTap, child: content),
    );
  }
}

/// The working language selector, unchanged in behavior — folded into the
/// Appearance section per the design.
class _LanguageDropdown extends StatelessWidget {
  const _LanguageDropdown();

  @override
  Widget build(BuildContext context) {
    return DropdownButton<String>(
      value: LocaleSettings.currentLocale.languageCode,
      underline: const SizedBox.shrink(),
      items: const [
        DropdownMenuItem(value: 'en', child: Text('English')),
        DropdownMenuItem(value: 'ru', child: Text('Русский')),
        DropdownMenuItem(value: 'el', child: Text('Ελληνικά')),
        DropdownMenuItem(value: 'uk', child: Text('Українська')),
      ],
      onChanged: (String? code) {
        if (code == null) return;
        final locale = AppLocale.values.firstWhere(
          (l) => l.languageCode == code,
          orElse: () => AppLocale.en,
        );
        LocaleSettings.setLocale(locale);
      },
    );
  }
}
