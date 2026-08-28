//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'backup_created_dto.g.dart';

/// A completed metadata-database snapshot plus the short-lived signed URL for downloading it. Shaped after `MaterialDownloadUrlDto` — the extra fields describe the archive itself so the caller can show what it got without a second request.
///
/// Properties:
/// * [id] - Identifier of the archive on the server. Unguessable on its own, but possession of the id is not sufficient to download — the signed token is still required.
/// * [createdAt] - When the dump completed.
/// * [sizeBytes] - Size of the archive on disk, in bytes.
/// * [url] - Same-origin relative path carrying the signed token as the `token` query parameter, so a plain `<a href download>` works without an Authorization header. This route is intentionally absent from this specification (opaque byte stream).
/// * [token] - Opaque signed token. Same compact `header.payload.signature` shape as the streaming tokens, but signed with a key derived under a different HKDF info string, so a stream token can never be replayed against a backup and vice versa. Round-trip untouched.
/// * [expiresAt] - When the token stops being accepted. The archive stays on disk after this moment — expiry revokes the link, not the file.
@BuiltValue()
abstract class BackupCreatedDto implements Built<BackupCreatedDto, BackupCreatedDtoBuilder> {
  /// Identifier of the archive on the server. Unguessable on its own, but possession of the id is not sufficient to download — the signed token is still required.
  @BuiltValueField(wireName: r'id')
  String get id;

  /// When the dump completed.
  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  /// Size of the archive on disk, in bytes.
  @BuiltValueField(wireName: r'sizeBytes')
  int get sizeBytes;

  /// Same-origin relative path carrying the signed token as the `token` query parameter, so a plain `<a href download>` works without an Authorization header. This route is intentionally absent from this specification (opaque byte stream).
  @BuiltValueField(wireName: r'url')
  String get url;

  /// Opaque signed token. Same compact `header.payload.signature` shape as the streaming tokens, but signed with a key derived under a different HKDF info string, so a stream token can never be replayed against a backup and vice versa. Round-trip untouched.
  @BuiltValueField(wireName: r'token')
  String get token;

  /// When the token stops being accepted. The archive stays on disk after this moment — expiry revokes the link, not the file.
  @BuiltValueField(wireName: r'expiresAt')
  DateTime get expiresAt;

  BackupCreatedDto._();

  factory BackupCreatedDto([void updates(BackupCreatedDtoBuilder b)]) = _$BackupCreatedDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BackupCreatedDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BackupCreatedDto> get serializer => _$BackupCreatedDtoSerializer();
}

class _$BackupCreatedDtoSerializer implements PrimitiveSerializer<BackupCreatedDto> {
  @override
  final Iterable<Type> types = const [BackupCreatedDto, _$BackupCreatedDto];

  @override
  final String wireName = r'BackupCreatedDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BackupCreatedDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    yield r'sizeBytes';
    yield serializers.serialize(
      object.sizeBytes,
      specifiedType: const FullType(int),
    );
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
    BackupCreatedDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required BackupCreatedDtoBuilder result,
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
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'sizeBytes':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.sizeBytes = valueDes;
          break;
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
  BackupCreatedDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BackupCreatedDtoBuilder();
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

