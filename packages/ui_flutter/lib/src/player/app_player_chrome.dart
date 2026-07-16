import 'package:flutter/material.dart';

import 'package:app_ui/src/buttons/app_button.dart';
import 'package:app_ui/src/buttons/app_button_variant.dart';
import 'package:app_ui/src/buttons/app_icon_button.dart';
import 'package:app_ui/src/icons/icon_cs.dart';
import 'package:app_ui/src/icons/icon_name.dart';
import 'package:app_ui/src/player/app_player_chrome_state.dart';
import 'package:app_ui/src/player/app_player_scrubber.dart';
import 'package:app_ui/src/progress/app_spinner.dart';
import 'package:app_ui/src/theme/app_theme.dart';
import 'package:app_ui/src/theme/tokens.g.dart';

/// Which edge a double-tap skip / flash-hint landed on.
enum _EdgeHintSide { left, right }

/// Locally-owned on-video literals with no [ColorScheme] / [AppOpacity] slot
/// — mirrors the web `PlayerChrome`'s own hard-coded `.pc-*` values
/// (`docs/design/cs-components/components.jsx` `§PlayerChrome`,
/// `cs-components/styles.css`) where the design itself skips its token
/// scale rather than a Flutter-side rounding decision.
abstract final class _OnVideo {
  /// `.pc-lesson-title` / the error and locked message spans' inline
  /// `style={{ fontSize: 13 }}` — between `AppFontSize.sm` (12) and `.md`
  /// (14); mirrored verbatim rather than rounded to a step.
  static const double messageFontSize = 13;

  /// The state-overlay `Icon ... size={28}` (alert / lock glyph).
  static const double stateIconSize = 28;

  /// `.pc-state-overlay { background: rgba(0,0,0,0.4) }` — equal to
  /// [AppOpacity.overlay]; named here for readability at each call site.
  static const double scrimAlpha = AppOpacity.overlay;

  /// `.pc-end-banner { background: rgba(0,0,0,0.55) }` — doesn't land on
  /// any [AppOpacity] step.
  static const double endScrimAlpha = 0.55;

  /// `.pc-btn:hover { background: rgba(255,255,255,.15) }` — the on-video
  /// hover/press fill [_OnVideoChrome] substitutes for
  /// `AppSemanticColors.raised` so ghost [AppIconButton]s read correctly
  /// over video regardless of the ambient light/dark theme.
  static const double hoverAlpha = 0.15;

  /// The end banner eyebrow's inline `style={{ opacity: 0.8 }}`.
  static const double eyebrowAlpha = 0.8;

  /// `.pc-lesson-sub { color: rgba(255,255,255,0.7) }`.
  static const double subtleAlpha = 0.7;

  /// `.pc-time { color: rgba(255,255,255,.85) }`.
  static const double timeAlpha = 0.85;

  /// Control-row `gap` (web: 6px) — nearest existing spacing step is
  /// [AppSpacing.s1] (4px); the extra 2px isn't worth a bespoke literal.
  static const double controlGap = AppSpacing.s1;

  /// `.pc-edge-hint { width: 60px }`.
  static const double edgeHintWidth = 60;
}

/// Scopes descendant [AppIconButton]/[AppButton] ghost controls to on-video
/// colours: white foreground, translucent-white hover/press fill.
///
/// There's no [ColorScheme] slot for "foreground painted directly on video"
/// (as opposed to a themed surface) — this locally overrides `onSurface` and
/// `AppSemanticColors.raised` for the wrapped subtree only, so the chrome
/// reads identically under both [AppTheme.light] and [AppTheme.dark] hosts,
/// exactly like the web `.pc-btn { color: white }` doesn't vary with the
/// surrounding page theme either.
class _OnVideoChrome extends StatelessWidget {
  const _OnVideoChrome({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final ThemeData base = Theme.of(context);
    final AppSemanticColors? semantic = base.extension<AppSemanticColors>();
    final AppShadows? shadows = base.extension<AppShadows>();
    final ThemeData onVideo = base.copyWith(
      colorScheme: base.colorScheme.copyWith(onSurface: Colors.white),
      extensions: <ThemeExtension<dynamic>>[
        if (semantic != null)
          semantic.copyWith(
            raised: Colors.white.withValues(alpha: _OnVideo.hoverAlpha),
          ),
        if (shadows != null) shadows,
      ],
    );
    return Theme(data: onVideo, child: child);
  }
}

/// The web `.pc-frame` gradient shown when no [AppPlayerChrome.videoSlot] is
/// supplied.
class _VideoPlaceholder extends StatelessWidget {
  const _VideoPlaceholder();

