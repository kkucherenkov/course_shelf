// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'tag_detail_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$TagDetailDto extends TagDetailDto {
  @override
  final TagDto tag;
  @override
  final BuiltList<CourseDto> courses;
  @override
  final int coursesTotal;

  factory _$TagDetailDto([void Function(TagDetailDtoBuilder)? updates]) =>
      (TagDetailDtoBuilder()..update(updates))._build();

  _$TagDetailDto._({
    required this.tag,
    required this.courses,
    required this.coursesTotal,
  }) : super._();
  @override
  TagDetailDto rebuild(void Function(TagDetailDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TagDetailDtoBuilder toBuilder() => TagDetailDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TagDetailDto &&
        tag == other.tag &&
        courses == other.courses &&
        coursesTotal == other.coursesTotal;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, tag.hashCode);
    _$hash = $jc(_$hash, courses.hashCode);
    _$hash = $jc(_$hash, coursesTotal.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'TagDetailDto')
          ..add('tag', tag)
          ..add('courses', courses)
          ..add('coursesTotal', coursesTotal))
        .toString();
  }
}

class TagDetailDtoBuilder
    implements Builder<TagDetailDto, TagDetailDtoBuilder> {
  _$TagDetailDto? _$v;

  TagDtoBuilder? _tag;
  TagDtoBuilder get tag => _$this._tag ??= TagDtoBuilder();
  set tag(TagDtoBuilder? tag) => _$this._tag = tag;

  ListBuilder<CourseDto>? _courses;
  ListBuilder<CourseDto> get courses =>
      _$this._courses ??= ListBuilder<CourseDto>();
  set courses(ListBuilder<CourseDto>? courses) => _$this._courses = courses;

  int? _coursesTotal;
  int? get coursesTotal => _$this._coursesTotal;
  set coursesTotal(int? coursesTotal) => _$this._coursesTotal = coursesTotal;

  TagDetailDtoBuilder() {
    TagDetailDto._defaults(this);
  }

  TagDetailDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _tag = $v.tag.toBuilder();
      _courses = $v.courses.toBuilder();
      _coursesTotal = $v.coursesTotal;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TagDetailDto other) {
    _$v = other as _$TagDetailDto;
  }

  @override
  void update(void Function(TagDetailDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TagDetailDto build() => _build();

  _$TagDetailDto _build() {
    _$TagDetailDto _$result;
    try {
      _$result =
          _$v ??
          _$TagDetailDto._(
            tag: tag.build(),
            courses: courses.build(),
            coursesTotal: BuiltValueNullFieldError.checkNotNull(
              coursesTotal,
              r'TagDetailDto',
              'coursesTotal',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'tag';
        tag.build();
        _$failedField = 'courses';
        courses.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'TagDetailDto',
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
