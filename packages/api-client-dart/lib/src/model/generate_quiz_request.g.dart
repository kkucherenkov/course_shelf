// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'generate_quiz_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$GenerateQuizRequest extends GenerateQuizRequest {
  @override
  final String? modelId;
  @override
  final bool? cleanupEnabled;

  factory _$GenerateQuizRequest([
    void Function(GenerateQuizRequestBuilder)? updates,
  ]) => (GenerateQuizRequestBuilder()..update(updates))._build();

  _$GenerateQuizRequest._({this.modelId, this.cleanupEnabled}) : super._();
  @override
  GenerateQuizRequest rebuild(
    void Function(GenerateQuizRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  GenerateQuizRequestBuilder toBuilder() =>
      GenerateQuizRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is GenerateQuizRequest &&
        modelId == other.modelId &&
        cleanupEnabled == other.cleanupEnabled;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, modelId.hashCode);
    _$hash = $jc(_$hash, cleanupEnabled.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'GenerateQuizRequest')
          ..add('modelId', modelId)
          ..add('cleanupEnabled', cleanupEnabled))
        .toString();
  }
}

class GenerateQuizRequestBuilder
    implements Builder<GenerateQuizRequest, GenerateQuizRequestBuilder> {
  _$GenerateQuizRequest? _$v;

  String? _modelId;
  String? get modelId => _$this._modelId;
  set modelId(String? modelId) => _$this._modelId = modelId;

  bool? _cleanupEnabled;
  bool? get cleanupEnabled => _$this._cleanupEnabled;
  set cleanupEnabled(bool? cleanupEnabled) =>
      _$this._cleanupEnabled = cleanupEnabled;

  GenerateQuizRequestBuilder() {
    GenerateQuizRequest._defaults(this);
  }

  GenerateQuizRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _modelId = $v.modelId;
      _cleanupEnabled = $v.cleanupEnabled;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(GenerateQuizRequest other) {
    _$v = other as _$GenerateQuizRequest;
  }

  @override
  void update(void Function(GenerateQuizRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  GenerateQuizRequest build() => _build();

  _$GenerateQuizRequest _build() {
    final _$result =
        _$v ??
        _$GenerateQuizRequest._(
          modelId: modelId,
          cleanupEnabled: cleanupEnabled,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
