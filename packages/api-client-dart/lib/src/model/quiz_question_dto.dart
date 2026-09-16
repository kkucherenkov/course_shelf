//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'quiz_question_dto.g.dart';

/// One multiple-choice question generated from a transcript window.
///
/// Properties:
/// * [prompt] - The question text.
/// * [options] - Exactly four answer options.
/// * [correctOptionIndex] - Index into `options` of the correct answer.
/// * [cueStartMs] - Start timestamp (ms) of the transcript window this question was generated from — assigned by the window, not the model, so it cannot be hallucinated.
@BuiltValue()
abstract class QuizQuestionDto implements Built<QuizQuestionDto, QuizQuestionDtoBuilder> {
  /// The question text.
  @BuiltValueField(wireName: r'prompt')
  String get prompt;

  /// Exactly four answer options.
  @BuiltValueField(wireName: r'options')
  BuiltList<String> get options;

  /// Index into `options` of the correct answer.
  @BuiltValueField(wireName: r'correctOptionIndex')
  int get correctOptionIndex;

  /// Start timestamp (ms) of the transcript window this question was generated from — assigned by the window, not the model, so it cannot be hallucinated.
  @BuiltValueField(wireName: r'cueStartMs')
  int get cueStartMs;

  QuizQuestionDto._();

  factory QuizQuestionDto([void updates(QuizQuestionDtoBuilder b)]) = _$QuizQuestionDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(QuizQuestionDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<QuizQuestionDto> get serializer => _$QuizQuestionDtoSerializer();
}

class _$QuizQuestionDtoSerializer implements PrimitiveSerializer<QuizQuestionDto> {
  @override
  final Iterable<Type> types = const [QuizQuestionDto, _$QuizQuestionDto];

  @override
  final String wireName = r'QuizQuestionDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    QuizQuestionDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'prompt';
    yield serializers.serialize(
      object.prompt,
      specifiedType: const FullType(String),
    );
    yield r'options';
    yield serializers.serialize(
      object.options,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    yield r'correctOptionIndex';
    yield serializers.serialize(
      object.correctOptionIndex,
      specifiedType: const FullType(int),
    );
    yield r'cueStartMs';
    yield serializers.serialize(
      object.cueStartMs,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    QuizQuestionDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required QuizQuestionDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'prompt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.prompt = valueDes;
          break;
        case r'options':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.options.replace(valueDes);
          break;
        case r'correctOptionIndex':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.correctOptionIndex = valueDes;
          break;
        case r'cueStartMs':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.cueStartMs = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  QuizQuestionDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = QuizQuestionDtoBuilder();
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

