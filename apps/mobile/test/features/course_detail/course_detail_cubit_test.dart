import 'dart:async';

import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

import 'package:app_mobile/features/course_detail/domain/course_detail.dart';
import 'package:app_mobile/features/course_detail/domain/course_detail_repository.dart';
import 'package:app_mobile/features/course_detail/presentation/bloc/course_detail_cubit.dart';
import 'package:app_mobile/features/course_detail/presentation/bloc/course_detail_state.dart';

class _MockCourseDetailRepository extends Mock
    implements CourseDetailRepository {}

const _lesson = CourseDetailLesson(
  id: 'l1',
  position: 1,
  title: 'Intro',
  durationSeconds: 300,
  hasMaterials: false,
  state: CourseDetailLessonState.notStarted,
  progressPercent: 0,
);

const _section = CourseDetailSection(
  id: 's1',
  position: 1,
  title: 'Foundations',
  totalDurationSeconds: 300,
  lessons: <CourseDetailLesson>[_lesson],
);

const _summary = CourseDetailSummary(
  id: 'c1',
  title: 'Rust in anger',
  lessonsTotal: 1,
  totalDurationSeconds: 300,
  lessonsCompleted: 0,
);

const _outline = CourseDetailOutline(
  summary: _summary,
  sections: <CourseDetailSection>[_section],
);

const _estimate = CourseDownloadEstimate(
  courseId: 'c1',
  totalBytes: 1000,
  lessonCount: 1,
);

void main() {
  late _MockCourseDetailRepository repository;

  setUp(() => repository = _MockCourseDetailRepository());

  test('starts loading — the screen renders a spinner before any await', () {
    expect(CourseDetailCubit(repository).state, const CourseDetailState());
    expect(
      CourseDetailCubit(repository).state.status,
      CourseDetailStatus.loading,
    );
  });

  group('load', () {
    blocTest<CourseDetailCubit, CourseDetailState>(
      'emits Loading then Loaded with the outline + estimate assembled together',
      setUp: () {
        when(
          () => repository.fetchOutline('c1'),
        ).thenAnswer((_) async => _outline);
        when(
          () => repository.fetchDownloadEstimate('c1'),
        ).thenAnswer((_) async => _estimate);
      },
      build: () => CourseDetailCubit(repository),
      act: (cubit) => cubit.load('c1'),
      expect: () => <CourseDetailState>[
        const CourseDetailState(),
        const CourseDetailState(
          status: CourseDetailStatus.loaded,
          detail: CourseDetail(
            summary: _summary,
            sections: <CourseDetailSection>[_section],
            estimate: _estimate,
          ),
        ),
      ],
    );

    blocTest<CourseDetailCubit, CourseDetailState>(
      'fails the estimate soft — still Loaded, estimate null',
      setUp: () {
        when(
          () => repository.fetchOutline('c1'),
        ).thenAnswer((_) async => _outline);
        when(
          () => repository.fetchDownloadEstimate('c1'),
        ).thenThrow(Exception('boom'));
      },
      build: () => CourseDetailCubit(repository),
      act: (cubit) => cubit.load('c1'),
      expect: () => <CourseDetailState>[
        const CourseDetailState(),
        const CourseDetailState(
          status: CourseDetailStatus.loaded,
          detail: CourseDetail(
            summary: _summary,
            sections: <CourseDetailSection>[_section],
          ),
        ),
      ],
    );

    blocTest<CourseDetailCubit, CourseDetailState>(
      'maps an outline 403 to NoAccess, dropping the estimate too',
      setUp: () {
        when(
          () => repository.fetchOutline('c1'),
        ).thenThrow(const CourseAccessDeniedException('c1'));
        when(
          () => repository.fetchDownloadEstimate('c1'),
        ).thenAnswer((_) async => _estimate);
      },
      build: () => CourseDetailCubit(repository),
      act: (cubit) => cubit.load('c1'),
      expect: () => <CourseDetailState>[
        const CourseDetailState(),
        const CourseDetailState(status: CourseDetailStatus.noAccess),
      ],
    );

    blocTest<CourseDetailCubit, CourseDetailState>(
      'maps any other outline error to Failed',
      setUp: () {
        when(
          () => repository.fetchOutline('c1'),
        ).thenThrow(Exception('network down'));
        when(
          () => repository.fetchDownloadEstimate('c1'),
        ).thenAnswer((_) async => _estimate);
      },
      build: () => CourseDetailCubit(repository),
      act: (cubit) => cubit.load('c1'),
      expect: () => <CourseDetailState>[
        const CourseDetailState(),
        const CourseDetailState(status: CourseDetailStatus.failed),
      ],
    );

    test(
      'fetches the outline and the estimate concurrently, not in sequence',
      () async {
        final outlineCompleter = Completer<CourseDetailOutline>();
        final estimateCompleter = Completer<CourseDownloadEstimate>();
        when(
          () => repository.fetchOutline('c1'),
        ).thenAnswer((_) => outlineCompleter.future);
        when(
          () => repository.fetchDownloadEstimate('c1'),
        ).thenAnswer((_) => estimateCompleter.future);

        final cubit = CourseDetailCubit(repository);
        final future = cubit.load('c1');
        await Future<void>.delayed(Duration.zero);

        // Both calls are already in flight — neither awaited the other before
        // firing.
        verify(() => repository.fetchOutline('c1')).called(1);
        verify(() => repository.fetchDownloadEstimate('c1')).called(1);

        outlineCompleter.complete(_outline);
        estimateCompleter.complete(_estimate);
        await future;

        expect(cubit.state.status, CourseDetailStatus.loaded);
        await cubit.close();
      },
    );
  });

  group('retry', () {
    blocTest<CourseDetailCubit, CourseDetailState>(
      'reuses the last courseId and can recover Failed back to Loaded',
      setUp: () {
        when(() => repository.fetchOutline('c1')).thenThrow(Exception('boom'));
        when(
          () => repository.fetchDownloadEstimate('c1'),
        ).thenAnswer((_) async => _estimate);
      },
      build: () => CourseDetailCubit(repository),
      act: (cubit) async {
        await cubit.load('c1');
        when(
          () => repository.fetchOutline('c1'),
        ).thenAnswer((_) async => _outline);
        await cubit.retry();
      },
      expect: () => <CourseDetailState>[
        const CourseDetailState(),
        const CourseDetailState(status: CourseDetailStatus.failed),
        const CourseDetailState(),
        const CourseDetailState(
          status: CourseDetailStatus.loaded,
          detail: CourseDetail(
            summary: _summary,
            sections: <CourseDetailSection>[_section],
            estimate: _estimate,
          ),
        ),
      ],
    );

    test('is a no-op before the first load', () async {
      final cubit = CourseDetailCubit(repository);
      await cubit.retry();

      expect(cubit.state, const CourseDetailState());
      verifyNever(() => repository.fetchOutline(any()));
      await cubit.close();
    });
  });
}
