import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/player/domain/lesson_playback.dart';
import 'package:app_mobile/features/player/presentation/bloc/player_bloc.dart';
import 'package:app_mobile/features/player/presentation/bloc/player_event.dart';
import 'package:app_mobile/features/player/presentation/bloc/player_state.dart';
import 'package:app_mobile/features/player/presentation/widgets/player_settings_sheet.dart';
import 'package:app_mobile/features/player/presentation/widgets/player_tab_panels.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/di/injector.dart';

/// The lesson player.
///
/// Portrait: a 16:9 stage over the Sections / Notes / Bookmarks / Materials
/// tab strip. Landscape: the immersive [AppPlayerChrome], full-bleed.
///
/// [lessonId] arrives via `Navigator.pushNamed(AppRoutes.lesson, arguments:)`.
class LessonPlayerScreen extends StatelessWidget {
  const LessonPlayerScreen({required this.lessonId, super.key});

  final String lessonId;

  @override
  Widget build(BuildContext context) {
    return BlocProvider<PlayerBloc>(
      create: (_) => getIt<PlayerBloc>()..add(PlayerStarted(lessonId)),
      child: const LessonPlayerView(),
    );
  }
}

/// The player's view, split from [LessonPlayerScreen] so a test can mount it
/// against its own `BlocProvider` without get_it.
class LessonPlayerView extends StatefulWidget {
  const LessonPlayerView({super.key});

  @override
  State<LessonPlayerView> createState() => _LessonPlayerViewState();
}

class _LessonPlayerViewState extends State<LessonPlayerView>
    with WidgetsBindingObserver {
  bool _immersive = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    // Restore unconditionally. Leaving the status bar hidden, or the device
    // pinned to landscape, after the player is popped would leak this screen's
    // chrome into every screen after it.
    _restoreSystemChrome();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Web flushes progress on `visibilitychange`/`beforeunload`; backgrounding
    // is the mobile equivalent, and the process may not come back.
    if (state == AppLifecycleState.paused ||
        state == AppLifecycleState.inactive) {
      context.read<PlayerBloc>().add(const PlayerProgressFlushed());
    }
  }

  void _applyImmersive({required bool immersive}) {
    if (_immersive == immersive) return;
    _immersive = immersive;
    if (immersive) {
      SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    } else {
      _restoreSystemChrome();
    }
  }

  void _restoreSystemChrome() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    // An empty list means "whatever the device allows" — restoring the app's
    // default rather than pinning an orientation of our own.
    SystemChrome.setPreferredOrientations(const <DeviceOrientation>[]);
  }

  Future<void> _rotateToPortrait() async {
    await SystemChrome.setPreferredOrientations(<DeviceOrientation>[
      DeviceOrientation.portraitUp,
    ]);
    // Release the lock so the user can rotate back out again; the pin only has
    // to survive the transition itself.
    await SystemChrome.setPreferredOrientations(const <DeviceOrientation>[]);
  }

  Future<void> _rotateToLandscape() =>
      SystemChrome.setPreferredOrientations(<DeviceOrientation>[
        DeviceOrientation.landscapeLeft,
        DeviceOrientation.landscapeRight,
      ]);

  @override
  Widget build(BuildContext context) {
    final bool isLandscape =
        MediaQuery.orientationOf(context) == Orientation.landscape;

    // Applied during build rather than in a listener: orientation is a
    // MediaQuery fact, and the immersive flag has to track it whether the
    // change came from a rotation or from our own affordance.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _applyImmersive(immersive: isLandscape);
    });

    return BlocBuilder<PlayerBloc, PlayerState>(
      builder: (BuildContext context, PlayerState state) {
        if (isLandscape) {
          return _LandscapePlayer(
            state: state,
            onDismissToPortrait: _rotateToPortrait,
          );
        }
        return _PortraitPlayer(state: state, onFullscreen: _rotateToLandscape);
      },
    );
  }
}

