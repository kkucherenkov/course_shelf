import 'dart:async';

import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/downloads/domain/device_storage.dart';
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
        lessonTitle: any<String?>(named: 'lessonTitle'),
        courseTitle: any<String?>(named: 'courseTitle'),
      ),
    ).thenAnswer((_) async {});
    when(
      () => repository.enqueueCourse(
        any<String>(),
        any<List<DownloadRequest>>(),
      ),
    ).thenAnswer((_) async {});
    when(() => repository.pause(any<String>())).thenAnswer((_) async {});
    when(() => repository.resume(any<String>())).thenAnswer((_) async {});
    when(() => repository.cancel(any<String>())).thenAnswer((_) async {});
    when(() => repository.retry(any<String>())).thenAnswer((_) async {});
  });

  tearDown(() => queue.close());

  blocTest<DownloadsBloc, DownloadsState>(
    'start reconciles a killed download before subscribing',
    build: () => DownloadsBloc(repository),
    act: (DownloadsBloc bloc) => bloc.add(const DownloadsStarted()),
    verify: (_) {
      // Order is the point: subscribing first would briefly surface a row that
      // an app kill left in `downloading` but that nothing is actually running.
      verifyInOrder(<void Function()>[
        () => repository.reconcileAfterRestart(),
        () => repository.watchAll(),
      ]);
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
    act: (DownloadsBloc bloc) => bloc.add(
      const EnqueueCourse('c1', <DownloadRequest>[
        DownloadRequest(lessonId: 'a', lessonTitle: 'A', courseTitle: 'C'),
        DownloadRequest(lessonId: 'b'),
      ]),
    ),
    verify: (_) => verify(
      () => repository.enqueueCourse(
        'c1',
        any<List<DownloadRequest>>(
          that: predicate<List<DownloadRequest>>(
            (List<DownloadRequest> l) =>
                l.length == 2 &&
                l.first.lessonId == 'a' &&
                l.first.lessonTitle == 'A',
          ),
        ),
      ),
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

  group('Downloads tab additions (E19-F01-S03)', () {
    blocTest<DownloadsBloc, DownloadsState>(
      'DeleteCourseDownloads cancels every lesson of that course and no other',
      build: () => DownloadsBloc(repository),
      seed: () => DownloadsState(
        isLoading: false,
        items: <DownloadItem>[
          _item('a', courseId: 'c1'),
          _item('b', courseId: 'c1'),
          _item('c', courseId: 'c2'),
        ],
      ),
      act: (DownloadsBloc bloc) => bloc.add(const DeleteCourseDownloads('c1')),
      verify: (_) {
        verify(() => repository.cancel('a')).called(1);
        verify(() => repository.cancel('b')).called(1);
        verifyNever(() => repository.cancel('c'));
      },
    );

    blocTest<DownloadsBloc, DownloadsState>(
      'connectivity drives isOnline',
      build: () => DownloadsBloc(repository),
      seed: () => const DownloadsState(isLoading: false),
      act: (DownloadsBloc bloc) =>
          bloc.add(const DownloadsConnectivityChanged(isOnline: false)),
      expect: () => <Matcher>[
        isA<DownloadsState>().having(
          (DownloadsState s) => s.isOnline,
          'isOnline',
          false,
        ),
      ],
    );

    blocTest<DownloadsBloc, DownloadsState>(
      'an unchanged storage reading is not re-emitted',
      build: () => DownloadsBloc(repository),
      seed: () => const DownloadsState(
        isLoading: false,
        storage: StorageSnapshot(deviceFreeBytes: 1, deviceTotalBytes: 2),
      ),
      act: (DownloadsBloc bloc) => bloc.add(
        const DownloadsStorageUpdated(
          StorageSnapshot(deviceFreeBytes: 1, deviceTotalBytes: 2),
        ),
      ),
      // Capacity moves slowly; rebuilding the tab on every identical reading
      // after every queue tick is pure churn.
      expect: () => <DownloadsState>[],
    );

    test('groups ready items by course, keeping ungrouped ones together', () {
      final DownloadsState state = DownloadsState(
        isLoading: false,
        items: <DownloadItem>[
          _item('a', courseId: 'c1', courseTitle: 'One'),
          _item('b', courseId: 'c1', courseTitle: 'One'),
          _item('c'),
          _item('d', state: DownloadState.failed, courseId: 'c1'),
        ],
      );

      final List<DownloadCourseGroup> groups = state.downloadedByCourse;

      expect(groups, hasLength(2));
      expect(groups.first.courseId, 'c1');
      expect(groups.first.items.map((DownloadItem i) => i.lessonId), <String>[
        'a',
        'b',
      ]);
      // The failed row belongs to the Failed section, not to a course group.
      expect(state.failed.map((DownloadItem i) => i.lessonId), <String>['d']);
      expect(groups.last.courseId, isNull);
    });

    test('appUsedBytes sums what the queue has written', () {
      final DownloadsState state = DownloadsState(
        isLoading: false,
        items: <DownloadItem>[
          _item('a', bytes: 100),
          _item('b', bytes: 250),
        ],
      );

      expect(state.appUsedBytes, 350);
    });
  });
}

DownloadItem _item(
  String id, {
  DownloadState state = DownloadState.ready,
  String? courseId,
  String? courseTitle,
  int bytes = 1024,
}) => DownloadItem(
  lessonId: id,
  state: state,
  bytesDownloaded: bytes,
  totalBytes: bytes,
  attemptCount: 0,
  courseId: courseId,
  lessonTitle: 'Lesson $id',
  courseTitle: courseTitle,
);