  @override
  Widget build(BuildContext context) {
    return const DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          // Web: `linear-gradient(135deg, #1a1d22, #0a0c10)`.
          colors: <Color>[Color(0xFF1A1D22), Color(0xFF0A0C10)],
        ),
      ),
    );
  }
}

String _formatDuration(Duration duration) {
  final int totalSeconds = duration.inSeconds < 0 ? 0 : duration.inSeconds;
  final int hours = totalSeconds ~/ 3600;
  final int minutes = (totalSeconds % 3600) ~/ 60;
  final int secs = totalSeconds % 60;
  if (hours > 0) {
    return '$hours:${minutes.toString().padLeft(2, '0')}:'
        '${secs.toString().padLeft(2, '0')}';
  }
  return '$minutes:${secs.toString().padLeft(2, '0')}';
}

/// The mobile-landscape video controls overlay — Flutter twin of the web
/// `PlayerChrome`'s `mobile-landscape` context
/// (`docs/design/cs-components/components.jsx` `§PlayerChrome`).
///
/// Presentational and **controlled**: it never decodes video, only accepts
/// an optional [videoSlot] (or renders a neutral gradient placeholder) that
/// the E18 player screen supplies, and reports every interaction via
/// callbacks rather than mutating playback state itself. The one exception
/// is minimal/full overlay mode ([initiallyMinimal]), a purely visual
/// sub-state this widget owns internally and toggles on tap — mirroring how
/// `CoursePosterCard` owns its hover/focus state without exposing it.
///
/// Composes a custom-painted [AppPlayerScrubber] with `app_ui` primitives:
/// [AppIconButton] (ghost, on-video via [_OnVideoChrome]) for every glyph
/// control, [AppButton] for the speed label and the error/end banner
/// actions, and [AppSpinner] for the buffering indicator.
///
/// Mobile-only gestures, all on the [videoAreaKey] surface: a single tap
/// toggles minimal mode; a double-tap on the right/left half fires
/// [onSkip] with +10/-10 and flashes an edge hint; a pinch-in fires
/// [onDismissToPortrait]. These gestures stay live under the error/locked/end
/// overlays too (a plain scrim `Container` doesn't consume Flutter's Stack
/// hit-testing) — callers that want them suppressed in a terminal state
/// should ignore/no-op the relevant callback while that state is active.
class AppPlayerChrome extends StatefulWidget {
  const AppPlayerChrome({
    required this.state,
    required this.sectionLabel,
    required this.lessonTitle,
    required this.position,
    required this.duration,
    this.videoSlot,
    this.bufferedFraction = 0,
    this.chapterFractions = const <double>[],
    this.bookmarkFractions = const <double>[],
    this.isMuted = false,
    this.speedLabel = '1.0×',
    this.initiallyMinimal = false,
    this.errorMessage = 'Playback failed',
    this.lockedMessage = "You don't have access to this lesson",
    this.retryLabel = 'Try again',
    this.upNextEyebrow,
    this.upNextTitle,
    this.stayLabel = 'Stay here',
    this.playNextLabel = 'Play next',
    this.onPlayPause,
    this.onSeek,
    this.onSkip,
    this.onDismissToPortrait,
    this.onNext,
    this.onPrevious,
    this.onVolumeTap,
    this.onSpeedTap,
    this.onSubtitlesTap,
    this.onSettingsTap,
    this.onToggleFullscreen,
    this.onRetry,
    this.onStay,
    this.onPlayNext,
    super.key,
  });

