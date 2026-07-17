//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'material_download_url_dto.g.dart';

/// Short-lived signed URL for downloading a lesson material (PDF, MD, image). Same shape as `StreamUrlDto` — the only difference is the token's internal scope claim. Issued by `issueMaterialDownloadUrl` and consumed by the browser via a transient `<a href download>`.
///
/// Properties:
/// * [url] - URL the browser should fetch. Same-origin relative path (e.g. `/api/v1/stream/materials/<id>?token=…`). Carries the signed token as the `token` query parameter so a direct `<a href download>` works without an Authorization header.
/// * [token] - Opaque signed token. Internal format is the same compact `header.payload.signature` shape as the video stream token, but the payload's scope claim differs so a video token can never be re-used to fetch a material (and vice versa). Round-trip untouched.
/// * [expiresAt] - ISO-8601 timestamp at which the token + URL stop being accepted. Default TTL is 5 minutes — clicking a download link should resolve immediately, so a long TTL is unnecessary.
@BuiltValue()
abstract class MaterialDownloadUrlDto implements Built<MaterialDownloadUrlDto, MaterialDownloadUrlDtoBuilder> {
  /// URL the browser should fetch. Same-origin relative path (e.g. `/api/v1/stream/materials/<id>?token=…`). Carries the signed token as the `token` query parameter so a direct `<a href download>` works without an Authorization header.
  @BuiltValueField(wireName: r'url')
  String get url;

  /// Opaque signed token. Internal format is the same compact `header.payload.signature` shape as the video stream token, but the payload's scope claim differs so a video token can never be re-used to fetch a material (and vice versa). Round-trip untouched.
  @BuiltValueField(wireName: r'token')
  String get token;

  /// ISO-8601 timestamp at which the token + URL stop being accepted. Default TTL is 5 minutes — clicking a download link should resolve immediately, so a long TTL is unnecessary.
  @BuiltValueField(wireName: r'expiresAt')
  DateTime get expiresAt;

  MaterialDownloadUrlDto._();

  factory MaterialDownloadUrlDto([void updates(MaterialDownloadUrlDtoBuilder b)]) = _$MaterialDownloadUrlDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MaterialDownloadUrlDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MaterialDownloadUrlDto> get serializer => _$MaterialDownloadUrlDtoSerializer();
}

class _$MaterialDownloadUrlDtoSerializer implements PrimitiveSerializer<MaterialDownloadUrlDto> {
  @override
  final Iterable<Type> types = const [MaterialDownloadUrlDto, _$MaterialDownloadUrlDto];

  @override
  final String wireName = r'MaterialDownloadUrlDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MaterialDownloadUrlDto object, {
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
    MaterialDownloadUrlDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MaterialDownloadUrlDtoBuilder result,
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
  MaterialDownloadUrlDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MaterialDownloadUrlDtoBuilder();
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

