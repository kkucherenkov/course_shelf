//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/grant_target.dart';
import 'package:app_api_client/src/model/grant_level.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'access_grant_dto.g.dart';

/// A single access grant issued by an admin.
///
/// Properties:
/// * [id] - Server-generated cuid identifying this grant.
/// * [userId] - Better Auth user id of the grantee.
/// * [target] 
/// * [level] 
/// * [createdAt] - ISO-8601 instant when the grant was created.
@BuiltValue()
abstract class AccessGrantDto implements Built<AccessGrantDto, AccessGrantDtoBuilder> {
  /// Server-generated cuid identifying this grant.
  @BuiltValueField(wireName: r'id')
  String get id;

  /// Better Auth user id of the grantee.
  @BuiltValueField(wireName: r'userId')
  String get userId;

  @BuiltValueField(wireName: r'target')
  GrantTarget get target;

  @BuiltValueField(wireName: r'level')
  GrantLevel get level;
  // enum levelEnum {  READ,  };

  /// ISO-8601 instant when the grant was created.
  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  AccessGrantDto._();

  factory AccessGrantDto([void updates(AccessGrantDtoBuilder b)]) = _$AccessGrantDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(AccessGrantDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<AccessGrantDto> get serializer => _$AccessGrantDtoSerializer();
}

class _$AccessGrantDtoSerializer implements PrimitiveSerializer<AccessGrantDto> {
  @override
  final Iterable<Type> types = const [AccessGrantDto, _$AccessGrantDto];

  @override
  final String wireName = r'AccessGrantDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    AccessGrantDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'userId';
    yield serializers.serialize(
      object.userId,
      specifiedType: const FullType(String),
    );
    yield r'target';
    yield serializers.serialize(
      object.target,
      specifiedType: const FullType(GrantTarget),
    );
    yield r'level';
    yield serializers.serialize(
      object.level,
      specifiedType: const FullType(GrantLevel),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    AccessGrantDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required AccessGrantDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'userId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.userId = valueDes;
          break;
        case r'target':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(GrantTarget),
          ) as GrantTarget;
          result.target.replace(valueDes);
          break;
        case r'level':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(GrantLevel),
          ) as GrantLevel;
          result.level = valueDes;
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  AccessGrantDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = AccessGrantDtoBuilder();
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

