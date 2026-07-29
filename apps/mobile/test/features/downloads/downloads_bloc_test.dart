import 'dart:async';

import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/downloads/domain/download_item.dart';
import 'package:app_mobile/features/downloads/domain/downloads_repository.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_bloc.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_event.dart';
import 'package:app_mobile/features/downloads/presentation/bloc/downloads_state.dart';
import 'package:app_mobile/shared/db/tables/downloaded_lessons.dart';

class _MockRepository extends Mock implements DownloadsRepository {}

DownloadItem item(String id, DownloadState state) => DownloadItem(
  lessonId: id,
  state: state,
  bytesDownloaded: 0,
  totalBytes: 100,
  attemptCount: 0,
);

void main() {
  late _MockRepository repository;
  late StreamController<List<DownloadItem>> queue;

  setUp(() {
    repository = _MockRepository();
    queue = StreamController<List<DownloadItem>>.broadcast();

    when(() => repository.watchAll()).thenAnswer((_) => queue.stream);
    when(() => repository.reconcileAfterRestart()).thenAnswer((_) async {});
    when(
      () => repository.enqueueLesson(
        any<String>(),
        courseId: any<String?>(named: 'courseId'),
      ),
    ).thenAnswer((_) async {});
    when(
      () => repository.enqueueCourse(any<String>(), any<List<String>>()),
    ).thenAnswer((_) async {});
    when(() => repository.pause(any<String>())).thenAnswer((_) async {});
    when(() => repository.resume(any<String>())).thenAnswer((_) async {});
    when(() => repository.cancel(any<String>())).thenAnswer((_) async {});
    when(() => repository.retry(any<String>())).thenAnswer((_) async {});
  });

  tearDown(() => queue.close());

  blocTest<DownloadsBloc, DownloadsState>(
    'start reconciles a killed download and subscribes',
    build: () => DownloadsBloc(repository),
    act: (DownloadsBloc bloc) => bloc.add(const DownloadsStarted()),
    verify: (_) {
      verify(() => repository.reconcileAfterRestart()).called(1);
      verify(() => repository.watchAll()).called(1);
    },
  );

  blocTest<DownloadsBloc, DownloadsState>(
    'a queue snapshot clears loading and lands in state',
    build: () => DownloadsBloc(repository),
    act: (DownloadsBloc bloc) async {
      bloc.add(const DownloadsStarted());
      await Future<void>.delayed(Duration.zero);
      queue.add(<DownloadItem>[item('l1', DownloadState.downloading)]);
    },
    expect: () => <Matcher>[
      isA<DownloadsState>().having(
        (DownloadsState s) => s.items.single.lessonId,
        'lessonId',
        'l1',
      ),
    ],
    verify: (DownloadsBloc bloc) {
      expect(bloc.state.isLoading, isFalse);
      expect(bloc.state.itemFor('l1')?.state, DownloadState.downloading);
    },
  );

  blocTest<DownloadsBloc, DownloadsState>(
    'EnqueueLesson delegates with its course id',
    build: () => DownloadsBloc(repository),
    act: (DownloadsBloc bloc) =>
        bloc.add(const EnqueueLesson('l1', courseId: 'c1')),
    verify: (_) =>
        verify(() => repository.enqueueLesson('l1', courseId: 'c1')).called(1),
  );

  blocTest<DownloadsBloc, DownloadsState>(
    'EnqueueCourse delegates the whole lesson list',
    build: () => DownloadsBloc(repository),
    act: (DownloadsBloc bloc) =>
        bloc.add(const EnqueueCourse('c1', <String>['a', 'b'])),
    verify: (_) => verify(
      () => repository.enqueueCourse('c1', <String>['a', 'b']),
    ).called(1),
  );

  for (final (String name, DownloadsEvent event, String method)
      in <(String, DownloadsEvent, String)>[
        ('PauseDownload', const PauseDownload('l1'), 'pause'),
        ('ResumeDownload', const ResumeDownload('l1'), 'resume'),
        ('CancelDownload', const CancelDownload('l1'), 'cancel'),
        ('RetryDownload', const RetryDownload('l1'), 'retry'),
      ]) {
    blocTest<DownloadsBloc, DownloadsState>(
      '$name delegates to the repository',
      build: () => DownloadsBloc(repository),
      act: (DownloadsBloc bloc) => bloc.add(event),
      verify: (_) {
        switch (method) {
          case 'pause':
            verify(() => repository.pause('l1')).called(1);
          case 'resume':
            verify(() => repository.resume('l1')).called(1);
          case 'cancel':
            verify(() => repository.cancel('l1')).called(1);
          case 'retry':
            verify(() => repository.retry('l1')).called(1);
        }
      },
    );
  }
}
