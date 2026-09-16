//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/model_weight_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'model_weight_list_dto.g.dart';

/// Every file in the weights directory, unsorted.
///
/// Properties:
/// * [weights] 
@BuiltValue()
abstract class ModelWeightListDto implements Built<ModelWeightListDto, ModelWeightListDtoBuilder> {
  @BuiltValueField(wireName: r'weights')
  BuiltList<ModelWeightDto> get weights;

  ModelWeightListDto._();

  factory ModelWeightListDto([void updates(ModelWeightListDtoBuilder b)]) = _$ModelWeightListDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ModelWeightListDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ModelWeightListDto> get serializer => _$ModelWeightListDtoSerializer();
}

class _$ModelWeightListDtoSerializer implements PrimitiveSerializer<ModelWeightListDto> {
  @override
  final Iterable<Type> types = const [ModelWeightListDto, _$ModelWeightListDto];

  @override
  final String wireName = r'ModelWeightListDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ModelWeightListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'weights';
    yield serializers.serialize(
      object.weights,
      specifiedType: const FullType(BuiltList, [FullType(ModelWeightDto)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ModelWeightListDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ModelWeightListDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'weights':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(ModelWeightDto)]),
          ) as BuiltList<ModelWeightDto>;
          result.weights.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ModelWeightListDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ModelWeightListDtoBuilder();
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

