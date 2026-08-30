/// Widget tests for the Downloads tab.
///
/// The card asks for an `integration_test`. This host has no emulator and
/// cannot build iOS — the same constraint E19-F01-S01 recorded — so the
/// acceptance criteria are covered here instead.
///
/// These drive the screen from a **seeded state** rather than by feeding the
/// real bloc events: a bloc's event processing is microtask-driven and does not
/// reliably progress inside the widget tester's fake-async zone, which made the
/// first cut of these tests pass or fail on frame counts rather than on
/// rendering. State transitions are asserted in `downloads_bloc_test.dart`,
/// where real async works; this file asserts what a given state renders.
library;

import 'package:app_ui/app_ui.dart';
import 'package:bloc_test/bloc_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/downloads/domain/device_storage.dart';
import 'package:app_mobile/features/downloads/domain/download_item.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_bloc.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_event.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_state.dart';
import 'package:app_mobile/features/downloads/presentation/downloads_screen.dart';
import 'package:app_mobile/features/downloads/presentation/widgets/storage_bar.dart';
import 'package:app_mobile/i18n/strings.g.dart';
import 'package:app_mobile/shared/db/tables/downloaded_lessons.dart';

class _MockDownloadsBloc extends MockBloc<DownloadsEvent, DownloadsState>
    implements DownloadsBloc {}

DownloadItem _item(
  String id, {
  DownloadState state = DownloadState.ready,
  String? courseId,
  String? courseTitle,
  String? lessonTitle,
  int bytes = 1024,
}) => DownloadItem(
  lessonId: id,
  state: state,
  bytesDownloaded: bytes,
  totalBytes: bytes,
  attemptCount: 0,
  courseId: courseId,
  lessonTitle: lessonTitle ?? 'Lesson $id',
  courseTitle: courseTitle,
);

void main() {
  late DownloadsBloc bloc;

  // DownloadsEvent is sealed, so a Fake cannot implement it. Every event this
  // screen dispatches is a const value, so a real one serves as the fallback.
  setUpAll(
    () => registerFallbackValue(const DeleteCourseDownloads('fallback')),
  );

  setUp(() => bloc = _MockDownloadsBloc());

  Future<void> pump(WidgetTester tester, DownloadsState state) async {
    when(() => bloc.state).thenReturn(state);
    whenListen(bloc, Stream<DownloadsState>.value(state), initialState: state);

    await tester.binding.setSurfaceSize(const Size(800, 1600));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      TranslationProvider(
        child: MaterialApp(
          theme: AppTheme.dark(),
          home: BlocProvider<DownloadsBloc>.value(
            value: bloc,
            child: const SingleChildScrollView(child: DownloadsTabBody()),
          ),
        ),
      ),
    );
    await tester.pump();
  }

  testWidgets('shows a spinner while the queue is still loading', (
    tester,
  ) async {
    await pump(tester, const DownloadsState());

    expect(find.byType(AppSpinner), findsOneWidget);
    // An empty list mid-load is not an empty state.
    expect(find.byType(AppEmptyState), findsNothing);
  });

  testWidgets('shows the empty copy once the queue is known to be empty', (
    tester,
  ) async {
    await pump(tester, const DownloadsState(isLoading: false));

    expect(
      find.text(
        'Nothing downloaded yet — open a course and tap the download icon.',
      ),
      findsOneWidget,
    );
  });

  // Two tests rather than one that re-pumps: `whenListen` is stubbed before the
  // widget subscribes, so re-stubbing it afterwards would not reach the
  // already-subscribed BlocBuilder — the second half would silently assert
  // against the first state.
  testWidgets('shows no offline banner while online', (tester) async {
    await pump(tester, const DownloadsState(isLoading: false));

    expect(find.byType(AppBanner), findsNothing);
  });

  testWidgets('shows the offline banner when offline', (tester) async {
    await pump(tester, const DownloadsState(isLoading: false, isOnline: false));

    expect(find.byType(AppBanner), findsOneWidget);
    expect(
      find.textContaining('they resume automatically when you reconnect'),
      findsOneWidget,
    );
  });

  testWidgets('groups the queue and omits the sections that are empty', (
    tester,
  ) async {
    await pump(
      tester,
      DownloadsState(
        isLoading: false,
        items: <DownloadItem>[
          _item('a', state: DownloadState.downloading),
          _item('b', courseId: 'c1', courseTitle: 'C1'),
        ],
      ),
    );

    expect(find.text('In progress'), findsOneWidget);
    expect(find.text('Downloaded'), findsOneWidget);
    // Nothing has failed, so the heading must not be there at all.
    expect(find.text('Failed'), findsNothing);
  });

  testWidgets('shows the Failed section when something failed', (tester) async {
    await pump(
      tester,
      DownloadsState(
        isLoading: false,
        items: <DownloadItem>[_item('a', state: DownloadState.failed)],
      ),
    );

    expect(find.text('Failed'), findsOneWidget);
  });

  testWidgets('subdivides Downloaded per course, each with a delete-all', (
    tester,
  ) async {
    await pump(
      tester,
      DownloadsState(
        isLoading: false,
        items: <DownloadItem>[
          _item('a', courseId: 'c1', courseTitle: 'Distributed Systems'),
          _item('b', courseId: 'c1', courseTitle: 'Distributed Systems'),
          _item('c', courseId: 'c2', courseTitle: 'Type Theory'),
        ],
      ),
    );

    // Once as the group subhead, once per row beneath it — a row names its own
    // course by design.
    expect(find.text('Distributed Systems'), findsNWidgets(3));
    expect(find.text('Type Theory'), findsNWidgets(2));

    await tester.tap(
      find.bySemanticsLabel('Delete all downloads for Distributed Systems'),
    );
    await tester.pump();

    verify(() => bloc.add(const DeleteCourseDownloads('c1'))).called(1);
  });

  testWidgets('a lesson with no course renders without a delete-all', (
    tester,
  ) async {
    await pump(
      tester,
      DownloadsState(isLoading: false, items: <DownloadItem>[_item('lonely')]),
    );

    expect(find.text('Other lessons'), findsNWidgets(2));
    // Asserted by label rather than by widget type: each download row has icon
    // buttons of its own.
    expect(
      find.bySemanticsLabel(RegExp('^Delete all downloads for')),
      findsNothing,
    );
  });

  testWidgets('the storage bar shows only our own usage without totals', (
    tester,
  ) async {
    await pump(
      tester,
      DownloadsState(
        isLoading: false,
        items: <DownloadItem>[_item('a', bytes: 2 * 1024 * 1024)],
      ),
    );

    expect(find.byType(StorageBar), findsOneWidget);
    expect(find.text('CourseShelf is using 2.0 MB'), findsOneWidget);
  });

  testWidgets('the storage bar shows the device free space when it is known', (
    tester,
  ) async {
    await pump(
      tester,
      DownloadsState(
        isLoading: false,
        items: <DownloadItem>[_item('a', bytes: 1024 * 1024)],
        storage: const StorageSnapshot(deviceFreeBytes: 8 * 1024 * 1024 * 1024),
      ),
    );

    expect(find.text('1.0 MB used, 8.0 GB free'), findsOneWidget);
  });
}
