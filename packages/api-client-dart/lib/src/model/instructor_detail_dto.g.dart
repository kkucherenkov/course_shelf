// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'instructor_detail_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$InstructorDetailDto extends InstructorDetailDto {
  @override
  final InstructorDto instructor;
  @override
  final BuiltList<CourseDto> courses;
  @override
  final int coursesTotal;

  factory _$InstructorDetailDto([
    void Function(InstructorDetailDtoBuilder)? updates,
  ]) => (InstructorDetailDtoBuilder()..update(updates))._build();

  _$InstructorDetailDto._({
    required this.instructor,
    required this.courses,
    required this.coursesTotal,
  }) : super._();
  @override
  InstructorDetailDto rebuild(
    void Function(InstructorDetailDtoBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  InstructorDetailDtoBuilder toBuilder() =>
      InstructorDetailDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is InstructorDetailDto &&
        instructor == other.instructor &&
        courses == other.courses &&
        coursesTotal == other.coursesTotal;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, instructor.hashCode);
    _$hash = $jc(_$hash, courses.hashCode);
    _$hash = $jc(_$hash, coursesTotal.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'InstructorDetailDto')
          ..add('instructor', instructor)
          ..add('courses', courses)
          ..add('coursesTotal', coursesTotal))
        .toString();
  }
}

class InstructorDetailDtoBuilder
    implements Builder<InstructorDetailDto, InstructorDetailDtoBuilder> {
  _$InstructorDetailDto? _$v;

  InstructorDtoBuilder? _instructor;
  InstructorDtoBuilder get instructor =>
      _$this._instructor ??= InstructorDtoBuilder();
  set instructor(InstructorDtoBuilder? instructor) =>
      _$this._instructor = instructor;

  ListBuilder<CourseDto>? _courses;
  ListBuilder<CourseDto> get courses =>
      _$this._courses ??= ListBuilder<CourseDto>();
  set courses(ListBuilder<CourseDto>? courses) => _$this._courses = courses;

  int? _coursesTotal;
  int? get coursesTotal => _$this._coursesTotal;
  set coursesTotal(int? coursesTotal) => _$this._coursesTotal = coursesTotal;

  InstructorDetailDtoBuilder() {
    InstructorDetailDto._defaults(this);
  }

  InstructorDetailDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _instructor = $v.instructor.toBuilder();
      _courses = $v.courses.toBuilder();
      _coursesTotal = $v.coursesTotal;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(InstructorDetailDto other) {
    _$v = other as _$InstructorDetailDto;
  }

  @override
  void update(void Function(InstructorDetailDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  InstructorDetailDto build() => _build();

  _$InstructorDetailDto _build() {
    _$InstructorDetailDto _$result;
    try {
      _$result =
          _$v ??
          _$InstructorDetailDto._(
            instructor: instructor.build(),
            courses: courses.build(),
            coursesTotal: BuiltValueNullFieldError.checkNotNull(
              coursesTotal,
              r'InstructorDetailDto',
              'coursesTotal',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'instructor';
        instructor.build();
        _$failedField = 'courses';
        courses.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'InstructorDetailDto',
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
