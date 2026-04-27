//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/record_progress_request.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'batch_progress_request.g.dart';

/// BatchProgressRequest
///
/// Properties:
/// * [items] - Up to 200 progress writes. Cap exists to bound server-side work and to keep request bodies under the 1 MiB JSON ceiling. 
@BuiltValue()
abstract class BatchProgressRequest implements Built<BatchProgressRequest, BatchProgressRequestBuilder> {
  /// Up to 200 progress writes. Cap exists to bound server-side work and to keep request bodies under the 1 MiB JSON ceiling. 
  @BuiltValueField(wireName: r'items')
  BuiltList<RecordProgressRequest> get items;

  BatchProgressRequest._();

  factory BatchProgressRequest([void updates(BatchProgressRequestBuilder b)]) = _$BatchProgressRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BatchProgressRequestBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BatchProgressRequest> get serializer => _$BatchProgressRequestSerializer();
}

class _$BatchProgressRequestSerializer implements PrimitiveSerializer<BatchProgressRequest> {
  @override
  final Iterable<Type> types = const [BatchProgressRequest, _$BatchProgressRequest];

  @override
  final String wireName = r'BatchProgressRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BatchProgressRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'items';
    yield serializers.serialize(
      object.items,
      specifiedType: const FullType(BuiltList, [FullType(RecordProgressRequest)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    BatchProgressRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required BatchProgressRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'items':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(RecordProgressRequest)]),
          ) as BuiltList<RecordProgressRequest>;
          result.items.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  BatchProgressRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BatchProgressRequestBuilder();
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

