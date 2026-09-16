// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'quiz_generation_accepted_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$QuizGenerationAcceptedDto extends QuizGenerationAcceptedDto {
  @override
  final String courseId;
  @override
  final int lessonsQueued;

  factory _$QuizGenerationAcceptedDto([
    void Function(QuizGenerationAcceptedDtoBuilder)? updates,
  ]) => (QuizGenerationAcceptedDtoBuilder()..update(updates))._build();

  _$QuizGenerationAcceptedDto._({
    required this.courseId,
    required this.lessonsQueued,
  }) : super._();
  @override
  QuizGenerationAcceptedDto rebuild(
    void Function(QuizGenerationAcceptedDtoBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  QuizGenerationAcceptedDtoBuilder toBuilder() =>
      QuizGenerationAcceptedDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is QuizGenerationAcceptedDto &&
        courseId == other.courseId &&
        lessonsQueued == other.lessonsQueued;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, courseId.hashCode);
    _$hash = $jc(_$hash, lessonsQueued.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'QuizGenerationAcceptedDto')
          ..add('courseId', courseId)
          ..add('lessonsQueued', lessonsQueued))
        .toString();
  }
}

class QuizGenerationAcceptedDtoBuilder
    implements
        Builder<QuizGenerationAcceptedDto, QuizGenerationAcceptedDtoBuilder> {
  _$QuizGenerationAcceptedDto? _$v;

  String? _courseId;
  String? get courseId => _$this._courseId;
  set courseId(String? courseId) => _$this._courseId = courseId;

  int? _lessonsQueued;
  int? get lessonsQueued => _$this._lessonsQueued;
  set lessonsQueued(int? lessonsQueued) =>
      _$this._lessonsQueued = lessonsQueued;

  QuizGenerationAcceptedDtoBuilder() {
    QuizGenerationAcceptedDto._defaults(this);
  }

  QuizGenerationAcceptedDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _courseId = $v.courseId;
      _lessonsQueued = $v.lessonsQueued;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(QuizGenerationAcceptedDto other) {
    _$v = other as _$QuizGenerationAcceptedDto;
  }

  @override
  void update(void Function(QuizGenerationAcceptedDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  QuizGenerationAcceptedDto build() => _build();

  _$QuizGenerationAcceptedDto _build() {
    final _$result =
        _$v ??
        _$QuizGenerationAcceptedDto._(
          courseId: BuiltValueNullFieldError.checkNotNull(
            courseId,
            r'QuizGenerationAcceptedDto',
            'courseId',
          ),
          lessonsQueued: BuiltValueNullFieldError.checkNotNull(
            lessonsQueued,
            r'QuizGenerationAcceptedDto',
            'lessonsQueued',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
