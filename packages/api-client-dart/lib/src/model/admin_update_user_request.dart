//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/admin_user_role.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'admin_update_user_request.g.dart';

/// Patch body for `PATCH /admin/users/{id}`. At least one field must be set — the handler returns 400 on an empty body.
///
/// Properties:
/// * [role] 
/// * [banned] 
@BuiltValue()
abstract class AdminUpdateUserRequest implements Built<AdminUpdateUserRequest, AdminUpdateUserRequestBuilder> {
  @BuiltValueField(wireName: r'role')
  AdminUserRole? get role;
  // enum roleEnum {  admin,  user,  guest,  };

  @BuiltValueField(wireName: r'banned')
  bool? get banned;

  AdminUpdateUserRequest._();

  factory AdminUpdateUserRequest([void updates(AdminUpdateUserRequestBuilder b)]) = _$AdminUpdateUserRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AdminUpdateUserRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AdminUpdateUserRequest> get serializer => _$AdminUpdateUserRequestSerializer();
}

class _$AdminUpdateUserRequestSerializer implements PrimitiveSerializer<AdminUpdateUserRequest> {
  @override
  final Iterable<Type> types = const [AdminUpdateUserRequest, _$AdminUpdateUserRequest];

  @override
  final String wireName = r'AdminUpdateUserRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AdminUpdateUserRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.role != null) {
      yield r'role';
      yield serializers.serialize(
        object.role,
        specifiedType: const FullType(AdminUserRole),
      );
    }
    if (object.banned != null) {
      yield r'banned';
      yield serializers.serialize(
        object.banned,
        specifiedType: const FullType(bool),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    AdminUpdateUserRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AdminUpdateUserRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'role':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(AdminUserRole),
          ) as AdminUserRole;
          result.role = valueDes;
          break;
        case r'banned':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.banned = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AdminUpdateUserRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AdminUpdateUserRequestBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