  final AppPlayerChromeState state;
  final String sectionLabel;
  final String lessonTitle;
  final Duration position;
  final Duration duration;

  /// The decoded video surface the E18 player screen supplies; renders a
  /// neutral gradient placeholder when null — this widget never decodes
  /// video itself.
  final Widget? videoSlot;

  /// 0..1 fraction of [duration] buffered so far.
  final double bufferedFraction;

  /// 0..1 fractions along the scrubber where a chapter tick is drawn.
  final List<double> chapterFractions;

  /// 0..1 fractions along the scrubber where a bookmark glyph is drawn.
  final List<double> bookmarkFractions;

  /// Swaps the volume glyph between `volume` and `volumeMute`.
  final bool isMuted;

  /// The speed control's label (e.g. `'1.0×'`, `'1.5×'`) — a plain button
  /// that fires [onSpeedTap]; the speed picker itself is the E18 screen's
  /// job (approved design decision, not embedded here).
  final String speedLabel;

  /// Seeds minimal (scrubber-only) mode; a tap on [videoAreaKey] toggles it
  /// afterwards.
  final bool initiallyMinimal;

  /// Message shown under the alert glyph in [AppPlayerChromeState.error].
  final String errorMessage;

  /// Message shown under the lock glyph in [AppPlayerChromeState.locked].
  final String lockedMessage;

  /// Label of the [AppPlayerChromeState.error] retry button.
  final String retryLabel;

  /// Small eyebrow line above [upNextTitle] in [AppPlayerChromeState.end]
  /// (e.g. `'Up next in 5s'`); omitted entirely when null.
  final String? upNextEyebrow;

  /// The up-next lesson title in [AppPlayerChromeState.end]; omitted
  /// entirely when null.
  final String? upNextTitle;

  /// Label of the [AppPlayerChromeState.end] "stay here" button.
  final String stayLabel;

  /// Label of the [AppPlayerChromeState.end] "play next" button.
  final String playNextLabel;

  final VoidCallback? onPlayPause;

  /// Fires with the tapped scrubber x-fraction (0..1).
  final ValueChanged<double>? onSeek;

  /// Fires with `10` / `-10` on a right/left double-tap.
  final ValueChanged<int>? onSkip;

  /// Fires on a pinch-in gesture over the video area.
  final VoidCallback? onDismissToPortrait;

  final VoidCallback? onNext;
  final VoidCallback? onPrevious;

  /// Not part of the approved design's enumerated callback list, but the
  /// control row's volume glyph needs an affordance — added as a
  /// button-emits-callback control mirroring [onSpeedTap] / [onSubtitlesTap].
  final VoidCallback? onVolumeTap;

  final VoidCallback? onSpeedTap;
  final VoidCallback? onSubtitlesTap;
  final VoidCallback? onSettingsTap;
  final VoidCallback? onToggleFullscreen;

  /// Fires when the [AppPlayerChromeState.error] retry button is tapped.
  final VoidCallback? onRetry;

  /// Fires when the [AppPlayerChromeState.end] "stay here" button is tapped.
  final VoidCallback? onStay;

  /// Fires when the [AppPlayerChromeState.end] "play next" button is tapped.
  final VoidCallback? onPlayNext;

  /// Web: `.pc-mobile-landscape { aspect-ratio: 19/9 }`.
  static const double aspectRatio = 19 / 9;

  /// Below this two-finger scale factor, a pinch reads as "pinch in" and
  /// fires [onDismissToPortrait] once per gesture — locally-owned; there is
  /// no design token for a gesture threshold.
  static const double pinchDismissThreshold = 0.7;

