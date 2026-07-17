import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/course_detail/data/course_detail_repository_impl.dart';
import 'package:app_mobile/features/course_detail/domain/course_detail.dart';
import 'package:app_mobile/features/course_detail/domain/course_detail_repository.dart';

class _MockDio extends Mock implements Dio {}

Response<Map<String, dynamic>> _ok(Map<String, dynamic>? body) =>
    Response<Map<String, dynamic>>(
      data: body,
      statusCode: 200,
      requestOptions: RequestOptions(path: '/'),
    );

Map<String, dynamic> _lessonJson({
  String id = 'l1',
  int position = 1,
  String state = 'not-started',
}) => <String, dynamic>{
  'id': id,
  'position': position,
  'title': 'Intro',
  'durationSeconds': 300,
  'hasMaterials': false,
  'state': state,
  'progressPercent': 0,
};

Map<String, dynamic> _sectionJson() => <String, dynamic>{
  'id': 's1',
  'position': 1,
  'title': 'Foundations',
  'totalDurationSeconds': 300,
  'lessons': <Map<String, dynamic>>[_lessonJson()],
};

Map<String, dynamic> _courseJson() => <String, dynamic>{
  'id': 'c1',
  'title': 'Rust in anger',
  'slug': 'rust-in-anger',
  'description': 'A course',
  'instructor': 'J. Blandy',
  'librarySlug': 'rust',
  'lessonsTotal': 1,
  'totalDurationSeconds': 300,
  'progress': <String, dynamic>{
    'percent': 0,
    'lessonsCompleted': 0,
    'lessonsTotal': 1,
  },
  'createdAt': '2026-01-01T00:00:00.000Z',
  'updatedAt': '2026-01-01T00:00:00.000Z',
};

void main() {
  late _MockDio dio;
  late CourseDetailRepositoryImpl repository;

  const outlinePath = '/courses/c1/outline';
  const estimatePath = '/courses/c1/download-estimate';

  setUp(() {
    dio = _MockDio();
    repository = CourseDetailRepositoryImpl(dio);
  });

  group('fetchOutline', () {
    test('maps the course summary, sections and lessons', () async {
      when(() => dio.get<Map<String, dynamic>>(outlinePath)).thenAnswer(
        (_) async => _ok(<String, dynamic>{
          'course': _courseJson(),
          'sections': <Map<String, dynamic>>[_sectionJson()],
          'materials': <Map<String, dynamic>>[],
        }),
      );

      final outline = await repository.fetchOutline('c1');

      expect(outline.summary.id, 'c1');
      expect(outline.summary.title, 'Rust in anger');
      expect(outline.summary.instructor, 'J. Blandy');
      expect(outline.summary.librarySlug, 'rust');
      expect(outline.summary.lessonsTotal, 1);
      expect(outline.summary.lessonsCompleted, 0);

      expect(outline.sections, hasLength(1));
      final section = outline.sections.single;
      expect(section.id, 's1');
      expect(section.lessons, hasLength(1));
      expect(section.lessons.single.id, 'l1');
      expect(section.lessons.single.state, CourseDetailLessonState.notStarted);
    });

    test('hits the path WITHOUT re-prefixing /api/v1', () async {
      when(() => dio.get<Map<String, dynamic>>(outlinePath)).thenAnswer(
        (_) async => _ok(<String, dynamic>{
          'course': _courseJson(),
          'sections': <Map<String, dynamic>>[],
          'materials': <Map<String, dynamic>>[],
        }),
      );

      await repository.fetchOutline('c1');

      verify(() => dio.get<Map<String, dynamic>>(outlinePath)).called(1);
    });

    test('maps each lesson state from the kebab-case wire enum', () async {
      when(() => dio.get<Map<String, dynamic>>(outlinePath)).thenAnswer(
        (_) async => _ok(<String, dynamic>{
          'course': _courseJson(),
          'sections': <Map<String, dynamic>>[
            <String, dynamic>{
              'id': 's1',
              'position': 1,
              'title': 'Foundations',
              'totalDurationSeconds': 1200,
              'lessons': <Map<String, dynamic>>[
                _lessonJson(id: 'l1', position: 1, state: 'not-started'),
                _lessonJson(id: 'l2', position: 2, state: 'in-progress'),
                _lessonJson(id: 'l3', position: 3, state: 'completed'),
                _lessonJson(id: 'l4', position: 4, state: 'locked'),
              ],
            },
          ],
          'materials': <Map<String, dynamic>>[],
        }),
      );

      final outline = await repository.fetchOutline('c1');
      final states = outline.sections.single.lessons
          .map((lesson) => lesson.state)
          .toList();

      expect(states, <CourseDetailLessonState>[
        CourseDetailLessonState.notStarted,
        CourseDetailLessonState.inProgress,
        CourseDetailLessonState.completed,
        CourseDetailLessonState.locked,
      ]);
    });

    test('maps a 403 to CourseAccessDeniedException', () async {
      when(() => dio.get<Map<String, dynamic>>(outlinePath)).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: outlinePath),
          response: Response<dynamic>(
            statusCode: 403,
            requestOptions: RequestOptions(path: outlinePath),
          ),
        ),
      );

      expect(
        repository.fetchOutline('c1'),
        throwsA(isA<CourseAccessDeniedException>()),
      );
    });

    test('propagates any other transport failure', () async {
      when(() => dio.get<Map<String, dynamic>>(outlinePath)).thenThrow(
        DioException(
          requestOptions: RequestOptions(path: outlinePath),
          response: Response<dynamic>(
            statusCode: 500,
            requestOptions: RequestOptions(path: outlinePath),
          ),
        ),
      );

      expect(repository.fetchOutline('c1'), throwsA(isA<DioException>()));
    });

    test(
      'throws when a 2xx carries no course/sections rather than faking one',
      () async {
        when(
          () => dio.get<Map<String, dynamic>>(outlinePath),
        ).thenAnswer((_) async => _ok(<String, dynamic>{}));

        expect(repository.fetchOutline('c1'), throwsStateError);
      },
    );
  });

  group('fetchDownloadEstimate', () {
    test('maps courseId, totalBytes and lessonCount', () async {
      when(() => dio.get<Map<String, dynamic>>(estimatePath)).thenAnswer(
        (_) async => _ok(<String, dynamic>{
          'courseId': 'c1',
          'totalBytes': 1288490188,
          'lessonCount': 42,
        }),
      );

      final estimate = await repository.fetchDownloadEstimate('c1');

      expect(estimate.courseId, 'c1');
      expect(estimate.totalBytes, 1288490188);
      expect(estimate.lessonCount, 42);
    });

    test('hits the path WITHOUT re-prefixing /api/v1', () async {
      when(() => dio.get<Map<String, dynamic>>(estimatePath)).thenAnswer(
        (_) async => _ok(<String, dynamic>{
          'courseId': 'c1',
          'totalBytes': 0,
          'lessonCount': 0,
        }),
      );

      await repository.fetchDownloadEstimate('c1');

      verify(() => dio.get<Map<String, dynamic>>(estimatePath)).called(1);
    });

    test(
      'propagates transport failures so the cubit can fail it soft',
      () async {
        when(() => dio.get<Map<String, dynamic>>(estimatePath)).thenThrow(
          DioException(requestOptions: RequestOptions(path: estimatePath)),
        );

        expect(
          repository.fetchDownloadEstimate('c1'),
          throwsA(isA<DioException>()),
        );
      },
    );
  });
}
