import 'package:flutter/widgets.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:app_mobile/features/sync/presentation/bloc/sync_bloc.dart';

/// Turns "the app came back to the foreground" into [SyncAppResumed].
///
/// A widget rather than something inside [SyncBloc] because the bloc has no
/// business binding to `WidgetsBinding` — that would make it untestable without
/// a widget tree, and `SyncBloc`'s whole point is that it can be driven purely
/// through events.
///
/// This trigger is not redundant with the ticker: `Timer.periodic` does not
/// fire while the process is suspended, so an app backgrounded for an hour with
/// a full queue would otherwise wait for the next tick *after* it resumes.
class SyncLifecycle extends StatefulWidget {
  const SyncLifecycle({required this.child, super.key});

  final Widget child;

  @override
  State<SyncLifecycle> createState() => _SyncLifecycleState();
}

class _SyncLifecycleState extends State<SyncLifecycle> {
  late final AppLifecycleListener _listener;

  @override
  void initState() {
    super.initState();
    _listener = AppLifecycleListener(
      onResume: () {
        // `mounted` because the listener can outlive a fast
        // background→foreground→dispose sequence by a frame.
        if (mounted) context.read<SyncBloc>().add(const SyncAppResumed());
      },
    );
  }

  @override
  void dispose() {
    _listener.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
