import 'package:flutter/material.dart';
import 'package:widgetbook/widgetbook.dart';

import 'package:app_ui/app_ui.dart';

const CourseCardData _sampleCourse = CourseCardData(
  id: '1',
  title: 'Advanced Vue Patterns',
  instructor: 'Jane Doe',
  lessons: 12,
  completed: 4,
  accent: CourseAccent.teal,
);

const CourseCardData _completeCourse = CourseCardData(
  id: '2',
  title: 'System Design Interviews',
  instructor: 'Ada Lovelace',
  lessons: 8,
  completed: 8,
  accent: CourseAccent.coral,
);

const CourseCardData _noInstructorCourse = CourseCardData(
  id: '3',
  title: 'Self-Paced Fundamentals',
  instructor: '',
  lessons: 6,
  completed: 2,
  accent: CourseAccent.amber,
);

List<CourseCardData> _accentVariants() => <CourseCardData>[
  for (final CourseAccent accent in CourseAccent.values)
    CourseCardData(
      id: accent.name,
      title: '${accent.name} Course',
      instructor: 'Instructor Name',
      lessons: 10,
      completed: 4,
      accent: accent,
    ),
];

/// Widgetbook components cataloguing the `app_ui` CourseCard family:
/// [CoursePosterCard], [CourseWideCard], and [CourseCompactRow] — three
/// distinct widgets sharing the same [CourseCardState] matrix, not one
/// widget with a variant prop.
List<WidgetbookComponent> buildCourseCardComponents() {
  return <WidgetbookComponent>[
    _buildPosterCardComponent(),
    _buildWideCardComponent(),
    _buildCompactRowComponent(),
  ];
}

WidgetbookComponent _buildPosterCardComponent() {
  return WidgetbookComponent(
    name: 'CoursePosterCard',
    useCases: <WidgetbookUseCase>[
      WidgetbookUseCase(name: 'Not started', builder: _posterNotStarted),
      WidgetbookUseCase(name: 'In progress', builder: _posterInProgress),
      WidgetbookUseCase(name: 'Completed', builder: _posterCompleted),
      WidgetbookUseCase(name: 'Locked', builder: _posterLocked),
      WidgetbookUseCase(name: 'Loading', builder: _posterLoading),
      WidgetbookUseCase(name: 'No instructor', builder: _posterNoInstructor),
      WidgetbookUseCase(
        name: 'Presentational (inside a link)',
        builder: _posterPresentational,
      ),
      WidgetbookUseCase(name: 'Accent variants', builder: _posterAccents),
    ],
  );
}

WidgetbookComponent _buildWideCardComponent() {
  return WidgetbookComponent(
    name: 'CourseWideCard',
    useCases: <WidgetbookUseCase>[
      WidgetbookUseCase(name: 'Not started', builder: _wideNotStarted),
      WidgetbookUseCase(name: 'In progress', builder: _wideInProgress),
      WidgetbookUseCase(name: 'Completed', builder: _wideCompleted),
      WidgetbookUseCase(name: 'Locked', builder: _wideLocked),
      WidgetbookUseCase(name: 'Loading', builder: _wideLoading),
      WidgetbookUseCase(
        name: 'Resume label vs. percentage',
        builder: _wideResumeLabel,
      ),
    ],
  );
}

WidgetbookComponent _buildCompactRowComponent() {
  return WidgetbookComponent(
    name: 'CourseCompactRow',
    useCases: <WidgetbookUseCase>[
      WidgetbookUseCase(name: 'Not started', builder: _compactNotStarted),
      WidgetbookUseCase(name: 'In progress', builder: _compactInProgress),
      WidgetbookUseCase(name: 'Completed', builder: _compactCompleted),
      WidgetbookUseCase(name: 'Locked', builder: _compactLocked),
      WidgetbookUseCase(name: 'Loading', builder: _compactLoading),
      WidgetbookUseCase(name: 'Accent variants', builder: _compactAccents),
    ],
  );
}

Widget _poster(
  CourseCardData course, {
  CourseCardState state = CourseCardState.auto,
  bool loading = false,
}) {
  return Center(
    child: SizedBox(
      width: 180,
      child: CoursePosterCard(
        course: course,
        state: state,
        loading: loading,
        onTap: (_) {},
      ),
    ),
  );
}

