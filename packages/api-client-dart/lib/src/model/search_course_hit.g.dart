// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'search_course_hit.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SearchCourseHit extends SearchCourseHit {
  @override
  final String id;
  @override
  final String libraryId;
  @override
  final String title;
  @override
  final String slug;
  @override
  final int lessonsTotal;

  factory _$SearchCourseHit([void Function(SearchCourseHitBuilder)? updates]) =>
      (SearchCourseHitBuilder()..update(updates))._build();

  _$SearchCourseHit._({
    required this.id,
    required this.libraryId,
    required this.title,
    required this.slug,
    required this.lessonsTotal,
  }) : super._();
  @override
  SearchCourseHit rebuild(void Function(SearchCourseHitBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SearchCourseHitBuilder toBuilder() => SearchCourseHitBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SearchCourseHit &&
        id == other.id &&
        libraryId == other.libraryId &&
        title == other.title &&
        slug == other.slug &&
        lessonsTotal == other.lessonsTotal;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, libraryId.hashCode);
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jc(_$hash, slug.hashCode);
    _$hash = $jc(_$hash, lessonsTotal.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SearchCourseHit')
          ..add('id', id)
          ..add('libraryId', libraryId)
          ..add('title', title)
          ..add('slug', slug)
          ..add('lessonsTotal', lessonsTotal))
        .toString();
  }
}

class SearchCourseHitBuilder
    implements Builder<SearchCourseHit, SearchCourseHitBuilder> {
  _$SearchCourseHit? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _libraryId;
  String? get libraryId => _$this._libraryId;
  set libraryId(String? libraryId) => _$this._libraryId = libraryId;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  String? _slug;
  String? get slug => _$this._slug;
  set slug(String? slug) => _$this._slug = slug;

  int? _lessonsTotal;
  int? get lessonsTotal => _$this._lessonsTotal;
  set lessonsTotal(int? lessonsTotal) => _$this._lessonsTotal = lessonsTotal;

  SearchCourseHitBuilder() {
    SearchCourseHit._defaults(this);
  }

  SearchCourseHitBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _libraryId = $v.libraryId;
      _title = $v.title;
      _slug = $v.slug;
      _lessonsTotal = $v.lessonsTotal;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SearchCourseHit other) {
    _$v = other as _$SearchCourseHit;
  }

  @override
  void update(void Function(SearchCourseHitBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SearchCourseHit build() => _build();

  _$SearchCourseHit _build() {
    final _$result =
        _$v ??
        _$SearchCourseHit._(
          id: BuiltValueNullFieldError.checkNotNull(
            id,
            r'SearchCourseHit',
            'id',
          ),
          libraryId: BuiltValueNullFieldError.checkNotNull(
            libraryId,
            r'SearchCourseHit',
            'libraryId',
          ),
          title: BuiltValueNullFieldError.checkNotNull(
            title,
            r'SearchCourseHit',
            'title',
          ),
          slug: BuiltValueNullFieldError.checkNotNull(
            slug,
            r'SearchCourseHit',
            'slug',
          ),
          lessonsTotal: BuiltValueNullFieldError.checkNotNull(
            lessonsTotal,
            r'SearchCourseHit',
            'lessonsTotal',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
