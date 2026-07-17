// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'search_lesson_hit.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SearchLessonHit extends SearchLessonHit {
  @override
  final String id;
  @override
  final String courseId;
  @override
  final String courseTitle;
  @override
  final String sectionTitle;
  @override
  final String title;
  @override
  final int position;

  factory _$SearchLessonHit([void Function(SearchLessonHitBuilder)? updates]) =>
      (SearchLessonHitBuilder()..update(updates))._build();

  _$SearchLessonHit._({
    required this.id,
    required this.courseId,
    required this.courseTitle,
    required this.sectionTitle,
    required this.title,
    required this.position,
  }) : super._();
  @override
  SearchLessonHit rebuild(void Function(SearchLessonHitBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SearchLessonHitBuilder toBuilder() => SearchLessonHitBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SearchLessonHit &&
        id == other.id &&
        courseId == other.courseId &&
        courseTitle == other.courseTitle &&
        sectionTitle == other.sectionTitle &&
        title == other.title &&
        position == other.position;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, courseId.hashCode);
    _$hash = $jc(_$hash, courseTitle.hashCode);
    _$hash = $jc(_$hash, sectionTitle.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, position.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SearchLessonHit')
          ..add('id', id)
          ..add('courseId', courseId)
          ..add('courseTitle', courseTitle)
          ..add('sectionTitle', sectionTitle)
          ..add('title', title)
          ..add('position', position))
        .toString();
  }
}

class SearchLessonHitBuilder
    implements Builder<SearchLessonHit, SearchLessonHitBuilder> {
  _$SearchLessonHit? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _courseId;
  String? get courseId => _$this._courseId;
  set courseId(String? courseId) => _$this._courseId = courseId;

  String? _courseTitle;
  String? get courseTitle => _$this._courseTitle;
  set courseTitle(String? courseTitle) => _$this._courseTitle = courseTitle;

  String? _sectionTitle;
  String? get sectionTitle => _$this._sectionTitle;
  set sectionTitle(String? sectionTitle) => _$this._sectionTitle = sectionTitle;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  int? _position;
  int? get position => _$this._position;
  set position(int? position) => _$this._position = position;

  SearchLessonHitBuilder() {
    SearchLessonHit._defaults(this);
  }

  SearchLessonHitBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _courseId = $v.courseId;
      _courseTitle = $v.courseTitle;
      _sectionTitle = $v.sectionTitle;
      _title = $v.title;
      _position = $v.position;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SearchLessonHit other) {
    _$v = other as _$SearchLessonHit;
  }

  @override
  void update(void Function(SearchLessonHitBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SearchLessonHit build() => _build();

  _$SearchLessonHit _build() {
    final _$result =
        _$v ??
        _$SearchLessonHit._(
          id: BuiltValueNullFieldError.checkNotNull(
            id,
            r'SearchLessonHit',
            'id',
          ),
          courseId: BuiltValueNullFieldError.checkNotNull(
            courseId,
            r'SearchLessonHit',
            'courseId',
          ),
          courseTitle: BuiltValueNullFieldError.checkNotNull(
            courseTitle,
            r'SearchLessonHit',
            'courseTitle',
          ),
          sectionTitle: BuiltValueNullFieldError.checkNotNull(
            sectionTitle,
            r'SearchLessonHit',
            'sectionTitle',
          ),
          title: BuiltValueNullFieldError.checkNotNull(
            title,
            r'SearchLessonHit',
            'title',
          ),
          position: BuiltValueNullFieldError.checkNotNull(
            position,
            r'SearchLessonHit',
            'position',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
