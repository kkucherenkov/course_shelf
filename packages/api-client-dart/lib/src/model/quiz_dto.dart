//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:app_api_client/src/model/quiz_status.dart';
import 'package:app_api_client/src/model/quiz_question_dto.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'quiz_dto.g.dart';

/// A reviewable quiz-generation proposal for one lesson — reviewed by an admin (apply/discard) before it counts as real, the same lifecycle as an identify task.
///
/// Properties:
/// * [id] 
/// * [lessonId] 
/// * [courseId] 
/// * [status] 
/// * [model] - Model that generated this proposal — meaning depends on the deployment's text-generation provider (ADR-0012): a `.gguf` weight filename under the local provider, or a hosted provider's own model id under `openrouter`. Lets an admin compare a 4B run against a 9B run of the same lesson under the local provider.
/// * [questions] 
/// * [createdAt] 
/// * [completedAt] 
@BuiltValue()
abstract class QuizDto implements Built<QuizDto, QuizDtoBuilder> {
  @BuiltValueField(wireName: r'id')
  String get id;

  @BuiltValueField(wireName: r'lessonId')
  String get lessonId;

  @BuiltValueField(wireName: r'courseId')
  String get courseId;

  @BuiltValueField(wireName: r'status')
  QuizStatus get status;
  // enum statusEnum {  proposed,  applied,  discarded,  };

  /// Model that generated this proposal — meaning depends on the deployment's text-generation provider (ADR-0012): a `.gguf` weight filename under the local provider, or a hosted provider's own model id under `openrouter`. Lets an admin compare a 4B run against a 9B run of the same lesson under the local provider.
  @BuiltValueField(wireName: r'model')
  String get model;

  @BuiltValueField(wireName: r'questions')
  BuiltList<QuizQuestionDto> get questions;

  @BuiltValueField(wireName: r'createdAt')
  DateTime get createdAt;

  @BuiltValueField(wireName: r'completedAt')
  DateTime? get completedAt;

  QuizDto._();

  factory QuizDto([void updates(QuizDtoBuilder b)]) = _$QuizDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(QuizDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<QuizDto> get serializer => _$QuizDtoSerializer();
}

class _$QuizDtoSerializer implements PrimitiveSerializer<QuizDto> {
  @override
  final Iterable<Type> types = const [QuizDto, _$QuizDto];

  @override
  final String wireName = r'QuizDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    QuizDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'id';
    yield serializers.serialize(
      object.id,
      specifiedType: const FullType(String),
    );
    yield r'lessonId';
    yield serializers.serialize(
      object.lessonId,
      specifiedType: const FullType(String),
    );
    yield r'courseId';
    yield serializers.serialize(
      object.courseId,
      specifiedType: const FullType(String),
    );
    yield r'status';
    yield serializers.serialize(
      object.status,
      specifiedType: const FullType(QuizStatus),
    );
    yield r'model';
    yield serializers.serialize(
      object.model,
      specifiedType: const FullType(String),
    );
    yield r'questions';
    yield serializers.serialize(
      object.questions,
      specifiedType: const FullType(BuiltList, [FullType(QuizQuestionDto)]),
    );
    yield r'createdAt';
    yield serializers.serialize(
      object.createdAt,
      specifiedType: const FullType(DateTime),
    );
    if (object.completedAt != null) {
      yield r'completedAt';
      yield serializers.serialize(
        object.completedAt,
        specifiedType: const FullType(DateTime),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    QuizDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required QuizDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'id':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.id = valueDes;
          break;
        case r'lessonId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.lessonId = valueDes;
          break;
        case r'courseId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.courseId = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(QuizStatus),
          ) as QuizStatus;
          result.status = valueDes;
          break;
        case r'model':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.model = valueDes;
          break;
        case r'questions':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(QuizQuestionDto)]),
          ) as BuiltList<QuizQuestionDto>;
          result.questions.replace(valueDes);
          break;
        case r'createdAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.createdAt = valueDes;
          break;
        case r'completedAt':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(DateTime),
          ) as DateTime;
          result.completedAt = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  QuizDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = QuizDtoBuilder();
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

