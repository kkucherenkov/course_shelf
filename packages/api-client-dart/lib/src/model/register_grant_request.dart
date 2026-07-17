//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/grant_target.dart';
import 'package:app_api_client/src/model/grant_level.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'register_grant_request.g.dart';

/// Payload for issuing a new access grant.
///
/// Properties:
/// * [userId] - Better Auth user id of the grantee.
/// * [target] 
/// * [level] 
@BuiltValue()
abstract class RegisterGrantRequest implements Built<RegisterGrantRequest, RegisterGrantRequestBuilder> {
  /// Better Auth user id of the grantee.
  @BuiltValueField(wireName: r'userId')
  String get userId;

  @BuiltValueField(wireName: r'target')
  GrantTarget get target;

  @BuiltValueField(wireName: r'level')
  GrantLevel get level;
  // enum levelEnum {  READ,  };

  RegisterGrantRequest._();

  factory RegisterGrantRequest([void updates(RegisterGrantRequestBuilder b)]) = _$RegisterGrantRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RegisterGrantRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RegisterGrantRequest> get serializer => _$RegisterGrantRequestSerializer();
}

class _$RegisterGrantRequestSerializer implements PrimitiveSerializer<RegisterGrantRequest> {
  @override
  final Iterable<Type> types = const [RegisterGrantRequest, _$RegisterGrantRequest];

  @override
  final String wireName = r'RegisterGrantRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RegisterGrantRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
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
  }

  @override
  Object serialize(
    Serializers serializers,
    RegisterGrantRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required RegisterGrantRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
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
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RegisterGrantRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RegisterGrantRequestBuilder();
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

