// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'update_library_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$UpdateLibraryRequest extends UpdateLibraryRequest {
  @override
  final String? name;

  factory _$UpdateLibraryRequest([
    void Function(UpdateLibraryRequestBuilder)? updates,
  ]) => (UpdateLibraryRequestBuilder()..update(updates))._build();

  _$UpdateLibraryRequest._({this.name}) : super._();
  @override
  UpdateLibraryRequest rebuild(
    void Function(UpdateLibraryRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  UpdateLibraryRequestBuilder toBuilder() =>
      UpdateLibraryRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is UpdateLibraryRequest && name == other.name;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'UpdateLibraryRequest',
    )..add('name', name)).toString();
  }
}

class UpdateLibraryRequestBuilder
    implements Builder<UpdateLibraryRequest, UpdateLibraryRequestBuilder> {
  _$UpdateLibraryRequest? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  UpdateLibraryRequestBuilder() {
    UpdateLibraryRequest._defaults(this);
  }

  UpdateLibraryRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _name = $v.name;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(UpdateLibraryRequest other) {
    _$v = other as _$UpdateLibraryRequest;
  }

  @override
  void update(void Function(UpdateLibraryRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  UpdateLibraryRequest build() => _build();

  _$UpdateLibraryRequest _build() {
    final _$result = _$v ?? _$UpdateLibraryRequest._(name: name);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
