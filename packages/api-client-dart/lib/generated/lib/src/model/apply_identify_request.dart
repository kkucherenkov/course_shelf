//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/merge_policy_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'apply_identify_request.g.dart';

/// Apply a proposed identify task, optionally overriding its merge policy.
///
/// Properties:
/// * [mergePolicy] - Overrides the policy stored on the task when present.
@BuiltValue()
abstract class ApplyIdentifyRequest implements Built<ApplyIdentifyRequest, ApplyIdentifyRequestBuilder> {
  /// Overrides the policy stored on the task when present.
  @BuiltValueField(wireName: r'mergePolicy')
  MergePolicyDto? get mergePolicy;

  ApplyIdentifyRequest._();

  factory ApplyIdentifyRequest([void updates(ApplyIdentifyRequestBuilder b)]) = _$ApplyIdentifyRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ApplyIdentifyRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ApplyIdentifyRequest> get serializer => _$ApplyIdentifyRequestSerializer();
}

class _$ApplyIdentifyRequestSerializer implements PrimitiveSerializer<ApplyIdentifyRequest> {
  @override
  final Iterable<Type> types = const [ApplyIdentifyRequest, _$ApplyIdentifyRequest];

  @override
  final String wireName = r'ApplyIdentifyRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ApplyIdentifyRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.mergePolicy != null) {
      yield r'mergePolicy';
      yield serializers.serialize(
        object.mergePolicy,
        specifiedType: const FullType(MergePolicyDto),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    ApplyIdentifyRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ApplyIdentifyRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'mergePolicy':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(MergePolicyDto),
          ) as MergePolicyDto;
          result.mergePolicy.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ApplyIdentifyRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ApplyIdentifyRequestBuilder();
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

