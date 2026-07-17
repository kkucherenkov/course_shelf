// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'apply_identify_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$ApplyIdentifyRequest extends ApplyIdentifyRequest {
  @override
  final MergePolicyDto? mergePolicy;

  factory _$ApplyIdentifyRequest([
    void Function(ApplyIdentifyRequestBuilder)? updates,
  ]) => (ApplyIdentifyRequestBuilder()..update(updates))._build();

  _$ApplyIdentifyRequest._({this.mergePolicy}) : super._();
  @override
  ApplyIdentifyRequest rebuild(
    void Function(ApplyIdentifyRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  ApplyIdentifyRequestBuilder toBuilder() =>
      ApplyIdentifyRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ApplyIdentifyRequest && mergePolicy == other.mergePolicy;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, mergePolicy.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'ApplyIdentifyRequest',
    )..add('mergePolicy', mergePolicy)).toString();
  }
}

class ApplyIdentifyRequestBuilder
    implements Builder<ApplyIdentifyRequest, ApplyIdentifyRequestBuilder> {
  _$ApplyIdentifyRequest? _$v;

  MergePolicyDtoBuilder? _mergePolicy;
  MergePolicyDtoBuilder get mergePolicy =>
      _$this._mergePolicy ??= MergePolicyDtoBuilder();
  set mergePolicy(MergePolicyDtoBuilder? mergePolicy) =>
      _$this._mergePolicy = mergePolicy;

  ApplyIdentifyRequestBuilder() {
    ApplyIdentifyRequest._defaults(this);
  }

  ApplyIdentifyRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _mergePolicy = $v.mergePolicy?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ApplyIdentifyRequest other) {
    _$v = other as _$ApplyIdentifyRequest;
  }

  @override
  void update(void Function(ApplyIdentifyRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ApplyIdentifyRequest build() => _build();

  _$ApplyIdentifyRequest _build() {
    _$ApplyIdentifyRequest _$result;
    try {
      _$result =
          _$v ?? _$ApplyIdentifyRequest._(mergePolicy: _mergePolicy?.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'mergePolicy';
        _mergePolicy?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
          r'ApplyIdentifyRequest',
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
