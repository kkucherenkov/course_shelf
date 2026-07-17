// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'studio_detail_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$StudioDetailDto extends StudioDetailDto {
  @override
  final StudioDto studio;
  @override
  final BuiltList<CourseDto> courses;
  @override
  final int coursesTotal;

  factory _$StudioDetailDto([void Function(StudioDetailDtoBuilder)? updates]) =>
      (StudioDetailDtoBuilder()..update(updates))._build();

  _$StudioDetailDto._({
    required this.studio,
    required this.courses,
    required this.coursesTotal,
  }) : super._();
  @override
  StudioDetailDto rebuild(void Function(StudioDetailDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  StudioDetailDtoBuilder toBuilder() => StudioDetailDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is StudioDetailDto &&
        studio == other.studio &&
        courses == other.courses &&
        coursesTotal == other.coursesTotal;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, studio.hashCode);
    _$hash = $jc(_$hash, courses.hashCode);
    _$hash = $jc(_$hash, coursesTotal.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'StudioDetailDto')
          ..add('studio', studio)
          ..add('courses', courses)
          ..add('coursesTotal', coursesTotal))
        .toString();
  }
}

class StudioDetailDtoBuilder
    implements Builder<StudioDetailDto, StudioDetailDtoBuilder> {
  _$StudioDetailDto? _$v;

  StudioDtoBuilder? _studio;
  StudioDtoBuilder get studio => _$this._studio ??= StudioDtoBuilder();
  set studio(StudioDtoBuilder? studio) => _$this._studio = studio;

  ListBuilder<CourseDto>? _courses;
  ListBuilder<CourseDto> get courses =>
      _$this._courses ??= ListBuilder<CourseDto>();
  set courses(ListBuilder<CourseDto>? courses) => _$this._courses = courses;

  int? _coursesTotal;
  int? get coursesTotal => _$this._coursesTotal;
  set coursesTotal(int? coursesTotal) => _$this._coursesTotal = coursesTotal;

  StudioDetailDtoBuilder() {
    StudioDetailDto._defaults(this);
  }

  StudioDetailDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _studio = $v.studio.toBuilder();
      _courses = $v.courses.toBuilder();
      _coursesTotal = $v.coursesTotal;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(StudioDetailDto other) {
    _$v = other as _$StudioDetailDto;
  }

  @override
  void update(void Function(StudioDetailDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  StudioDetailDto build() => _build();

  _$StudioDetailDto _build() {
    _$StudioDetailDto _$result;
    try {
      _$result =
          _$v ??
          _$StudioDetailDto._(
            studio: studio.build(),
            courses: courses.build(),
            coursesTotal: BuiltValueNullFieldError.checkNotNull(
              coursesTotal,
              r'StudioDetailDto',
              'coursesTotal',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'studio';
        studio.build();
        _$failedField = 'courses';
        courses.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'StudioDetailDto',
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
