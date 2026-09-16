//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'generate_quiz_request.g.dart';

/// Payload for starting a quiz-generation run. Body may be omitted entirely.
///
/// Properties:
/// * [modelId] - Filename of the .gguf weight to use (see `GET /admin/model-weights`). Omitted uses the deployment's configured default.
/// * [cleanupEnabled] - Runs an ASR-typo cleanup pass on each transcript window before generating questions from it. The cleaned text is never written back to the transcript — only used for this run. Turning it off roughly halves generation time and is reasonable for already-clean author-provided subtitles.
@BuiltValue()
abstract class GenerateQuizRequest implements Built<GenerateQuizRequest, GenerateQuizRequestBuilder> {
  /// Filename of the .gguf weight to use (see `GET /admin/model-weights`). Omitted uses the deployment's configured default.
  @BuiltValueField(wireName: r'modelId')
  String? get modelId;

  /// Runs an ASR-typo cleanup pass on each transcript window before generating questions from it. The cleaned text is never written back to the transcript — only used for this run. Turning it off roughly halves generation time and is reasonable for already-clean author-provided subtitles.
  @BuiltValueField(wireName: r'cleanupEnabled')
  bool? get cleanupEnabled;

  GenerateQuizRequest._();

  factory GenerateQuizRequest([void updates(GenerateQuizRequestBuilder b)]) = _$GenerateQuizRequest;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(GenerateQuizRequestBuilder b) => b
      ..cleanupEnabled = true;

  @BuiltValueSerializer(custom: true)
  static Serializer<GenerateQuizRequest> get serializer => _$GenerateQuizRequestSerializer();
}

class _$GenerateQuizRequestSerializer implements PrimitiveSerializer<GenerateQuizRequest> {
  @override
  final Iterable<Type> types = const [GenerateQuizRequest, _$GenerateQuizRequest];

  @override
  final String wireName = r'GenerateQuizRequest';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    GenerateQuizRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.modelId != null) {
      yield r'modelId';
      yield serializers.serialize(
        object.modelId,
        specifiedType: const FullType(String),
      );
    }
    if (object.cleanupEnabled != null) {
      yield r'cleanupEnabled';
      yield serializers.serialize(
        object.cleanupEnabled,
        specifiedType: const FullType(bool),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    GenerateQuizRequest object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required GenerateQuizRequestBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'modelId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.modelId = valueDes;
          break;
        case r'cleanupEnabled':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.cleanupEnabled = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  GenerateQuizRequest deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = GenerateQuizRequestBuilder();
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

