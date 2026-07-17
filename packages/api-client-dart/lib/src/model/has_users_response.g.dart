// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'has_users_response.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$HasUsersResponse extends HasUsersResponse {
  @override
  final bool hasUsers;

  factory _$HasUsersResponse([
    void Function(HasUsersResponseBuilder)? updates,
  ]) => (HasUsersResponseBuilder()..update(updates))._build();

  _$HasUsersResponse._({required this.hasUsers}) : super._();
  @override
  HasUsersResponse rebuild(void Function(HasUsersResponseBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  HasUsersResponseBuilder toBuilder() =>
      HasUsersResponseBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is HasUsersResponse && hasUsers == other.hasUsers;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, hasUsers.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
      r'HasUsersResponse',
    )..add('hasUsers', hasUsers)).toString();
  }
}

class HasUsersResponseBuilder
    implements Builder<HasUsersResponse, HasUsersResponseBuilder> {
  _$HasUsersResponse? _$v;

  bool? _hasUsers;
  bool? get hasUsers => _$this._hasUsers;
  set hasUsers(bool? hasUsers) => _$this._hasUsers = hasUsers;

  HasUsersResponseBuilder() {
    HasUsersResponse._defaults(this);
  }

  HasUsersResponseBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _hasUsers = $v.hasUsers;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(HasUsersResponse other) {
    _$v = other as _$HasUsersResponse;
  }

  @override
  void update(void Function(HasUsersResponseBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  HasUsersResponse build() => _build();

  _$HasUsersResponse _build() {
    final _$result =
        _$v ??
        _$HasUsersResponse._(
          hasUsers: BuiltValueNullFieldError.checkNotNull(
            hasUsers,
            r'HasUsersResponse',
            'hasUsers',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