// ── Landscape ───────────────────────────────────────────────────────────────

class _LandscapePlayer extends StatelessWidget {
  const _LandscapePlayer({
    required this.state,
    required this.onDismissToPortrait,
  });

  final PlayerState state;
  final VoidCallback onDismissToPortrait;

  @override
  Widget build(BuildContext context) {
    final PlayerBloc bloc = context.read<PlayerBloc>();

    return Scaffold(
      // `media.stage` (#000) behind the chrome's own letterbox.
      backgroundColor: AppMedia.stage,
      body: Center(
        child: AppPlayerChrome(
          state: _chromeState(state.status),
          sectionLabel: _sectionLabel(context, state),
          // context defaults to mobileLandscape.
          lessonTitle: state.lesson?.title ?? '',
          position: state.position,
          duration: state.duration,
          videoSlot: _VideoSurface(state: state),
          bufferedFraction: state.bufferedFraction,
          bookmarkFractions: state.bookmarkFractions,
          isMuted: state.isMuted,
          speedLabel: '${state.speed}×',
          errorMessage: context.t.player.streamError,
          lockedMessage: context.t.player.noAccessBody,
          retryLabel: context.t.player.retry,
          stayLabel: context.t.player.stayHere,
          playNextLabel: context.t.player.playNext,
          onPlayPause: () => bloc.add(const PlayerPlayPausePressed()),
          onSeek: (double fraction) => bloc.add(
            PlayerSeekRequested(state.duration * fraction),
          ),
          onSkip: (int seconds) => bloc.add(PlayerSkipRequested(seconds)),
          onDismissToPortrait: onDismissToPortrait,
          onVolumeTap: () => bloc.add(const PlayerMuteToggled()),
          onSpeedTap: () => bloc.add(const PlayerSpeedChanged()),
          onSettingsTap: () => _openSettings(context, state),
          onToggleFullscreen: onDismissToPortrait,
          onRetry: () => bloc.add(const PlayerRetryRequested()),
          onStay: () => bloc.add(const PlayerPlayPausePressed()),
        ),
      ),
    );
  }
}

// ── Portrait ────────────────────────────────────────────────────────────────

class _PortraitPlayer extends StatelessWidget {
  const _PortraitPlayer({required this.state, required this.onFullscreen});

  final PlayerState state;
  final VoidCallback onFullscreen;

