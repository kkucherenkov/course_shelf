// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'course_outline_summary.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CourseOutlineSummary extends CourseOutlineSummary {
  @override
  final String id;
  @override
  final String title;
  @override
  final String? slug;
  @override
  final String? description;
  @override
  final String? instructor;
  @override
  final String? librarySlug;
  @override
  final int lessonsTotal;
  @override
  final int totalDurationSeconds;
  @override
  final CourseProgress progress;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  factory _$CourseOutlineSummary([
    void Function(CourseOutlineSummaryBuilder)? updates,
  ]) => (CourseOutlineSummaryBuilder()..update(updates))._build();

  _$CourseOutlineSummary._({
    required this.id,
    required this.title,
    this.slug,
    this.description,
    this.instructor,
    this.librarySlug,
    required this.lessonsTotal,
    required this.totalDurationSeconds,
    required this.progress,
    required this.createdAt,
    required this.updatedAt,
  }) : super._();
  @override
  CourseOutlineSummary rebuild(
    void Function(CourseOutlineSummaryBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  CourseOutlineSummaryBuilder toBuilder() =>
      CourseOutlineSummaryBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CourseOutlineSummary &&
        id == other.id &&
        title == other.title &&
        slug == other.slug &&
        description == other.description &&
        instructor == other.instructor &&
        librarySlug == other.librarySlug &&
        lessonsTotal == other.lessonsTotal &&
        totalDurationSeconds == other.totalDurationSeconds &&
        progress == other.progress &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, slug.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, instructor.hashCode);
    _$hash = $jc(_$hash, librarySlug.hashCode);
    _$hash = $jc(_$hash, lessonsTotal.hashCode);
    _$hash = $jc(_$hash, totalDurationSeconds.hashCode);
    _$hash = $jc(_$hash, progress.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CourseOutlineSummary')
          ..add('id', id)
          ..add('title', title)
          ..add('slug', slug)
          ..add('description', description)
          ..add('instructor', instructor)
          ..add('librarySlug', librarySlug)
          ..add('lessonsTotal', lessonsTotal)
          ..add('totalDurationSeconds', totalDurationSeconds)
          ..add('progress', progress)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class CourseOutlineSummaryBuilder
    implements Builder<CourseOutlineSummary, CourseOutlineSummaryBuilder> {
  _$CourseOutlineSummary? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _slug;
  String? get slug => _$this._slug;
  set slug(String? slug) => _$this._slug = slug;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  String? _instructor;
  String? get instructor => _$this._instructor;
  set instructor(String? instructor) => _$this._instructor = instructor;

  String? _librarySlug;
  String? get librarySlug => _$this._librarySlug;
  set librarySlug(String? librarySlug) => _$this._librarySlug = librarySlug;

  int? _lessonsTotal;
  int? get lessonsTotal => _$this._lessonsTotal;
  set lessonsTotal(int? lessonsTotal) => _$this._lessonsTotal = lessonsTotal;

  int? _totalDurationSeconds;
  int? get totalDurationSeconds => _$this._totalDurationSeconds;
  set totalDurationSeconds(int? totalDurationSeconds) =>
      _$this._totalDurationSeconds = totalDurationSeconds;

  CourseProgressBuilder? _progress;
  CourseProgressBuilder get progress =>
      _$this._progress ??= CourseProgressBuilder();
  set progress(CourseProgressBuilder? progress) => _$this._progress = progress;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _updatedAt;
  DateTime? get updatedAt => _$this._updatedAt;
  set updatedAt(DateTime? updatedAt) => _$this._updatedAt = updatedAt;

  CourseOutlineSummaryBuilder() {
    CourseOutlineSummary._defaults(this);
  }

  CourseOutlineSummaryBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _title = $v.title;
      _slug = $v.slug;
      _description = $v.description;
      _instructor = $v.instructor;
      _librarySlug = $v.librarySlug;
      _lessonsTotal = $v.lessonsTotal;
      _totalDurationSeconds = $v.totalDurationSeconds;
      _progress = $v.progress.toBuilder();
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CourseOutlineSummary other) {
    _$v = other as _$CourseOutlineSummary;
  }

  @override
  void update(void Function(CourseOutlineSummaryBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CourseOutlineSummary build() => _build();

  _$CourseOutlineSummary _build() {
    _$CourseOutlineSummary _$result;
    try {
      _$result =
          _$v ??
          _$CourseOutlineSummary._(
            id: BuiltValueNullFieldError.checkNotNull(
              id,
              r'CourseOutlineSummary',
              'id',
            ),
            title: BuiltValueNullFieldError.checkNotNull(
              title,
              r'CourseOutlineSummary',
              'title',
            ),
            slug: slug,
            description: description,
            instructor: instructor,
            librarySlug: librarySlug,
            lessonsTotal: BuiltValueNullFieldError.checkNotNull(
              lessonsTotal,
              r'CourseOutlineSummary',
              'lessonsTotal',
            ),
            totalDurationSeconds: BuiltValueNullFieldError.checkNotNull(
              totalDurationSeconds,
              r'CourseOutlineSummary',
              'totalDurationSeconds',
            ),
            progress: progress.build(),
            createdAt: BuiltValueNullFieldError.checkNotNull(
              createdAt,
              r'CourseOutlineSummary',
              'createdAt',
            ),
            updatedAt: BuiltValueNullFieldError.checkNotNull(
              updatedAt,
              r'CourseOutlineSummary',
              'updatedAt',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'progress';
        progress.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'CourseOutlineSummary',
          _$failedField,
          e.toString(),
        );
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
