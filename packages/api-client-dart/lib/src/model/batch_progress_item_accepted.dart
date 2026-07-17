//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/lesson_progress_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'batch_progress_item_accepted.g.dart';

/// BatchProgressItemAccepted
///
/// Properties:
/// * [status] - The client write was applied (or absorbed by last-write-wins with no resulting state change). `state` reflects the post-merge server state. 
/// * [state] 
@BuiltValue()
abstract class BatchProgressItemAccepted implements Built<BatchProgressItemAccepted, BatchProgressItemAcceptedBuilder> {
  /// The client write was applied (or absorbed by last-write-wins with no resulting state change). `state` reflects the post-merge server state. 
  @BuiltValueField(wireName: r'status')
  BatchProgressItemAcceptedStatusEnum get status;
  // enum statusEnum {  accepted,  };

  @BuiltValueField(wireName: r'state')
  LessonProgressDto get state;

  BatchProgressItemAccepted._();

  factory BatchProgressItemAccepted([void updates(BatchProgressItemAcceptedBuilder b)]) = _$BatchProgressItemAccepted;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BatchProgressItemAcceptedBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BatchProgressItemAccepted> get serializer => _$BatchProgressItemAcceptedSerializer();
}

class _$BatchProgressItemAcceptedSerializer implements PrimitiveSerializer<BatchProgressItemAccepted> {
  @override
  final Iterable<Type> types = const [BatchProgressItemAccepted, _$BatchProgressItemAccepted];

  @override
  final String wireName = r'BatchProgressItemAccepted';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BatchProgressItemAccepted object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(BatchProgressItemAcceptedStatusEnum),
    );
    yield r'state';
    yield serializers.serialize(
      object.state,
      specifiedType: const FullType(LessonProgressDto),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    BatchProgressItemAccepted object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required BatchProgressItemAcceptedBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BatchProgressItemAcceptedStatusEnum),
          ) as BatchProgressItemAcceptedStatusEnum;
          result.status = valueDes;
          break;
        case r'state':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(LessonProgressDto),
          ) as LessonProgressDto;
          result.state.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  BatchProgressItemAccepted deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BatchProgressItemAcceptedBuilder();
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

class BatchProgressItemAcceptedStatusEnum extends EnumClass {

  /// The client write was applied (or absorbed by last-write-wins with no resulting state change). `state` reflects the post-merge server state. 
  @BuiltValueEnumConst(wireName: r'accepted')
  static const BatchProgressItemAcceptedStatusEnum accepted = _$batchProgressItemAcceptedStatusEnum_accepted;

  static Serializer<BatchProgressItemAcceptedStatusEnum> get serializer => _$batchProgressItemAcceptedStatusEnumSerializer;

  const BatchProgressItemAcceptedStatusEnum._(String name): super(name);

  static BuiltSet<BatchProgressItemAcceptedStatusEnum> get values => _$batchProgressItemAcceptedStatusEnumValues;
  static BatchProgressItemAcceptedStatusEnum valueOf(String name) => _$batchProgressItemAcceptedStatusEnumValueOf(name);
}

