//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'quiz_generation_accepted_dto.g.dart';

/// Acknowledges a quiz-generation run. Generation happens in the background; poll `GET /quizzes?courseId=...&status=proposed` to see proposals as they land — there is no separate run record to poll.
///
/// Properties:
/// * [courseId] - The course the run is scoped to (the lesson's own course for a lesson-scoped request).
/// * [lessonsQueued] - Number of lessons this run will attempt.
@BuiltValue()
abstract class QuizGenerationAcceptedDto implements Built<QuizGenerationAcceptedDto, QuizGenerationAcceptedDtoBuilder> {
  /// The course the run is scoped to (the lesson's own course for a lesson-scoped request).
  @BuiltValueField(wireName: r'courseId')
  String get courseId;

  /// Number of lessons this run will attempt.
  @BuiltValueField(wireName: r'lessonsQueued')
  int get lessonsQueued;

  QuizGenerationAcceptedDto._();

  factory QuizGenerationAcceptedDto([void updates(QuizGenerationAcceptedDtoBuilder b)]) = _$QuizGenerationAcceptedDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(QuizGenerationAcceptedDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<QuizGenerationAcceptedDto> get serializer => _$QuizGenerationAcceptedDtoSerializer();
}

class _$QuizGenerationAcceptedDtoSerializer implements PrimitiveSerializer<QuizGenerationAcceptedDto> {
  @override
  final Iterable<Type> types = const [QuizGenerationAcceptedDto, _$QuizGenerationAcceptedDto];

  @override
  final String wireName = r'QuizGenerationAcceptedDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    QuizGenerationAcceptedDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'courseId';
    yield serializers.serialize(
      object.courseId,
      specifiedType: const FullType(String),
    );
    yield r'lessonsQueued';
    yield serializers.serialize(
      object.lessonsQueued,
      specifiedType: const FullType(int),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    QuizGenerationAcceptedDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required QuizGenerationAcceptedDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'courseId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.courseId = valueDes;
          break;
        case r'lessonsQueued':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(int),
          ) as int;
          result.lessonsQueued = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  QuizGenerationAcceptedDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = QuizGenerationAcceptedDtoBuilder();
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

