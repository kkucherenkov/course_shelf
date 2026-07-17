import 'package:equatable/equatable.dart';

/// Per-user lesson state — Flutter twin of the wire `LessonOutlineItem.state`
/// enum (`not-started` | `in-progress` | `completed` | `locked`).
enum CourseDetailLessonState { notStarted, inProgress, completed, locked }

/// One lesson row inside a [CourseDetailSection] — mirrors `LessonOutlineItem`
/// 1:1 (the OpenAPI doc says it "maps 1:1 to the AppLessonRow component's
/// props").
class CourseDetailLesson extends Equatable {
  const CourseDetailLesson({
    required this.id,
    required this.position,
    required this.title,
    required this.durationSeconds,
    required this.hasMaterials,
    required this.state,
    required this.progressPercent,
  });

  final String id;

  /// 1-based position within the section.
  final int position;
  final String title;
  final int durationSeconds;
  final bool hasMaterials;
  final CourseDetailLessonState state;

  /// 0..100; only meaningful when [state] is
  /// [CourseDetailLessonState.inProgress].
  final int progressPercent;

  @override
  List<Object?> get props => <Object?>[
    id,
    position,
    title,
    durationSeconds,
    hasMaterials,
    state,
    progressPercent,
  ];
}

/// One curriculum section — mirrors `SectionOutline`.
class CourseDetailSection extends Equatable {
  const CourseDetailSection({
    required this.id,
    required this.position,
    required this.title,
    required this.totalDurationSeconds,
    required this.lessons,
  });

  final String id;

  /// 1-based position within the course.
  final int position;
  final String title;
  final int totalDurationSeconds;

  /// Sorted by [CourseDetailLesson.position].
  final List<CourseDetailLesson> lessons;

  @override
  List<Object?> get props => <Object?>[
    id,
    position,
    title,
    totalDurationSeconds,
    lessons,
  ];
}

/// Course-level fields feeding the hero + CTAs — narrowed from the wire
/// `CourseOutlineSummary`. `createdAt`/`updatedAt` are deliberately dropped:
/// this screen renders no course metadata timestamps (the same trim
/// `HomeSummary` applies to `ContinueWatchingCourse`).
class CourseDetailSummary extends Equatable {
  const CourseDetailSummary({
    required this.id,
    required this.title,
    required this.lessonsTotal,
    required this.totalDurationSeconds,
    required this.lessonsCompleted,
    this.slug,
    this.description,
    this.instructor,
    this.librarySlug,
  });

  final String id;
  final String title;
  final String? slug;

  /// Long-form description. Not rendered by this screen yet — carried for
  /// parity with the wire DTO and future use.
  final String? description;

  /// Visible "by …" label; `null` until the catalog DTO grows the field.
  final String? instructor;

  /// Slug of the parent library; `null` until `Library` grows one.
  final String? librarySlug;
  final int lessonsTotal;
  final int totalDurationSeconds;
  final int lessonsCompleted;

  /// Derived client-side from [lessonsCompleted] / [lessonsTotal] — never the
  /// wire `CourseProgress.percent` field, which the v1 API always returns `0`
  /// ("populated once the LessonProgress projector lands", per the OpenAPI
  /// doc). Mirrors the `HomeSummary.ContinueWatchingCourse` precedent: the
  /// card family derives its own percentage rather than carrying two sources
  /// of truth for one number.
  int get progressPercent {
    if (lessonsTotal <= 0) return 0;
    return ((lessonsCompleted / lessonsTotal) * 100).round().clamp(0, 100);
  }

  @override
  List<Object?> get props => <Object?>[
    id,
    title,
    slug,
    description,
    instructor,
    librarySlug,
    lessonsTotal,
    totalDurationSeconds,
    lessonsCompleted,
  ];
}

/// The course summary + full curriculum — what
/// `GET /courses/{id}/outline` returns, narrowed to what this screen renders
/// (the outline's `materials[]` is dropped; the mobile Course-detail screen
/// does not render the materials rail).
class CourseDetailOutline extends Equatable {
  const CourseDetailOutline({required this.summary, required this.sections});

  final CourseDetailSummary summary;

  /// Sorted by [CourseDetailSection.position].
  final List<CourseDetailSection> sections;

  @override
  List<Object?> get props => <Object?>[summary, sections];
}

/// Mirrors `CourseDownloadEstimateDto` — the real byte total feeding the
/// "Download course · `<size>`" CTA. Fetched independently of the outline and
/// allowed to fail soft (see `CourseDetailCubit.load`).
class CourseDownloadEstimate extends Equatable {
  const CourseDownloadEstimate({
    required this.courseId,
    required this.totalBytes,
    required this.lessonCount,
  });

  final String courseId;
  final int totalBytes;
  final int lessonCount;

  @override
  List<Object?> get props => <Object?>[courseId, totalBytes, lessonCount];
}

/// Everything one Course-detail render needs — the `CourseDetailState.detail`
/// payload, assembled by the cubit from the two independent fetches.
///
/// [estimate] is nullable: the byte total is real (this card's own
/// download-estimate endpoint), but its fetch is allowed to fail soft, and
/// the per-lesson download STATE it might imply does not exist yet — that is
/// E19's `DownloadsBloc`, not this card.
class CourseDetail extends Equatable {
  const CourseDetail({
    required this.summary,
    required this.sections,
    this.estimate,
  });

  final CourseDetailSummary summary;
  final List<CourseDetailSection> sections;
  final CourseDownloadEstimate? estimate;

  @override
  List<Object?> get props => <Object?>[summary, sections, estimate];
}