Widget _posterNotStarted(BuildContext context) =>
    _poster(_sampleCourse, state: CourseCardState.notStarted);
Widget _posterInProgress(BuildContext context) =>
    _poster(_sampleCourse, state: CourseCardState.inProgress);
Widget _posterCompleted(BuildContext context) =>
    _poster(_completeCourse, state: CourseCardState.completed);
Widget _posterLocked(BuildContext context) =>
    _poster(_sampleCourse, state: CourseCardState.locked);
Widget _posterLoading(BuildContext context) =>
    _poster(_sampleCourse, loading: true);
Widget _posterNoInstructor(BuildContext context) =>
    _poster(_noInstructorCourse);

Widget _posterPresentational(BuildContext context) {
  return Center(
    child: SizedBox(
      width: 180,
      // Mirrors the web `StaticInsideLink` story: wrapped in a tappable
      // ancestor that owns navigation, so the card itself carries no button
      // semantics (`interactive: false`).
      child: InkWell(
        onTap: () {},
        child: const CoursePosterCard(
          course: _sampleCourse,
          interactive: false,
        ),
      ),
    ),
  );
}

Widget _posterAccents(BuildContext context) {
  return Center(
    child: Wrap(
      spacing: 12,
      runSpacing: 12,
      children: <Widget>[
        for (final CourseCardData course in _accentVariants())
          SizedBox(
            width: 140,
            child: CoursePosterCard(course: course, onTap: (_) {}),
          ),
      ],
    ),
  );
}

Widget _wide(
  CourseCardData course, {
  CourseCardState state = CourseCardState.auto,
  String? resumeLabel,
  bool loading = false,
}) {
  return Center(
    child: SizedBox(
      width: 420,
      child: CourseWideCard(
        course: course,
        state: state,
        resumeLabel: resumeLabel,
        loading: loading,
        onTap: (_) {},
      ),
    ),
  );
}

Widget _wideNotStarted(BuildContext context) =>
    _wide(_sampleCourse, state: CourseCardState.notStarted);
Widget _wideInProgress(BuildContext context) =>
    _wide(_sampleCourse, state: CourseCardState.inProgress);
Widget _wideCompleted(BuildContext context) =>
    _wide(_completeCourse, state: CourseCardState.completed);
Widget _wideLocked(BuildContext context) =>
    _wide(_sampleCourse, state: CourseCardState.locked);
Widget _wideLoading(BuildContext context) =>
    _wide(_sampleCourse, loading: true);

Widget _wideResumeLabel(BuildContext context) {
  return Center(
    child: SizedBox(
      width: 420,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          CourseWideCard(course: _sampleCourse, onTap: (_) {}),
          const SizedBox(height: 8),
          CourseWideCard(
            course: _sampleCourse,
            resumeLabel: 'Resume 2:05',
            onTap: (_) {},
          ),
        ],
      ),
    ),
  );
}

Widget _compact(
  CourseCardData course, {
  CourseCardState state = CourseCardState.auto,
  bool loading = false,
}) {
  return Center(
    child: SizedBox(
      width: 360,
      child: CourseCompactRow(
        course: course,
        state: state,
        loading: loading,
        onTap: (_) {},
      ),
    ),
  );
}

Widget _compactNotStarted(BuildContext context) =>
    _compact(_sampleCourse, state: CourseCardState.notStarted);
Widget _compactInProgress(BuildContext context) =>
    _compact(_sampleCourse, state: CourseCardState.inProgress);
Widget _compactCompleted(BuildContext context) =>
    _compact(_completeCourse, state: CourseCardState.completed);
Widget _compactLocked(BuildContext context) =>
    _compact(_sampleCourse, state: CourseCardState.locked);
Widget _compactLoading(BuildContext context) =>
    _compact(_sampleCourse, loading: true);

Widget _compactAccents(BuildContext context) {
  return Center(
    child: SizedBox(
      width: 360,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          for (final CourseCardData course in _accentVariants())
            CourseCompactRow(course: course, onTap: (_) {}),
        ],
      ),
    ),
  );
}
