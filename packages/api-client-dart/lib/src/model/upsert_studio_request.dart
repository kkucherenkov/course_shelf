//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/external_id_ref.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'upsert_studio_request.g.dart';

/// Payload for creating or updating a studio.
///
/// Properties:
/// * [displayName] - Human-readable studio name.
/// * [slug] - URL-safe slug. Auto-generated from `displayName` when omitted.
/// * [externalIds] - External system references for this studio.
@BuiltValue()
abstract class UpsertStudioRequest implements Built<UpsertStudioRequest, UpsertStudioRequestBuilder> {
  /// Human-readable studio name.
  @BuiltValueField(wireName: r'displayName')
  String get displayName;

  /// URL-safe slug. Auto-generated from `displayName` when omitted.
  @BuiltValueField(wireName: r'slug')
  String? get slug;

  /// External system references for this studio.
  @BuiltValueField(wireName: r'externalIds')
  BuiltList<ExternalIdRef>? get externalIds;

  UpsertStudioRequest._();

  factory UpsertStudioRequest([void updates(UpsertStudioRequestBuilder b)]) = _$UpsertStudioRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpsertStudioRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpsertStudioRequest> get serializer => _$UpsertStudioRequestSerializer();
}

class _$UpsertStudioRequestSerializer implements PrimitiveSerializer<UpsertStudioRequest> {
  @override
  final Iterable<Type> types = const [UpsertStudioRequest, _$UpsertStudioRequest];

  @override
  final String wireName = r'UpsertStudioRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpsertStudioRequest object, {
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
    UpsertStudioRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpsertStudioRequestBuilder result,
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
  UpsertStudioRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpsertStudioRequestBuilder();
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

