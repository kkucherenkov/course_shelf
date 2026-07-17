// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ping_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$PingResponse extends PingResponse {
  @override
  final String id;
  @override
  final String role;
  @override
  final String? displayName;

  factory _$PingResponse([void Function(PingResponseBuilder)? updates]) =>
      (PingResponseBuilder()..update(updates))._build();

  _$PingResponse._({required this.id, required this.role, this.displayName})
    : super._();
  @override
  PingResponse rebuild(void Function(PingResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  PingResponseBuilder toBuilder() => PingResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is PingResponse &&
        id == other.id &&
        role == other.role &&
        displayName == other.displayName;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'PingResponse')
          ..add('id', id)
          ..add('role', role)
          ..add('displayName', displayName))
        .toString();
  }
}

class PingResponseBuilder
    implements Builder<PingResponse, PingResponseBuilder> {
  _$PingResponse? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _role;
  String? get role => _$this._role;
  set role(String? role) => _$this._role = role;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  PingResponseBuilder() {
    PingResponse._defaults(this);
  }

  PingResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _role = $v.role;
      _displayName = $v.displayName;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(PingResponse other) {
    _$v = other as _$PingResponse;
  }

  @override
  void update(void Function(PingResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  PingResponse build() => _build();

  _$PingResponse _build() {
    final _$result =
        _$v ??
        _$PingResponse._(
          id: BuiltValueNullFieldError.checkNotNull(id, r'PingResponse', 'id'),
          role: BuiltValueNullFieldError.checkNotNull(
            role,
            r'PingResponse',
            'role',
          ),
          displayName: displayName,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
