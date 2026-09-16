// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'model_weight_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ModelWeightDto extends ModelWeightDto {
  @override
  final String filename;
  @override
  final int sizeBytes;
  @override
  final bool usableForQuizGeneration;

  factory _$ModelWeightDto([void Function(ModelWeightDtoBuilder)? updates]) =>
      (ModelWeightDtoBuilder()..update(updates))._build();

  _$ModelWeightDto._({
    required this.filename,
    required this.sizeBytes,
    required this.usableForQuizGeneration,
  }) : super._();
  @override
  ModelWeightDto rebuild(void Function(ModelWeightDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ModelWeightDtoBuilder toBuilder() => ModelWeightDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ModelWeightDto &&
        filename == other.filename &&
        sizeBytes == other.sizeBytes &&
        usableForQuizGeneration == other.usableForQuizGeneration;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, filename.hashCode);
    _$hash = $jc(_$hash, sizeBytes.hashCode);
    _$hash = $jc(_$hash, usableForQuizGeneration.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ModelWeightDto')
          ..add('filename', filename)
          ..add('sizeBytes', sizeBytes)
          ..add('usableForQuizGeneration', usableForQuizGeneration))
        .toString();
  }
}

class ModelWeightDtoBuilder
    implements Builder<ModelWeightDto, ModelWeightDtoBuilder> {
  _$ModelWeightDto? _$v;

  String? _filename;
  String? get filename => _$this._filename;
  set filename(String? filename) => _$this._filename = filename;

  int? _sizeBytes;
  int? get sizeBytes => _$this._sizeBytes;
  set sizeBytes(int? sizeBytes) => _$this._sizeBytes = sizeBytes;

  bool? _usableForQuizGeneration;
  bool? get usableForQuizGeneration => _$this._usableForQuizGeneration;
  set usableForQuizGeneration(bool? usableForQuizGeneration) =>
      _$this._usableForQuizGeneration = usableForQuizGeneration;

  ModelWeightDtoBuilder() {
    ModelWeightDto._defaults(this);
  }

  ModelWeightDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _filename = $v.filename;
      _sizeBytes = $v.sizeBytes;
      _usableForQuizGeneration = $v.usableForQuizGeneration;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ModelWeightDto other) {
    _$v = other as _$ModelWeightDto;
  }

  @override
  void update(void Function(ModelWeightDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ModelWeightDto build() => _build();

  _$ModelWeightDto _build() {
    final _$result =
        _$v ??
        _$ModelWeightDto._(
          filename: BuiltValueNullFieldError.checkNotNull(
            filename,
            r'ModelWeightDto',
            'filename',
          ),
          sizeBytes: BuiltValueNullFieldError.checkNotNull(
            sizeBytes,
            r'ModelWeightDto',
            'sizeBytes',
          ),
          usableForQuizGeneration: BuiltValueNullFieldError.checkNotNull(
            usableForQuizGeneration,
            r'ModelWeightDto',
            'usableForQuizGeneration',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
