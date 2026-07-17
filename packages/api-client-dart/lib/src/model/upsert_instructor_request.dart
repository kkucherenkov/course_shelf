//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/external_id_ref.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'upsert_instructor_request.g.dart';

/// Payload for creating or updating an instructor.
///
/// Properties:
/// * [displayName] - Human-readable name displayed in the UI.
/// * [slug] - URL-safe slug. Auto-generated from `displayName` when omitted.
/// * [externalIds] - External system references for this instructor.
@BuiltValue()
abstract class UpsertInstructorRequest implements Built<UpsertInstructorRequest, UpsertInstructorRequestBuilder> {
  /// Human-readable name displayed in the UI.
  @BuiltValueField(wireName: r'displayName')
  String get displayName;

  /// URL-safe slug. Auto-generated from `displayName` when omitted.
  @BuiltValueField(wireName: r'slug')
  String? get slug;

  /// External system references for this instructor.
  @BuiltValueField(wireName: r'externalIds')
  BuiltList<ExternalIdRef>? get externalIds;

  UpsertInstructorRequest._();

  factory UpsertInstructorRequest([void updates(UpsertInstructorRequestBuilder b)]) = _$UpsertInstructorRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpsertInstructorRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpsertInstructorRequest> get serializer => _$UpsertInstructorRequestSerializer();
}

class _$UpsertInstructorRequestSerializer implements PrimitiveSerializer<UpsertInstructorRequest> {
  @override
  final Iterable<Type> types = const [UpsertInstructorRequest, _$UpsertInstructorRequest];

  @override
  final String wireName = r'UpsertInstructorRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpsertInstructorRequest object, {
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
    UpsertInstructorRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpsertInstructorRequestBuilder result,
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
  UpsertInstructorRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpsertInstructorRequestBuilder();
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

