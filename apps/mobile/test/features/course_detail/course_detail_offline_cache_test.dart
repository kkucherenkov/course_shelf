import 'package:dio/dio.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/course_detail/data/course_detail_repository_impl.dart';
import 'package:app_mobile/features/course_detail/domain/course_detail.dart';
import 'package:app_mobile/features/course_detail/domain/course_detail_repository.dart';
import 'package:app_mobile/shared/db/app_database.dart';

class _MockDio extends Mock implements Dio {}

Response<Map<String, dynamic>> _ok(Map<String, dynamic> body) =>
    Response<Map<String, dynamic>>(
      data: body,
      statusCode: 200,
      requestOptions: RequestOptions(path: '/'),
    );

DioException _offline() => DioException.connectionError(
  requestOptions: RequestOptions(path: '/courses/c1/outline'),
  reason: 'no route to host',
);

DioException _status(int code) => DioException.badResponse(
  statusCode: code,
  requestOptions: RequestOptions(path: '/courses/c1/outline'),
  response: Response<void>(
    statusCode: code,
    requestOptions: RequestOptions(path: '/courses/c1/outline'),
  ),
);

Map<String, dynamic> _lesson(String id, int position) => <String, dynamic>{
  'id': id,
  'position': position,
  'title': 'Lesson $position',
  'durationSeconds': 300,
  'hasMaterials': false,
  'state': 'not-started',
  'progressPercent': 0,
};

Map<String, dynamic> _outlineBody() => <String, dynamic>{
  'course': <String, dynamic>{
    'id': 'c1',
    'libraryId': 'lib1',
    'title': 'Rust in anger',
    'slug': 'rust-in-anger',
    'description': 'A course',
    'instructor': 'J. Blandy',
    'librarySlug': 'rust',
    'lessonsTotal': 2,
    'totalDurationSeconds': 600,
    'progress': <String, dynamic>{
      'percent': 0,
      'lessonsCompleted': 0,
      'lessonsTotal': 2,
    },
    'updatedAt': '2026-01-01T00:00:00.000Z',
  },
  'sections': <Map<String, dynamic>>[
    <String, dynamic>{
      'id': 's1',
      'position': 1,
      'title': 'Foundations',
      'totalDurationSeconds': 600,
      'lessons': <Map<String, dynamic>>[_lesson('l1', 1), _lesson('l2', 2)],
    },
  ],
};

/// The read half of the offline pair E20 completed on the write side: a
/// downloaded lesson played offline, but the screen listing it could not draw
/// without a round trip, because nothing ever wrote to `cached_*`.
void main() {
  late _MockDio dio;
  late AppDatabase db;
  late CachedCatalogDao cache;
  late CourseDetailRepositoryImpl repository;

  const path = '/courses/c1/outline';

  setUp(() {
    dio = _MockDio();
    db = AppDatabase(NativeDatabase.memory());
    cache = CachedCatalogDao(db);
    repository = CourseDetailRepositoryImpl(dio, cache: cache);
  });

  tearDown(() => db.close());

  Future<void> primeCache() async {
    when(
      () => dio.get<Map<String, dynamic>>(path),
    ).thenAnswer((_) async => _ok(_outlineBody()));
    await repository.fetchOutline('c1');
  }

  group('write-through', () {
    test('a successful fetch populates all three tables', () async {
      await primeCache();

      expect(await cache.courseById('c1'), isNotNull);
      expect(await cache.sectionsForCourse('c1'), hasLength(1));
      // Lessons are their own rows, not left inside the section payload, so
      // `lessonsForCourse` answers with one indexed read.
      expect(await cache.lessonsForCourse('c1'), hasLength(2));
    });

    test(
      'promoted columns carry the server values, not placeholders',
      () async {
        await primeCache();

        final CachedCourse row = (await cache.courseById('c1'))!;
        expect(row.title, 'Rust in anger');
        expect(row.libraryId, 'lib1');
        expect(row.slug, 'rust-in-anger');
        expect(row.updatedAt, DateTime.utc(2026, 1, 1));
        expect(row.cachedAt.isUtc, isTrue);
      },
    );

    test('a re-fetch replaces the outline rather than accumulating', () async {
      await primeCache();
      await primeCache();

      expect(await cache.sectionsForCourse('c1'), hasLength(1));
      expect(await cache.lessonsForCourse('c1'), hasLength(2));
    });
  });

  group('read-back', () {
    test('a network failure is served from the cache', () async {
      await primeCache();
      when(() => dio.get<Map<String, dynamic>>(path)).thenThrow(_offline());

      final CourseDetailOutline outline = await repository.fetchOutline('c1');

      expect(outline.summary.title, 'Rust in anger');
      expect(outline.sections, hasLength(1));
      expect(outline.sections.single.lessons.map((l) => l.id), <String>[
        'l1',
        'l2',
      ]);
    });

    test('lessons come back in outline order', () async {
      await primeCache();
      when(() => dio.get<Map<String, dynamic>>(path)).thenThrow(_offline());

      final CourseDetailOutline outline = await repository.fetchOutline('c1');

      expect(outline.sections.single.lessons.map((l) => l.position), <int>[
        1,
        2,
      ]);
    });

    test('with nothing cached the original error propagates', () async {
      when(() => dio.get<Map<String, dynamic>>(path)).thenThrow(_offline());

      await expectLater(
        repository.fetchOutline('c1'),
        throwsA(isA<DioException>()),
      );
    });

    test('a 403 locks the screen even when a cached copy exists', () async {
      // Access revocation must not be masked by a stale row — this is the one
      // failure that deliberately does not fall back.
      await primeCache();
      when(() => dio.get<Map<String, dynamic>>(path)).thenThrow(_status(403));

      await expectLater(
        repository.fetchOutline('c1'),
        throwsA(isA<CourseAccessDeniedException>()),
      );
    });

    test('a 500 does fall back — it is not an access decision', () async {
      await primeCache();
      when(() => dio.get<Map<String, dynamic>>(path)).thenThrow(_status(500));

      final CourseDetailOutline outline = await repository.fetchOutline('c1');

      expect(outline.summary.title, 'Rust in anger');
    });
  });

  group('without a cache', () {
    test('the repository behaves exactly as before', () async {
      final CourseDetailRepositoryImpl bare = CourseDetailRepositoryImpl(dio);
      when(() => dio.get<Map<String, dynamic>>(path)).thenThrow(_offline());

      await expectLater(bare.fetchOutline('c1'), throwsA(isA<DioException>()));
    });
  });
}
