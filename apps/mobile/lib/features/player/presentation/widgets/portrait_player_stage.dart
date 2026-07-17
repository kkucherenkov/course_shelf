import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

import 'package:app_mobile/features/player/presentation/bloc/player_state.dart';
import 'package:app_mobile/i18n/strings.g.dart';

/// The portrait 16:9 stage: video surface, buffering/error overlays, and a
/// compact control row.
///
/// **Why this is not `AppPlayerChrome`.** The `cs-mobile-lesson-player` mockup
/// draws portrait with `<PlayerChrome context="desktop">`, but the Flutter
/// catalog's [AppPlayerChrome] (E17-F02-S03) implements the *mobile-landscape*
/// context only: its aspect ratio is a hard-coded `static const 19/9`, and
/// nesting it inside a 16:9 box would letterbox it to a 19:9 strip rather than
/// fill the stage. There is no desktop-context twin in `app_ui` to compose. So
/// portrait composes the catalog's own primitives instead — [AppPlayerScrubber]
/// for the bar, [AppIconButton]/[AppSpinner]/[AppButton] for the controls —
/// rather than reimplementing chrome or reshaping a shared component from a
/// feature. Landscape still uses the real [AppPlayerChrome].
class PortraitPlayerStage extends StatelessWidget {
  const PortraitPlayerStage({
    required this.state,
    required this.videoSlot,
    required this.onPlayPause,
    required this.onSeekFraction,
    required this.onRetry,
    required this.onFullscreen,
    required this.onSettings,
    super.key,
  });

  final PlayerState state;
  final Widget videoSlot;
  final VoidCallback onPlayPause;
  final ValueChanged<double> onSeekFraction;
  final VoidCallback onRetry;
  final VoidCallback onFullscreen;
  final VoidCallback onSettings;

  static const Key playPauseKey = Key('portraitPlayerPlayPause');
  static const Key bufferingKey = Key('portraitPlayerBuffering');
  static const Key errorKey = Key('portraitPlayerError');
  static const Key retryKey = Key('portraitPlayerRetry');
  static const Key fullscreenKey = Key('portraitPlayerFullscreen');
  static const Key settingsKey = Key('portraitPlayerSettings');

  /// Web: `.page-lesson-player__skeleton-player { aspect-ratio: 16 / 9 }`, and
  /// DESIGN_BRIEF §7.6 ("player at the top in 16:9").
  static const double aspectRatio = 16 / 9;

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: aspectRatio,
      child: ColoredBox(
        // `media.stage` (#000) — the video plane. Deliberately NOT a themed
        // surface: `docs/design/shared/tokens.json` §media documents the media
        // ramp as theme-independent because video is dark under every theme.
        // The Dart token emitter does not emit the media ramp yet (see the
        // card report), so this mirrors `AppPlayerChrome`'s own
        // `ColoredBox(color: Colors.black)` stage rather than inventing a
        // different value.
        color: Colors.black,
        child: Stack(
          fit: StackFit.expand,
          children: <Widget>[
            videoSlot,
            if (state.status == PlayerStatus.buffering)
              const IgnorePointer(
                child: Center(
                  child: AppSpinner(
                    key: bufferingKey,
                    size: AppSpinnerSize.lg,
                    color: Colors.white,
                  ),
                ),
              ),
            if (state.status == PlayerStatus.error) _buildError(context),
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: _buildControls(context),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildError(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    return ColoredBox(
      key: errorKey,
      color: Colors.black.withValues(alpha: AppOpacity.overlay),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            IconCS(
              name: IconName.alert,
              size: AppFontSize.s2xl,
              color: theme.colorScheme.error,
            ),
            const SizedBox(height: AppSpacing.s2),
            Text(
              context.t.player.streamError,
              textAlign: TextAlign.center,
              style: (theme.textTheme.bodyMedium ?? const TextStyle()).copyWith(
                color: Colors.white,
              ),
            ),
            const SizedBox(height: AppSpacing.s2),
            AppButton(
              key: retryKey,
              label: context.t.player.retry,
              variant: AppButtonVariant.secondary,
              size: AppButtonSize.sm,
              onPressed: onRetry,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildControls(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final bool isPlaying = state.status == PlayerStatus.playing;

    // Scopes the ghost controls to on-video white, the same substitution
    // AppPlayerChrome makes internally — there is no ColorScheme slot for
    // "painted directly on video".
    final ThemeData onVideo = theme.copyWith(
      colorScheme: theme.colorScheme.copyWith(onSurface: Colors.white),
    );

    return Theme(
      data: onVideo,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.s3,
          vertical: AppSpacing.s2,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            AppPlayerScrubber(
              playedFraction: _playedFraction,
              bufferedFraction: state.bufferedFraction,
              bookmarkFractions: state.bookmarkFractions,
              onSeek: onSeekFraction,
            ),
            Row(
              children: <Widget>[
                AppIconButton(
                  key: playPauseKey,
                  name: isPlaying ? IconName.pause : IconName.play,
                  semanticLabel: isPlaying
                      ? context.t.player.pause
                      : context.t.player.play,
                  variant: AppButtonVariant.ghost,
                  size: AppButtonSize.sm,
                  onPressed: onPlayPause,
                ),
                const SizedBox(width: AppSpacing.s2),
                Text(
                  '${_format(state.position)} / ${_format(state.duration)}',
                  style: (theme.textTheme.bodySmall ?? const TextStyle())
                      .copyWith(
                        fontFamily: AppTypography.code.fontFamily,
                        fontSize: AppFontSize.xs,
                        color: Colors.white,
                        fontFeatures: const <FontFeature>[
                          FontFeature.tabularFigures(),
                        ],
                      ),
                ),
                const Spacer(),
                AppIconButton(
                  key: settingsKey,
                  name: IconName.settings,
                  semanticLabel: context.t.player.settingsTitle,
                  variant: AppButtonVariant.ghost,
                  size: AppButtonSize.sm,
                  onPressed: onSettings,
                ),
                AppIconButton(
                  key: fullscreenKey,
                  name: IconName.fullscreen,
                  semanticLabel: context.t.player.playerAria,
                  variant: AppButtonVariant.ghost,
                  size: AppButtonSize.sm,
                  onPressed: onFullscreen,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  double get _playedFraction {
    final int total = state.duration.inMilliseconds;
    if (total <= 0) return 0;
    return (state.position.inMilliseconds / total).clamp(0.0, 1.0);
  }

  String _format(Duration duration) {
    final int seconds = duration.inSeconds < 0 ? 0 : duration.inSeconds;
    final int hours = seconds ~/ 3600;
    final int minutes = (seconds % 3600) ~/ 60;
    final int secs = seconds % 60;
    final String mm = minutes.toString().padLeft(hours > 0 ? 2 : 1, '0');
    if (hours > 0) {
      return '$hours:$mm:${secs.toString().padLeft(2, '0')}';
    }
    return '$mm:${secs.toString().padLeft(2, '0')}';
  }
}
