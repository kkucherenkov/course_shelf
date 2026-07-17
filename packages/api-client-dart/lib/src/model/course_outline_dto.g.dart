// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'course_outline_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CourseOutlineDto extends CourseOutlineDto {
  @override
  final CourseOutlineSummary course;
  @override
  final BuiltList<SectionOutline> sections;
  @override
  final BuiltList<CourseMaterialItem> materials;

  factory _$CourseOutlineDto([
    void Function(CourseOutlineDtoBuilder)? updates,
  ]) => (CourseOutlineDtoBuilder()..update(updates))._build();

  _$CourseOutlineDto._({
    required this.course,
    required this.sections,
    required this.materials,
  }) : super._();
  @override
  CourseOutlineDto rebuild(void Function(CourseOutlineDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CourseOutlineDtoBuilder toBuilder() =>
      CourseOutlineDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CourseOutlineDto &&
        course == other.course &&
        sections == other.sections &&
        materials == other.materials;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, course.hashCode);
    _$hash = $jc(_$hash, sections.hashCode);
    _$hash = $jc(_$hash, materials.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CourseOutlineDto')
          ..add('course', course)
          ..add('sections', sections)
          ..add('materials', materials))
        .toString();
  }
}

class CourseOutlineDtoBuilder
    implements Builder<CourseOutlineDto, CourseOutlineDtoBuilder> {
  _$CourseOutlineDto? _$v;

  CourseOutlineSummaryBuilder? _course;
  CourseOutlineSummaryBuilder get course =>
      _$this._course ??= CourseOutlineSummaryBuilder();
  set course(CourseOutlineSummaryBuilder? course) => _$this._course = course;

  ListBuilder<SectionOutline>? _sections;
  ListBuilder<SectionOutline> get sections =>
      _$this._sections ??= ListBuilder<SectionOutline>();
  set sections(ListBuilder<SectionOutline>? sections) =>
      _$this._sections = sections;

  ListBuilder<CourseMaterialItem>? _materials;
  ListBuilder<CourseMaterialItem> get materials =>
      _$this._materials ??= ListBuilder<CourseMaterialItem>();
  set materials(ListBuilder<CourseMaterialItem>? materials) =>
      _$this._materials = materials;

  CourseOutlineDtoBuilder() {
    CourseOutlineDto._defaults(this);
  }

  CourseOutlineDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _course = $v.course.toBuilder();
      _sections = $v.sections.toBuilder();
      _materials = $v.materials.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CourseOutlineDto other) {
    _$v = other as _$CourseOutlineDto;
  }

  @override
  void update(void Function(CourseOutlineDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CourseOutlineDto build() => _build();

  _$CourseOutlineDto _build() {
    _$CourseOutlineDto _$result;
    try {
      _$result =
          _$v ??
          _$CourseOutlineDto._(
            course: course.build(),
            sections: sections.build(),
            materials: materials.build(),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'course';
        course.build();
        _$failedField = 'sections';
        sections.build();
        _$failedField = 'materials';
        materials.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'CourseOutlineDto',
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
