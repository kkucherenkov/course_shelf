import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/home/data/home_repository_impl.dart';

class _MockDio extends Mock implements Dio {}

Response<Map<String, dynamic>> _ok(Map<String, dynamic>? body) =>
    Response<Map<String, dynamic>>(
      data: body,
      statusCode: 200,
      requestOptions: RequestOptions(path: '/'),
    );

Map<String, dynamic> _cwItem() => <String, dynamic>{
      'courseId': 'c1',
      'courseTitle': 'Rust in anger',
      'librarySlug': 'rust',
      'percent': 30,
      'lessonsCompleted': 3,
      'lessonsTotal': 10,
      'lastSeenAt': '2026-07-01T00:00:00.000Z',
      'lastSeenLessonId': 'l7',
    };

Map<String, dynamic> _raItem() => <String, dynamic>{
      'courseId': 'c2',
      'courseTitle': 'Postgres internals',
      'librarySlug': 'pg',
      'lessonCount': 12,
      'totalDurationSeconds': 3600,
      'createdAt': '2026-07-02T00:00:00.000Z',
    };

Map<String, dynamic> _library(String id) => <String, dynamic>{
      'id': id,
      'name': 'lib-$id',
      'rootPath': '/srv/$id',
      'createdAt': '2026-01-01T00:00:00.000Z',
      'updatedAt': '2026-01-01T00:00:00.000Z',
    };

void main() {
  late _MockDio dio;
  late HomeRepositoryImpl repository;

  const cwPath = '/home/continue-watching';
  const raPath = '/home/recently-added';
  const libPath = '/libraries';

  void stub({
    List<Map<String, dynamic>> continueWatching = const [],
    List<Map<String, dynamic>> recentlyAdded = const [],
    List<Map<String, dynamic>> libraries = const [],
  }) {
    when(
      () => dio.get<Map<String, dynamic>>(
        cwPath,
        queryParameters: any(named: 'queryParameters'),
      ),
    ).thenAnswer((_) async => _ok(<String, dynamic>{'items': continueWatching}));
    when(
      () => dio.get<Map<String, dynamic>>(
        raPath,
        queryParameters: any(named: 'queryParameters'),
      ),
    ).thenAnswer((_) async => _ok(<String, dynamic>{'items': recentlyAdded}));
    when(() => dio.get<Map<String, dynamic>>(libPath)).thenAnswer(
      (_) async => _ok(<String, dynamic>{'items': libraries}),
    );
  }

  setUp(() {
    dio = _MockDio();
    repository = HomeRepositoryImpl(dio);
  });

  test('maps both rows and counts libraries', () async {
    stub(
      continueWatching: [_cwItem()],
      recentlyAdded: [_raItem()],
      libraries: [_library('a'), _library('b')],
    );

    final summary = await repository.fetchSummary();

    expect(summary.continueWatching, hasLength(1));
    expect(summary.continueWatching.single.courseId, 'c1');
    expect(summary.continueWatching.single.courseTitle, 'Rust in anger');
    expect(summary.continueWatching.single.lessonsCompleted, 3);
    expect(summary.continueWatching.single.lessonsTotal, 10);
    // The row resumes into this lesson — losing it would strand the card.
    expect(summary.continueWatching.single.lastSeenLessonId, 'l7');

    expect(summary.recentlyAdded.single.courseId, 'c2');
    expect(summary.recentlyAdded.single.lessonCount, 12);

    expect(summary.libraryCount, 2);
    expect(summary.isEmpty, isFalse);
  });

  test('hits paths WITHOUT re-prefixing /api/v1 (Dio concatenates baseUrl)',
      () async {
    stub();
    await repository.fetchSummary();

    // A leading `/api/v1` here would resolve to `/api/v1/api/v1/...` — the
    // auth_api.dart doubling bug. Assert the version-less paths explicitly.
    verify(
      () => dio.get<Map<String, dynamic>>(
        cwPath,
        queryParameters: any(named: 'queryParameters'),
      ),
    ).called(1);
    verify(
      () => dio.get<Map<String, dynamic>>(
        raPath,
        queryParameters: any(named: 'queryParameters'),
      ),
    ).called(1);
    verify(() => dio.get<Map<String, dynamic>>(libPath)).called(1);
  });

  test('asks for the same row limit web Home uses', () async {
    stub();
    await repository.fetchSummary();

    final cwQuery = verify(
      () => dio.get<Map<String, dynamic>>(
        cwPath,
        queryParameters: captureAny(named: 'queryParameters'),
      ),
    ).captured.single as Map<String, dynamic>;
    expect(cwQuery['limit'], 10);
  });

  test('reports empty when both rows are empty', () async {
    stub(libraries: [_library('a')]);

    final summary = await repository.fetchSummary();

    expect(summary.isEmpty, isTrue);
    // Libraries exist even though there is nothing to watch — the quick link
    // must stay enabled, so an empty Home still carries the real count.
    expect(summary.libraryCount, 1);
  });

  test('throws when a 2xx carries no items array rather than faking empty Home',
      () async {
    stub();
    when(
      () => dio.get<Map<String, dynamic>>(
        cwPath,
        queryParameters: any(named: 'queryParameters'),
      ),
    ).thenAnswer((_) async => _ok(<String, dynamic>{}));

    expect(repository.fetchSummary(), throwsStateError);
  });

  test('propagates transport failures so the cubit can show Failed', () async {
    stub();
    when(() => dio.get<Map<String, dynamic>>(libPath)).thenThrow(
      DioException(requestOptions: RequestOptions(path: libPath)),
    );

    expect(repository.fetchSummary(), throwsA(isA<DioException>()));
  });
}
