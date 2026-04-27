//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/lesson_progress_dto.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'batch_progress_item_stale.g.dart';

/// BatchProgressItemStale
///
/// Properties:
/// * [status] - The client's `clientUpdatedAt` was older than the server's `lastSeenAt` for this lesson. The write was absorbed but the server already had newer state — the client should overwrite its local cache from `state`. 
/// * [state] 
@BuiltValue()
abstract class BatchProgressItemStale implements Built<BatchProgressItemStale, BatchProgressItemStaleBuilder> {
  /// The client's `clientUpdatedAt` was older than the server's `lastSeenAt` for this lesson. The write was absorbed but the server already had newer state — the client should overwrite its local cache from `state`. 
  @BuiltValueField(wireName: r'status')
  BatchProgressItemStaleStatusEnum get status;
  // enum statusEnum {  stale,  };

  @BuiltValueField(wireName: r'state')
  LessonProgressDto get state;

  BatchProgressItemStale._();

  factory BatchProgressItemStale([void updates(BatchProgressItemStaleBuilder b)]) = _$BatchProgressItemStale;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BatchProgressItemStaleBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BatchProgressItemStale> get serializer => _$BatchProgressItemStaleSerializer();
}

class _$BatchProgressItemStaleSerializer implements PrimitiveSerializer<BatchProgressItemStale> {
  @override
  final Iterable<Type> types = const [BatchProgressItemStale, _$BatchProgressItemStale];

  @override
  final String wireName = r'BatchProgressItemStale';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BatchProgressItemStale object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(BatchProgressItemStaleStatusEnum),
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
    BatchProgressItemStale object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required BatchProgressItemStaleBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BatchProgressItemStaleStatusEnum),
          ) as BatchProgressItemStaleStatusEnum;
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
  BatchProgressItemStale deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BatchProgressItemStaleBuilder();
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

class BatchProgressItemStaleStatusEnum extends EnumClass {

  /// The client's `clientUpdatedAt` was older than the server's `lastSeenAt` for this lesson. The write was absorbed but the server already had newer state — the client should overwrite its local cache from `state`. 
  @BuiltValueEnumConst(wireName: r'stale')
  static const BatchProgressItemStaleStatusEnum stale = _$batchProgressItemStaleStatusEnum_stale;

  static Serializer<BatchProgressItemStaleStatusEnum> get serializer => _$batchProgressItemStaleStatusEnumSerializer;

  const BatchProgressItemStaleStatusEnum._(String name): super(name);

  static BuiltSet<BatchProgressItemStaleStatusEnum> get values => _$batchProgressItemStaleStatusEnumValues;
  static BatchProgressItemStaleStatusEnum valueOf(String name) => _$batchProgressItemStaleStatusEnumValueOf(name);
}

