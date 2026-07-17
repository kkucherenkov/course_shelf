import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

import 'package:app_mobile/features/player/presentation/bloc/player_state.dart';
import 'package:app_mobile/i18n/strings.g.dart';

/// The player settings overlay: playback speed and the sleep timer.
///
/// DESIGN_BRIEF §7.6 puts the sleep timer here specifically — *"Sleep timer
/// affordance accessible from the player settings overlay"* — rather than on
/// the chrome itself, which is why `AppPlayerChrome.onSettingsTap` only emits
/// a callback and leaves the sheet to the feature.
class PlayerSettingsSheet extends StatelessWidget {
  const PlayerSettingsSheet({
    required this.speed,
    required this.sleepTimer,
    required this.onSpeedSelected,
    required this.onSleepTimerSelected,
    super.key,
  });

  final double speed;
  final Duration? sleepTimer;
  final ValueChanged<double> onSpeedSelected;
  final ValueChanged<Duration?> onSleepTimerSelected;

  static const Key sleepTimerOffKey = Key('playerSettingsSleepOff');

  static Key speedKey(double value) => Key('playerSettingsSpeed-$value');
  static Key sleepKey(Duration value) =>
      Key('playerSettingsSleep-${value.inMinutes}');

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final TextStyle labelStyle =
        (theme.textTheme.labelLarge ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.sm,
          fontWeight: AppFontWeight.medium,
          color: theme.colorScheme.onSurfaceVariant,
        );

    return AppBottomSheet(
      title: context.t.player.settingsTitle,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Text(context.t.player.settingsSpeed, style: labelStyle),
          const SizedBox(height: AppSpacing.s2),
          Wrap(
            spacing: AppSpacing.s2,
            runSpacing: AppSpacing.s2,
            children: <Widget>[
              for (final double option in kPlaybackSpeeds)
                AppChip(
                  key: speedKey(option),
                  label: '$option×',
                  selected: option == speed,
                  onTap: () => onSpeedSelected(option),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.s4),
          Text(context.t.player.settingsSleepTimer, style: labelStyle),
          const SizedBox(height: AppSpacing.s2),
          Wrap(
            spacing: AppSpacing.s2,
            runSpacing: AppSpacing.s2,
            children: <Widget>[
              AppChip(
                key: sleepTimerOffKey,
                label: context.t.player.sleepTimerOff,
                selected: sleepTimer == null,
                onTap: () => onSleepTimerSelected(null),
              ),
              for (final Duration option in kSleepTimerOptions)
                AppChip(
                  key: sleepKey(option),
                  label: context.t.player.sleepTimerMinutes(
                    n: option.inMinutes,
                  ),
                  // An armed timer counts down, so the remaining duration never
                  // equals the preset after the first tick — match on the
                  // preset the user actually picked by rounding up.
                  selected: sleepTimer != null && _matches(option),
                  onTap: () => onSleepTimerSelected(option),
                ),
            ],
          ),
        ],
      ),
    );
  }

  bool _matches(Duration option) {
    final Duration? remaining = sleepTimer;
    if (remaining == null) return false;
    final int index = kSleepTimerOptions.indexOf(option);
    final Duration? previous = index > 0
        ? kSleepTimerOptions[index - 1]
        : null;
    return remaining <= option && (previous == null || remaining > previous);
  }
}
