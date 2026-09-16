// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'quiz_list_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$QuizListDto extends QuizListDto {
  @override
  final BuiltList<QuizDto> quizzes;

  factory _$QuizListDto([void Function(QuizListDtoBuilder)? updates]) =>
      (QuizListDtoBuilder()..update(updates))._build();

  _$QuizListDto._({required this.quizzes}) : super._();
  @override
  QuizListDto rebuild(void Function(QuizListDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  QuizListDtoBuilder toBuilder() => QuizListDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is QuizListDto && quizzes == other.quizzes;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, quizzes.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'QuizListDto',
    )..add('quizzes', quizzes)).toString();
  }
}

class QuizListDtoBuilder implements Builder<QuizListDto, QuizListDtoBuilder> {
  _$QuizListDto? _$v;

  ListBuilder<QuizDto>? _quizzes;
  ListBuilder<QuizDto> get quizzes =>
      _$this._quizzes ??= ListBuilder<QuizDto>();
  set quizzes(ListBuilder<QuizDto>? quizzes) => _$this._quizzes = quizzes;

  QuizListDtoBuilder() {
    QuizListDto._defaults(this);
  }

  QuizListDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _quizzes = $v.quizzes.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(QuizListDto other) {
    _$v = other as _$QuizListDto;
  }

  @override
  void update(void Function(QuizListDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  QuizListDto build() => _build();

  _$QuizListDto _build() {
    _$QuizListDto _$result;
    try {
      _$result = _$v ?? _$QuizListDto._(quizzes: quizzes.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'quizzes';
        quizzes.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'QuizListDto',
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
