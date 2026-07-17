// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'register_library_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$RegisterLibraryRequest extends RegisterLibraryRequest {
  @override
  final String name;
  @override
  final String rootPath;

  factory _$RegisterLibraryRequest([
    void Function(RegisterLibraryRequestBuilder)? updates,
  ]) => (RegisterLibraryRequestBuilder()..update(updates))._build();

  _$RegisterLibraryRequest._({required this.name, required this.rootPath})
    : super._();
  @override
  RegisterLibraryRequest rebuild(
    void Function(RegisterLibraryRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  RegisterLibraryRequestBuilder toBuilder() =>
      RegisterLibraryRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is RegisterLibraryRequest &&
        name == other.name &&
        rootPath == other.rootPath;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, rootPath.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'RegisterLibraryRequest')
          ..add('name', name)
          ..add('rootPath', rootPath))
        .toString();
  }
}

class RegisterLibraryRequestBuilder
    implements Builder<RegisterLibraryRequest, RegisterLibraryRequestBuilder> {
  _$RegisterLibraryRequest? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _rootPath;
  String? get rootPath => _$this._rootPath;
  set rootPath(String? rootPath) => _$this._rootPath = rootPath;

  RegisterLibraryRequestBuilder() {
    RegisterLibraryRequest._defaults(this);
  }

  RegisterLibraryRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _name = $v.name;
      _rootPath = $v.rootPath;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(RegisterLibraryRequest other) {
    _$v = other as _$RegisterLibraryRequest;
  }

  @override
  void update(void Function(RegisterLibraryRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  RegisterLibraryRequest build() => _build();

  _$RegisterLibraryRequest _build() {
    final _$result =
        _$v ??
        _$RegisterLibraryRequest._(
          name: BuiltValueNullFieldError.checkNotNull(
            name,
            r'RegisterLibraryRequest',
            'name',
          ),
          rootPath: BuiltValueNullFieldError.checkNotNull(
            rootPath,
            r'RegisterLibraryRequest',
            'rootPath',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
