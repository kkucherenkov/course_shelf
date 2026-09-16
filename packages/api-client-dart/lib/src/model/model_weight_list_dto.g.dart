// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'model_weight_list_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ModelWeightListDto extends ModelWeightListDto {
  @override
  final BuiltList<ModelWeightDto> weights;

  factory _$ModelWeightListDto([
    void Function(ModelWeightListDtoBuilder)? updates,
  ]) => (ModelWeightListDtoBuilder()..update(updates))._build();

  _$ModelWeightListDto._({required this.weights}) : super._();
  @override
  ModelWeightListDto rebuild(
    void Function(ModelWeightListDtoBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  ModelWeightListDtoBuilder toBuilder() =>
      ModelWeightListDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ModelWeightListDto && weights == other.weights;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, weights.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'ModelWeightListDto',
    )..add('weights', weights)).toString();
  }
}

class ModelWeightListDtoBuilder
    implements Builder<ModelWeightListDto, ModelWeightListDtoBuilder> {
  _$ModelWeightListDto? _$v;

  ListBuilder<ModelWeightDto>? _weights;
  ListBuilder<ModelWeightDto> get weights =>
      _$this._weights ??= ListBuilder<ModelWeightDto>();
  set weights(ListBuilder<ModelWeightDto>? weights) =>
      _$this._weights = weights;

  ModelWeightListDtoBuilder() {
    ModelWeightListDto._defaults(this);
  }

  ModelWeightListDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _weights = $v.weights.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ModelWeightListDto other) {
    _$v = other as _$ModelWeightListDto;
  }

  @override
  void update(void Function(ModelWeightListDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ModelWeightListDto build() => _build();

  _$ModelWeightListDto _build() {
    _$ModelWeightListDto _$result;
    try {
      _$result = _$v ?? _$ModelWeightListDto._(weights: weights.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'weights';
        weights.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'ModelWeightListDto',
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
