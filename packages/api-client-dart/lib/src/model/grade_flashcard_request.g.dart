// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'grade_flashcard_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$GradeFlashcardRequest extends GradeFlashcardRequest {
  @override
  final int grade;

  factory _$GradeFlashcardRequest([
    void Function(GradeFlashcardRequestBuilder)? updates,
  ]) => (GradeFlashcardRequestBuilder()..update(updates))._build();

  _$GradeFlashcardRequest._({required this.grade}) : super._();
  @override
  GradeFlashcardRequest rebuild(
    void Function(GradeFlashcardRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  GradeFlashcardRequestBuilder toBuilder() =>
      GradeFlashcardRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is GradeFlashcardRequest && grade == other.grade;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, grade.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'GradeFlashcardRequest',
    )..add('grade', grade)).toString();
  }
}

class GradeFlashcardRequestBuilder
    implements Builder<GradeFlashcardRequest, GradeFlashcardRequestBuilder> {
  _$GradeFlashcardRequest? _$v;

  int? _grade;
  int? get grade => _$this._grade;
  set grade(int? grade) => _$this._grade = grade;

  GradeFlashcardRequestBuilder() {
    GradeFlashcardRequest._defaults(this);
  }

  GradeFlashcardRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _grade = $v.grade;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(GradeFlashcardRequest other) {
    _$v = other as _$GradeFlashcardRequest;
  }

  @override
  void update(void Function(GradeFlashcardRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  GradeFlashcardRequest build() => _build();

  _$GradeFlashcardRequest _build() {
    final _$result =
        _$v ??
        _$GradeFlashcardRequest._(
          grade: BuiltValueNullFieldError.checkNotNull(
            grade,
            r'GradeFlashcardRequest',
            'grade',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
