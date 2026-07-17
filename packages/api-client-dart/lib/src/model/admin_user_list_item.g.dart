// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_user_list_item.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$AdminUserListItem extends AdminUserListItem {
  @override
  final String id;
  @override
  final String email;
  @override
  final String name;
  @override
  final String? displayName;
  @override
  final AdminUserRole role;
  @override
  final bool banned;
  @override
  final DateTime createdAt;
  @override
  final DateTime updatedAt;

  factory _$AdminUserListItem([
    void Function(AdminUserListItemBuilder)? updates,
  ]) => (AdminUserListItemBuilder()..update(updates))._build();

  _$AdminUserListItem._({
    required this.id,
    required this.email,
    required this.name,
    this.displayName,
    required this.role,
    required this.banned,
    required this.createdAt,
    required this.updatedAt,
  }) : super._();
  @override
  AdminUserListItem rebuild(void Function(AdminUserListItemBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  AdminUserListItemBuilder toBuilder() =>
      AdminUserListItemBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is AdminUserListItem &&
        id == other.id &&
        email == other.email &&
        name == other.name &&
        displayName == other.displayName &&
        role == other.role &&
        banned == other.banned &&
        createdAt == other.createdAt &&
        updatedAt == other.updatedAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, email.hashCode);
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jc(_$hash, banned.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jc(_$hash, updatedAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'AdminUserListItem')
          ..add('id', id)
          ..add('email', email)
          ..add('name', name)
          ..add('displayName', displayName)
          ..add('role', role)
          ..add('banned', banned)
          ..add('createdAt', createdAt)
          ..add('updatedAt', updatedAt))
        .toString();
  }
}

class AdminUserListItemBuilder
    implements Builder<AdminUserListItem, AdminUserListItemBuilder> {
  _$AdminUserListItem? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _email;
  String? get email => _$this._email;
  set email(String? email) => _$this._email = email;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  AdminUserRole? _role;
  AdminUserRole? get role => _$this._role;
  set role(AdminUserRole? role) => _$this._role = role;

  bool? _banned;
  bool? get banned => _$this._banned;
  set banned(bool? banned) => _$this._banned = banned;

  DateTime? _createdAt;
  DateTime? get createdAt => _$this._createdAt;
  set createdAt(DateTime? createdAt) => _$this._createdAt = createdAt;

  DateTime? _updatedAt;
  DateTime? get updatedAt => _$this._updatedAt;
  set updatedAt(DateTime? updatedAt) => _$this._updatedAt = updatedAt;

  AdminUserListItemBuilder() {
    AdminUserListItem._defaults(this);
  }

  AdminUserListItemBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _email = $v.email;
      _name = $v.name;
      _displayName = $v.displayName;
      _role = $v.role;
      _banned = $v.banned;
      _createdAt = $v.createdAt;
      _updatedAt = $v.updatedAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(AdminUserListItem other) {
    _$v = other as _$AdminUserListItem;
  }

  @override
  void update(void Function(AdminUserListItemBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  AdminUserListItem build() => _build();

  _$AdminUserListItem _build() {
    final _$result =
        _$v ??
        _$AdminUserListItem._(
          id: BuiltValueNullFieldError.checkNotNull(
            id,
            r'AdminUserListItem',
            'id',
          ),
          email: BuiltValueNullFieldError.checkNotNull(
            email,
            r'AdminUserListItem',
            'email',
          ),
          name: BuiltValueNullFieldError.checkNotNull(
            name,
            r'AdminUserListItem',
            'name',
          ),
          displayName: displayName,
          role: BuiltValueNullFieldError.checkNotNull(
            role,
            r'AdminUserListItem',
            'role',
          ),
          banned: BuiltValueNullFieldError.checkNotNull(
            banned,
            r'AdminUserListItem',
            'banned',
          ),
          createdAt: BuiltValueNullFieldError.checkNotNull(
            createdAt,
            r'AdminUserListItem',
            'createdAt',
          ),
          updatedAt: BuiltValueNullFieldError.checkNotNull(
            updatedAt,
            r'AdminUserListItem',
            'updatedAt',
          ),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
