import 'dart:async';
import 'dart:io';

import 'package:flutter/widgets.dart';
import 'package:video_player/video_player.dart';

import 'package:app_mobile/features/player/domain/lesson_playback.dart';
import 'package:app_mobile/features/player/domain/video_playback_port.dart';

/// The only place in the app that touches `video_player`.
///
/// Adapts a [VideoPlayerController] to [VideoPlaybackPort]: the plugin's single
/// `ValueListenable<VideoPlayerValue>` becomes the port's snapshot stream, and
/// its imperative surface becomes the port's commands. Everything above this
/// file — the BLoC especially — sees only the port, which is what lets the BLoC
/// be tested with no platform present.
class VideoPlayerAdapter implements VideoPlaybackPort {
  VideoPlayerAdapter({VideoPlayerControllerFactory? controllerFactory})
    : _factory = controllerFactory ?? _defaultFactory;

  final VideoPlayerControllerFactory _factory;

  final StreamController<VideoPlaybackSnapshot> _snapshots =
      StreamController<VideoPlaybackSnapshot>.broadcast();

  VideoPlayerController? _controller;
  VideoPlaybackSnapshot _snapshot = const VideoPlaybackSnapshot();

  @override
  Stream<VideoPlaybackSnapshot> get snapshots => _snapshots.stream;

  @override
  VideoPlaybackSnapshot get snapshot => _snapshot;

  @override
  Future<void> open(LessonVideoSource source) async {
    await _disposeController();

    final VideoPlayerController controller = _factory(source);
    _controller = controller;
    controller.addListener(_handleValueChanged);

    await controller.initialize();
    _handleValueChanged();
  }

  void _handleValueChanged() {
    final VideoPlayerController? controller = _controller;
    if (controller == null) return;

    final VideoPlayerValue value = controller.value;

    _snapshot = VideoPlaybackSnapshot(
      position: value.position,
      duration: value.duration,
      buffered: _bufferedEnd(value),
      isInitialized: value.isInitialized,
      isPlaying: value.isPlaying,
      isBuffering: value.isBuffering,
      isCompleted: value.isCompleted,
      errorMessage: value.hasError ? value.errorDescription : null,
    );

    if (!_snapshots.isClosed) _snapshots.add(_snapshot);
  }

  /// The far edge of the buffer, matching web's `video.buffered.end(len - 1)`.
  Duration _bufferedEnd(VideoPlayerValue value) {
    if (value.buffered.isEmpty) return Duration.zero;
    return value.buffered.last.end;
  }

  @override
  Future<void> play() async => _controller?.play();

  @override
  Future<void> pause() async => _controller?.pause();

  @override
  Future<void> seek(Duration position) async =>
      _controller?.seekTo(position);

  @override
  Future<void> setSpeed(double speed) async =>
      _controller?.setPlaybackSpeed(speed);

  @override
  Future<void> setMuted(bool muted) async =>
      _controller?.setVolume(muted ? 0 : 1);

  @override
  Widget buildSurface() {
    final VideoPlayerController? controller = _controller;
    if (controller == null || !controller.value.isInitialized) {
      return const SizedBox.expand();
    }
    // `AppPlayerChrome` already paints the stage and enforces the aspect box,
    // so the surface only has to fill it — letterboxing is the chrome's call,
    // mirroring web's `object-fit: contain` on the <video> element.
    return FittedBox(
      fit: BoxFit.contain,
      child: SizedBox(
        width: controller.value.size.width,
        height: controller.value.size.height,
        child: VideoPlayer(controller),
      ),
    );
  }

  Future<void> _disposeController() async {
    final VideoPlayerController? controller = _controller;
    if (controller == null) return;
    controller.removeListener(_handleValueChanged);
    _controller = null;
    await controller.dispose();
  }

  @override
  Future<void> dispose() async {
    await _disposeController();
    await _snapshots.close();
  }
}

/// Builds the plugin controller for a source. Injectable so a test can supply
/// one without a platform.
typedef VideoPlayerControllerFactory =
    VideoPlayerController Function(LessonVideoSource source);

VideoPlayerController _defaultFactory(LessonVideoSource source) {
  return switch (source.kind) {
    LessonVideoSourceKind.network => VideoPlayerController.networkUrl(
      Uri.parse(source.uri),
    ),
    // E19 owns making this path playable — `downloaded_lessons.filePath` is
    // AES-GCM ciphertext today, so this branch is unreachable until it lands a
    // decrypting read path (no row is ever written before then).
    LessonVideoSourceKind.localFile => VideoPlayerController.file(
      File(source.uri),
    ),
  };
}
