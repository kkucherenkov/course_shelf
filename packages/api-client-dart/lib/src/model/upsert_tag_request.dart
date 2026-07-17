//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/external_id_ref.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'upsert_tag_request.g.dart';

/// Payload for creating or updating a tag.
///
/// Properties:
/// * [displayName] - Human-readable tag name.
/// * [slug] - URL-safe slug. Auto-generated from `displayName` when omitted.
/// * [category] 
/// * [externalIds] - External system references for this tag.
@BuiltValue()
abstract class UpsertTagRequest implements Built<UpsertTagRequest, UpsertTagRequestBuilder> {
  /// Human-readable tag name.
  @BuiltValueField(wireName: r'displayName')
  String get displayName;

  /// URL-safe slug. Auto-generated from `displayName` when omitted.
  @BuiltValueField(wireName: r'slug')
  String? get slug;

  @BuiltValueField(wireName: r'category')
  String? get category;

  /// External system references for this tag.
  @BuiltValueField(wireName: r'externalIds')
  BuiltList<ExternalIdRef>? get externalIds;

  UpsertTagRequest._();

  factory UpsertTagRequest([void updates(UpsertTagRequestBuilder b)]) = _$UpsertTagRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpsertTagRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpsertTagRequest> get serializer => _$UpsertTagRequestSerializer();
}

class _$UpsertTagRequestSerializer implements PrimitiveSerializer<UpsertTagRequest> {
  @override
  final Iterable<Type> types = const [UpsertTagRequest, _$UpsertTagRequest];

  @override
  final String wireName = r'UpsertTagRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpsertTagRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'displayName';
    yield serializers.serialize(
      object.displayName,
      specifiedType: const FullType(String),
    );
    if (object.slug != null) {
      yield r'slug';
      yield serializers.serialize(
        object.slug,
        specifiedType: const FullType(String),
      );
    }
    if (object.category != null) {
      yield r'category';
      yield serializers.serialize(
        object.category,
        specifiedType: const FullType.nullable(String),
      );
    }
    if (object.externalIds != null) {
      yield r'externalIds';
      yield serializers.serialize(
        object.externalIds,
        specifiedType: const FullType(BuiltList, [FullType(ExternalIdRef)]),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpsertTagRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpsertTagRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'displayName':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.displayName = valueDes;
          break;
        case r'slug':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.slug = valueDes;
          break;
        case r'category':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType.nullable(String),
          ) as String?;
          if (valueDes == null) continue;
          result.category = valueDes;
          break;
        case r'externalIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ExternalIdRef)]),
          ) as BuiltList<ExternalIdRef>;
          result.externalIds.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpsertTagRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpsertTagRequestBuilder();
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

