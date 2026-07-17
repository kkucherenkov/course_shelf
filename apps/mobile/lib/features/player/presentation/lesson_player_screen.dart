import 'package:app_ui/app_ui.dart';
import 'package:flutter/material.dart';

import 'package:app_mobile/i18n/strings.g.dart';

/// Placeholder for the lesson player.
///
/// **E18-F02-S01 replaces this** with the real `video_player`-backed player:
/// a player BLoC, portrait tabs, the landscape `AppPlayerChrome`, and the
/// throttled 10s `progress_outbox` write. It exists now only so
/// [AppRoutes.lesson] can be registered ahead of that card — pre-wiring the
/// route is what keeps the player work out of `routes.dart`, and therefore out
/// of the parallel Home/Auth cards' way.
///
/// [lessonId] is already threaded from the route arguments, so the card
/// inherits the argument plumbing rather than inventing it.
class LessonPlayerScreen extends StatelessWidget {
  const LessonPlayerScreen({required this.lessonId, super.key});

  /// The lesson to play — `Navigator.pushNamed(AppRoutes.lesson, arguments:)`.
  final String lessonId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: AppEmptyState(
          icon: IconName.play,
          title: context.t.common.appTitle,
          message: context.t.common.comingSoon,
        ),
      ),
    );
  }
}
