// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'continue_watching_item.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ContinueWatchingItem extends ContinueWatchingItem {
  @override
  final String courseId;
  @override
  final String courseTitle;
  @override
  final String? librarySlug;
  @override
  final num percent;
  @override
  final int lessonsCompleted;
  @override
  final int lessonsTotal;
  @override
  final DateTime lastSeenAt;
  @override
  final String lastSeenLessonId;

  factory _$ContinueWatchingItem([
    void Function(ContinueWatchingItemBuilder)? updates,
  ]) => (ContinueWatchingItemBuilder()..update(updates))._build();

  _$ContinueWatchingItem._({
    required this.courseId,
    required this.courseTitle,
    this.librarySlug,
    required this.percent,
    required this.lessonsCompleted,
    required this.lessonsTotal,
    required this.lastSeenAt,
    required this.lastSeenLessonId,
  }) : super._();
  @override
  ContinueWatchingItem rebuild(
    void Function(ContinueWatchingItemBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  ContinueWatchingItemBuilder toBuilder() =>
      ContinueWatchingItemBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ContinueWatchingItem &&
        courseId == other.courseId &&
        courseTitle == other.courseTitle &&
        librarySlug == other.librarySlug &&
        percent == other.percent &&
        lessonsCompleted == other.lessonsCompleted &&
        lessonsTotal == other.lessonsTotal &&
        lastSeenAt == other.lastSeenAt &&
        lastSeenLessonId == other.lastSeenLessonId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, courseId.hashCode);
    _$hash = $jc(_$hash, courseTitle.hashCode);
    _$hash = $jc(_$hash, librarySlug.hashCode);
    _$hash = $jc(_$hash, percent.hashCode);
    _$hash = $jc(_$hash, lessonsCompleted.hashCode);
    _$hash = $jc(_$hash, lessonsTotal.hashCode);
    _$hash = $jc(_$hash, lastSeenAt.hashCode);
    _$hash = $jc(_$hash, lastSeenLessonId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ContinueWatchingItem')
          ..add('courseId', courseId)
          ..add('courseTitle', courseTitle)
          ..add('librarySlug', librarySlug)
          ..add('percent', percent)
          ..add('lessonsCompleted', lessonsCompleted)
          ..add('lessonsTotal', lessonsTotal)
          ..add('lastSeenAt', lastSeenAt)
          ..add('lastSeenLessonId', lastSeenLessonId))
        .toString();
  }
}

class ContinueWatchingItemBuilder
    implements Builder<ContinueWatchingItem, ContinueWatchingItemBuilder> {
  _$ContinueWatchingItem? _$v;

  String? _courseId;
  String? get courseId => _$this._courseId;
  set courseId(String? courseId) => _$this._courseId = courseId;

  String? _courseTitle;
  String? get courseTitle => _$this._courseTitle;
  set courseTitle(String? courseTitle) => _$this._courseTitle = courseTitle;

  String? _librarySlug;
  String? get librarySlug => _$this._librarySlug;
  set librarySlug(String? librarySlug) => _$this._librarySlug = librarySlug;

  num? _percent;
  num? get percent => _$this._percent;
  set percent(num? percent) => _$this._percent = percent;

  int? _lessonsCompleted;
  int? get lessonsCompleted => _$this._lessonsCompleted;
  set lessonsCompleted(int? lessonsCompleted) =>
      _$this._lessonsCompleted = lessonsCompleted;

  int? _lessonsTotal;
  int? get lessonsTotal => _$this._lessonsTotal;
  set lessonsTotal(int? lessonsTotal) => _$this._lessonsTotal = lessonsTotal;

  DateTime? _lastSeenAt;
  DateTime? get lastSeenAt => _$this._lastSeenAt;
  set lastSeenAt(DateTime? lastSeenAt) => _$this._lastSeenAt = lastSeenAt;

  String? _lastSeenLessonId;
  String? get lastSeenLessonId => _$this._lastSeenLessonId;
  set lastSeenLessonId(String? lastSeenLessonId) =>
      _$this._lastSeenLessonId = lastSeenLessonId;

  ContinueWatchingItemBuilder() {
    ContinueWatchingItem._defaults(this);
  }

  ContinueWatchingItemBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _courseId = $v.courseId;
      _courseTitle = $v.courseTitle;
      _librarySlug = $v.librarySlug;
      _percent = $v.percent;
      _lessonsCompleted = $v.lessonsCompleted;
      _lessonsTotal = $v.lessonsTotal;
      _lastSeenAt = $v.lastSeenAt;
      _lastSeenLessonId = $v.lastSeenLessonId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ContinueWatchingItem other) {
    _$v = other as _$ContinueWatchingItem;
  }

  @override
  void update(void Function(ContinueWatchingItemBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ContinueWatchingItem build() => _build();

  _$ContinueWatchingItem _build() {
    final _$result =
        _$v ??
        _$ContinueWatchingItem._(
          courseId: BuiltValueNullFieldError.checkNotNull(
            courseId,
            r'ContinueWatchingItem',
            'courseId',
          ),
          courseTitle: BuiltValueNullFieldError.checkNotNull(
            courseTitle,
            r'ContinueWatchingItem',
            'courseTitle',
          ),
          librarySlug: librarySlug,
          percent: BuiltValueNullFieldError.checkNotNull(
            percent,
            r'ContinueWatchingItem',
            'percent',
          ),
          lessonsCompleted: BuiltValueNullFieldError.checkNotNull(
            lessonsCompleted,
            r'ContinueWatchingItem',
            'lessonsCompleted',
          ),
          lessonsTotal: BuiltValueNullFieldError.checkNotNull(
            lessonsTotal,
            r'ContinueWatchingItem',
            'lessonsTotal',
          ),
          lastSeenAt: BuiltValueNullFieldError.checkNotNull(
            lastSeenAt,
            r'ContinueWatchingItem',
            'lastSeenAt',
          ),
          lastSeenLessonId: BuiltValueNullFieldError.checkNotNull(
            lastSeenLessonId,
            r'ContinueWatchingItem',
            'lastSeenLessonId',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
