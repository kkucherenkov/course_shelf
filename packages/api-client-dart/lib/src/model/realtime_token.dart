//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'realtime_token.g.dart';

/// RealtimeToken
///
/// Properties:
/// * [token] - Short-lived HMAC-signed JWT for Centrifugo
/// * [expiresAt] - ISO-8601 instant when the token expires
@BuiltValue()
abstract class RealtimeToken implements Built<RealtimeToken, RealtimeTokenBuilder> {
  /// Short-lived HMAC-signed JWT for Centrifugo
  @BuiltValueField(wireName: r'token')
  String? get token;

  /// ISO-8601 instant when the token expires
  @BuiltValueField(wireName: r'expiresAt')
  DateTime? get expiresAt;

  RealtimeToken._();

  factory RealtimeToken([void updates(RealtimeTokenBuilder b)]) = _$RealtimeToken;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(RealtimeTokenBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<RealtimeToken> get serializer => _$RealtimeTokenSerializer();
}

class _$RealtimeTokenSerializer implements PrimitiveSerializer<RealtimeToken> {
  @override
  final Iterable<Type> types = const [RealtimeToken, _$RealtimeToken];

  @override
  final String wireName = r'RealtimeToken';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    RealtimeToken object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'token';
    yield object.token == null ? null : serializers.serialize(
      object.token,
      specifiedType: const FullType.nullable(String),
    );
    yield r'expiresAt';
    yield object.expiresAt == null ? null : serializers.serialize(
      object.expiresAt,
      specifiedType: const FullType.nullable(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    RealtimeToken object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required RealtimeTokenBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'token':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.token = valueDes;
          break;
        case r'expiresAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(DateTime),
          ) as DateTime?;
          if (valueDes == null) continue;
          result.expiresAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  RealtimeToken deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = RealtimeTokenBuilder();
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

