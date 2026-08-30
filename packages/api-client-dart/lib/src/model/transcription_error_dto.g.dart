// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'transcription_error_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$TranscriptionErrorDto extends TranscriptionErrorDto {
  @override
  final String lessonId;
  @override
  final String message;
  @override
  final String? code;

  factory _$TranscriptionErrorDto([
    void Function(TranscriptionErrorDtoBuilder)? updates,
  ]) => (TranscriptionErrorDtoBuilder()..update(updates))._build();

  _$TranscriptionErrorDto._({
    required this.lessonId,
    required this.message,
    this.code,
  }) : super._();
  @override
  TranscriptionErrorDto rebuild(
    void Function(TranscriptionErrorDtoBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  TranscriptionErrorDtoBuilder toBuilder() =>
      TranscriptionErrorDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TranscriptionErrorDto &&
        lessonId == other.lessonId &&
        message == other.message &&
        code == other.code;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, lessonId.hashCode);
    _$hash = $jc(_$hash, message.hashCode);
    _$hash = $jc(_$hash, code.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'TranscriptionErrorDto')
          ..add('lessonId', lessonId)
          ..add('message', message)
          ..add('code', code))
        .toString();
  }
}

class TranscriptionErrorDtoBuilder
    implements Builder<TranscriptionErrorDto, TranscriptionErrorDtoBuilder> {
  _$TranscriptionErrorDto? _$v;

  String? _lessonId;
  String? get lessonId => _$this._lessonId;
  set lessonId(String? lessonId) => _$this._lessonId = lessonId;

  String? _message;
  String? get message => _$this._message;
  set message(String? message) => _$this._message = message;

  String? _code;
  String? get code => _$this._code;
  set code(String? code) => _$this._code = code;

  TranscriptionErrorDtoBuilder() {
    TranscriptionErrorDto._defaults(this);
  }

  TranscriptionErrorDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _lessonId = $v.lessonId;
      _message = $v.message;
      _code = $v.code;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TranscriptionErrorDto other) {
    _$v = other as _$TranscriptionErrorDto;
  }

  @override
  void update(void Function(TranscriptionErrorDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TranscriptionErrorDto build() => _build();

  _$TranscriptionErrorDto _build() {
    final _$result =
        _$v ??
        _$TranscriptionErrorDto._(
          lessonId: BuiltValueNullFieldError.checkNotNull(
            lessonId,
            r'TranscriptionErrorDto',
            'lessonId',
          ),
          message: BuiltValueNullFieldError.checkNotNull(
            message,
            r'TranscriptionErrorDto',
            'message',
          ),
          code: code,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