  static const Key videoAreaKey = Key('appPlayerChromeVideoArea');
  static const Key scrubberKey = Key('appPlayerChromeScrubber');
  static const Key minimalScrubberKey = Key('appPlayerChromeMinimalScrubber');
  static const Key playPauseKey = Key('appPlayerChromePlayPause');
  static const Key previousKey = Key('appPlayerChromePrevious');
  static const Key nextKey = Key('appPlayerChromeNext');
  static const Key volumeKey = Key('appPlayerChromeVolume');
  static const Key timeKey = Key('appPlayerChromeTime');
  static const Key speedKey = Key('appPlayerChromeSpeed');
  static const Key subtitlesKey = Key('appPlayerChromeSubtitles');
  static const Key fullscreenKey = Key('appPlayerChromeFullscreen');
  static const Key settingsKey = Key('appPlayerChromeSettings');
  static const Key bufferingSpinnerKey = Key('appPlayerChromeBufferingSpinner');
  static const Key retryKey = Key('appPlayerChromeRetry');
  static const Key stayKey = Key('appPlayerChromeStay');
  static const Key playNextKey = Key('appPlayerChromePlayNext');
  static const Key leftHintKey = Key('appPlayerChromeLeftHint');
  static const Key rightHintKey = Key('appPlayerChromeRightHint');

  @override
  State<AppPlayerChrome> createState() => _AppPlayerChromeState();
}

