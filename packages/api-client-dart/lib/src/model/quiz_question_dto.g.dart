// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'quiz_question_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$QuizQuestionDto extends QuizQuestionDto {
  @override
  final String prompt;
  @override
  final BuiltList<String> options;
  @override
  final int correctOptionIndex;
  @override
  final int cueStartMs;

  factory _$QuizQuestionDto([void Function(QuizQuestionDtoBuilder)? updates]) =>
      (QuizQuestionDtoBuilder()..update(updates))._build();

  _$QuizQuestionDto._({
    required this.prompt,
    required this.options,
    required this.correctOptionIndex,
    required this.cueStartMs,
  }) : super._();
  @override
  QuizQuestionDto rebuild(void Function(QuizQuestionDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  QuizQuestionDtoBuilder toBuilder() => QuizQuestionDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is QuizQuestionDto &&
        prompt == other.prompt &&
        options == other.options &&
        correctOptionIndex == other.correctOptionIndex &&
        cueStartMs == other.cueStartMs;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, prompt.hashCode);
    _$hash = $jc(_$hash, options.hashCode);
    _$hash = $jc(_$hash, correctOptionIndex.hashCode);
    _$hash = $jc(_$hash, cueStartMs.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'QuizQuestionDto')
          ..add('prompt', prompt)
          ..add('options', options)
          ..add('correctOptionIndex', correctOptionIndex)
          ..add('cueStartMs', cueStartMs))
        .toString();
  }
}

class QuizQuestionDtoBuilder
    implements Builder<QuizQuestionDto, QuizQuestionDtoBuilder> {
  _$QuizQuestionDto? _$v;

  String? _prompt;
  String? get prompt => _$this._prompt;
  set prompt(String? prompt) => _$this._prompt = prompt;

  ListBuilder<String>? _options;
  ListBuilder<String> get options => _$this._options ??= ListBuilder<String>();
  set options(ListBuilder<String>? options) => _$this._options = options;

  int? _correctOptionIndex;
  int? get correctOptionIndex => _$this._correctOptionIndex;
  set correctOptionIndex(int? correctOptionIndex) =>
      _$this._correctOptionIndex = correctOptionIndex;

  int? _cueStartMs;
  int? get cueStartMs => _$this._cueStartMs;
  set cueStartMs(int? cueStartMs) => _$this._cueStartMs = cueStartMs;

  QuizQuestionDtoBuilder() {
    QuizQuestionDto._defaults(this);
  }

  QuizQuestionDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _prompt = $v.prompt;
      _options = $v.options.toBuilder();
      _correctOptionIndex = $v.correctOptionIndex;
      _cueStartMs = $v.cueStartMs;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(QuizQuestionDto other) {
    _$v = other as _$QuizQuestionDto;
  }

  @override
  void update(void Function(QuizQuestionDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  QuizQuestionDto build() => _build();

  _$QuizQuestionDto _build() {
    _$QuizQuestionDto _$result;
    try {
      _$result =
          _$v ??
          _$QuizQuestionDto._(
            prompt: BuiltValueNullFieldError.checkNotNull(
              prompt,
              r'QuizQuestionDto',
              'prompt',
            ),
            options: options.build(),
            correctOptionIndex: BuiltValueNullFieldError.checkNotNull(
              correctOptionIndex,
              r'QuizQuestionDto',
              'correctOptionIndex',
            ),
            cueStartMs: BuiltValueNullFieldError.checkNotNull(
              cueStartMs,
              r'QuizQuestionDto',
              'cueStartMs',
            ),
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'options';
        options.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'QuizQuestionDto',
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