  @override
  Widget build(BuildContext context) {
    final PlayerBloc bloc = context.read<PlayerBloc>();

    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            _PortraitHeader(state: state),
            // The embedded 16:9 stage: the same catalog [AppPlayerChrome] the
            // landscape path uses, switched to its portrait context. Landscape
            // rotation swaps to the immersive 19:9 context via `onFullscreen`.
            AppPlayerChrome(
              context: AppPlayerChromeContext.portrait,
              state: _chromeState(state.status),
              sectionLabel: _sectionLabel(context, state),
              lessonTitle: state.lesson?.title ?? '',
              position: state.position,
              duration: state.duration,
              videoSlot: _VideoSurface(state: state),
              bufferedFraction: state.bufferedFraction,
              bookmarkFractions: state.bookmarkFractions,
              isMuted: state.isMuted,
              speedLabel: '${state.speed}×',
              errorMessage: context.t.player.streamError,
              lockedMessage: context.t.player.noAccessBody,
              retryLabel: context.t.player.retry,
              stayLabel: context.t.player.stayHere,
              playNextLabel: context.t.player.playNext,
              onPlayPause: () => bloc.add(const PlayerPlayPausePressed()),
              onSeek: (double fraction) =>
                  bloc.add(PlayerSeekRequested(state.duration * fraction)),
              onVolumeTap: () => bloc.add(const PlayerMuteToggled()),
              onSpeedTap: () => bloc.add(const PlayerSpeedChanged()),
              onSettingsTap: () => _openSettings(context, state),
              onToggleFullscreen: onFullscreen,
              onRetry: () => bloc.add(const PlayerRetryRequested()),
              onStay: () => bloc.add(const PlayerPlayPausePressed()),
            ),
            if (state.watchingOffline) const _OfflineIndicator(),
            _PortraitTabs(state: state),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.only(bottom: AppSpacing.s4),
                child: _PortraitTabBody(state: state),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PortraitHeader extends StatelessWidget {
  const _PortraitHeader({required this.state});

  final PlayerState state;

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final AppSemanticColors semantic = context.semanticColors;

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s3,
        vertical: AppSpacing.s2,
      ),
      child: Row(
        children: <Widget>[
          AppIconButton(
            name: IconName.chevronLeft,
            semanticLabel: context.t.player.back,
            variant: AppButtonVariant.ghost,
            size: AppButtonSize.sm,
            onPressed: () => Navigator.of(context).maybePop(),
          ),
          const SizedBox(width: AppSpacing.s2),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text(
                  _sectionLabel(context, state),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: (theme.textTheme.labelSmall ?? const TextStyle())
                      .copyWith(
                        fontSize: AppFontSize.xs,
                        color: theme.colorScheme.onSurfaceVariant,
                        letterSpacing: AppTracking.wide * AppFontSize.xs,
                      ),
                ),
                Text(
                  state.lesson?.title ?? '',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: (theme.textTheme.bodyMedium ?? const TextStyle())
                      .copyWith(
                        fontSize: AppFontSize.sm,
                        fontWeight: AppFontWeight.medium,
                        color: semantic.textLoud,
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

/// "Watching offline" — shown only when the source is a local file
/// (DESIGN_BRIEF §7.6).
class _OfflineIndicator extends StatelessWidget {
  const _OfflineIndicator();

  static const Key indicatorKey = Key('playerOfflineIndicator');

  @override
  Widget build(BuildContext context) {
    final ThemeData theme = Theme.of(context);
    final AppSemanticColors semantic = context.semanticColors;

    return Padding(
      key: indicatorKey,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s3,
        vertical: AppSpacing.s2,
      ),
      child: Row(
        children: <Widget>[
          IconCS(
            name: IconName.cloudDown,
            size: AppFontSize.sm,
            color: semantic.successFg,
          ),
          const SizedBox(width: AppSpacing.s2),
          Text(
            context.t.player.watchingOffline,
            style: (theme.textTheme.bodySmall ?? const TextStyle()).copyWith(
              fontSize: AppFontSize.xs,
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

class _PortraitTabs extends StatelessWidget {
  const _PortraitTabs({required this.state});

  final PlayerState state;

  @override
  Widget build(BuildContext context) {
    final PlayerBloc bloc = context.read<PlayerBloc>();

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: AppTabs(
        label: context.t.player.tabsAriaLabel,
        selectedIndex: PlayerTab.values.indexOf(state.tab),
        onChanged: (int index) =>
            bloc.add(PlayerTabChanged(PlayerTab.values[index])),
        items: <AppTabItem>[
          AppTabItem(label: context.t.player.tabSections),
          AppTabItem(label: context.t.player.tabNotes),
          AppTabItem(label: context.t.player.tabBookmarks),
          AppTabItem(label: context.t.player.tabMaterials),
        ],
      ),
    );
  }
}

class _PortraitTabBody extends StatelessWidget {
  const _PortraitTabBody({required this.state});

  final PlayerState state;

  @override
  Widget build(BuildContext context) {
    final PlayerBloc bloc = context.read<PlayerBloc>();

    return switch (state.tab) {
      PlayerTab.sections => PlayerSectionsPanel(
        state: state,
        onSelectLesson: (String id) => bloc.add(PlayerStarted(id)),
      ),
      PlayerTab.notes => PlayerNotesPanel(
        state: state,
        onSave: (String body) => bloc.add(PlayerNoteSaved(body)),
      ),
      PlayerTab.bookmarks => PlayerBookmarksPanel(
        state: state,
        onSeek: (Duration position) => bloc.add(PlayerSeekRequested(position)),
        onDelete: (String id) => bloc.add(PlayerBookmarkDeleted(id)),
        onAddSave: (BookmarkDraft draft) => bloc.add(
          PlayerBookmarkAdded(
            position: Duration(seconds: draft.time.round()),
            label: draft.label,
          ),
        ),
        onAddCancel: () => bloc.add(const PlayerBookmarkAddToggled(adding: false)),
      ),
      PlayerTab.materials => PlayerMaterialsPanel(
        state: state,
        onDownload: (LessonMaterial material) =>
            _downloadMaterial(context, material),
      ),
    };
  }

  /// Mobile is this endpoint's first consumer. Issuing the URL is where the
  /// card stops: handing the signed URL to a downloader is E19's job, so this
  /// confirms the link rather than pretending to save a file.
  Future<void> _downloadMaterial(
    BuildContext context,
    LessonMaterial material,
  ) async {
    final PlayerBloc bloc = context.read<PlayerBloc>();
    final ScaffoldMessengerState messenger = ScaffoldMessenger.of(context);
    final String ready = context.t.player.materialDownloadReady;
    final String failed = context.t.player.materialDownloadError;

    final bool ok = await bloc.issueMaterialUrl(material.id);
    messenger.showSnackBar(SnackBar(content: Text(ok ? ready : failed)));
  }
}

// ── Shared bits ─────────────────────────────────────────────────────────────

/// The platform texture.
///
/// Takes [state] it never reads: the engine hands back a real surface only
/// after `open()` resolves, so this widget MUST rebuild on every state change.
/// As a `const` widget it would be canonicalised to a single instance, Flutter
/// would skip the subtree, and the placeholder would never be replaced by the
/// video.
class _VideoSurface extends StatelessWidget {
  const _VideoSurface({required this.state});

  final PlayerState state;

  @override
  Widget build(BuildContext context) =>
      context.read<PlayerBloc>().buildVideoSurface();
}

/// [AppPlayerChrome] has no `loading` member — the screen is still resolving,
/// so `buffering` (its spinner state) is the honest mapping. Shared by both
/// orientations so the portrait and landscape chrome read the bloc's status
/// identically.
AppPlayerChromeState _chromeState(PlayerStatus status) => switch (status) {
  PlayerStatus.loading || PlayerStatus.buffering =>
    AppPlayerChromeState.buffering,
  PlayerStatus.playing => AppPlayerChromeState.playing,
  PlayerStatus.paused => AppPlayerChromeState.paused,
  PlayerStatus.endOfLesson => AppPlayerChromeState.end,
  PlayerStatus.error => AppPlayerChromeState.error,
};

String _sectionLabel(BuildContext context, PlayerState state) {
  final String? sectionId = state.lesson?.sectionId;
  if (sectionId == null) return '';
  for (final LessonOutlineSection section in state.sections) {
    if (section.id == sectionId) {
      return context.t.player.sectionLabel(
        n: section.position.toString().padLeft(2, '0'),
      );
    }
  }
  return '';
}

Future<void> _openSettings(BuildContext context, PlayerState state) {
  final PlayerBloc bloc = context.read<PlayerBloc>();
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: Colors.transparent,
    builder: (BuildContext sheetContext) => PlayerSettingsSheet(
      speed: state.speed,
      sleepTimer: state.sleepTimer,
      onSpeedSelected: (double speed) {
        bloc.add(PlayerSpeedChanged(speed));
        Navigator.of(sheetContext).pop();
      },
      onSleepTimerSelected: (Duration? duration) {
        bloc.add(PlayerSleepTimerSet(duration));
        Navigator.of(sheetContext).pop();
      },
    ),
  );
}
