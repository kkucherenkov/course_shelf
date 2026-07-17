//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'has_users_response.g.dart';

/// HasUsersResponse
///
/// Properties:
/// * [hasUsers] - True iff `users` table count > 0. The web SPA caches this for the session lifetime and re-checks only when the user explicitly signs out + back in. 
@BuiltValue()
abstract class HasUsersResponse implements Built<HasUsersResponse, HasUsersResponseBuilder> {
  /// True iff `users` table count > 0. The web SPA caches this for the session lifetime and re-checks only when the user explicitly signs out + back in. 
  @BuiltValueField(wireName: r'hasUsers')
  bool get hasUsers;

  HasUsersResponse._();

  factory HasUsersResponse([void updates(HasUsersResponseBuilder b)]) = _$HasUsersResponse;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(HasUsersResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<HasUsersResponse> get serializer => _$HasUsersResponseSerializer();
}

class _$HasUsersResponseSerializer implements PrimitiveSerializer<HasUsersResponse> {
  @override
  final Iterable<Type> types = const [HasUsersResponse, _$HasUsersResponse];

  @override
  final String wireName = r'HasUsersResponse';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    HasUsersResponse object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'hasUsers';
    yield serializers.serialize(
      object.hasUsers,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    HasUsersResponse object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required HasUsersResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'hasUsers':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.hasUsers = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  HasUsersResponse deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = HasUsersResponseBuilder();
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

