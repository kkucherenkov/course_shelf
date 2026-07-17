// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'admin_user_role.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const AdminUserRole _$admin = const AdminUserRole._('admin');
const AdminUserRole _$user = const AdminUserRole._('user');
const AdminUserRole _$guest = const AdminUserRole._('guest');

AdminUserRole _$valueOf(String name) {
  switch (name) {
    case 'admin':
      return _$admin;
    case 'user':
      return _$user;
    case 'guest':
      return _$guest;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<AdminUserRole> _$values = BuiltSet<AdminUserRole>(
  const <AdminUserRole>[_$admin, _$user, _$guest],
);

class _$AdminUserRoleMeta {
  const _$AdminUserRoleMeta();
  AdminUserRole get admin => _$admin;
  AdminUserRole get user => _$user;
  AdminUserRole get guest => _$guest;
  AdminUserRole valueOf(String name) => _$valueOf(name);
  BuiltSet<AdminUserRole> get values => _$values;
}

mixin _$AdminUserRoleMixin {
  // ignore: non_constant_identifier_names
  _$AdminUserRoleMeta get AdminUserRole => const _$AdminUserRoleMeta();
}

Serializer<AdminUserRole> _$adminUserRoleSerializer =
    _$AdminUserRoleSerializer();

class _$AdminUserRoleSerializer implements PrimitiveSerializer<AdminUserRole> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'admin': 'admin',
    'user': 'user',
    'guest': 'guest',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'admin': 'admin',
    'user': 'user',
    'guest': 'guest',
  };

  @override
  final Iterable<Type> types = const <Type>[AdminUserRole];
  @override
  final String wireName = 'AdminUserRole';

  @override
  Object serialize(
    Serializers serializers,
    AdminUserRole object, {
    FullType specifiedType = FullType.unspecified,
  }) => _toWire[object.name] ?? object.name;

  @override
  AdminUserRole deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) => AdminUserRole.valueOf(
    _fromWire[serialized] ?? (serialized is String ? serialized : ''),
  );
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
