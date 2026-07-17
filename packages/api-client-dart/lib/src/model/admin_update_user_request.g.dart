// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_update_user_request.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminUpdateUserRequest extends AdminUpdateUserRequest {
  @override
  final AdminUserRole? role;
  @override
  final bool? banned;

  factory _$AdminUpdateUserRequest([
    void Function(AdminUpdateUserRequestBuilder)? updates,
  ]) => (AdminUpdateUserRequestBuilder()..update(updates))._build();

  _$AdminUpdateUserRequest._({this.role, this.banned}) : super._();
  @override
  AdminUpdateUserRequest rebuild(
    void Function(AdminUpdateUserRequestBuilder) updates,
  ) => (toBuilder()..update(updates)).build();

  @override
  AdminUpdateUserRequestBuilder toBuilder() =>
      AdminUpdateUserRequestBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminUpdateUserRequest &&
        role == other.role &&
        banned == other.banned;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jc(_$hash, banned.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminUpdateUserRequest')
          ..add('role', role)
          ..add('banned', banned))
        .toString();
  }
}

class AdminUpdateUserRequestBuilder
    implements Builder<AdminUpdateUserRequest, AdminUpdateUserRequestBuilder> {
  _$AdminUpdateUserRequest? _$v;

  AdminUserRole? _role;
  AdminUserRole? get role => _$this._role;
  set role(AdminUserRole? role) => _$this._role = role;

  bool? _banned;
  bool? get banned => _$this._banned;
  set banned(bool? banned) => _$this._banned = banned;

  AdminUpdateUserRequestBuilder() {
    AdminUpdateUserRequest._defaults(this);
  }

  AdminUpdateUserRequestBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _role = $v.role;
      _banned = $v.banned;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminUpdateUserRequest other) {
    _$v = other as _$AdminUpdateUserRequest;
  }

  @override
  void update(void Function(AdminUpdateUserRequestBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminUpdateUserRequest build() => _build();

  _$AdminUpdateUserRequest _build() {
    final _$result =
        _$v ?? _$AdminUpdateUserRequest._(role: role, banned: banned);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
