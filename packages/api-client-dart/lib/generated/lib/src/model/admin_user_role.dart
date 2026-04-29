//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_user_role.g.dart';

class AdminUserRole extends EnumClass {

  /// Canonical lowercase role used by the SPA. The auth backend stamps upper-case values (`'ADMIN'`, `'USER'`) in the database; this DTO normalises to lowercase at the boundary.
  @BuiltValueEnumConst(wireName: r'admin')
  static const AdminUserRole admin = _$admin;
  /// Canonical lowercase role used by the SPA. The auth backend stamps upper-case values (`'ADMIN'`, `'USER'`) in the database; this DTO normalises to lowercase at the boundary.
  @BuiltValueEnumConst(wireName: r'user')
  static const AdminUserRole user = _$user;
  /// Canonical lowercase role used by the SPA. The auth backend stamps upper-case values (`'ADMIN'`, `'USER'`) in the database; this DTO normalises to lowercase at the boundary.
  @BuiltValueEnumConst(wireName: r'guest')
  static const AdminUserRole guest = _$guest;

  static Serializer<AdminUserRole> get serializer => _$adminUserRoleSerializer;

  const AdminUserRole._(String name): super(name);

  static BuiltSet<AdminUserRole> get values => _$values;
  static AdminUserRole valueOf(String name) => _$valueOf(name);
}

/// Optionally, enum_class can generate a mixin to go with your enum for use
/// with Angular. It exposes your enum constants as getters. So, if you mix it
/// in to your Dart component class, the values become available to the
/// corresponding Angular template.
///
/// Trigger mixin generation by writing a line like this one next to your enum.
abstract class AdminUserRoleMixin = Object with _$AdminUserRoleMixin;

