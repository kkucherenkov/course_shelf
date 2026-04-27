//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:app_api_client/src/model/batch_progress_item_result.dart';
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'batch_progress_response.g.dart';

/// BatchProgressResponse
///
/// Properties:
/// * [results] - Same length and order as the input `items` array. Index N in the response maps 1:1 to index N in the request. 
@BuiltValue()
abstract class BatchProgressResponse implements Built<BatchProgressResponse, BatchProgressResponseBuilder> {
  /// Same length and order as the input `items` array. Index N in the response maps 1:1 to index N in the request. 
  @BuiltValueField(wireName: r'results')
  BuiltList<BatchProgressItemResult> get results;

  BatchProgressResponse._();

  factory BatchProgressResponse([void updates(BatchProgressResponseBuilder b)]) = _$BatchProgressResponse;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(BatchProgressResponseBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<BatchProgressResponse> get serializer => _$BatchProgressResponseSerializer();
}

class _$BatchProgressResponseSerializer implements PrimitiveSerializer<BatchProgressResponse> {
  @override
  final Iterable<Type> types = const [BatchProgressResponse, _$BatchProgressResponse];

  @override
  final String wireName = r'BatchProgressResponse';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    BatchProgressResponse object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'results';
    yield serializers.serialize(
      object.results,
      specifiedType: const FullType(BuiltList, [FullType(BatchProgressItemResult)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    BatchProgressResponse object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required BatchProgressResponseBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'results':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(BatchProgressItemResult)]),
          ) as BuiltList<BatchProgressItemResult>;
          result.results.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  BatchProgressResponse deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = BatchProgressResponseBuilder();
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