class _AppPlayerChromeState extends State<AppPlayerChrome>
    with SingleTickerProviderStateMixin {
  late bool _minimal;
  _EdgeHintSide? _hintSide;
  double? _pendingDoubleTapDx;
  bool _pinchFired = false;

  // Created eagerly in initState (not as a `late` field initializer): both
  // edge hints are inactive by default, so if this were a `late final`
  // initializer, an AppPlayerChrome that never shows a hint would first
  // create the AnimationController from inside `dispose()` — too late,
  // since `vsync: this` needs an active element to resolve TickerMode.
  late final AnimationController _hintController;
  late final Animation<double> _hintOpacity;

  @override
  void initState() {
    super.initState();
    _minimal = widget.initiallyMinimal;
    _hintController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _hintOpacity = Tween<double>(
      begin: 1,
      end: 0,
    ).animate(CurvedAnimation(parent: _hintController, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _hintController.dispose();
    super.dispose();
  }

  void _toggleMinimal() => setState(() => _minimal = !_minimal);

  void _handleDoubleTapDown(TapDownDetails details) {
    _pendingDoubleTapDx = details.localPosition.dx;
  }

  void _handleDoubleTap(double width) {
    final double? dx = _pendingDoubleTapDx;
    if (dx == null || width <= 0) return;
    final bool isRight = dx > width / 2;
    setState(
      () => _hintSide = isRight ? _EdgeHintSide.right : _EdgeHintSide.left,
    );
    _hintController.forward(from: 0);
    widget.onSkip?.call(isRight ? 10 : -10);
  }

  void _handleScaleStart(ScaleStartDetails details) {
    _pinchFired = false;
  }

  void _handleScaleUpdate(ScaleUpdateDetails details) {
    if (!_pinchFired && details.scale < AppPlayerChrome.pinchDismissThreshold) {
      _pinchFired = true;
      widget.onDismissToPortrait?.call();
    }
  }

  double get _playedFraction {
    final int totalMs = widget.duration.inMilliseconds;
    if (totalMs <= 0) return 0;
    return (widget.position.inMilliseconds / totalMs).clamp(0.0, 1.0);
  }

  bool get _showBottomControls => switch (widget.state) {
    AppPlayerChromeState.playing ||
    AppPlayerChromeState.paused ||
    AppPlayerChromeState.buffering => true,
    AppPlayerChromeState.error ||
    AppPlayerChromeState.locked ||
    AppPlayerChromeState.end => false,
  };

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);

    return ClipRRect(
      borderRadius: BorderRadius.circular(AppRadius.md),
      child: AspectRatio(
        aspectRatio: AppPlayerChrome.aspectRatio,
        child: ColoredBox(
          color: Colors.black,
          child: Stack(
            fit: StackFit.expand,
            children: <Widget>[
              LayoutBuilder(
                builder: (BuildContext context, BoxConstraints constraints) {
                  return GestureDetector(
                    key: AppPlayerChrome.videoAreaKey,
                    behavior: HitTestBehavior.opaque,
                    onTap: _toggleMinimal,
                    onDoubleTapDown: _handleDoubleTapDown,
                    onDoubleTap: () => _handleDoubleTap(constraints.maxWidth),
                    onScaleStart: _handleScaleStart,
                    onScaleUpdate: _handleScaleUpdate,
                    child: widget.videoSlot ?? const _VideoPlaceholder(),
                  );
                },
              ),
              if (widget.state == AppPlayerChromeState.buffering)
                const IgnorePointer(
                  child: Center(
                    child: AppSpinner(
                      key: AppPlayerChrome.bufferingSpinnerKey,
                      size: AppSpinnerSize.lg,
                      color: Colors.white,
                    ),
                  ),
                ),
              if (widget.state == AppPlayerChromeState.error)
                _buildErrorOverlay(theme),
              if (widget.state == AppPlayerChromeState.locked)
                _buildLockedOverlay(theme),
              if (widget.state == AppPlayerChromeState.end)
                _buildEndOverlay(theme),
              _buildEdgeHint(_EdgeHintSide.left, AppPlayerChrome.leftHintKey),
              _buildEdgeHint(_EdgeHintSide.right, AppPlayerChrome.rightHintKey),
              IgnorePointer(
                ignoring: _minimal,
                child: AnimatedOpacity(
                  opacity: _minimal ? 0 : 1,
                  duration: AppDuration.base,
                  curve: AppEasing.out,
                  child: _OnVideoChrome(child: _buildChromeOverlay(theme)),
                ),
              ),
              if (_minimal)
                Positioned(
                  left: 0,
                  right: 0,
                  bottom: 0,
                  child: IgnorePointer(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.s4,
                        vertical: AppSpacing.s2,
                      ),
                      child: AppPlayerScrubber(
                        key: AppPlayerChrome.minimalScrubberKey,
                        playedFraction: _playedFraction,
                        height: 8,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEdgeHint(_EdgeHintSide side, Key key) {
    final bool active = _hintSide == side;
    return Positioned(
      left: side == _EdgeHintSide.left ? 0 : null,
      right: side == _EdgeHintSide.right ? 0 : null,
      top: 0,
      bottom: 0,
      width: _OnVideo.edgeHintWidth,
      child: IgnorePointer(
        child: !active
            ? const SizedBox.shrink()
            : FadeTransition(
                key: key,
                opacity: _hintOpacity,
                child: Center(
                  child: Text(
                    side == _EdgeHintSide.left ? '⟲ 10' : '10 ⟳',
                    style:
                        (Theme.of(context).textTheme.bodySmall ??
                                const TextStyle())
                            .copyWith(
                              fontFamily: AppTypography.code.fontFamily,
                              fontSize: AppFontSize.sm,
                              color: Colors.white.withValues(
                                alpha: _OnVideo.subtleAlpha,
                              ),
                            ),
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildErrorOverlay(ThemeData theme) {
    final ColorScheme cs = theme.colorScheme;
    final TextStyle messageStyle =
        (theme.textTheme.bodyMedium ?? const TextStyle()).copyWith(
          fontSize: _OnVideo.messageFontSize,
          color: Colors.white,
        );
    return ColoredBox(
      color: Colors.black.withValues(alpha: _OnVideo.scrimAlpha),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            IconCS(
              name: IconName.alert,
              size: _OnVideo.stateIconSize,
              color: cs.error,
            ),
            const SizedBox(height: AppSpacing.s2),
            Text(widget.errorMessage, style: messageStyle),
            const SizedBox(height: AppSpacing.s2),
            AppButton(
              key: AppPlayerChrome.retryKey,
              label: widget.retryLabel,
              variant: AppButtonVariant.secondary,
              size: AppButtonSize.sm,
              onPressed: widget.onRetry,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLockedOverlay(ThemeData theme) {
    final TextStyle messageStyle =
        (theme.textTheme.bodyMedium ?? const TextStyle()).copyWith(
          fontSize: _OnVideo.messageFontSize,
          color: Colors.white,
        );
    return ColoredBox(
      color: Colors.black.withValues(alpha: _OnVideo.scrimAlpha),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const IconCS(
              name: IconName.lock,
              size: _OnVideo.stateIconSize,
              color: Colors.white,
            ),
            const SizedBox(height: AppSpacing.s2),
            Text(
              widget.lockedMessage,
              textAlign: TextAlign.center,
              style: messageStyle,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEndOverlay(ThemeData theme) {
    final TextStyle eyebrowStyle =
        (theme.textTheme.bodySmall ?? const TextStyle()).copyWith(
          fontSize: _OnVideo.messageFontSize,
          color: Colors.white.withValues(alpha: _OnVideo.eyebrowAlpha),
        );
    final TextStyle titleStyle =
        (theme.textTheme.titleLarge ?? const TextStyle()).copyWith(
          fontSize: AppFontSize.lg,
          fontWeight: AppFontWeight.semibold,
          color: Colors.white,
        );
    return ColoredBox(
      color: Colors.black.withValues(alpha: _OnVideo.endScrimAlpha),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            if (widget.upNextEyebrow != null) ...<Widget>[
              Text(widget.upNextEyebrow!, style: eyebrowStyle),
              const SizedBox(height: AppSpacing.s1),
            ],
            if (widget.upNextTitle != null) ...<Widget>[
              Text(
                widget.upNextTitle!,
                textAlign: TextAlign.center,
                style: titleStyle,
              ),
              const SizedBox(height: AppSpacing.s3),
            ],
            Row(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                AppButton(
                  key: AppPlayerChrome.stayKey,
                  label: widget.stayLabel,
                  variant: AppButtonVariant.secondary,
                  size: AppButtonSize.sm,
                  onPressed: widget.onStay,
                ),
                const SizedBox(width: AppSpacing.s2),
                AppButton(
                  key: AppPlayerChrome.playNextKey,
                  label: widget.playNextLabel,
                  variant: AppButtonVariant.primary,
                  size: AppButtonSize.sm,
                  iconLeading: IconName.next,
                  onPressed: widget.onPlayNext,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChromeOverlay(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.s4),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          _buildTopBar(theme),
          if (_showBottomControls)
            _buildBottomBar(theme)
          else
            const SizedBox.shrink(),
        ],
      ),
    );
  }

  Widget _buildTopBar(ThemeData theme) {
    final TextStyle subStyle = (theme.textTheme.labelSmall ?? const TextStyle())
        .copyWith(
          fontSize: AppFontSize.xs,
          color: Colors.white.withValues(alpha: _OnVideo.subtleAlpha),
          letterSpacing: AppTracking.wide * AppFontSize.xs,
        );
    final TextStyle titleStyle =
        (theme.textTheme.bodyMedium ?? const TextStyle()).copyWith(
          fontSize: _OnVideo.messageFontSize,
          fontWeight: AppFontWeight.medium,
          color: Colors.white,
        );

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Text(
                widget.sectionLabel,
                style: subStyle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                widget.lessonTitle,
                style: titleStyle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        const SizedBox(width: AppSpacing.s2),
        AppIconButton(
          key: AppPlayerChrome.settingsKey,
          name: IconName.settings,
          semanticLabel: 'Settings',
          variant: AppButtonVariant.ghost,
          size: AppButtonSize.sm,
          onPressed: widget.onSettingsTap,
        ),
      ],
    );
  }

  Widget _buildBottomBar(ThemeData theme) {
    final TextStyle timeStyle = (theme.textTheme.bodySmall ?? const TextStyle())
        .copyWith(
          fontFamily: AppTypography.code.fontFamily,
          fontSize: AppFontSize.sm,
          color: Colors.white.withValues(alpha: _OnVideo.timeAlpha),
          fontFeatures: const <FontFeature>[FontFeature.tabularFigures()],
        );
    final TextStyle speedStyle =
        (theme.textTheme.bodySmall ?? const TextStyle()).copyWith(
          fontFamily: AppTypography.code.fontFamily,
          fontSize: AppFontSize.xs,
          color: Colors.white,
        );

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        AppPlayerScrubber(
          key: AppPlayerChrome.scrubberKey,
          playedFraction: _playedFraction,
          bufferedFraction: widget.bufferedFraction,
          chapterFractions: widget.chapterFractions,
          bookmarkFractions: widget.bookmarkFractions,
          onSeek: widget.onSeek,
        ),
        const SizedBox(height: AppSpacing.s2),
        Row(
          children: <Widget>[
            AppIconButton(
              key: AppPlayerChrome.playPauseKey,
              name: widget.state == AppPlayerChromeState.playing
                  ? IconName.pause
                  : IconName.play,
              semanticLabel: widget.state == AppPlayerChromeState.playing
                  ? 'Pause'
                  : 'Play',
              variant: AppButtonVariant.ghost,
              size: AppButtonSize.sm,
              onPressed: widget.onPlayPause,
            ),
            const SizedBox(width: _OnVideo.controlGap),
            AppIconButton(
              key: AppPlayerChrome.previousKey,
              name: IconName.prev,
              semanticLabel: 'Previous lesson',
              variant: AppButtonVariant.ghost,
              size: AppButtonSize.sm,
              onPressed: widget.onPrevious,
            ),
            const SizedBox(width: _OnVideo.controlGap),
            AppIconButton(
              key: AppPlayerChrome.nextKey,
              name: IconName.next,
              semanticLabel: 'Next lesson',
              variant: AppButtonVariant.ghost,
              size: AppButtonSize.sm,
              onPressed: widget.onNext,
            ),
            const SizedBox(width: _OnVideo.controlGap),
            AppIconButton(
              key: AppPlayerChrome.volumeKey,
              name: widget.isMuted ? IconName.volumeMute : IconName.volume,
              semanticLabel: widget.isMuted ? 'Unmute' : 'Mute',
              variant: AppButtonVariant.ghost,
              size: AppButtonSize.sm,
              onPressed: widget.onVolumeTap,
            ),
            const SizedBox(width: AppSpacing.s2),
            Text(
              '${_formatDuration(widget.position)} / '
              '${_formatDuration(widget.duration)}',
              key: AppPlayerChrome.timeKey,
              style: timeStyle,
            ),
            const Spacer(),
            AppButton(
              key: AppPlayerChrome.speedKey,
              variant: AppButtonVariant.ghost,
              size: AppButtonSize.sm,
              onPressed: widget.onSpeedTap,
              child: Text(widget.speedLabel, style: speedStyle),
            ),
            const SizedBox(width: _OnVideo.controlGap),
            AppIconButton(
              key: AppPlayerChrome.subtitlesKey,
              name: IconName.subtitles,
              semanticLabel: 'Subtitles',
              variant: AppButtonVariant.ghost,
              size: AppButtonSize.sm,
              onPressed: widget.onSubtitlesTap,
            ),
            const SizedBox(width: _OnVideo.controlGap),
            AppIconButton(
              key: AppPlayerChrome.fullscreenKey,
              name: IconName.fullscreen,
              semanticLabel: 'Fullscreen',
              variant: AppButtonVariant.ghost,
              size: AppButtonSize.sm,
              onPressed: widget.onToggleFullscreen,
            ),
          ],
        ),
      ],
    );
  }
}
