//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'stream_url_dto.g.dart';

/// Short-lived signed URL for streaming a lesson video.
///
/// Properties:
/// * [url] - Full URL the player should request. Carries the signed token as the `token` query parameter so existing video-element implementations work without an Authorization header.
/// * [token] - Opaque signed token. Format is internal to the backend (currently a JWT-like compact form `header.payload.signature`); clients must round-trip it untouched.
/// * [expiresAt] - ISO-8601 timestamp at which the token + URL stop being accepted. Clients should request a fresh URL before this moment.
@BuiltValue()
abstract class StreamUrlDto implements Built<StreamUrlDto, StreamUrlDtoBuilder> {
  /// Full URL the player should request. Carries the signed token as the `token` query parameter so existing video-element implementations work without an Authorization header.
  @BuiltValueField(wireName: r'url')
  String get url;

  /// Opaque signed token. Format is internal to the backend (currently a JWT-like compact form `header.payload.signature`); clients must round-trip it untouched.
  @BuiltValueField(wireName: r'token')
  String get token;

  /// ISO-8601 timestamp at which the token + URL stop being accepted. Clients should request a fresh URL before this moment.
  @BuiltValueField(wireName: r'expiresAt')
  DateTime get expiresAt;

  StreamUrlDto._();

  factory StreamUrlDto([void updates(StreamUrlDtoBuilder b)]) = _$StreamUrlDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(StreamUrlDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<StreamUrlDto> get serializer => _$StreamUrlDtoSerializer();
}

class _$StreamUrlDtoSerializer implements PrimitiveSerializer<StreamUrlDto> {
  @override
  final Iterable<Type> types = const [StreamUrlDto, _$StreamUrlDto];

  @override
  final String wireName = r'StreamUrlDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    StreamUrlDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'url';
    yield serializers.serialize(
      object.url,
      specifiedType: const FullType(String),
    );
    yield r'token';
    yield serializers.serialize(
      object.token,
      specifiedType: const FullType(String),
    );
    yield r'expiresAt';
    yield serializers.serialize(
      object.expiresAt,
      specifiedType: const FullType(DateTime),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    StreamUrlDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required StreamUrlDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'url':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.url = valueDes;
          break;
        case r'token':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.token = valueDes;
          break;
        case r'expiresAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
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
  StreamUrlDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = StreamUrlDtoBuilder();
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

