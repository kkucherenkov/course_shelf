// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'search_result_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$SearchResultDto extends SearchResultDto {
  @override
  final String query;
  @override
  final BuiltList<SearchCourseHit> courses;
  @override
  final BuiltList<SearchLessonHit> lessons;

  factory _$SearchResultDto([void Function(SearchResultDtoBuilder)? updates]) =>
      (SearchResultDtoBuilder()..update(updates))._build();

  _$SearchResultDto._({
    required this.query,
    required this.courses,
    required this.lessons,
  }) : super._();
  @override
  SearchResultDto rebuild(void Function(SearchResultDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  SearchResultDtoBuilder toBuilder() => SearchResultDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is SearchResultDto &&
        query == other.query &&
        courses == other.courses &&
        lessons == other.lessons;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, query.hashCode);
    _$hash = $jc(_$hash, courses.hashCode);
    _$hash = $jc(_$hash, lessons.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'SearchResultDto')
          ..add('query', query)
          ..add('courses', courses)
          ..add('lessons', lessons))
        .toString();
  }
}

class SearchResultDtoBuilder
    implements Builder<SearchResultDto, SearchResultDtoBuilder> {
  _$SearchResultDto? _$v;

  String? _query;
  String? get query => _$this._query;
  set query(String? query) => _$this._query = query;

  ListBuilder<SearchCourseHit>? _courses;
  ListBuilder<SearchCourseHit> get courses =>
      _$this._courses ??= ListBuilder<SearchCourseHit>();
  set courses(ListBuilder<SearchCourseHit>? courses) =>
      _$this._courses = courses;

  ListBuilder<SearchLessonHit>? _lessons;
  ListBuilder<SearchLessonHit> get lessons =>
      _$this._lessons ??= ListBuilder<SearchLessonHit>();
  set lessons(ListBuilder<SearchLessonHit>? lessons) =>
      _$this._lessons = lessons;

  SearchResultDtoBuilder() {
    SearchResultDto._defaults(this);
  }

  SearchResultDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _query = $v.query;
      _courses = $v.courses.toBuilder();
      _lessons = $v.lessons.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(SearchResultDto other) {
    _$v = other as _$SearchResultDto;
  }

  @override
  void update(void Function(SearchResultDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  SearchResultDto build() => _build();

  _$SearchResultDto _build() {
    _$SearchResultDto _$result;
    try {
      _$result =
          _$v ??
          _$SearchResultDto._(
            query: BuiltValueNullFieldError.checkNotNull(
              query,
              r'SearchResultDto',
              'query',
            ),
            courses: courses.build(),
            lessons: lessons.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'courses';
        courses.build();
        _$failedField = 'lessons';
        lessons.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'SearchResultDto',
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
