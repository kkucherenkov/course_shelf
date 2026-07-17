// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'recently_added_item.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RecentlyAddedItem extends RecentlyAddedItem {
  @override
  final String courseId;
  @override
  final String courseTitle;
  @override
  final String? librarySlug;
  @override
  final int lessonCount;
  @override
  final int totalDurationSeconds;
  @override
  final DateTime createdAt;

  factory _$RecentlyAddedItem([
    void Function(RecentlyAddedItemBuilder)? updates,
  ]) => (RecentlyAddedItemBuilder()..update(updates))._build();

  _$RecentlyAddedItem._({
    required this.courseId,
    required this.courseTitle,
    this.librarySlug,
    required this.lessonCount,
    required this.totalDurationSeconds,
    required this.createdAt,
  }) : super._();
  @override
  RecentlyAddedItem rebuild(void Function(RecentlyAddedItemBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  RecentlyAddedItemBuilder toBuilder() =>
      RecentlyAddedItemBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RecentlyAddedItem &&
        courseId == other.courseId &&
        courseTitle == other.courseTitle &&
        librarySlug == other.librarySlug &&
        lessonCount == other.lessonCount &&
        totalDurationSeconds == other.totalDurationSeconds &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, courseId.hashCode);
    _$hash = $jc(_$hash, courseTitle.hashCode);
    _$hash = $jc(_$hash, librarySlug.hashCode);
    _$hash = $jc(_$hash, lessonCount.hashCode);
    _$hash = $jc(_$hash, totalDurationSeconds.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RecentlyAddedItem')
          ..add('courseId', courseId)
          ..add('courseTitle', courseTitle)
          ..add('librarySlug', librarySlug)
          ..add('lessonCount', lessonCount)
          ..add('totalDurationSeconds', totalDurationSeconds)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class RecentlyAddedItemBuilder
    implements Builder<RecentlyAddedItem, RecentlyAddedItemBuilder> {
  _$RecentlyAddedItem? _$v;

  String? _courseId;
  String? get courseId => _$this._courseId;
  set courseId(String? courseId) => _$this._courseId = courseId;

  String? _courseTitle;
  String? get courseTitle => _$this._courseTitle;
  set courseTitle(String? courseTitle) => _$this._courseTitle = courseTitle;

  String? _librarySlug;
  String? get librarySlug => _$this._librarySlug;
  set librarySlug(String? librarySlug) => _$this._librarySlug = librarySlug;

  int? _lessonCount;
  int? get lessonCount => _$this._lessonCount;
  set lessonCount(int? lessonCount) => _$this._lessonCount = lessonCount;

  int? _totalDurationSeconds;
  int? get totalDurationSeconds => _$this._totalDurationSeconds;
  set totalDurationSeconds(int? totalDurationSeconds) =>
      _$this._totalDurationSeconds = totalDurationSeconds;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  RecentlyAddedItemBuilder() {
    RecentlyAddedItem._defaults(this);
  }

  RecentlyAddedItemBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _courseId = $v.courseId;
      _courseTitle = $v.courseTitle;
      _librarySlug = $v.librarySlug;
      _lessonCount = $v.lessonCount;
      _totalDurationSeconds = $v.totalDurationSeconds;
      _createdAt = $v.createdAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RecentlyAddedItem other) {
    _$v = other as _$RecentlyAddedItem;
  }

  @override
  void update(void Function(RecentlyAddedItemBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RecentlyAddedItem build() => _build();

  _$RecentlyAddedItem _build() {
    final _$result =
        _$v ??
        _$RecentlyAddedItem._(
          courseId: BuiltValueNullFieldError.checkNotNull(
            courseId,
            r'RecentlyAddedItem',
            'courseId',
          ),
          courseTitle: BuiltValueNullFieldError.checkNotNull(
            courseTitle,
            r'RecentlyAddedItem',
            'courseTitle',
          ),
          librarySlug: librarySlug,
          lessonCount: BuiltValueNullFieldError.checkNotNull(
            lessonCount,
            r'RecentlyAddedItem',
            'lessonCount',
          ),
          totalDurationSeconds: BuiltValueNullFieldError.checkNotNull(
            totalDurationSeconds,
            r'RecentlyAddedItem',
            'totalDurationSeconds',
          ),
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'RecentlyAddedItem',
            'createdAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
