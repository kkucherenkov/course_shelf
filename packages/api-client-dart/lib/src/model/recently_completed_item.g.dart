// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'recently_completed_item.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RecentlyCompletedItem extends RecentlyCompletedItem {
  @override
  final String courseId;
  @override
  final String courseTitle;
  @override
  final String? librarySlug;
  @override
  final int lessonsTotal;
  @override
  final DateTime completedAt;

  factory _$RecentlyCompletedItem([
    void Function(RecentlyCompletedItemBuilder)? updates,
  ]) => (RecentlyCompletedItemBuilder()..update(updates))._build();

  _$RecentlyCompletedItem._({
    required this.courseId,
    required this.courseTitle,
    this.librarySlug,
    required this.lessonsTotal,
    required this.completedAt,
  }) : super._();
  @override
  RecentlyCompletedItem rebuild(
    void Function(RecentlyCompletedItemBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  RecentlyCompletedItemBuilder toBuilder() =>
      RecentlyCompletedItemBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RecentlyCompletedItem &&
        courseId == other.courseId &&
        courseTitle == other.courseTitle &&
        librarySlug == other.librarySlug &&
        lessonsTotal == other.lessonsTotal &&
        completedAt == other.completedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, courseId.hashCode);
    _$hash = $jc(_$hash, courseTitle.hashCode);
    _$hash = $jc(_$hash, librarySlug.hashCode);
    _$hash = $jc(_$hash, lessonsTotal.hashCode);
    _$hash = $jc(_$hash, completedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RecentlyCompletedItem')
          ..add('courseId', courseId)
          ..add('courseTitle', courseTitle)
          ..add('librarySlug', librarySlug)
          ..add('lessonsTotal', lessonsTotal)
          ..add('completedAt', completedAt))
        .toString();
  }
}

class RecentlyCompletedItemBuilder
    implements Builder<RecentlyCompletedItem, RecentlyCompletedItemBuilder> {
  _$RecentlyCompletedItem? _$v;

  String? _courseId;
  String? get courseId => _$this._courseId;
  set courseId(String? courseId) => _$this._courseId = courseId;

  String? _courseTitle;
  String? get courseTitle => _$this._courseTitle;
  set courseTitle(String? courseTitle) => _$this._courseTitle = courseTitle;

  String? _librarySlug;
  String? get librarySlug => _$this._librarySlug;
  set librarySlug(String? librarySlug) => _$this._librarySlug = librarySlug;

  int? _lessonsTotal;
  int? get lessonsTotal => _$this._lessonsTotal;
  set lessonsTotal(int? lessonsTotal) => _$this._lessonsTotal = lessonsTotal;

  DateTime? _completedAt;
  DateTime? get completedAt => _$this._completedAt;
  set completedAt(DateTime? completedAt) => _$this._completedAt = completedAt;

  RecentlyCompletedItemBuilder() {
    RecentlyCompletedItem._defaults(this);
  }

  RecentlyCompletedItemBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _courseId = $v.courseId;
      _courseTitle = $v.courseTitle;
      _librarySlug = $v.librarySlug;
      _lessonsTotal = $v.lessonsTotal;
      _completedAt = $v.completedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RecentlyCompletedItem other) {
    _$v = other as _$RecentlyCompletedItem;
  }

  @override
  void update(void Function(RecentlyCompletedItemBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RecentlyCompletedItem build() => _build();

  _$RecentlyCompletedItem _build() {
    final _$result =
        _$v ??
        _$RecentlyCompletedItem._(
          courseId: BuiltValueNullFieldError.checkNotNull(
            courseId,
            r'RecentlyCompletedItem',
            'courseId',
          ),
          courseTitle: BuiltValueNullFieldError.checkNotNull(
            courseTitle,
            r'RecentlyCompletedItem',
            'courseTitle',
          ),
          librarySlug: librarySlug,
          lessonsTotal: BuiltValueNullFieldError.checkNotNull(
            lessonsTotal,
            r'RecentlyCompletedItem',
            'lessonsTotal',
          ),
          completedAt: BuiltValueNullFieldError.checkNotNull(
            completedAt,
            r'RecentlyCompletedItem',
            'completedAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
