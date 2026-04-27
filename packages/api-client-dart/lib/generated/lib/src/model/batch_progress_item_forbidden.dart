//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'batch_progress_item_forbidden.g.dart';

/// BatchProgressItemForbidden
///
/// Properties:
/// * [status] - Actor has no READ grant covering this lesson, OR the lesson does not exist. The two cases are collapsed deliberately to avoid existence leakage (no-oracle rule). 
/// * [lessonId] - Echoes the input `lessonId` for client correlation.
@BuiltValue()
abstract class BatchProgressItemForbidden implements Built<BatchProgressItemForbidden, BatchProgressItemForbiddenBuilder> {
  /// Actor has no READ grant covering this lesson, OR the lesson does not exist. The two cases are collapsed deliberately to avoid existence leakage (no-oracle rule). 
  @BuiltValueField(wireName: r'status')
  BatchProgressItemForbiddenStatusEnum get status;
  // enum statusEnum {  forbidden,  };

  /// Echoes the input `lessonId` for client correlation.
  @BuiltValueField(wireName: r'lessonId')
  String get lessonId;

  BatchProgressItemForbidden._();

  factory BatchProgressItemForbidden([void updates(BatchProgressItemForbiddenBuilder b)]) = _$BatchProgressItemForbidden;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BatchProgressItemForbiddenBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BatchProgressItemForbidden> get serializer => _$BatchProgressItemForbiddenSerializer();
}

class _$BatchProgressItemForbiddenSerializer implements PrimitiveSerializer<BatchProgressItemForbidden> {
  @override
  final Iterable<Type> types = const [BatchProgressItemForbidden, _$BatchProgressItemForbidden];

  @override
  final String wireName = r'BatchProgressItemForbidden';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BatchProgressItemForbidden object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(BatchProgressItemForbiddenStatusEnum),
    );
    yield r'lessonId';
    yield serializers.serialize(
      object.lessonId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    BatchProgressItemForbidden object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required BatchProgressItemForbiddenBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BatchProgressItemForbiddenStatusEnum),
          ) as BatchProgressItemForbiddenStatusEnum;
          result.status = valueDes;
          break;
        case r'lessonId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.lessonId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  BatchProgressItemForbidden deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BatchProgressItemForbiddenBuilder();
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

class BatchProgressItemForbiddenStatusEnum extends EnumClass {

  /// Actor has no READ grant covering this lesson, OR the lesson does not exist. The two cases are collapsed deliberately to avoid existence leakage (no-oracle rule). 
  @BuiltValueEnumConst(wireName: r'forbidden')
  static const BatchProgressItemForbiddenStatusEnum forbidden = _$batchProgressItemForbiddenStatusEnum_forbidden;

  static Serializer<BatchProgressItemForbiddenStatusEnum> get serializer => _$batchProgressItemForbiddenStatusEnumSerializer;

  const BatchProgressItemForbiddenStatusEnum._(String name): super(name);

  static BuiltSet<BatchProgressItemForbiddenStatusEnum> get values => _$batchProgressItemForbiddenStatusEnumValues;
  static BatchProgressItemForbiddenStatusEnum valueOf(String name) => _$batchProgressItemForbiddenStatusEnumValueOf(name);
}

