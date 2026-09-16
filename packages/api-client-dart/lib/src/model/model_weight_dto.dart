//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'model_weight_dto.g.dart';

/// One model weight file on the shared weights volume (whisper's ggml AND llama's gguf).
///
/// Properties:
/// * [filename] 
/// * [sizeBytes] - File size in bytes, as reported by the filesystem.
/// * [usableForQuizGeneration] - True for a `.gguf` file (a llama.cpp weight, selectable as `GenerateQuizRequest.modelId`); false for whisper's `.bin`.
@BuiltValue()
abstract class ModelWeightDto implements Built<ModelWeightDto, ModelWeightDtoBuilder> {
  @BuiltValueField(wireName: r'filename')
  String get filename;

  /// File size in bytes, as reported by the filesystem.
  @BuiltValueField(wireName: r'sizeBytes')
  int get sizeBytes;

  /// True for a `.gguf` file (a llama.cpp weight, selectable as `GenerateQuizRequest.modelId`); false for whisper's `.bin`.
  @BuiltValueField(wireName: r'usableForQuizGeneration')
  bool get usableForQuizGeneration;

  ModelWeightDto._();

  factory ModelWeightDto([void updates(ModelWeightDtoBuilder b)]) = _$ModelWeightDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(ModelWeightDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<ModelWeightDto> get serializer => _$ModelWeightDtoSerializer();
}

class _$ModelWeightDtoSerializer implements PrimitiveSerializer<ModelWeightDto> {
  @override
  final Iterable<Type> types = const [ModelWeightDto, _$ModelWeightDto];

  @override
  final String wireName = r'ModelWeightDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    ModelWeightDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'filename';
    yield serializers.serialize(
      object.filename,
      specifiedType: const FullType(String),
    );
    yield r'sizeBytes';
    yield serializers.serialize(
      object.sizeBytes,
      specifiedType: const FullType(int),
    );
    yield r'usableForQuizGeneration';
    yield serializers.serialize(
      object.usableForQuizGeneration,
      specifiedType: const FullType(bool),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    ModelWeightDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required ModelWeightDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'filename':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.filename = valueDes;
          break;
        case r'sizeBytes':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.sizeBytes = valueDes;
          break;
        case r'usableForQuizGeneration':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.usableForQuizGeneration = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  ModelWeightDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = ModelWeightDtoBuilder();
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

